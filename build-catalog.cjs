'use strict';

// node build-catalog.cjs <upstream.json> [output.json] [kitsu-metadata.json] [kitsu-sequels.json]
const fs = require('node:fs');
const path = require('node:path');
const database = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const output = process.argv[3] || path.join(__dirname, 'anime-catalog-3.json');
const checks = process.argv[4] ? JSON.parse(fs.readFileSync(process.argv[4], 'utf8')) : {};
const sequels = process.argv[5] ? JSON.parse(fs.readFileSync(process.argv[5], 'utf8')) : {};
const root = {
    version: 3,
    source: database.repository,
    updated: database.lastUpdate,
    license: database.license,
    tags: [],
    imageHosts: [],
    data: []
};
const ids = new Map();
const sources = new Map();
const byKey = new Map();
const kept = [];
const imageHosts = new Map();
const explicit = /^(hentai|erotica|pornography|sexual content.*)$/;
const acceptedTypes = new Set(['TV', 'ONA', 'OVA']);
const noise = /^(?:place|time|tropes|motifs|japanese production|chinese production|anime|new|manga|present|past|ending|remake|sequel|canon filler|original work|has fillers|cgi|cg animation|full cgi|award winning|awards|based on .+|adapted .+|remastered .+|.+ -- to be split and deleted)$/;

function idFor(urls, site) {
    const match = urls.find(url => site.test(url));
    return match ? Number(match.match(/\d+$/)[0]) : 0;
}

function tagId(tag) {
    if (!ids.has(tag)) {
        ids.set(tag, root.tags.length);
        root.tags.push(tag);
    }
    return ids.get(tag);
}

function compactPoster(value) {
    const url = /^https:\/\/([a-zA-Z0-9.-]+)\/(.+)$/.exec(value);
    if (!url || url[2].includes('no_pic')) return 0;
    if (!imageHosts.has(url[1])) {
        imageHosts.set(url[1], root.imageHosts.length);
        root.imageHosts.push(url[1]);
    }
    return imageHosts.get(url[1]) + ':' + url[2];
}

function franchiseNames(row) {
    return [row[1], ...row[7]].map(title => title.normalize('NFKC').toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
        .replace(/\s+(?:the )?(?:final )?(?:season|part|cour|series|сезон|часть)(?:\s+[\divx]+)?(?:\s+(?:part|cour)\s+[\divx]+)?$/u, '')
        .replace(/\s+\d+(?:st|nd|rd|th)?$/u, '')).filter(name => name.length >= 5);
}

function sameSeries(left, right) {
    const a = franchiseNames(left);
    const b = franchiseNames(right);
    const sequelName = /\b(?:\d+(?:st|nd|rd|th)? (?:season|part)|season \d+|final season|part \d+|сезон \d+)\b/i;
    const numbered = [left[1], ...left[7], right[1], ...right[7]].some(name => sequelName.test(name));
    const match = (name, other) => name === other || name.length >= 8 && other.startsWith(name + ' ') ||
        other.length >= 8 && name.startsWith(other + ' ');
    return Boolean(a[0] && b[0] && (match(a[0], b[0]) ||
        numbered && a.some(name => b.some(other => match(name, other)))));
}

