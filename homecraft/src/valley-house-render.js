import * as T from 'three';
import {build,poseDoorLeaf} from './scene.js';
import {disposeMaterial} from './graphics.js';
import {enrichInterior} from './valley-interior-detail.js';
export function disposeHouse(root){if(!root)return;const geometries=new Set(),materials=new Set();root.traverse(o=>{o.userData.disposed=true;if(o.geometry)geometries.add(o.geometry);for(const m of [].concat(o.material||[]))materials.add(m)});geometries.forEach(g=>g.dispose());materials.forEach(disposeMaterial);root.removeFromParent()}
const houseParts=new WeakMap();
const doorKey=(levelId,wallId,openingId)=>JSON.stringify([levelId,wallId,openingId]);

export function makeHouseMesh(d,{source=d.source,quality='medium',playable=false}={}){
 const p={...source,graphics:{...source.graphics,quality:quality==='medium'?'standard':quality,contact:false}};
 const g=build(p,p.levels[0].id,true,false,{electric:false,water:false,hot:false,drain:false,heat:false,vent:false});
 enrichInterior(g,p,quality);const pivot=new T.Group();
 g.position.set(-d.origin.x,0,-d.origin.z);
 pivot.add(g);
 const doors=new Map();
 pivot.traverse(o=>{
   if(o.isLight)o.visible=false;
   if(!playable||!o.userData.door)return;
   const {levelId,wallId,openingId}=o.userData;
   const key=doorKey(levelId,wallId,openingId);
   if(!doors.has(key))doors.set(key,[]);
   doors.get(key).push(o);
 });
 if(playable){
   const levels=new Map(g.children.filter(o=>o.userData.levelId).map(o=>[
     o.userData.levelId,
     {group:o,ceilings:o.children.filter(child=>child.userData.roomCeiling)}
   ]));
   houseParts.set(pivot,{levels,doors,roof:g.children.filter(o=>o.userData.houseRoof)});
 }
 return pivot;
}

export function showHouseLevel(root,activeId){
 const {levels,roof}=houseParts.get(root);
 const active=levels.get(activeId);
 for(const {group,ceilings} of levels.values()){
   group.visible=!active||group===active.group||group.position.y<active.group.position.y;
   for(const ceiling of ceilings)ceiling.visible=group!==active?.group;
 }
 for(const part of roof)part.visible=!active;
}

export function updateHouseDoor(root,{levelId,wallId,opening}){
 const leaves=houseParts.get(root)?.doors.get(doorKey(levelId,wallId,opening.id))||[];
 for(const leaf of leaves)poseDoorLeaf(leaf,opening);
}
export function moveHouse(root,t){root.position.set(t.x,.015,t.z);root.rotation.y=-t.rotation*Math.PI/180;root.updateMatrixWorld(true);const b=new T.Box3().setFromObject(root);return {minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z}}
export function ghostHouse(root,valid){root.traverse(o=>{if(!o.isMesh)return;for(const m of [].concat(o.material||[])){m.transparent=true;m.opacity=.55;m.depthWrite=false;if(!m.userData.valleyOriginal)m.userData.valleyOriginal=m.color?.clone();if(m.color&&m.userData.valleyOriginal){m.color.copy(m.userData.valleyOriginal);m.color.lerp(new T.Color(valid?0x4eb780:0xf66b66),.28)}}})}
