import test from 'node:test';import assert from 'node:assert/strict';
import {newSave} from '../src/valley-core.js';
import {project,level,rectangle,addOpening,object,walkTarget} from '../src/core.js';
import {makeDesign,placeBuilding} from '../src/valley-house.js';
import {createWalker,moveWalker,tryStep,nearAction,interact,tickWalker,initialNeeds,validateNeeds,advanceNeeds,localToWorld,worldToLocal,inWalkArea} from '../src/valley-life.js';
const base=()=>newSave({id:'life',name:'Test',plotId:'HC-01'});
function withHouse(rotation=0,customize=()=>{}){const s=base(),p=project('Test');rectangle(p.levels[0],{x:0,y:0},{x:10,y:10});addOpening(p.levels[0].walls[0],5,'door',1,2.1,0);p.levels[0].objects.push(object('bed',{x:3,y:4}));customize(p);const d=makeDesign(p,'d');return placeBuilding(s,{saveId:s.id,plotId:s.plotId,landRevision:0,buildingRevision:0,design:d,transform:{x:s.rect.x+10,z:s.rect.z+12,rotation},requestId:'b'})}
test('spawn and parcel boundaries, normalized movement',()=>{const w=createWalker(base());assert.ok(inWalkArea(w.save.rect,w.state.x,w.state.z));assert.equal(tryStep(w,0,-1000),false);const x=w.state.x,z=w.state.z;assert.ok(moveWalker(w,1,1,.1));assert.ok(Math.hypot(w.state.x-x,w.state.z-z)<=.271)});
test('transforms roundtrip for all four rotations',()=>{for(const r of [0,90,180,270]){const b=withHouse(r).building,p=localToWorld(b,3,4);const q=worldToLocal(b,p.x,p.z);assert.ok(Math.abs(q.x-3)<1e-8&&Math.abs(q.y-4)<1e-8)}});
test('closed door blocks, interaction opens, walking does not modify design',()=>{const s=withHouse(),w=createWalker(s),b=s.building,l=w.p.levels[0];const wall=l.walls[0],o=wall.openings[0],mx=(wall.a.x+wall.b.x)/2,my=(wall.a.y+wall.b.y)/2,len=Math.hypot(wall.b.x-wall.a.x,wall.b.y-wall.a.y),nx=-(wall.b.y-wall.a.y)/len,ny=(wall.b.x-wall.a.x)/len,pt=localToWorld(b,mx-nx*.65,my-ny*.65),dest=localToWorld(b,mx,my);w.state={...w.state,...pt};assert.equal(tryStep(w,dest.x-pt.x,dest.z-pt.z),false);assert.equal(nearAction(w)?.kind,'door');assert.equal(interact(w).door.opening.id,o.id);assert.equal(tryStep(w,dest.x-pt.x,dest.z-pt.z),true);assert.equal(!!s.building.design.source.levels[0].walls[0].openings[0].open,false)});
test('needs bounded, time wraps, furniture actions complete only after duration',()=>{const n=initialNeeds();assert.equal(validateNeeds(n).hunger,85);assert.throws(()=>validateNeeds({...n,energy:101}));assert.ok(advanceNeeds({...n,minute:1439},1,true).minute<2);const w=createWalker(withHouse());w.needs.energy=20;w.action={label:'Schlafen',key:'energy',gain:42,remaining:.15};assert.equal(tickWalker(w,.1,false),null);assert.ok(tickWalker(w,.1,false));assert.ok(w.needs.energy>60&&w.needs.energy<=100)});

test('stationary and non-finite steps do not count as movement',()=>{const w=createWalker(base());assert.equal(tryStep(w,0,0),false);assert.equal(tryStep(w,NaN,0),false);assert.equal(moveWalker(w,0,0,.1),false)});

test('solid upper terrace supports walking and checkpoint restore at the deck height',()=>{
 const s=withHouse(90,p=>{
   const upper=level('Obergeschoss',2.7);
   rectangle(upper,{x:0,y:0},{x:10,y:10});
   const door=addOpening(upper.walls[0],5,'door',1.1,2.2,0);
   door.open=true;
   upper.objects.push({...object('cantilever',{x:5,y:-.95}),width:3,depth:1.9,height:.2});
   p.levels.push(upper);
 });
 const b=s.building,upper=b.design.source.levels[1],w=createWalker(s);
 w.state={...localToWorld(b,5,.3),height:upper.z,level:upper.id};
 const deck=localToWorld(b,5,-.45);
 assert.ok(tryStep(w,deck.x-w.state.x,deck.z-w.state.z));
 assert.ok(Math.abs(w.state.height-2.9)<.001);
 const restored=createWalker({...s,life:{checkpoint:{buildingRevision:b.revision,state:w.state}}});
 assert.deepEqual(restored.state,w.state);
 const edge=localToWorld(b,5,-2.2);
 assert.equal(tryStep(w,edge.x-w.state.x,edge.z-w.state.z),false);
});

test('checkpoint uses supported height or falls back to a valid starting position',()=>{
 const s=withHouse(),b=s.building,level=b.design.source.levels[0].id;
 const checkpoint=(height)=>({buildingRevision:b.revision,state:{...localToWorld(b,7,6),height,level}});
 assert.equal(createWalker({...s,life:{checkpoint:checkpoint(.04)}}).state.height,0);
 assert.deepEqual(createWalker({...s,life:{checkpoint:checkpoint(.4)}}).state,createWalker(s).state);
});

test('an open door above floor level does not let the walker through the wall',()=>{
 const s=withHouse(0,p=>{
   const door=p.levels[0].walls[0].openings[0];
   door.bottom=.35;
   door.height=1.9;
   door.open=true;
 });
 const l=s.building.design.source.levels[0];
 assert.equal(walkTarget(s.building.design.source,l.id,{x:5,y:.3,height:0},{x:5,y:0}),null);
});
