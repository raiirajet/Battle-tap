// Schematic services, not engineering dimensioning.
export function routeSettings(r){return {name:'',diameter:.05,end:r.elevation,material:'',price:0,...r.tech}}
export function validateTechnical(r){if(r.tech===undefined)return;const a=r.tech,n=(v,l,h)=>Number.isFinite(v)&&v>=l&&v<=h;if(!a||typeof a!=='object'||Array.isArray(a)||typeof a.name!=='string'||a.name.length>100||typeof a.material!=='string'||a.material.length>100||!n(a.diameter,.005,1)||!n(a.end,-30,30)||!n(a.price,0,1000000))throw Error('Ungültige Leitungsparameter')}
export function routeGeometry(r){
 const a=routeSettings(r),lengths=[0];for(let i=1;i<r.points.length;i++)lengths.push(lengths.at(-1)+Math.hypot(r.points[i].x-r.points[i-1].x,r.points[i].y-r.points[i-1].y));
 const horizontal=lengths.at(-1),rise=a.end-r.elevation,points=r.points.map((p,i)=>({...p,z:r.elevation+(horizontal>0?lengths[i]/horizontal:0)*rise}));
 return {points,horizontal,rise,length:Math.hypot(horizontal,rise),slope:horizontal>0?rise/horizontal*100:0}
}
export function routeWarning(r,l){const a=routeSettings(r),g=routeGeometry(r),out=[];if(g.horizontal<.05)out.push('Leitung zu kurz');if(r.system==='drain'&&g.rise>=0)out.push('Abwasser: kein Gefälle in Zeichenrichtung');if(Math.max(r.elevation,a.end)+a.diameter/2>l.height||Math.min(r.elevation,a.end)-a.diameter/2<-(l.slab??.2))out.push('Leitung ausserhalb Geschoss inklusive Decke');return out}
