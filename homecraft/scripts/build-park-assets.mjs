import {mkdir,writeFile} from 'node:fs/promises';
import {parkPack} from './park-asset-source.mjs';
const dir=new URL('../public/assets/park/',import.meta.url);
await mkdir(dir,{recursive:true});
const entries=parkPack();
for(const p of entries)await writeFile(new URL(p.name,dir),p.bytes);
const manifest={version:1,units:'metres',up:'+Y',forward:'+Z',lod:{0:'near',1:'medium',2:'far'},assets:entries.map(a=>({...a.meta,bytes:a.bytes.length,path:'homecraft/public/assets/park/'+a.name}))};
await writeFile(new URL('manifest.json',dir),JSON.stringify(manifest,null,2)+'\n');
console.log('Park GLBs: '+entries.length+' ('+entries.reduce((s,p)=>s+p.bytes.length,0)+' bytes)');
