import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
const assets=JSON.parse(fs.readFileSync('dist/assets.json','utf8'));
assert.equal(new Set(assets.map(a=>a.id)).size,assets.length,'unique asset ids');
for(const asset of assets){for(const key of ['id','brand','title','shortTitle','concept','industry','date','image','keywords','description','copy','format','dimensions','palette'])assert.ok(asset[key],`${asset.id} ${key}`);assert.match(asset.date,/^\d{4}-\d{2}-\d{2}$/);assert.ok(!asset.image.includes('..'));assert.ok(fs.existsSync(path.join('dist',asset.image)));for(const color of asset.palette)assert.match(color,/^#[0-9a-f]{6}$/i);}
const html=fs.readFileSync('dist/index.html','utf8');const js=fs.readFileSync('dist/app.js','utf8');
for(const [,id]of js.matchAll(/\$\('#([a-z-]+)'\)/g))assert.ok(html.includes(`id="${id}"`),`missing HTML #${id}`);
assert.ok(html.includes('미담릴공장'));assert.ok(assets.length>0,'archive must contain assets');
console.log(`Verified ${assets.length} asset records, files, dates, palette colors and UI element references.`);
