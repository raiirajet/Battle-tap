import * as T from 'three';import {worldGround} from './valley-world-life.js';import {roads} from './valley-core.js';
import {meadowEligible} from './valley-art-world.js';
import {crownGeometry} from './valley-realism.js';
// Reusable, instanced details; decorative only, never change simulation geometry.
export function worldDetails(scene,seed,treePositions,bark){const group=new T.Group();scene.add(group);const dummy=new T.Object3D(),groups=[];let n=seed>>>0;const rand=()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);const mat=(c,extra={})=>new T.MeshStandardMaterial({color:c,roughness:.85,...extra});
function batch(geometry,material,items,tier){const mesh=new T.InstancedMesh(geometry,material,items.length);items.forEach((p,i)=>{dummy.position.set(p.x,p.y??worldGround(p.x,p.z,seed),p.z);dummy.rotation.set(p.rx||0,p.angle||0,0);dummy.scale.set(p.sx||1,p.sy||1,p.sz||1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});mesh.receiveShadow=true;mesh.castShadow=tier===1;group.add(mesh);groups.push({mesh,tier});return mesh}
const graph=roads(),nodes=Object.fromEntries(graph.nodes.map(n=>[n.id,n])),lines=[],edges=[];for(const e of graph.edges){const a=nodes[e.a],b=nodes[e.b],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),angle=Math.atan2(dx,dz);for(let t=7;t<len-7;t+=8){lines.push({x:a.x+dx*t/len,z:a.z+dz*t/len,y:.102,angle})}for(const side of [-1,1])edges.push({x:(a.x+b.x)/2+dz/len*side*2.8,z:(a.z+b.z)/2-dx/len*side*2.8,y:.104,angle,sz:len})}
batch(new T.BoxGeometry(.105,.012,3),mat(0xe5e1cc),lines,0);batch(new T.BoxGeometry(.07,.012,1),mat(0xbfc3bd),edges,1);
const shrubs=[];
for(let i=0;i<75;i++){
 const x=272+rand()*32,z=326+rand()*51;
 if(!meadowEligible(x,z,seed)||z>366||treePositions.some(t=>Math.hypot(x-t.x,z-t.z)<1.5))continue;
 const spread=.36+rand()*.35,sy=spread*(.70+rand()*.35);
 shrubs.push({x,z,y:worldGround(x,z,seed)+sy*.4,angle:rand()*Math.PI*2,sx:spread,sy,sz:spread*.85});
}
const shrubMat=mat(0x6b914d,{vertexColors:true});
const shrubMesh=batch(crownGeometry(2),shrubMat,shrubs,1);
for(let i=0;i<shrubs.length;i++)shrubMesh.setColorAt(i,new T.Color().setScalar(.8+(i%6)*.06));

const branches=[],branchGeometry=new T.CylinderGeometry(.034,.096,1,7);
const up=new T.Vector3(0,1,0),direction=new T.Vector3(),start=new T.Vector3(),end=new T.Vector3();
for(const t of treePositions.filter(t=>t.x>=270&&t.x<=315&&t.z>=325&&t.z<=540)){
 const y=worldGround(t.x,t.z,seed);
 for(let i=0;i<3;i++){
  const a=i*2.4+t.z;
  start.set(t.x,y+t.h*(.27+i*.045),t.z);
  end.set(t.x+Math.cos(a)*t.h*.15,y+t.h*(.53+i*.035),t.z+Math.sin(a)*t.h*.15);
  direction.subVectors(end,start);
  const length=direction.length();
  dummy.position.copy(start).lerp(end,.5);
  dummy.quaternion.setFromUnitVectors(up,direction.normalize());
  dummy.scale.set(1,length,1);
  dummy.updateMatrix();
  branches.push(dummy.matrix.clone());
 }
}
const limbs=new T.InstancedMesh(branchGeometry,bark,branches.length);
branches.forEach((matrix,i)=>limbs.setMatrixAt(i,matrix));
limbs.castShadow=true;
limbs.receiveShadow=true;
group.add(limbs);
groups.push({mesh:limbs,tier:1});
function box(x,y,z,w,h,d,color){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m}
function pole(a,b,r,color){const v=new T.Vector3(...b).sub(new T.Vector3(...a)),m=new T.Mesh(new T.CylinderGeometry(r,r,v.length(),8),mat(color));m.position.copy(new T.Vector3(...a).addScaledVector(v,.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());group.add(m);m.castShadow=true;return m}
// Park furniture and playground on non-job areas, clear of the main path.
box(279,.06,369,10,.10,7,0xc4ac81);for(const x of [276.5,281.5])for(const z of [367,371])pole([x,0,z],[x,2.7,369],.065,0xb46e49);pole([276.5,2.7,369],[281.5,2.7,369],.07,0xb46e49);for(const x of [278,280]){pole([x-.32,2.65,369],[x-.32,.75,369],.022,0x495457);pole([x+.32,2.65,369],[x+.32,.75,369],.022,0x495457);box(x,.72,369,.76,.10,.34,0x3c777c)}
box(298,.16,369,3,.32,2.4,0xa37c54);box(298,.33,369,2.65,.025,2.05,0xe5c99a);
for(const [x,z,w,h] of [[296,305.53,15,5],[344,308.53,14,4]]){box(x,1.15,z,1.4,2.3,.08,0x43585e);for(const d of [-w*.31,w*.31]){box(x+d,1.75,z,2.9,1.65,.09,0x466372);box(x+d,1.75,z+.06,2.65,1.42,.04,0x91bac7);box(x+d,1.75,z+.10,.055,1.42,.04,0x42545c)}box(x,h-.42,z+.17,w-.7,.45,.35,0x516d65)}
let lastSeason=-1;
return {
 setQuality(q){for(const {mesh,tier} of groups)mesh.visible=tier<=q.detail},
 update(season){
  if(season===lastSeason)return;
  lastSeason=season;
  shrubMat.color.set([0x6b914d,0x60844a,0x9d7650,0x8c9985][season]);
 },
 destroy(){
  group.removeFromParent();
  const gs=new Set(),ms=new Set();
  group.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material&&o.material!==bark)ms.add(o.material);if(o.isInstancedMesh)o.dispose()});
  gs.forEach(g=>g.dispose());
  ms.forEach(m=>m.dispose());
 }
};
}
export function lakeSurface(water){const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d'),data=ctx.createImageData(128,128);for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4,v=128+Math.sin(x*.39+y*.14)*28+Math.sin(y*.49-x*.22)*20;data.data.set([v,v,v,255],i)}ctx.putImageData(data,0,0);const t=new T.CanvasTexture(canvas);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(12,9);water.material.bumpMap=t;water.material.bumpScale=.19;water.material.roughness=.18;water.material.metalness=.20;water.material.envMapIntensity=.65;water.material.needsUpdate=true;return {update(dt,wind,day=1){t.offset.x=(t.offset.x+dt*.016*wind)%1;t.offset.y=(t.offset.y+dt*.009)%1;water.material.bumpScale=.09+wind*.13;water.material.roughness=.14+wind*.10;water.material.color.set(0x18364d).lerp(new T.Color(0x508e9e),day)},destroy(){t.dispose()}}}
