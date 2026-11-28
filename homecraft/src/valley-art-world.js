import {PARK_LAMP_POSITIONS} from './environment/props.js';
import {grassClump,windMaterial} from './environment/parkGround.js';
import * as T from 'three';
import {roads,plots} from './valley-core.js';
import {worldGround,worldPassable,inRect,SITES} from './valley-world-life.js';
import {HOMES} from './valley-town.js';
import {box,ell,mesh,bake,material} from './valley-realism.js';
import {surfaceMaps,setSurface} from './valley-atmosphere.js';
function dispose(root){const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);if(o.isInstancedMesh)o.dispose()});root.removeFromParent();gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose())}
function seedRand(seed){let n=seed>>>0;return()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296)}
const graph=roads(),nodes=Object.fromEntries(graph.nodes.map(p=>[p.id,p])),reserves=plots().map(p=>p.reserve);
function distance(x,z,a,b){const dx=b.x-a.x,dz=b.z-a.z,t=T.MathUtils.clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1);return Math.hypot(x-a.x-dx*t,z-a.z-dz*t)}
export function meadowEligible(x,z,seed){
 if(!worldPassable(x,z,seed,null)||reserves.some(r=>inRect(r,x,z,1)))return false;
 if(graph.edges.some(e=>distance(x,z,nodes[e.a],nodes[e.b])<5.3))return false;
 if(x>305&&x<336&&z>301&&z<329)return false;
 if(x>270&&x<307&&z>326&&z<380&&(Math.abs(x-288)<1.65||Math.abs(z-345.5)<1.65||x<285&&z>365))return false;
 if((Math.abs(x-279)<5.3&&Math.abs(z-369)<3.8)||(Math.abs(x-298)<1.8&&Math.abs(z-369)<1.5))return false;
 if(HOMES.some(h=>Math.abs(z-h.z)<1.2&&x>h.door.x-1&&x<316))return false;
 if(Object.values(SITES).some(s=>Math.hypot(x-s.door.x,z-s.door.z)<5))return false;
 return worldGround(x,z,seed)>-.10;
}
export {grassClump} from './environment/parkGround.js';
export function meadowArt(scene,seed){
 const root=new T.Group();scene.add(root);const rand=seedRand(seed+842),geos=Array.from({length:4},(_,i)=>grassClump(i)),m=material(0xffffff,{side:T.DoubleSide,roughness:.94,vertexColors:true});const wind={value:0},time={value:0};windMaterial(m,wind,time);
 const tiles=[],dummy=new T.Object3D(),colors=[0x789455,0x9ba568,0x577946,0xa5a977,0x70884a];
 for(const [cx,cz,wx,wz] of [[278,346,13,34],[299,346,13,36],[288,369,32,15],[340,331,24,15],[329,395,18,38],[329,463,18,42],[329,529,18,45],[605,351,48,40],[646,390,40,52],[676,430,35,30]]){
 const items=[];for(let i=0;i<1800;i++){const x=cx+(rand()-.5)*wx,z=cz+(rand()-.5)*wz;if(!meadowEligible(x,z,seed))continue;
 const patch=.5+.5*Math.sin(x*.79+Math.cos(z*.58))*Math.cos(z*.46+x*.16);
 if(rand()>.17+.72*patch)continue;
 items.push({x,z,y:worldGround(x,z,seed)+.01,a:rand()*6.28,s:.45+rand()*.52+patch*.48,c:colors[Math.floor(rand()*colors.length)]})}
 if(!items.length)continue;for(let variant=0;variant<4;variant++){const subset=items.filter((_,i)=>i%4===variant);if(!subset.length)continue;const inst=new T.InstancedMesh(geos[variant],m,subset.length);for(const [i,p] of subset.entries()){dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,p.a,0);dummy.scale.set(p.s,p.s,p.s);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);inst.setColorAt(i,new T.Color(p.c))}inst.receiveShadow=true;inst.castShadow=false;root.add(inst);tiles.push({cx,cz,inst,total:subset.length});}
 }
 // Wildflower clusters: stems and petal rings use instancing, no per-flower draw calls.
 const petalGeo=new T.SphereGeometry(1,7,5),petalMat=material(0xffffff),flowers=[];const fg=new T.Group();root.add(fg);for(const tile of tiles.filter((_,i)=>i%4===0)){for(let i=0;i<18;i++){const x=tile.cx+(rand()-.5)*14,z=tile.cz+(rand()-.5)*16;if(meadowEligible(x,z,seed))flowers.push({x,z,y:worldGround(x,z,seed)+.12+rand()*.12,c:[0xf7eee2,0xe5b746,0xcca2c9][i%3]})}}
 const petals=new T.InstancedMesh(petalGeo,petalMat,flowers.length*5);flowers.forEach((f,i)=>{for(let j=0;j<5;j++){const a=j*6.28/5;dummy.position.set(f.x+Math.cos(a)*.035,f.y,f.z+Math.sin(a)*.035);dummy.rotation.set(0,-a,0);dummy.scale.set(.035,.012,.017);dummy.updateMatrix();petals.setMatrixAt(i*5+j,dummy.matrix);petals.setColorAt(i*5+j,new T.Color(f.c))}});fg.add(petals);
 const stalkGeo=new T.CylinderGeometry(.004,.006,1,4),stalkMat=material(0x637e47);
 const stalks=new T.InstancedMesh(stalkGeo,stalkMat,flowers.length);
 for(const [i,f] of flowers.entries()){
  const ground=worldGround(f.x,f.z,seed),length=f.y-ground;
  dummy.position.set(f.x,ground+length*.5,f.z);dummy.rotation.set(0,0,0);dummy.scale.set(1,length,1);
  dummy.updateMatrix();stalks.setMatrixAt(i,dummy.matrix);
 }
 fg.add(stalks);
 const cloverGeo=new T.SphereGeometry(1,6,4),cloverMat=material(0x648b48),clover=new T.InstancedMesh(cloverGeo,cloverMat,flowers.length*3);flowers.forEach((f,i)=>{for(let j=0;j<3;j++){let a=j*Math.PI*2/3;dummy.position.set(f.x+.11+Math.cos(a)*.026,worldGround(f.x+.11,f.z,seed)+.045,f.z+Math.sin(a)*.026);dummy.rotation.set(0,-a,0);dummy.scale.set(.027,.006,.017);dummy.updateMatrix();clover.setMatrixAt(i*3+j,dummy.matrix)}});fg.add(clover);
 let detail=1;return {setQuality(q){detail=q.detail;root.visible=detail>0;fg.visible=detail>=2;for(const t of tiles)t.inst.count=Math.ceil(t.total*[0,.26,.60,1][detail])},update(state,c,dt){wind.value=c.wind||0;time.value=(time.value+dt)%10000;const season=c.season??0;m.color.set([0xffffff,0xe7e8cc,0xbca57b,0xe7ece6][season]);for(const t of tiles)t.inst.visible=detail>0&&Math.hypot(state.x-t.cx,state.z-t.cz)<(detail===3?135:detail===2?95:60);fg.visible=detail>=2&&season!==3},destroy(){dispose(root)}};
}
export function lanternMesh(parent,x,y,z,metal,glass,glow,{wall=false}={}){
 const g=new T.Group();parent.add(g);g.position.set(x,y,z);
 if(!wall){mesh(g,new T.CylinderGeometry(.12,.19,.18,10),metal,0,.09,0);mesh(g,new T.CylinderGeometry(.045,.075,2.46,10),metal,0,1.37,0);mesh(g,new T.CylinderGeometry(.09,.12,.16,10),metal,0,2.57,0)}
 const h=wall?0:2.76;
 mesh(g,new T.CylinderGeometry(.19,.13,.10,4),metal,0,h-.18,0).rotation.y=Math.PI/4;
 const pane=mesh(g,new T.CylinderGeometry(.16,.115,.32,4,1,true),glass,0,h+.015,0);pane.rotation.y=Math.PI/4;pane.castShadow=false;
 for(const a of [-1,1])for(const b of [-1,1])box(g,metal,a*.104,h+.015,b*.104,.021,.34,.021);
 ell(g,glow,0,h+.013,0,.070,.10,.070);
 const cap=mesh(g,new T.ConeGeometry(.21,.17,4),metal,0,h+.25,0);cap.rotation.y=Math.PI/4;ell(g,metal,0,h+.36,0,.037,.055,.037);
 return g;
}
export function villageArt(scene,seed){
 const root=new T.Group(),stoneGroup=new T.Group(),lamps=new T.Group();root.add(stoneGroup,lamps);scene.add(root);
 const metal=material(0x353c3f,{metalness:.62,roughness:.36}),glass=material(0xe9d2a0,{transparent:true,opacity:.24,roughness:.23,depthWrite:false,side:T.DoubleSide}),glow=material(0xffd498,{emissive:0xffa945,emissiveIntensity:.08}),stone=material(0xb6a58f),trim=material(0xd4c2a7);const maps=surfaceMaps('stone',192);setSurface(stone,maps,2,1,true);
 for(const p of plots())lanternMesh(lamps,p.anchor.x+2,.04,p.anchor.z,metal,glass,glow);for(const [x,z] of PARK_LAMP_POSITIONS)lanternMesh(lamps,x,worldGround(x,z,seed),z,metal,glass,glow);
 for(const h of HOMES){
 const y=.33;for(const s of [-1,1]){box(stoneGroup,stone,h.x,y,h.z+s*(h.d/2+.015),h.w,.64,.09);box(stoneGroup,trim,h.x,.68,h.z+s*(h.d/2+.025),h.w,.09,.12)}
 for(const s of [-1,1]){const length=h.d*.5-.74;box(stoneGroup,stone,h.x+s*(h.w/2+.015),y,h.z-length*.5-.74,.09,.64,length);box(stoneGroup,stone,h.x+s*(h.w/2+.015),y,h.z+length*.5+.74,.09,.64,length)}
 lanternMesh(lamps,h.door.x-.82,2.18,h.z+1.05,metal,glass,glow,{wall:true});
 // Window flowerboxes mounted below the existing windows, within facade footprint.
 const soil=material(0x625044),leaf=material(0x537840),flower=material(0xc76c92);for(const dx of [-h.w*.29,h.w*.29]){const z=h.z+h.d/2+.10;box(stoneGroup,soil,h.x+dx,1.12,z,1.56,.18,.24);for(let i=0;i<7;i++){ell(stoneGroup,leaf,h.x+dx-.65+i*.215,1.25,z,.13,.12,.11);ell(stoneGroup,flower,h.x+dx-.65+i*.215,1.34,z+.025,.060,.045,.060)}}
 }
 for(const s of Object.values(SITES))lanternMesh(lamps,s.door.x-1.1,2.45,s.z+s.d/2+.26,metal,glass,glow,{wall:true});
 bake(stoneGroup);
 // Lantern shells stay independent; the scene uses its existing bounded point light pool.
 return {setQuality(q){stoneGroup.visible=q.detail>=1;setSurface(stone,maps,2,1,q.detail>=2)},update(day){glow.emissiveIntensity=.10+(1-day)**2*2.6;glow.color.set(0xffe0b7).lerp(new T.Color(0xffbb6c),1-day)},destroy(){dispose(root);Object.values(maps).forEach(t=>t.dispose())}};
}
