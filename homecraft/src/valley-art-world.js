import {PARK_LAMP_POSITIONS} from './environment/props.js';
import {createMeadowChunks} from './environment/meadowChunks.js';
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
export function meadowArt(scene,seed){return createMeadowChunks(scene,seed,meadowEligible,worldGround)}
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
