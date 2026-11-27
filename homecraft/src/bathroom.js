// Parametric bathroom fixtures. Local +Z is the service/front side; plan +Y.
export const bathroomModels=[
 ['sanWC','Wand-WC',.40,.65,.85,'#f4f4f0'],
 ['sanVanity','Waschtisch mit Unterschrank',.80,.52,.85,'#c0ad93'],
 ['sanDouble','Doppelwaschtisch',1.40,.55,.85,'#c0ad93'],
 ['sanWalkin','Walk-in-Dusche',1.20,.90,2.10,'#e9eeee'],
 ['sanCorner','Eckdusche',.90,.90,2.05,'#e9eeee'],
 ['sanTub','Freistehende Badewanne',.80,1.70,.60,'#f4f4f0'],
 ['sanCabinet','Bad-Hochschrank',.40,.35,1.80,'#c0ad93'],
 ['sanTowel','Handtuchheizkörper',.55,.12,1.20,'#e9e9e9']
];
export const isBathroom=o=>bathroomModels.some(q=>q[0]===o?.kind);
const showers=['sanWalkin','sanCorner'],vanities=['sanVanity','sanDouble'];
export function bathroomSettings(o){return {ceramic:'#f4f4f0',metal:'#929fa1',glass:'#b4d8dc',tray:.04,wallMounted:o.kind==='sanWC',clearance:.75,price:0,...o.bathroom}}
export function validateBathroom(o){
 if(!isBathroom(o))return;
 if(o.bathroom!==undefined&&(!o.bathroom||typeof o.bathroom!=='object'||Array.isArray(o.bathroom)))throw Error('Ungültige Badparameter');
 const a=bathroomSettings(o),n=(v,l,h)=>Number.isFinite(v)&&v>=l&&v<=h;
 if(!n(o.width,.25,4)||!n(o.depth,.08,3)||!n(o.height,.3,3)||!n(a.tray,.02,.18)||!n(a.clearance,.3,2)||!n(a.price,0,1000000)||typeof a.wallMounted!=='boolean'||![a.ceramic,a.metal,a.glass].every(v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v)))throw Error('Ungültige Badmasse oder Materialien');
 if(showers.includes(o.kind)&&(o.width<.65||o.depth<.65||o.height<1.6))throw Error('Dusche benötigt mindestens 65 × 65 × 160 cm');
 if(o.kind==='sanTub'&&(o.width<.55||o.depth<1||o.height<.35))throw Error('Badewanne zu klein');
 if(vanities.includes(o.kind)&&(o.width<(o.kind==='sanDouble'?1.05:.4)||o.depth<.32||o.height<.55))throw Error('Waschtisch zu klein');
 if(o.kind==='sanWC'&&(o.depth<.35||o.height<.55))throw Error('WC zu klein');
 return a;
}
export function bathroomComponents(o){
 const a=validateBathroom(o);if(!a)return [];const w=o.width,d=o.depth,h=o.height,out=[];
 const b=(x,y,z,width,height,depth,color,role,extra={})=>{if(Math.min(width,height,depth)>1e-5)out.push({x,y,z,width,height,depth,color,role,...extra})};
 const rim=(x,y,z,W,D,H,t,col,role)=>{for(const s of [-1,1]){b(x+s*(W-t)/2,y,z,t,H,D,col,role);b(x,y,z+s*(D-t)/2,W-2*t,H,t,col,role)}};
 const tap=(x,y,z)=>{b(x,y+.055,z,.035,.11,.035,a.metal,'tap');b(x,y+.105,z+.035,.035,.025,.10,a.metal,'tap')};
 const drain=(x,y,z)=>b(x,y,z,.065,.006,.065,a.metal,'drain',{round:true});
 if(showers.includes(o.kind)){
  b(0,a.tray/2,0,w,a.tray,d,a.ceramic,'tray');drain(0,a.tray+.004,0);
  const H=h-a.tray,cy=a.tray+H/2,t=.012;
  b(-w/2+t/2,cy,0,t,H,d,a.glass,'glass',{glass:true});
  if(o.kind==='sanCorner'){b(w/2-t/2,cy,0,t,H,d,a.glass,'glass',{glass:true});b(-w*.28,cy,d/2-t/2,w*.44,H,t,a.glass,'glass',{glass:true})}
  else b(0,cy,-d/2+t/2,w,H,t,a.glass,'glass',{glass:true});
  b(0,h*.58,-d/2+.035,.025,h*.72,.025,a.metal,'showerRail');b(0,h*.91,-d/2+.13,.21,.025,.21,a.metal,'showerHead',{round:true});
 }else if(o.kind==='sanTub'){
  const t=Math.min(.075,w*.12),base=h*.18;
  b(0,base/2,0,w,base,d,a.ceramic,'tubBase');rim(0,(base+h)/2,0,w,d,h-base,t,a.ceramic,'tubWall');drain(0,base+.006,d*.2);tap(0,h,-d/2+t/2);
 }else if(vanities.includes(o.kind)){
  const count=o.kind==='sanDouble'?2:1,base=a.wallMounted?h*.22:.04,top=.10;
  b(0,(base+h-top)/2,0,w,h-top-base,d,o.color,'cabinet');
  const cell=w/count;
  for(let i=0;i<count;i++){const x=(i+.5)*cell-w/2;for(const s of [-1,1]){b(x,h-top/2,s*d*.425,cell,top,d*.15,a.ceramic,'basinRim');b(x+s*cell*.425,h-top/2,0,cell*.15,top,d*.7,a.ceramic,'basinRim')}b(x,h-top+.015,0,cell*.7,.03,d*.7,a.ceramic,'basinBase');drain(x,h-top+.033,0);tap(x,h,-d*.42);
   for(const z of [.35,.72]){const Y=base+(h-top-base)*z;b(x,Y,d/2+.008,cell-.012,(h-top-base)*.36,.016,o.color,'front');b(x,Y+.035,d/2+.025,Math.min(.22,cell*.5),.016,.025,a.metal,'handle')}
  }
 }else if(o.kind==='sanWC'){
  const y=a.wallMounted?h*.16:0,seat=h*.53,bd=d*.66,bz=d*.12;
  b(0,(h+y)/2,-d*.35,w*.8,h-y,d*.26,a.ceramic,'cistern');
  b(0,(y+seat*.67)/2,bz,w*.82,seat*.67-y,bd*.8,a.ceramic,'bowlBase');
  rim(0,seat*.84,bz,w,bd,seat*.25,Math.min(.045,w*.12),a.ceramic,'bowlRim');rim(0,seat,bz,w,bd,.028,Math.min(.04,w*.12),'#e7e7e4','seat');
  b(0,h*.90,-d*.20,.10,.035,.012,a.metal,'flush');
 }else if(o.kind==='sanCabinet'){
  b(0,h/2,0,w,h,d,o.color,'cabinet');for(const s of [-1,1]){b(0,h/2+s*h*.25,d/2+.008,w-.008,h*.49,.016,o.color,'front');b(w*.32,h/2+s*h*.25,d/2+.025,.018,.11,.025,a.metal,'handle')}
 }else{
  for(const s of [-1,1])b(s*w*.43,h/2,0,.035,h,.035,o.color,'rail');for(let i=0;i<8;i++)b(0,h*(.08+i*.12),0,w,.025,.035,o.color,'rail');
 }
 return out;
}
export function bathroomFrontZone(o){const a=validateBathroom(o),angle=o.rotation*Math.PI/180,shift=(o.mirrorY?-1:1)*(o.depth+a.clearance)/2;return {...o,x:o.x-Math.sin(angle)*shift,y:o.y+Math.cos(angle)*shift,depth:a.clearance,height:Math.min(o.height,1),elevation:o.elevation||0}}
export function bathroomQuantities(o){const a=validateBathroom(o),parts=bathroomComponents(o);return {price:a.price,footprint:o.width*o.depth,glass:parts.filter(q=>q.role==='glass').reduce((s,q)=>s+q.height*Math.max(q.width,q.depth),0),waterPoints:['sanWC','sanVanity','sanDouble','sanWalkin','sanCorner','sanTub'].includes(o.kind)?(o.kind==='sanDouble'?2:1):0}}
