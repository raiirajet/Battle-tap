import {copy,rooms,contains,stairLinks,stairHeight,voidState,walkTarget,projection,doorFitsWalker} from './core.js';
import {isBuildingPart,partContains,partTop} from './building-parts.js';
import {rotatedPoint} from './valley-house.js';
import {plots} from './valley-core.js';
import {profile,siteNear,worldGround,worldPassable,inRect} from './valley-world-life.js';
import {applyTradeNeeds,tradeSite,ruleFor} from './valley-economy.js';
import {isOpen} from './valley-town.js';
import {validateDay,advanceClock} from './valley-climate.js';
import {canUsePrivate,isOwner} from './valley-access.js';
import {ownedModel,validateVehicle} from './valley-vehicle.js';
export const SPEED=2.7, RADIUS=.15;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const initialNeeds=()=>({hunger:85,energy:85,hygiene:85,comfort:85,minute:480,day:0});
export function validateNeeds(n){if(n==null)return initialNeeds();if(!n||!['hunger','energy','hygiene','comfort'].every(k=>Number.isFinite(n[k])&&n[k]>=0&&n[k]<=100)||!Number.isFinite(n.minute)||n.minute<0||n.minute>=1440)throw Error('Ungültige Lebenswerte');return {...Object.fromEntries(['hunger','energy','hygiene','comfort','minute'].map(k=>[k,n[k]])),day:validateDay(n.day)}}
export function advanceNeeds(n,dt,moving=false){dt=clamp(Number.isFinite(dt)?dt:0,0,1);return {...advanceClock(n,dt*2),hunger:clamp(n.hunger-dt*.055,0,100),energy:clamp(n.energy-dt*(moving?.09:.035),0,100),hygiene:clamp(n.hygiene-dt*.025,0,100),comfort:clamp(n.comfort-dt*.018,0,100)}}
export const interactions={bed:['energy',42,'Schlafen'],single:['energy',42,'Schlafen'],sofa:['comfort',28,'Entspannen'],armchair:['comfort',28,'Entspannen'],fridge:['hunger',35,'Essen'],kitchen:['hunger',30,'Essen'],shower:['hygiene',45,'Duschen'],bath:['hygiene',45,'Baden'],basin:['hygiene',18,'Waschen'],toilet:['hygiene',10,'Toilette benutzen']};
export function localToWorld(b,x,y){const a=rotatedPoint(x-b.design.origin.x,y-b.design.origin.z,b.transform.rotation);return {x:a.x+b.transform.x,z:a.z+b.transform.z}}
export function worldToLocal(b,x,z){const a=rotatedPoint(x-b.transform.x,z-b.transform.z,(360-b.transform.rotation)%360);return{x:a.x+b.design.origin.x,y:a.z+b.design.origin.z}}
export function createWalker(save,{trees=[]}={}){
 const plot=plots().find(p=>p.id===save.plotId);
 if(!plot)throw Error('Grundstück fehlt.');
 const b=save.building||null,p=b?copy(b.design.source):null;
 const ground=p?.levels.find(l=>Math.abs(l.z)<.01)?.id||null;
 const links=p?stairLinks(p):[],cache=p?{links,voids:voidState(p,links)}:null;
 const roomMap=new Map(p?.levels.map(l=>[l.id,rooms(l)]));
 const w={save,b,p,ground,links,cache,roomMap,state:{x:plot.spawn.x,z:plot.spawn.z,height:0,level:ground},
   needs:validateNeeds(save.life?.needs),profile:profile(save.life?.profile),lifeRevision:save.life?.revision||0,
   action:null,inside:false,trees,car:validateVehicle(save.life?.car,ownedModel(save.ledger),save.plotId),driving:false,speed:0};
 const checkpoint=save.life?.checkpoint;
 if(checkpoint?.buildingRevision===(b?.revision||0))restorePosition(w,checkpoint.state);
 w.inside=insideRoom(w);
 return w;
}

