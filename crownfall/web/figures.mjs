// Original procedural low-poly meshes, projected through the game's fixed isometric camera.
// References: Art & Animation Bible v1.0 pp. 3–8, 15–25, 30. No PDF screenshots are reused.
const human=(cloth,skin,hair,gear,extra={})=>({kind:'human',cloth,skin,hair,gear,...extra});
const steel='#a7b9c1',gold='#d9b363',leather='#76553a',dark='#3c3028';
export const heroLooks={
 'Aldric Valen':human('#315d9b','#d8a477','#563b2b','sword',{armor:true,shield:true,cape:true,crown:true,width:1.2}),
 'Elara Voss':human('#9f3e3a','#d8a17d','#694335','sword',{armor:true,shield:true,cape:true,braid:true,width:.96}),
 'Lyra Dorn':human('#477847','#ca986f','#392a24','bow',{hood:true,cape:true,width:.85}),
 'Kael Fen':human('#805c39','#dbb28a','#c3a56b','bow',{hood:true,cape:true,width:.86}),
 'Bram Kessel':human('#936c45','#c59676','#b5b7b4','hammer',{beard:true,apron:true,width:1.22}),
 'Mira Stein':human('#a17a4e','#d4a17f','#4c382e','hammer',{apron:true,width:1.02}),
 'Oren Thal':human('#725797','#d7b092','#b9bcb9','book',{beard:true,robe:true,width:.85}),
 'Neria Aster':human('#e1d4b5','#e5b391','#b96035','book',{robe:true,braid:true,width:.86}),
 'Maera Venn':human('#8a4f82','#805137','#302321','scroll',{robe:true,braid:true,width:.92}),
 'Sami Rayan':human('#c2a47c','#b48159','#372b25','scroll',{robe:true,width:.88}),
 'Sera Lumen':human('#e3dfca','#c58d6f','#70482e','staff',{robe:true,braid:true,width:1.12}),
 'Tovan Reed':human('#38786f','#c99c77','#4b372a','staff',{robe:true,width:.98})
};
const soldier=(cloth,gear,extra={})=>human(cloth,'#c69a76','#574031',gear,{armor:true,helmet:true,...extra});
export const unitLooks={
 militia:human('#9a8054','#c99a74','#68482f','axe',{armor:true,width:1.03}),
 scout:human('#557b4c','#cba078','#503b2a','dagger',{hood:true,cape:true,width:.86}),
 sword:soldier('#405e80','sword'),spear:soldier('#597a85','spear'),
 bow:human('#507e45','#cba27e','#514032','bow',{hood:true,cape:true,width:.86}),
 shield:soldier('#46658d','sword',{shield:true,width:1.18}),crossbow:soldier('#8c7a59','crossbow'),
 cavalry:{kind:'horse',rider:soldier('#8a5546','spear'),coat:'#93653e'},knight:{kind:'horse',rider:soldier('#375d9b','sword',{shield:true,cape:true}),coat:'#754c32'},
 healer:human('#d8d8bf','#c99a79','#805b41','staff',{robe:true}),
 ram:{kind:'machine',type:'ram'},catapult:{kind:'machine',type:'catapult'},trebuchet:{kind:'machine',type:'trebuchet'},
 royal:soldier('#314f8b','sword',{shield:true,cape:true,width:1.2}),crown:soldier('#c7a64c','sword',{shield:true,cape:true}),
 ranger:human('#2e7049','#c29470','#493628','bow',{hood:true,cape:true,width:.86}),
 ironwatch:soldier('#59636b','hammer',{shield:true,width:1.3}),sunrider:{kind:'horse',rider:soldier('#c78d3b','spear'),coat:'#b08049'},
 tide:soldier('#3d9b9b','spear'),frost:soldier('#d0dce0','axe',{cape:true,shield:true}),
 fishing:{kind:'ship',sail:'#e6d7ad',size:.8},merchant:{kind:'ship',sail:'#cdbf9d',size:1.15},patrol:{kind:'ship',sail:'#466f9e',size:1.25,armed:true},cart:{kind:'machine',type:'cart'}
};
export const workerLooks={
 farmer:human('#a09447','#b98965','#63472e','hoe'),wood:human('#526e42','#be8e69','#503a2a','axe'),
 miner:human('#687480','#c89972','#5c4230','pick'),builder:human('#a37b49','#cd9b75','#61442f','hammer'),
 carrier:human('#8b6947','#c2916b','#5b3e29','crate'),fisher:human('#367b89','#c69b78','#65462f','spear'),
 smith:human('#6f6260','#c39370','#49382d','hammer',{apron:true,width:1.15}),scholar:human('#755b91','#d1a47e','#55402e','book',{robe:true})
};
export const workerRole=t=>['farm','ranch'].includes(t)?'farmer':['wood','forester','sawmill'].includes(t)?'wood':['stone','iron','gold'].includes(t)?'miner':['fish','port'].includes(t)?'fisher':['smith','armor'].includes(t)?'smith':['town','school','academy','library'].includes(t)?'scholar':'carrier';
const shade=(hex,k)=>'#'+[1,3,5].map(i=>Math.max(0,Math.min(255,Math.round(parseInt(hex.slice(i,i+2),16)*k))).toString(16).padStart(2,'0')).join('');
const sum=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,k)=>a.map(v=>v*k),dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>mul(a,1/(Math.hypot(...a)||1));
function mesh(){
 const faces=[];const face=(p,c)=>faces.push({p,c});
 function prism(a,b,r1,r2,c,n=6,ratio=1){const axis=norm(sub(b,a)),u=norm(cross(axis,Math.abs(axis[2])>.9?[0,1,0]:[0,0,1])),v=cross(axis,u);const ring=(p,r)=>Array.from({length:n},(_,i)=>{const t=(i+.5)*2*Math.PI/n;return sum(p,sum(mul(u,Math.cos(t)*r),mul(v,Math.sin(t)*r*ratio)))});const lo=ring(a,r1),hi=ring(b,r2);face(lo.slice().reverse(),c);face(hi,c);for(let i=0;i<n;i++)face([lo[i],lo[(i+1)%n],hi[(i+1)%n],hi[i]],c);}
 function box(x,y,z,w,d,h,c){const p=[[x-w/2,y-d/2,z],[x+w/2,y-d/2,z],[x+w/2,y+d/2,z],[x-w/2,y+d/2,z]],q=p.map(v=>sum(v,[0,0,h]));face(p.slice().reverse(),c);face(q,c);for(let i=0;i<4;i++)face([p[i],p[(i+1)%4],q[(i+1)%4],q[i]],c);}
 function ball(p,r,c,ratio=1){const a=sum(p,[0,0,-r*ratio]),b=sum(p,[0,0,r*ratio]),m=Array.from({length:8},(_,i)=>sum(p,[r*Math.cos(i*Math.PI/4),r*Math.sin(i*Math.PI/4),0]));for(let i=0;i<8;i++){face([a,m[(i+1)%8],m[i]],c);face([b,m[i],m[(i+1)%8]],c)}}
 return {faces,face,prism,box,ball};
}
function humanoid(m,l,time,moving,run=false,work=false,offset=[0,0,0],riding=false){
 const w=l.width||1,bob=moving?(run?.045:.023)*(1-Math.cos(time*4*Math.PI)):0,phase=time*2*Math.PI,step=moving?Math.sin(phase)*(run?.29:.19):0;
 const P=(x,y,z)=>sum(offset,[x*w,y,z+bob]);
 const seg=(a,b,r1,r2,c,n=6,ratio=1)=>m.prism(P(...a),P(...b),r1*w,r2*w,c,n,ratio);
 const bx=(x,y,z,a,b,c,col)=>m.box(...P(x,y,z),a*w,b,c,col);
 const ball=(x,y,z,r,c,ratio=1)=>m.ball(P(x,y,z),r*w,c,ratio);
 const trousers=l.robe?shade(l.cloth,.75):'#66513c';
 // independent thighs, knees, shins, boots and arm segments
 for(const side of [-1,1]){const swing=riding?.1:step*side,hip=[side*.105,0,.83],knee=[side*(riding?.20:.108),swing*.45,.46+(moving?Math.max(0,swing)*.25:0)],foot=[side*(riding?.28:.11),swing,.12+(moving?Math.max(0,-swing)*.28:0)];if(riding){foot[1]=-.03;knee[1]=.18;foot[2]=.31;}seg(hip,knee,.085,.064,trousers);seg(knee,foot,.061,.055,trousers);bx(foot[0],foot[1]+.042,foot[2]-.11,.14,.23,.115,dark);}
 seg([0,0,.76],[0,0,.92],.19,.18,l.cloth,8,.72);
 seg([0,0,.89],[0,0,1.35],.17,.245,l.armor?steel:l.cloth,8,.73);
 if(l.armor){bx(0,.152,1.02,.25,.035,.23,shade(steel,.91));bx(0,.18,1.11,.045,.025,.14,gold);}
 if(l.robe||l.cape){const c=shade(l.cloth,.82);m.face([P(-.21,-.12,1.34),P(.21,-.12,1.34),P(.27,-.23-Math.abs(step)*.4,.53),P(-.27,-.23-Math.abs(step)*.4,.53)],c);if(l.robe)seg([0,0,.62],[0,0,.91],.235,.17,l.cloth,8,.76);}
 if(l.apron)bx(0,.13,.68,.29,.035,.49,leather);
 bx(0,0,.84,.39,.25,.083,dark);bx(0,.14,.85,.095,.04,.06,gold);
 seg([0,0,1.34],[0,0,1.45],.082,.077,l.skin);
 seg([0,0,1.44],[0,0,1.75],.116,.108,l.skin,8,.89);ball(0,.102,1.59,.033,l.skin,.75);
 seg([0,-.012,1.68],[0,-.016,1.79],.122,.087,l.hair,8,.9);
 if(l.beard)seg([0,.055,1.43],[0,.085,1.57],.073,.098,l.hair,6,.65);
 if(l.braid)seg([.07,-.11,1.69],[.12,-.155,1.20],.047,.026,l.hair,5);
 if(l.helmet||l.hood){seg([0,-.025,1.61],[0,-.018,1.83],.142,.07,l.helmet?steel:shade(l.cloth,.82),8,.90);if(l.helmet)bx(0,.13,1.68,.065,.05,.14,shade(steel,.8));}
 if(l.crown){seg([0,0,1.745],[0,0,1.81],.127,.131,gold,8,.9);for(let i=0;i<6;i++){const t=i*Math.PI/3;seg([Math.cos(t)*.108,Math.sin(t)*.108,1.79],[Math.cos(t)*.108,Math.sin(t)*.108,1.88],.027,.004,gold,4);}}
 for(const side of [-1,1]){const swing=-step*side;const raise=work&&side===1?(.5+.5*Math.sin(phase))*0.55:0;const shoulder=[side*.24,0,1.30],elbow=[side*.29,swing*.65,1.07+raise*.35],hand=[side*.30,swing+.035,.86+raise];
 ball(...shoulder,.115,l.armor?steel:l.cloth,.8);seg(shoulder,elbow,.078,.059,l.cloth);seg(elbow,hand,.065,.045,l.armor?steel:l.skin);ball(...hand,.059,l.skin);
 const [x,y,z]=hand;
 if(side===-1&&l.shield){m.prism(P(x,y+.07,z+.12),P(x,y+.15,z+.12),.235*w,.235*w,gold,10);m.prism(P(x,y+.151,z+.12),P(x,y+.175,z+.12),.198*w,.198*w,l.cloth,10);ball(x,y+.195,z+.12,.067,steel,.65);}
 if(side!==1)continue;
 if(['sword','dagger','spear','staff','hammer','axe','pick','hoe'].includes(l.gear)){
 const long=['spear','staff','hoe'].includes(l.gear),top=z+(long?.83:l.gear==='dagger'?.23:.48),bottom=z-(long?.62:.11);
 seg([x,y,bottom],[x,y,top],long?.026:.022,long?.022:.018,leather,5);
 if(l.gear==='sword'||l.gear==='dagger'){bx(x,y,z+.085,.20,.052,.05,gold);seg([x,y,z+.10],[x,y,top+.23],.051,.004,steel,4,.35);}
 if(l.gear==='spear')seg([x,y,top-.04],[x,y,top+.19],.059,.003,steel,4,.55);
 if(l.gear==='staff')ball(x,y,top,.075,'#7cb4a5');
 if(['hammer','axe','pick','hoe'].includes(l.gear)){bx(x,y,top-.07,l.gear==='hammer'?.19:.26,.10,.125,steel);if(l.gear==='axe')seg([x+.10,y,top-.12],[x+.10,y,top+.06],.065,.04,steel,4,.45);}
 }else if(l.gear==='bow'){const arc=Array.from({length:7},(_,i)=>[x,y+.18*Math.sin(i*Math.PI/6),z-.40+i*.8/6]);for(let i=0;i<6;i++)seg(arc[i],arc[i+1],.024,.024,gold,5);seg(arc[0],arc[6],.008,.008,'#ddd0af',4);bx(-.16,-.20,.86,.13,.12,.55,leather);}
 else if(l.gear==='crossbow'){bx(x,y+.15,z,.12,.39,.09,leather);bx(x,y+.27,z+.04,.50,.065,.06,steel);}
 else if(l.gear==='book'||l.gear==='scroll'){bx(x-.09,y+.11,z,.28,.23,.08,l.gear==='book'?'#d4c5a0':'#e4d4aa');if(l.gear==='book')bx(x-.09,y+.11,z-.035,.30,.25,.035,'#654b37');}
 else if(l.gear==='crate')bx(x-.09,y+.13,z-.09,.28,.25,.22,'#b58b57');
 }
 if(l.robe||l.apron)bx(-.20,0,.77,.12,.17,.18,leather);
 // eyes on forward face; no screen-space facial symbols
 for(const x of [-.043,.043])bx(x,.099,1.595,.024,.015,.023,'#392e29');
}
function horse(m,l,t,moving,run){const c=l.coat,step=moving?Math.sin(t*2*Math.PI)*.25:0;
 m.prism([0,-.48,.83],[0,.43,.83],.25,.26,c,8,.85);m.prism([0,.35,.86],[0,.63,1.27],.20,.115,c,7);m.prism([0,.62,1.25],[0,.87,1.13],.13,.085,c,6);for(const x of [-.16,.16])for(const y of [-.36,.36]){const s=step*Math.sign(x*y);m.prism([x,y,.72],[x,y+s*.5,.38],.075,.048,c,6);m.prism([x,y+s*.5,.38],[x,y+s,.09],.048,.035,c,6);m.box(x,y+s,.02,.11,.17,.1,dark);}m.prism([0,-.49,.91],[0,-.80,.56+step*.3],.07,.025,dark,6);m.box(0,0,.98,.47,.48,.11,'#84503d');humanoid(m,l.rider,t,false,run,false,[0,-.025,.68],true);}
