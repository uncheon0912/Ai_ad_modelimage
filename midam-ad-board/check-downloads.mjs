import fs from 'node:fs';
import assert from 'node:assert/strict';
import './dist/zip.js';
const assets=JSON.parse(fs.readFileSync('dist/assets.json','utf8'));
const date=assets.map(asset=>asset.date).sort().at(-1);
const dated=assets.filter(asset=>asset.date===date);
const selected=[assets.find(asset=>asset.category==='ai-models'),assets.find(asset=>asset.brand==='EBC')];
for(const [name,group]of [['date',dated],['selected',selected]]){
  const zip=MidamZip.buildZip(group.map(asset=>({name:asset.id+'_'+asset.image.split('/').at(-1),bytes:new Uint8Array(fs.readFileSync('dist/'+asset.image)),date:asset.date})));
  fs.writeFileSync('../midam-'+name+'-download-test.zip',zip);
  console.log(`${name}: ${group.length} originals, ${zip.length} bytes`);
}
const unicode=MidamZip.buildZip([{name:'한글_파일.png',bytes:new Uint8Array([0,1,2,255]),date:'2026-10-27'}]);
fs.writeFileSync('../midam-unicode-download-test.zip',unicode);
assert.throws(()=>MidamZip.buildZip([]));
assert.throws(()=>MidamZip.buildZip([{name:'../bad',bytes:new Uint8Array()}]));