function restorePosition(w,candidate){
 const {x,z,height,level}=candidate;
 const {save,b,p,trees}=w;
 if(!worldPassable(x,z,save.seed,save.plotId,trees))return;
 if(!b||!inRect(save.rect,x,z)){
   const surface=worldGround(x,z,save.seed);
   if(Math.abs(height-surface)<.5)w.state={x,z,height:surface,level:w.ground};
   return;
 }
 const q=worldToLocal(b,x,z);
 const hit=walkTarget(p,level,{...q,height},q,w.cache);
 if(hit&&Math.abs(hit.height-height)<.09&&supportsPosition(w,hit,q)){
   w.state={x,z,height:hit.height,level:hit.level};
 }
}

function supportsPosition(w,hit,point){
 if(hit.height<-.01)return false;
 if(hit.height<=.46)return true;
 const floor=w.p.levels.find(l=>l.id===hit.level);
 if((w.roomMap.get(hit.level)||[]).some(r=>contains(r.points,point)))return true;
 if(floor.objects.some(o=>{
   if(o.hidden||!isBuildingPart(o))return false;
   const top=partTop(o);
   return top!==null&&Math.abs(floor.z+top-hit.height)<.01&&partContains(o,point);
 }))return true;
 return w.links.some(link=>(link.lower===hit.level||link.upper===hit.level)&&stairHeight(link,point)!==null);
}
export function insideRoom(w,state=w.state){if(!w.b)return false;const q=worldToLocal(w.b,state.x,state.z);return (w.roomMap.get(state.level)||[]).some(r=>contains(r.points,q))}
export function inWalkArea(rect,x,z){return x>=rect.x+RADIUS&&x<=rect.x+rect.w-RADIUS&&z>=rect.z-1.5+RADIUS&&z<=rect.z+rect.d-RADIUS}
export function tryStep(w,dx,dz,actorId=w.save.id){if(!isOwner(w.save,actorId))return false;if(!Number.isFinite(dx)||!Number.isFinite(dz)||Math.hypot(dx,dz)<1e-8)return false;const a=w.state,x=a.x+dx,z=a.z+dz;if(!worldPassable(x,z,w.save.seed,w.save.plotId,w.trees))return false;const own=inRect(w.save.rect,x,z),wasOwn=inRect(w.save.rect,a.x,a.z);if(!w.b||(!own&&!wasOwn)){const y=worldGround(x,z,w.save.seed);if(Math.abs(y-a.height)>.35)return false;w.state={x,z,height:y,level:w.ground};return true}if(!own&&a.height>.46)return false;
const from=worldToLocal(w.b,a.x,a.z),to=worldToLocal(w.b,x,z),hit=walkTarget(w.p,a.level,{...from,height:a.height},to,w.cache);
if(!hit||!supportsPosition(w,hit,to))return false;
w.state={x,z,height:hit.height,level:hit.level};return true}
export function moveWalker(w,dx,dz,dt){if(w.action)return false;const len=Math.hypot(dx,dz);if(!Number.isFinite(len)||len<.001)return false;const travel=SPEED*clamp(dt,0,.1)*Math.min(1,len),n=Math.max(1,Math.ceil(travel/.06)),sx=dx/len*travel/n,sz=dz/len*travel/n;let moved=false;for(let i=0;i<n;i++){if(tryStep(w,sx,sz))moved=true;else if(tryStep(w,sx,0)||tryStep(w,0,sz))moved=true}w.inside=insideRoom(w);return moved}
export function nearAction(w){if(!w.b||w.action)return null;if(!inRect(w.save.rect,w.state.x,w.state.z,2))return null;const l=w.p.levels.find(l=>l.id===w.state.level);if(!l)return null;const q=worldToLocal(w.b,w.state.x,w.state.z),items=[];for(const wall of l.walls){const dx=wall.b.x-wall.a.x,dy=wall.b.y-wall.a.y,len=Math.hypot(dx,dy);for(const o of wall.openings){if(!doorFitsWalker(o,w.state.height-l.z))continue;const x=wall.a.x+dx/len*o.t,y=wall.a.y+dy/len*o.t,d=Math.hypot(q.x-x,q.y-y);if(d<=1.55)items.push({kind:'door',o,wall,label:o.open?'Tür schliessen':'Tür öffnen',distance:d})}}
if(!insideRoom(w))return items.sort((a,b)=>a.distance-b.distance)[0]||null;
for(const o of l.objects){const rule=interactions[o.kind];if(o.hidden||!rule||(o.elevation||0)>.5)continue;const d=Math.hypot(q.x-o.x,q.y-o.y)-Math.min(.6,Math.max(o.width,o.depth)/2);if(d<=1.3){const blocked=l.walls.some(wall=>{for(let i=1;i<12;i++){const at={x:q.x+(o.x-q.x)*i/12,y:q.y+(o.y-q.y)*i/12},a=projection(at,wall);if(a.d<wall.thickness/2+.015&&!wall.openings.some(op=>op.open&&doorFitsWalker(op,w.state.height-l.z)&&Math.abs(op.t-a.t)<op.width/2))return true}return false});if(!blocked)items.push({kind:'furniture',o,label:rule[2],distance:d,rule})}}
return items.sort((a,b)=>a.distance-b.distance)[0]||null}
export function interact(w,actorId=w.save.id){if(!canUsePrivate(w.save,actorId,'house',w.b?.id))return {message:'Privatbesitz – Zutritt nur für den Eigentümer.',sound:'deny'};const a=nearAction(w);if(!a)return {message:'Keine Interaktion in Reichweite.'};if(a.kind==='door'){if(a.o.open){const q=worldToLocal(w.b,w.state.x,w.state.z),hit=projection(q,a.wall);if(hit.d<a.wall.thickness/2+.35&&Math.abs(hit.t-a.o.t)<a.o.width/2+.25)return {message:'Bitte aus der Türöffnung treten.'}}a.o.open=!a.o.open;return {door:{levelId:w.state.level,wallId:a.wall.id,opening:a.o},message:a.o.open?'Tür geöffnet.':'Tür geschlossen.',sound:a.o.open?'doorOpen':'doorClose'}}w.action={label:a.label,key:a.rule[0],gain:a.rule[1],remaining:a.rule[0]==='energy'?5:3};return{message:a.label+' …'}}
export function tickWalker(w,dt,moving){dt=clamp(Number.isFinite(dt)?dt:0,0,.1);if(w.save.mode==='life')w.needs=advanceNeeds(w.needs,dt,moving);if(w.action){w.action.remaining-=dt;if(w.action.remaining<=0){const a=w.action;w.action=null;if(w.save.mode==='life'){w.needs[a.key]=clamp(w.needs[a.key]+a.gain,0,100);w.needs=advanceClock(w.needs,a.key==='energy'?120:15)}return a.label+' abgeschlossen.'}}return null}