for (const anime of database.data) {
    const target = anime.type;
    if (!anime.title || !acceptedTypes.has(target)) continue;
    if (anime.tags.includes('anime influenced')) continue;
    if (anime.tags.some(tag => /^(chinese|korean|american|french|russian|british|thai|indian) (?:production|animation)$/.test(tag))
        && !anime.tags.includes('japanese production')) continue;
    const mal = idFor(anime.sources, /^https?:\/\/myanimelist\.net\/anime\/\d+$/);
    const kitsu = idFor(anime.sources, /^https?:\/\/kitsu\.(?:app|io)\/anime\/\d+$/);
    const anidb = idFor(anime.sources, /^https?:\/\/anidb\.net\/anime\/\d+$/);
    const anilist = idFor(anime.sources, /^https?:\/\/anilist\.co\/anime\/\d+$/);
    if (!anidb && !anime.tags.includes('japanese production')) continue;
    if (!(mal || kitsu || anidb || anilist)) continue;
    const key = mal ? 'm' + mal : kitsu ? 'k' + kitsu : anidb ? 'd' + anidb : 'a' + anilist;
    if (byKey.has(key)) {
        for (const url of anime.sources) sources.set(url, byKey.get(key));
        continue;
    }
    const ageCheck = checks[kitsu];
    const year = Number(anime.animeSeason.year) || 0;
    const checked = ageCheck && acceptedTypes.has(ageCheck.format) && (!year || !ageCheck.year || Math.abs(year - ageCheck.year) <= 1);
    const age = checked ? ageCheck.age : '';
    const sameMetadata = checked && ageCheck.nsfw === false && Boolean(age) && age !== 'R18';
    const restricted = anime.tags.includes('hentai') || checked && (ageCheck.nsfw === true || age === 'R18') ? 2
        : anime.tags.some(tag => explicit.test(tag)) && !sameMetadata ? 1 : 0;
    const names = (anime.synonyms || []).concat(checked ? ageCheck.titles : []).filter(name => name && name.length <= 105);
    // Keep Russian, English/romanized and Japanese variants, including localized catalog cards.
    const aliases = [...new Map(names.filter(name => /[а-яё]/i.test(name)).slice(0, 6)
        .concat(names.filter(name => /[\u3040-\u30ff\u3400-\u9fff]/.test(name)).slice(0, 2),
            names.filter(name => /^[\x20-\x7e]+$/.test(name)).slice(0, 6))
        .map(name => [name.toLowerCase(), name])).values()];
    const tags = anime.tags.filter(tag => !noise.test(tag) && !explicit.test(tag)).map(tagId);
    const rating = Math.round(Number(anime.score && anime.score.median || 0) * 10) / 10;
    const poster = anime.thumbnail || anime.picture || '';
    const index = root.data.length;
    const externalIds = [mal && 'm' + mal, kitsu && 'k' + kitsu, anidb && 'd' + anidb, anilist && 'a' + anilist].filter(Boolean);
    const tmdb = anime.sources.find(url => /themoviedb\.org\/tv\/\d+/.test(url));
    const season = tmdb && (/\/tv\/(\d+)(?:\/season\/(\d+))?/.exec(tmdb));
    root.data.push([key, anime.title, year, target, rating, kitsu,
        compactPoster(poster),
        aliases, tags, [], Number(anime.episodes) || 0, externalIds, age, restricted, key, '',
        season ? [Number(season[1]), Number(season[2]) || 0] : 0, anime.status === 'UPCOMING' ? 1 : 0]);
    byKey.set(key, index);
    kept.push(anime);
    for (const url of anime.sources) sources.set(url, index);
}

for (const [index, anime] of kept.entries()) {
    root.data[index][9] = [...new Set(anime.relatedAnime.map(url => sources.get(url))
        .filter(related => related !== undefined && related !== index)
        .map(related => root.data[related][0]))];
}

const parents = root.data.map((row, index) => index);
function group(index) {
    while (parents[index] !== index) {
        parents[index] = parents[parents[index]];
        index = parents[index];
    }
    return index;
}
for (const [index, row] of root.data.entries()) {
    for (const key of row[9]) {
        const other = byKey.get(key);
        if (sameSeries(row, root.data[other])) parents[group(other)] = group(index);
    }
    const confirmedNext = byKey.get(sequels[row[0]]);
    if (confirmedNext !== undefined) parents[group(confirmedNext)] = group(index);
}
const families = new Map();
for (const [index, row] of root.data.entries()) {
    const parent = group(index);
    row[14] = root.data[parent][0];
    if (!families.has(parent)) families.set(parent, []);
    families.get(parent).push(row);
}
for (const family of families.values()) {
    const seasons = family.filter(row => row[3] === 'TV' || row[3] === 'ONA').sort((a, b) => a[2] - b[2]);
    for (const current of seasons) {
        const next = sequels[current[0]];
        if (next && byKey.has(next)) current[15] = next;
        if (next || !current[2]) continue;
        const number = title => Number(title.match(/\bseason\s+(\d+)\b/i)?.[1] || title.match(/\b(\d+)(?:st|nd|rd|th) season\b/i)?.[1]) || 0;
        const release = Math.max(1, ...[current[1], ...current[7]].map(number));
        const candidates = seasons.filter(candidate => candidate[2] > current[2] &&
            (current[9].includes(candidate[0]) || candidate[9].includes(current[0])) &&
            [candidate[1], ...candidate[7]].some(title => number(title) === release + 1));
        if (candidates.length === 1) current[15] = candidates[0][0];
    }
}

fs.writeFileSync(output, JSON.stringify(root) + '\n');
console.log(JSON.stringify({entries: root.data.length, confirmedRatings: root.data.filter(row => row[12]).length,
    disputed: root.data.filter(row => row[13] === 1).length, tags: root.tags.length, bytes: fs.statSync(output).size}));
