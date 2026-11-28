// RC18.2–10: bounded, standalone garden model. All dimensions metres, rates CHF.
export const gardenKinds=[['pool','Swimmingpool'],['pond','Gartenteich'],['path','Weg / Pflasterfläche'],['wall','Stützmauer'],['stairs','Geländetreppe'],['planting','Pflanzbeet'],['light','Aussenleuchte'],['irrigation','Bewässerungsleitung']];
export const gardenMaterials=[['tile','Pflaster','#a6a39b'],['gravel','Kies','#b6ad99'],['oak','Holz','#a78a65'],['concrete','Beton','#adb1a9']];
export const gardenPlants=[['tree','Baum'],['shrub','Strauch'],['flower','Staude']];
const finite=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
const kindSet=new Set(gardenKinds.map(q=>q[0])),materialSet=new Set(gardenMaterials.map(q=>q[0])),plantSet=new Set(gardenPlants.map(q=>q[0]));
export const gardenDefaults=(kind,x=0,y=0)=>({kind,name:gardenKinds.find(q=>q[0]===kind)?.[1]||'',x,y,width:kind==='light'?.3:kind==='pool'?6:kind==='pond'?3:kind==='wall'?5:kind==='stairs'?3:kind==='irrigation'?8:kind==='planting'?4:5,depth:kind==='light'?.3:kind==='wall'?.25:kind==='irrigation'?.08:kind==='pool'?3:kind==='pond'?2:kind==='planting'?3:1.2,rotation:0,height:kind==='pool'?1.5:kind==='pond'?.8:kind==='wall'?1:kind==='stairs'?.9:kind==='light'?1:kind==='path'?.15:.2,elevation:0,rim:.15,freeboard:.12,material:'tile',plant:'shrub',spacing:1,steps:6,watts:8,lit:true,flow:2,rate:0});
export const isWater=q=>q.kind==='pool'||q.kind==='pond';
export function validateGarden(p){
 if(p.garden===undefined)return;
 const a=p.garden;if(!a||!Array.isArray(a.items)||a.items.length>120||!finite(a.cutRate,0,1e7)||!finite(a.fillRate,0,1e7)||!finite(a.reserve,0,100)||!finite(a.tax,0,100))throw Error('Ungültiges Gartenprojekt');
 const ids=new Set();let plantTotal=0,waterTotal=0,outletTotal=0;
 for(const q of a.items){
  if(!q||typeof q.id!=='string'||!q.id||q.id.length>200||ids.has(q.id)||!kindSet.has(q.kind)||typeof q.name!=='string'||!q.name.trim()||q.name.length>100||!finite(q.x,-1000,1000)||!finite(q.y,-1000,1000)||!finite(q.width,.08,100)||!finite(q.depth,.08,100)||!finite(q.rotation,-360,360)||!finite(q.height,.03,10)||!finite(q.elevation,-10,10)||!materialSet.has(q.material)||!plantSet.has(q.plant)||!finite(q.spacing,.3,20)||!Number.isInteger(q.steps)||!finite(q.steps,2,60)||!finite(q.watts,0,100)||typeof q.lit!=='boolean'||!finite(q.flow,.1,100)||!finite(q.rate,0,1e7))throw Error('Ungültiges Gartenelement');
  if(isWater(q)&&(!finite(q.width,1,30)||!finite(q.depth,1,30)||!finite(q.height,.2,4)||q.elevation-q.height-.15< -14||!finite(q.rim??.15,.10,.80)||2*(q.rim??.15)>=Math.min(q.width,q.depth)-.20||!finite(q.freeboard??.12,.05,.50)||(q.freeboard??.12)>=q.height)||q.kind==='stairs'&&q.width/q.steps<.2||q.kind==='planting'&&(q.width/q.spacing>60||q.depth/q.spacing>60||plantCount(q)>200))throw Error('Gartenelement: Abmessungen oder Anzahl ausserhalb der Grenzen');
  ids.add(q.id);if(isWater(q))waterTotal++;if(q.kind==='planting')plantTotal+=plantCount(q);if(q.kind==='irrigation')outletTotal+=gardenSprinklers(q).length;
 }
 if(waterTotal>12||plantTotal>600||outletTotal>1200)throw Error('Maximal 12 Wasseranlagen, 600 Pflanzen und 1200 Bewässerungsauslässe pro Garten.');
}
export const gardenSettings=p=>p.garden||{items:[],cutRate:0,fillRate:0,reserve:0,tax:0};
export function localPoint(q,x,y){const a=q.rotation*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return{x:q.x+x*c-y*s,y:q.y+x*s+y*c}}
export function gardenFootprint(q,inset=0){const w=q.width/2-inset,d=q.depth/2-inset;if(w<=0||d<=0)throw Error('Umrandung zu breit');return q.kind==='pond'?Array.from({length:32},(_,i)=>{const a=i*Math.PI/16;return localPoint(q,w*Math.cos(a),d*Math.sin(a))}):[localPoint(q,-w,-d),localPoint(q,w,-d),localPoint(q,w,d),localPoint(q,-w,d)]}
export function gardenArea(pts){return Math.abs(pts.reduce((s,a,i)=>{const b=pts[(i+1)%pts.length];return s+a.x*b.y-b.x*a.y},0))/2}
const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const edges=a=>a.map((q,i)=>[q,a[(i+1)%a.length]]);
const on=(p,a,b)=>Math.abs(cross(a,b,p))<1e-7&&p.x>=Math.min(a.x,b.x)-1e-7&&p.x<=Math.max(a.x,b.x)+1e-7&&p.y>=Math.min(a.y,b.y)-1e-7&&p.y<=Math.max(a.y,b.y)+1e-7;
export function gardenContains(poly,q,boundary=true){let inside=false;for(const [a,b] of edges(poly)){if(on(q,a,b))return boundary;if((a.y>q.y)!==(b.y>q.y)&&q.x<(b.x-a.x)*(q.y-a.y)/(b.y-a.y)+a.x)inside=!inside}return inside}
function intersects(a,b,c,d){return cross(a,b,c)*cross(a,b,d)<-1e-12&&cross(c,d,a)*cross(c,d,b)<-1e-12||on(a,c,d)||on(b,c,d)||on(c,a,b)||on(d,a,b)}
export function gardenOverlap(a,b){return edges(a).some(([u,v])=>edges(b).some(([x,y])=>intersects(u,v,x,y)))||gardenContains(a,b[0])||gardenContains(b,a[0])}
export function gardenInside(outer,inner){return inner.every(q=>gardenContains(outer,q,false))&&!edges(inner).some(([a,b])=>edges(outer).some(([c,d])=>intersects(a,b,c,d)))}
export function gardenState(p,obstacles=[]){
 const active=[],invalid=[];const parcel=p.parcel?.points;
 for(const q of gardenSettings(p).items){const pts=gardenFootprint(q),solid=q.kind!=='irrigation'&&q.kind!=='light';let reason='';
  if(!parcel||!gardenInside(parcel,pts))reason='Liegt nicht vollständig innerhalb der Grundstücksgrenze.';
  else if(q.kind!=='irrigation'&&obstacles.some(o=>gardenOverlap(o,pts)))reason='Überschneidet Gebäude oder Wand.';
  else if(active.some(v=>(isWater(q)||isWater(v))&&gardenOverlap(gardenFootprint(v),pts)))reason='Überschneidet eine Wasseranlage oder deren Aussparung.';
  else if(isWater(q)&&(p.landscape||[]).some(a=>a.kind!=='grass'&&gardenOverlap(a.points,pts)))reason='Überschneidet eine bestehende befestigte Aussenfläche.';
  else if(solid&&active.some(v=>v.kind!=='light'&&v.kind!=='irrigation'&&gardenOverlap(gardenFootprint(v),pts)))reason='Überschneidet ein anderes Gartenelement.';
  if(reason)invalid.push({item:q,reason});else active.push(q)
 }
 return {active,invalid}
}
// Subtract a convex counter-clockwise polygon from a convex input polygon.
// Output polygons partition the outside with no area duplication.
function clipHalf(poly,a,b,inside){const out=[];for(const [u,v] of edges(poly)){const du=cross(a,b,u),dv=cross(a,b,v),ok=x=>inside?x>=-1e-9:x<=1e-9;if(ok(du))out.push(u);if(ok(du)!==ok(dv)){const t=du/(du-dv);out.push({x:u.x+(v.x-u.x)*t,y:u.y+(v.y-u.y)*t})}}return out}
export function subtractGardenHole(poly,hole){let rest=poly,out=[];for(const [a,b] of edges(hole)){if(rest.length<3)break;const outside=clipHalf(rest,a,b,false);if(outside.length>=3&&gardenArea(outside)>1e-9)out.push(outside);rest=clipHalf(rest,a,b,true)}return out}
export function plantCount(q){return Math.floor(q.width/q.spacing)*Math.floor(q.depth/q.spacing)}
export function gardenPlantPoints(q){const nx=Math.floor(q.width/q.spacing),ny=Math.floor(q.depth/q.spacing);if(nx*ny>200)throw Error('Maximal 200 Pflanzen pro Beet');const a=[];for(let j=0;j<ny;j++)for(let i=0;i<nx;i++)a.push(localPoint(q,(i-(nx-1)/2)*q.spacing,(j-(ny-1)/2)*q.spacing));return a}
export function gardenLine(q){return [localPoint(q,-q.width/2,0),localPoint(q,q.width/2,0)]}
export function gardenSprinklers(q){const n=Math.min(100,Math.max(1,Math.floor(q.width/q.spacing)+1));return Array.from({length:n},(_,i)=>localPoint(q,n===1?0:-q.width/2+q.width*i/(n-1),0))}
export function gardenWater(q,height){const outer=gardenFootprint(q),inner=gardenFootprint(q,q.rim??.15),area=gardenArea(inner),outerArea=gardenArea(outer),bottom=q.elevation-q.height-.15,water=q.elevation-(q.freeboard??.12),innerBottom=q.elevation-q.height;
 let sum=0,count=0;for(let j=0;j<16;j++)for(let i=0;i<16;i++){const p=localPoint(q,((i+.5)/16-.5)*q.width,((j+.5)/16-.5)*q.depth);if(gardenContains(outer,p)){sum+=Math.max(0,height(p)-bottom);count++}}
 return {outer,inner,area,outerArea,bottom,innerBottom,water,volume:area*Math.max(0,water-innerBottom),excavation:count?outerArea*sum/count:0,rimArea:outerArea-area}
}
export function gardenQuantities(p,active,height,earth={cut:0,fill:0}){
 const rows=[],cfg=gardenSettings(p);let waterVolume=0,power=0,flow=0,excavation=0,plants=0,pathVolume=0,rimArea=0;
 const add=(name,qty,unit,rate)=>rows.push({name,qty,unit,rate,total:qty*rate});
 for(const q of active){if(isWater(q)){const w=gardenWater(q,height);waterVolume+=w.volume;excavation+=w.excavation;rimArea+=w.rimArea;add(q.name+' – Becken',w.area,'m²',q.rate)}
 else if(q.kind==='path'){pathVolume+=q.width*q.depth*q.height;add(q.name,q.width*q.depth,'m²',q.rate)}
 else if(q.kind==='wall'){add(q.name,q.width*q.depth*q.height,'m³',q.rate)}
 else if(q.kind==='stairs'){add(q.name,q.steps,'Stufen',q.rate)}
 else if(q.kind==='planting'){const n=plantCount(q);plants+=n;add(q.name,n,'Stk',q.rate)}
 else if(q.kind==='light'){if(q.lit)power+=q.watts;add(q.name,1,'Stk',q.rate)}
 else if(q.kind==='irrigation'){flow+=gardenSprinklers(q).length*q.flow;add(q.name,q.width,'m',q.rate)}}
 add('Geländeabtrag (vor Becken)',earth.cut||0,'m³',cfg.cutRate);add('Beckenaushub zusätzlich',excavation,'m³',cfg.cutRate);add('Geländeauftrag',earth.fill||0,'m³',cfg.fillRate);
 const subtotal=rows.reduce((s,q)=>s+q.total,0),reserve=subtotal*cfg.reserve/100,tax=(subtotal+reserve)*cfg.tax/100;
 return {rows,subtotal,reserve,tax,total:subtotal+reserve+tax,waterVolume,excavation,power,flow,plants,pathVolume,rimArea}
}

export function gardenWarnings(items,height){const out=[];let lit=0;for(const q of items){if(q.kind==='light'&&q.lit)lit++;if(isWater(q)&&gardenFootprint(q).some(a=>height(a)<q.elevation-q.height-.15))out.push(q.name+' – Becken liegt teilweise über dem Gelände; Auflager und Verfüllung prüfen.');if(q.kind==='stairs'){const base=height(localPoint(q,-q.width/2,0)),end=height(localPoint(q,q.width/2,0));if(Math.abs(base+q.height-end)>.2)out.push(q.name+' – oberes Treppenende weicht mehr als 20 cm von der Geländehöhe ab.');if(Array.from({length:q.steps},(_,i)=>{const a=localPoint(q,-q.width/2+(i+.5)*q.width/q.steps,0);return height(a)>base+(i+1)*q.height/q.steps+.02}).some(Boolean))out.push(q.name+' – Gelände überdeckt mindestens eine Stufe; Abgrabung separat planen.')}}if(lit>8)out.push('Mehr als acht Leuchten eingeschaltet: nur acht reale Punktlichter, weitere Leuchten visuell emissiv.');return out}
