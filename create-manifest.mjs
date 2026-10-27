import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('.',import.meta.url));
const files=[];
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(entry.name==='.git'||entry.name==='transfer-manifest.json')continue;
    const absolute=path.join(dir,entry.name);
    if(entry.isDirectory())walk(absolute);
    else if(entry.isFile()){
      const data=fs.readFileSync(absolute);
      files.push({path:path.relative(root,absolute).split(path.sep).join('/'),size:data.length,sha256:createHash('sha256').update(data).digest('hex')});
    }
  }
}
walk(root);files.sort((a,b)=>a.path.localeCompare(b.path));
fs.writeFileSync(path.join(root,'transfer-manifest.json'),JSON.stringify({snapshotDate:'2026-10-27',sourceHead:'a8413b73c141ca3324e5eccddd2edecc264adaca',generatedImages:15,files},null,2)+'\n');
console.log(`Recorded ${files.length} files.`);
