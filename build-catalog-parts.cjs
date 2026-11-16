'use strict';

const fs = require('node:fs');
const path = require('node:path');
const source = path.join(__dirname, 'anime-catalog-3.json');
const target = path.join(__dirname, 'anime-assets-v32');
const catalog = JSON.parse(fs.readFileSync(source, 'utf8'));
const count = 10;
const step = Math.ceil(catalog.data.length / count);
fs.mkdirSync(target, {recursive: true});
for (let part = 0; part < count; part++) {
    const data = catalog.data.slice(part * step, (part + 1) * step);
    const payload = part === 0 ? {...catalog, data} : {updated: catalog.updated, data};
    const literal = JSON.stringify(payload).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
    fs.writeFileSync(path.join(target, 'catalog-' + part + '.js'),
        'if(window.animeTastePart32)window.animeTastePart32(' + part + ',' + literal + ');\n');
}
