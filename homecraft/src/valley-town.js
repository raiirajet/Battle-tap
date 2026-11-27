// Deterministic offline town; residents and traffic are reconstructed from game time.
const point=(x,z)=>({x,z});
export const HOMES=Object.freeze([420,485,550].map((z,i)=>Object.freeze({id:'home-'+i,x:298,z,w:12,d:10,door:point(305,z),color:[0xdcc5a7,0xb6c7b6,0xc8b8a9][i]})));
export const HOURS=Object.freeze({work:Object.freeze({open:480,close:1080,label:'08:00–18:00'}),meal:Object.freeze({open:420,close:1200,label:'07:00–20:00'})});
export function isOpen(site,minute){const h=HOURS[site];return !!h&&Number.isFinite(minute)&&minute>=h.open&&minute<h.close}
const locations={work:point(296,309),meal:point(344,312),park:point(288,346),square:point(326,315)};
const residentData=[
 ['lea','Lea','Gärtnerin',0,'park',0,'#64784d','long'],
 ['noah','Noah','Mechaniker',0,'work',12,'#476ca8','short'],
 ['mia','Mia','Händlerin',1,'meal',24,'#a84f55','long'],
 ['elias','Elias','Kurier',1,'square',36,'#bc8a43','short'],
 ['sara','Sara','Floristin',2,'park',48,'#ece2d3','long'],
 ['luca','Luca','Verkäufer',2,'meal',60,'#367f82','short']
];
export const RESIDENTS=Object.freeze(residentData.map(([id,name,job,home,work,offset,shirt,hairStyle],i)=>Object.freeze({id,name,job,home,work,offset,profile:Object.freeze({skin:['#f2c4a0','#a66f50','#d9a076','#70452f','#c68c65','#d9a076'][i],shirt,pants:['#344457','#38383e','#80674d','#64808b'][i%4],hair:['#805739','#332924','#c49c54','#231f20','#a84d35'][i%5],hairStyle})})));
const homePoint=r=>point(HOMES[r.home].door.x+.8,HOMES[r.home].z+(r.offset%24)/12);
function destination(r){const p=locations[r.work];return r.offset>=48?point(p.x+1.8,p.z):p}
function route(r,dest){const h=homePoint(r),end=destination(r),side=315.7+(r.offset%24)/60;const join=dest==='park'?345.5:315;
return [h,point(side,h.z),point(side,join),point(end.x,join),end]}
function pathAt(path,t){const lengths=path.slice(1).map((p,i)=>Math.hypot(p.x-path[i].x,p.z-path[i].z)),total=lengths.reduce((a,b)=>a+b,0);let left=Math.max(0,Math.min(1,t))*total;for(let i=0;i<lengths.length;i++){if(left<=lengths[i]&&lengths[i]>0){const a=path[i],b=path[i+1],u=left/lengths[i];return {x:a.x+(b.x-a.x)*u,z:a.z+(b.z-a.z)*u,dx:(b.x-a.x)/lengths[i],dz:(b.z-a.z)/lengths[i]}}left-=lengths[i]}return {...path.at(-1),dx:0,dz:1}}
const stationary=(p,activity)=>({...p,dx:0,dz:1,moving:false,activity});
export function residentAt(r,minute){const t=((minute%1440)+1440)%1440,o=r.offset,depart=390+o,arrive=540+o,leave=900+o,back=1050+o,home=homePoint(r),path=route(r,r.work);if(t<depart||t>=back)return stationary(home,t>=1260||t<360?'Zuhause / Nachtruhe':'Feierabend');if(t<arrive)return {...pathAt(path,(t-depart)/(arrive-depart)),moving:true,activity:'Unterwegs zur Arbeit'};if(t<leave)return stationary(destination(r),r.work==='park'?'Im Park':r.work==='square'?'Am Dorfplatz':'Bei der Arbeit');return {...pathAt([...path].reverse(),(t-leave)/(back-leave)),moving:true,activity:'Auf dem Heimweg'}}
export function nearResident(state,minute,excluded=null){if(!state||Math.abs(state.height)>.7)return null;let best=null;for(const r of RESIDENTS){if(r.id===excluded)continue;const p=residentAt(r,minute),d=Math.hypot(p.x-state.x,p.z-state.z);if(d<=2.4&&(!best||d<best.distance))best={id:r.id,name:r.name,job:r.job,activity:p.activity,distance:d}}return best}
export const SOCIAL=Object.freeze({greet:Object.freeze({label:'Begrüssen',gain:3,minute:1}),chat:Object.freeze({label:'Unterhalten',gain:8,minute:5})});
export function validateRelations(input){if(input==null)return {};if(typeof input!=='object'||Array.isArray(input))throw Error('Ungültige Bekanntschaften.');const out={};for(const [id,value] of Object.entries(input)){if(!RESIDENTS.some(r=>r.id===id)||!value||!Number.isSafeInteger(value.score)||value.score<0||value.score>100||!Number.isSafeInteger(value.last)||value.last<0)throw Error('Ungültige Bekanntschaft.');out[id]={score:value.score,last:value.last}}return out}
export function relationshipLabel(score=0){return score>=75?'Gute Freunde':score>=40?'Freunde':score>=10?'Bekannt':'Fremd'}
export function socialAction(relations,request,state,minute,now=Date.now()){const result=validateRelations(relations);const rule=Object.hasOwn(SOCIAL,request?.type)?SOCIAL[request.type]:null;const r=RESIDENTS.find(x=>x.id===request?.id);if(!rule||!r||!Number.isSafeInteger(now)||now<0)throw Error('Ungültige soziale Aktion.');const p=residentAt(r,minute);if(!state||Math.abs(state.height)>.7||Math.hypot(state.x-p.x,state.z-p.z)>2.4)throw Error('Bewohner nicht in Reichweite.');const old=result[r.id];if(old&&now-old.last<30000)throw Error('Bitte 30 Sekunden bis zur nächsten Unterhaltung warten.');result[r.id]={score:Math.min(100,(old?.score||0)+rule.gain),last:now};return {relations:result,minute:(minute+rule.minute)%1440}}
export const CARS=Object.freeze([0,1,2,3].map((i)=>Object.freeze({id:'car-'+i,z:345.5+i*65,color:[0x577eaa,0xb74e47,0xe6e2d6,0x4a555a][i],offset:i*41})));
export function carAt(car,minute){const t=((minute+car.offset)%240+240)%240/240;const z=car.z,a=330,b=534,lane=1.45; // Each car has its own residential road; turn within the road at each end.
 const path=[point(a,z-lane),point(b,z-lane),point(b+1.45,z),point(b,z+lane),point(a,z+lane),point(a-1.45,z),point(a,z-lane)];
 return pathAt(path,t)}