export function checkpoint(w){return {expectedRevision:w.lifeRevision,buildingRevision:w.b?.revision||0,landRevision:w.save.revision,needs:{...w.needs},profile:{...w.profile},car:w.car?{...w.car}:null,checkpoint:{buildingRevision:w.b?.revision||0,state:{...w.state}}}}
export function validateCheckpoint(c){if(c==null)return null;const s=c.state;if(!Number.isSafeInteger(c.buildingRevision)||c.buildingRevision<0||!s||![s.x,s.z,s.height].every(Number.isFinite)||s.x<0||s.x>1024||s.z<0||s.z>1024||s.height< -10||s.height>550||!(s.level===null||typeof s.level==='string'&&s.level.length<=200))throw Error('Ungültiger Positionsspeicher');return {buildingRevision:c.buildingRevision,state:{x:s.x,z:s.z,height:s.height,level:s.level}}}
export function tradeNeeds(w,type){if(w.save.mode!=='life'||w.action||!tradeSite(type,siteNear(w.state.x,w.state.z)))throw Error('Bitte zum passenden Eingang gehen.');const rule=ruleFor(type);if(rule?.site&&!isOpen(rule.site,w.needs.minute))throw Error('Geschäft geschlossen.');return applyTradeNeeds(w.needs,type)}
