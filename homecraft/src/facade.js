// Wall-local normalized rectangles. + side = local +Z / plan +Y (left of A→B).
const finite=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
const eps=1e-8;
export const facadeStyles=[['plaster','Putz'],['wood','Holz'],['stone','Naturstein'],['concrete','Beton'],['brick','Klinker'],['metal','Metall'],['glass','Glasoptik'],['custom','Einfarbig']];
export function validateFacade(w,materials){
 const p=w.facade;if(p===undefined)return;
 if(!Array.isArray(p)||p.length>24)throw Error('Maximal 24 Fassadenabschnitte pro Wand');
 for(const a of p){if(!a||typeof a.id!=='string'||!a.id.length||a.id.length>200||typeof a.name!=='string'||a.name.length>100||![-1,1].includes(a.side)||!['plaster','wood','stone','concrete','brick','metal','glass','custom'].includes(a.style)||typeof a.color!=='string'||!/^#[0-9a-f]{6}$/i.test(a.color)||typeof a.material!=='string'||a.material.length>100||a.material&&materials&&!materials.some(m=>m.id===a.material)||![a.u0,a.u1,a.v0,a.v1].every(v=>finite(v,0,1))||a.u1-a.u0<eps||a.v1-a.v0<eps)throw Error('Ungültiger Fassadenabschnitt')}
 if(new Set(p.map(a=>a.id)).size!==p.length)throw Error('Doppelte Fassaden-ID');
 for(let i=0;i<p.length;i++)for(let j=0;j<i;j++){const a=p[i],b=p[j];if(a.side===b.side&&Math.min(a.u1,b.u1)-Math.max(a.u0,b.u0)>eps&&Math.min(a.v1,b.v1)-Math.max(a.v0,b.v0)>eps)throw Error('Fassadenabschnitte derselben Seite dürfen sich nicht überlagern')}
}
export function facadePieces(w,cells){
 const L=Math.hypot(w.b.x-w.a.x,w.b.y-w.a.y),H=w.height,out=[];
 for(const a of w.facade||[]){for(const c of cells){const x0=Math.max(a.u0*L,c.x-c.width/2),x1=Math.min(a.u1*L,c.x+c.width/2),y0=Math.max(a.v0*H,c.y-c.height/2),y1=Math.min(a.v1*H,c.y+c.height/2);if(x1-x0>eps&&y1-y0>eps)out.push({...a,x:(x0+x1)/2,y:(y0+y1)/2,width:x1-x0,height:y1-y0})}}
 return out;
}
export function facadeArea(w,cells){return facadePieces(w,cells).reduce((s,q)=>s+q.width*q.height,0)}
export function splitFacade(parts,t,side){
 const min=side==='left'?0:t,max=side==='left'?t:1;
 return (parts||[]).flatMap(a=>{const u0=Math.max(a.u0,min),u1=Math.min(a.u1,max);return u1-u0>eps?[{...a,u0:Math.max(0,(u0-min)/(max-min)),u1:Math.min(1,(u1-min)/(max-min))}]:[]})
}
