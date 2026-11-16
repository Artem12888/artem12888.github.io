'use strict';

// node fetch-catalog-metadata.cjs <upstream.json> <cache-directory> [popular pages]
const fs = require('node:fs');
const path = require('node:path');
const [upstreamFile, directory, count = '65'] = process.argv.slice(2);
const pages = Number(count);
const cacheFile = path.join(directory, 'kitsu-metadata.json');
const upstream = JSON.parse(fs.readFileSync(upstreamFile, 'utf8'));
const cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : {};
const fields = 'synopsis,description,subtype,ageRating,nsfw,canonicalTitle,titles,abbreviatedTitles,startDate';
const origin = 'https://kitsu.app/api/edge/anime';
const types = new Set(['TV', 'ONA', 'OVA']);
const disputed = /^(?:pornography|erotica|sexual content.*)$/;
const priority = new Set([11617, 15451, 24703, 34281, 23233, 7088, 25157, 12549, 30307, 7593, 30240,
    1535, 16498, 5114, 52991, 9253, 457, 10165, 20583, 1, 30276, 42897, 43608, 44511]);
let changed = 0;
let failures = 0;

function persist() {
    const pending = cacheFile + '.pending';
    fs.writeFileSync(pending, JSON.stringify(cache));
    fs.renameSync(pending, cacheFile);
}

function store(row) {
    const a = row.attributes;
    if (!a || row.type !== 'anime') return;
    const titles = Object.values(a.titles || {}).concat(a.abbreviatedTitles || [], [a.canonicalTitle]).filter(Boolean);
    cache[row.id] = {titles, format: a.subtype, year: Number(String(a.startDate || '').slice(0, 4)),
        age: a.ageRating || '', nsfw: a.nsfw, story: String(a.synopsis || a.description || '').slice(0, 1900), stamp: Date.now()};
    changed++;
}

async function request(url, retries = 1) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, {signal: AbortSignal.timeout(8000)});
            if (response.status === 404) return null;
            if (response.ok) return await response.json();
            if (response.status === 429 || response.status === 503) {
                const delay = Math.min(8000, 1000 * (Number(response.headers.get('retry-after')) || 3));
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        } catch (error) {
            if (attempt === retries) return null;
        }
    }
    return null;
}

async function batch(items, handler) {
    let next = 0;
    async function worker() {
        while (next < items.length) {
            const item = items[next++];
            await handler(item);
            await new Promise(resolve => setTimeout(resolve, 450));
        }
    }
    await Promise.all([worker(), worker(), worker()]);
}

async function main() {
    fs.mkdirSync(directory, {recursive: true});
    const requested = [];
    for (const anime of upstream.data) {
        if (!types.has(anime.type)) continue;
        const mal = anime.sources.find(u => /myanimelist\.net\/anime\/\d+$/.test(u));
        const known = mal && priority.has(Number(mal.split('/').pop()));
        if (!known && (!anime.tags.some(tag => disputed.test(tag)) || anime.tags.includes('hentai'))) continue;
        const url = anime.sources.find(u => /kitsu\.(?:app|io)\/anime\/\d+$/.test(u));
        if (url) requested.push({id: url.split('/').pop(), priority: Boolean(known)});
    }
    const wanted = [...new Set(requested.sort((a, b) => Number(b.priority) - Number(a.priority)).map(row => row.id))];
    await batch(wanted.filter(id => !cache[id]).slice(0, 150), async id => {
        const result = await request(origin + '/' + id + '?fields[anime]=' + fields);
        if (result && result.data) store(result.data);
        else failures++;
    });
    persist();
    console.log(JSON.stringify({phase: 'exact', records: Object.keys(cache).length, failures}));
    const offsets = Array.from({length: pages}, (_, index) => index * 20);
    await batch(offsets, async offset => {
        const result = await request(origin + '?sort=popularityRank&page[limit]=20&page[offset]=' + offset + '&fields[anime]=' + fields);
        if (!result || !Array.isArray(result.data)) { failures++; return; }
        result.data.forEach(store);
        if (changed % 200 < 20) persist();
    });
    persist();
    console.log(JSON.stringify({phase: 'popular', records: Object.keys(cache).length, failures, pages}));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
