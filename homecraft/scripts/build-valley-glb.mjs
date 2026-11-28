import {toonAvatar,toonClips} from '../src/valley-toon.js';
import {mkdir,writeFile} from 'node:fs/promises';import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';import {createSkinCharacter} from './valley-skin-builder.mjs';import {avatarMesh} from '../src/valley-avatar.js';import {attachValleyRig} from '../src/valley-rig-runtime.js';import {PROFILE_DEFAULT,profile,CHARACTER_PRESETS} from '../src/valley-world-life.js';
// GLTFExporter uses FileReader in browsers. Node's Blob supplies the same bytes.
globalThis.FileReader??=class {readAsArrayBuffer(blob){blob.arrayBuffer().then(v=>{this.result=v;this.onloadend?.()})}readAsDataURL(blob){blob.arrayBuffer().then(v=>{this.result='data:'+blob.type+';base64,'+Buffer.from(v).toString('base64');this.onloadend?.()})}};
import {RESIDENTS} from '../src/valley-town.js';
const dir='public/assets/characters';await mkdir(dir,{recursive:true});
function inspectGLB(glb){const dv=new DataView(glb);if(dv.getUint32(0,true)!==0x46546c67||dv.getUint32(4,true)!==2)throw Error('GLB header');const j=JSON.parse(new TextDecoder().decode(new Uint8Array(glb,20,dv.getUint32(12,true))));if(!j.skins?.length||j.skins[0].joints.length!==42||j.animations?.length!==8||!j.meshes.some(m=>m.primitives.some(p=>p.attributes.JOINTS_0!==undefined&&p.attributes.WEIGHTS_0!==undefined&&p.targets?.length===6)))throw Error('GLB rig validation failed');return {joints:j.skins[0].joints.length,clips:j.animations.map(a=>a.name),morphs:6}}
async function write(name,root,animations){const glb=await new GLTFExporter().parseAsync(root,{binary:true,animations,onlyVisible:true});const check=inspectGLB(glb);await writeFile(dir+'/'+name+'.glb',Buffer.from(glb));console.log(name,glb.byteLength,'bytes',JSON.stringify(check));return {file:name+'.glb',bytes:glb.byteLength,...check}}
const high=createSkinCharacter({step:.006}),low=createSkinCharacter({step:.009}),manifest=[];
manifest.push(await write('valley-human',high.skin,high.animations));manifest.push(await write('valley-human-npc',low.skin,low.animations));
// Two self-contained dressed reference characters. Their accessory meshes are bone-attached.
for(const [name,p] of [['npc_lea_lod1',{...PROFILE_DEFAULT,...RESIDENTS.find(r=>r.id==='lea').profile}],['player_reference_lod1',{...PROFILE_DEFAULT}],['valley-adventurer',{...PROFILE_DEFAULT,face:'angular',hairStyle:'sidepart',outfit:'jacket',shoeStyle:'boot',build:'athletic'}],['valley-explorer',{...PROFILE_DEFAULT,face:'soft',hairStyle:'ponytail',outfit:'cardigan',shoeStyle:'sneaker',build:'slim',eyes:'green'}],...CHARACTER_PRESETS.map((p,i)=>['valley-preset-'+['mila','lina','noah','leon','sam','ava'][i],p.profile])]){
 const a=avatarMesh(p,{detail:false}),root=a.root;const legacy=[];root.traverse(o=>{if(o.isMesh&&((o.material?.userData?.valleyLegacySkin&&o.parent?.name!=='ValleyHead')||o.material?.userData?.valleyFace))legacy.push(o)});const attached=attachValleyRig(root,{skin:low.skin,clips:low.animations,detail:false},profile(p),legacy);if(!attached)throw Error('Standalone character rig mismatch');
 // Keep export independent of DOM/canvas. Export coloured geometry, not procedural raster maps.
 root.traverse(o=>{o.userData={};if(o.isMesh){for(const k of ['map','normalMap','roughnessMap','metalnessMap','emissiveMap','alphaMap','aoMap'])if(o.material[k])o.material[k]=null}});
 root.name=name;const entry=await write(name,root,low.animations);manifest.push({...entry,profile:profile(p),style:'semi-realistic-anime'});attached.dispose();
}
for(const [name,overrides] of [['valley-toon-scout',{hairStyle:'short',outfit:'sport',bottom:'shorts',shirt:'#bc8a43'}],['valley-toon-artist',{hairStyle:'bob',outfit:'hoodie',shirt:'#a84f55',eyes:'green'}],['valley-toon-explorer',{hairStyle:'ponytail',outfit:'cardigan',build:'stocky',shoeStyle:'boot'}]]){
 const p=profile({...PROFILE_DEFAULT,...overrides,style:'cartoon'}),a=toonAvatar(p);a.root.traverse(o=>{o.userData={}});a.root.name=name;
 const glb=await new GLTFExporter().parseAsync(a.root,{binary:true,animations:toonClips(),onlyVisible:true});const dv=new DataView(glb),j=JSON.parse(new TextDecoder().decode(new Uint8Array(glb,20,dv.getUint32(12,true))));
 if(dv.getUint32(0,true)!==0x46546c67||j.animations?.length!==8||!j.meshes?.length)throw Error('Cartoon export incomplete');await writeFile(dir+'/'+name+'.glb',Buffer.from(glb));manifest.push({file:name+'.glb',bytes:glb.byteLength,clips:j.animations.map(a=>a.name),rig:'articulated',style:'round-cartoon'});
}
await writeFile(dir+'/manifest.json',JSON.stringify(manifest,null,2));