function machine(m,l,t,moving){const wood='#a17a4d';m.box(0,0,.19,.85,1.05,.16,wood);for(const x of [-.49,.49])for(const y of [-.36,.36]){m.prism([x-.07,y,.23],[x+.07,y,.23],.23,.23,dark,12);m.prism([x-.08,y,.23],[x+.08,y,.23],.18,.18,wood,8);for(let i=0;i<4;i++){const a=i*Math.PI/2+(moving?t*4:0);m.prism([x,y,.23],[x,y+Math.cos(a)*.18,.23+Math.sin(a)*.18],.02,.02,dark,4);}}
 if(l.type==='cart'){m.box(0,0,.35,.71,.82,.48,'#b99b66');m.box(0,0,.83,.75,.85,.065,'#c5aa77');}
 else if(l.type==='ram'){for(const x of [-.33,.33])for(const y of [-.4,.4])m.box(x,y,.35,.08,.08,.8,wood);m.box(0,0,1.12,1.04,1.24,.14,'#685844');m.prism([0,-.55,.60],[0,.72,.60],.13,.13,wood,8);m.prism([0,.65,.60],[0,.80,.60],.14,.12,steel,8);}
 else {const tall=l.type==='trebuchet'?1.25:.83;for(const x of [-.31,.31]){m.prism([x,-.43,.35],[x,0,tall],.06,.06,wood,4);m.prism([x,.43,.35],[x,0,tall],.06,.06,wood,4);}m.prism([-.37,0,tall],[.37,0,tall],.07,.07,dark,6);m.prism([0,-.48,.49],[0,.35,tall+.38],.065,.045,wood,6);m.ball([0,.35,tall+.38],.13,steel);}
}
function ship(m,l,t,moving){const k=l.size;const p=[[-.42,-.56,.16],[.42,-.56,.16],[.5,.26,.16],[0,.92,.16],[-.5,.26,.16]].map(a=>mul(a,k));const q=p.map(a=>sum(mul(a,.75),[0,0,-.13]));for(let i=0;i<p.length;i++)m.face([q[i],q[(i+1)%p.length],p[(i+1)%p.length],p[i]],'#9a7249');m.face(p,'#c0a074');m.prism([0,0,.12],[0,0,1.65*k],.045,.028,leather,6);m.prism([-.43*k,0,1.48*k],[.43*k,0,1.48*k],.032,.032,leather,5);m.face([[-.42*k,0,1.45*k],[.42*k,0,1.45*k],[.36*k,-.12*k,.62*k],[-.36*k,-.12*k,.62*k]],l.sail);if(l.armed)m.box(0,.36,.2,.45,.34,.36,'#516b84');}
export function drawFigure(ctx,x,y,scale,look,opts={}){
 if(!look||!Number.isFinite(scale)||scale<=0)return;
 const {facing=Math.PI/2,moving=false,phase=0,run=false,work=false,selected=false,hp=1,enemy=false}=opts;
 const m=mesh();if(look.kind==='human')humanoid(m,look,phase,moving,run,work);else if(look.kind==='horse')horse(m,look,phase,moving,run);else if(look.kind==='ship')ship(m,look,phase,moving);else machine(m,look,phase,moving);
 const fx=Math.cos(facing),fy=Math.sin(facing),fall=hp<=0?.88:0;
 const world=p=>{const py=p[1]+p[2]*fall,pz=p[2]*(1-fall);return [p[0]*fy+py*fx,-p[0]*fx+py*fy,pz]};
 const screen=p=>[x+(p[0]-p[1])*scale*.72,y+(p[0]+p[1])*scale*.36-p[2]*scale*.88];
 ctx.save();ctx.fillStyle='#14231e70';ctx.beginPath();ctx.ellipse(x,y,scale*(look.kind==='human'?.30:.57),scale*.135,0,0,Math.PI*2);ctx.fill();
 if(selected||enemy){ctx.strokeStyle=enemy?'#e68568':'#f2d082';ctx.lineWidth=Math.max(1.5,scale*.045);ctx.beginPath();ctx.ellipse(x,y,scale*(look.kind==='human'?.36:.65),scale*.18,0,0,Math.PI*2);ctx.stroke();}
 const faces=m.faces.map(f=>{const p=f.p.map(world),d=p.reduce((n,v)=>n+v[0]+v[1]+v[2]*.80,0)/p.length;const n=norm(cross(sub(p[1],p[0]),sub(p[2],p[0])));return {p,d,c:shade(f.c,.66+.34*Math.abs(dot(n,norm([-.5,-.3,1]))))}}).sort((a,b)=>a.d-b.d);
 for(const f of faces){ctx.beginPath();for(let i=0;i<f.p.length;i++){const [a,b]=screen(f.p[i]);if(i)ctx.lineTo(a,b);else ctx.moveTo(a,b);}ctx.closePath();ctx.fillStyle=f.c;ctx.fill();}
 if(selected||hp<.999){const height=look.kind==='horse'?2.6:look.kind==='human'?1.95:1.8,bar=scale*.8;ctx.fillStyle='#17221f';ctx.fillRect(x-bar/2,y-height*scale*.88-8,bar,4);ctx.fillStyle=enemy?'#da735a':'#9ccc73';ctx.fillRect(x-bar/2,y-height*scale*.88-8,bar*Math.min(1,Math.max(0,hp)),4);}
 ctx.restore();
}
