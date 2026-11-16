'use strict';

// node fetch-continuations.cjs <catalogue.json> <output.json> [group count]
const fs = require('node:fs');
const [catalogueFile, outputFile, count = '70'] = process.argv.slice(2);
const catalogue = JSON.parse(fs.readFileSync(catalogueFile, 'utf8'));
const priority = new Set(['m11617', 'm16498', 'm20583', 'm457', 'm9253']);
const episodes = new Map();
const groups = new Map();
for (const row of catalogue.data) {
    if (row[5]) episodes.set(String(row[5]), row);
    if (row[3] === 'OVA' || row[13] === 2 || !row[5]) continue;
    if (!groups.has(row[14])) groups.set(row[14], []);
    groups.get(row[14]).push(row);
}
const tracked = [...groups.values()].filter(group => group.length >= 2)
    .sort((a, b) => Number(b.some(row => priority.has(row[0]))) - Number(a.some(row => priority.has(row[0]))) ||
        Math.max(...b.map(row => row[4])) - Math.max(...a.map(row => row[4])))
    .slice(0, Number(count)).flatMap(group => group.sort((a, b) =>
        Number(priority.has(b[0])) - Number(priority.has(a[0])) || a[2] - b[2]).slice(0, 8));
const known = fs.existsSync(outputFile) ? JSON.parse(fs.readFileSync(outputFile, 'utf8')) : {};
let offset = 0;
let checked = 0;
let failures = 0;
function persist() { fs.writeFileSync(outputFile, JSON.stringify(known)); }
async function worker() {
    while (offset < tracked.length) {
        const source = tracked[offset++];
        if (Object.hasOwn(known, source[0])) continue;
        try {
            const response = await fetch('https://kitsu.app/api/edge/anime/' + source[5] + '/media-relationships?include=destination',
                {signal: AbortSignal.timeout(6500)});
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const payload = await response.json();
            const next = payload.data.filter(row => row.attributes.role === 'sequel')
                .map(row => row.relationships?.destination?.data)
                .filter(item => item?.type === 'anime').map(item => episodes.get(item.id))
                .filter(row => row && row[3] !== 'OVA' && row[2] >= source[2] && row[0] !== source[0]);
            known[source[0]] = next.length === 1 ? next[0][0] : '';
            if (++checked % 15 === 0) persist();
        } catch (error) { failures++; }
        await new Promise(resolve => setTimeout(resolve, 550));
    }
}
Promise.all([worker(), worker(), worker()]).then(() => {
    persist();
    console.log(JSON.stringify({checked, links: Object.values(known).filter(Boolean).length, failures}));
}).catch(error => { console.error(error); process.exitCode = 1; });
