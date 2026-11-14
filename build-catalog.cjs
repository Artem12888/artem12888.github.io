'use strict';

// node build-catalog.cjs <anime-offline-database-minified.json> [output.json]
const fs = require('node:fs');
const path = require('node:path');
const database = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const output = process.argv[3] || path.join(__dirname, 'anime-catalog-2.json');
const root = {
    version: 2,
    source: database.repository,
    updated: database.lastUpdate,
    license: database.license,
    tags: [],
    imageHosts: [],
    data: []
};
const ids = new Map();
const sources = new Map();
const imageHosts = new Map();
const explicit = /^(hentai|erotica|pornography|sexual content.*)$/;
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

for (const anime of database.data) {
    const target = anime.type;
    if (!anime.title || anime.tags.some(tag => explicit.test(tag))) continue;
    if (!['TV', 'ONA', 'OVA'].includes(target)) continue;
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
    const names = anime.synonyms.filter(name => name && name.length <= 105);
    // Keep Russian, English/romanized and Japanese variants, including localized catalog cards.
    const aliases = [...new Map(names.filter(name => /[а-яё]/i.test(name)).slice(0, 6)
        .concat(names.filter(name => /[\u3040-\u30ff\u3400-\u9fff]/.test(name)).slice(0, 2),
            names.filter(name => /^[\x20-\x7e]+$/.test(name)).slice(0, 6))
        .map(name => [name.toLowerCase(), name])).values()];
    const tags = anime.tags.filter(tag => !noise.test(tag)).map(tagId);
    const rating = Math.round(Number(anime.score && anime.score.median || 0) * 10) / 10;
    const poster = anime.thumbnail || anime.picture || '';
    const index = root.data.length;
    root.data.push([key, anime.title, Number(anime.animeSeason.year) || 0, target, rating, kitsu,
        compactPoster(poster),
        aliases, tags, [], Number(anime.episodes) || 0]);
    for (const url of anime.sources) sources.set(url, index);
}

for (const anime of database.data) {
    const index = sources.get(anime.sources[0]);
    if (index === undefined) continue;
    root.data[index][9] = [...new Set(anime.relatedAnime.map(url => sources.get(url))
        .filter(related => related !== undefined && related !== index)
        .map(related => root.data[related][0]))];
}

fs.writeFileSync(output, JSON.stringify(root) + '\n');
console.log(JSON.stringify({entries: root.data.length, tags: root.tags.length, bytes: fs.statSync(output).size}));
