// RC18.1: design layers above the existing surveyed/interpolated terrain.
// Pure bounded functions; no dependency on rendering or project mutation.
const finite=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
export const terrainDesignDefaults=()=>({originX:0,originY:0,offset:0,slopeX:0,slopeY:0,edits:[]});
export const terrainEditModes=['raise','lower','flatten'];
export function validateTerrainDesign(d){
 if(d===undefined)return;
 if(!d||!finite(d.originX,-1000,1000)||!finite(d.originY,-1000,1000)||!finite(d.offset,-10,10)||!finite(d.slopeX,-1,1)||!finite(d.slopeY,-1,1)||!Array.isArray(d.edits)||d.edits.length>32)throw Error('Ungültige Geländeplanung');
 const ids=new Set();
 for(const e of d.edits){if(!e||typeof e.id!=='string'||!e.id.length||e.id.length>200||ids.has(e.id)||!terrainEditModes.includes(e.mode)||!finite(e.x,-1000,1000)||!finite(e.y,-1000,1000)||!finite(e.radius,.5,100)||!(e.mode==='flatten'?finite(e.amount,-10,10):finite(e.amount,.05,10)))throw Error('Ungültige Geländemodellierung');ids.add(e.id)}
}
const smooth=t=>t*t*(3-2*t);
export function plannedHeight(existing,q,d){
 if(!d)return existing;
 let z=existing+d.offset+d.slopeX*(q.x-d.originX)+d.slopeY*(q.y-d.originY);
 for(const e of d.edits){const t=Math.hypot(q.x-e.x,q.y-e.y)/e.radius;if(t>=1)continue;const w=e.mode==='flatten'?1-smooth(Math.max(0,(t-.5)*2)):1-smooth(t);z=e.mode==='flatten'?z+(e.amount-z)*w:z+(e.mode==='raise'?1:-1)*e.amount*w}
 return Math.max(-10,Math.min(10,z));
}
export function terrainBounds(points){if(!Array.isArray(points)||points.length<3)throw Error('Zuerst Bauland erstellen.');const xs=points.map(q=>q.x),ys=points.map(q=>q.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);if(!(maxX>minX&&maxY>minY))throw Error('Ungültige Grundstücksfläche');return {minX,maxX,minY,maxY}}
function inside(points,q){let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>q.y)!==(b.y>q.y)&&q.x<(b.x-a.x)*(q.y-a.y)/(b.y-a.y)+a.x)yes=!yes}return yes}
export function terrainAnalysis(points,existing,planned,resolution=48){
 const b=terrainBounds(points),n=Math.max(8,Math.min(80,Math.round(resolution)||48)),dx=(b.maxX-b.minX)/n,dy=(b.maxY-b.minY)/n,cellArea=dx*dy,samples=[];
 let cut=0,fill=0,min=Infinity,max=-Infinity,limited=0;
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const q={x:b.minX+(i+.5)*dx,y:b.minY+(j+.5)*dy};if(!inside(points,q))continue;const old=existing(q),z=planned(q),delta=z-old;if(!Number.isFinite(old)||!Number.isFinite(z))throw Error('Ungültige Geländehöhe');cut+=Math.max(0,-delta)*cellArea;fill+=Math.max(0,delta)*cellArea;min=Math.min(min,z);max=Math.max(max,z);if(Math.abs(z)>=10-1e-9)limited++;samples.push({i,j,...q,old,z,delta})}
 if(!samples.length)throw Error('Grundstück für das Stichprobenraster zu schmal.');
 return {...b,resolution:n,dx,dy,samples,sampledArea:samples.length*cellArea,cut,fill,net:fill-cut,min,max,limited};
}
export function terrainProfile(points,existing,planned,{axis='x',at,steps=96}={}){
 if(!['x','y'].includes(axis)||!Number.isFinite(at))throw Error('Ungültiger Geländeschnitt');
 const b=terrainBounds(points),a=axis==='x'?b.minX:b.minY,end=axis==='x'?b.maxX:b.maxY,n=Math.max(2,Math.min(160,Math.round(steps)||96));
 return Array.from({length:n+1},(_,i)=>{const v=a+(end-a)*i/n,q=axis==='x'?{x:v,y:at}:{x:at,y:v};return {distance:v-a,...q,inside:inside(points,q),old:existing(q),z:planned(q)}});
}
