import * as T from 'three';
import {material,mesh,ell,box,bake} from './valley-realism.js';
import {silhouette,curveDetail,taperedLock} from './valley-character-model.js';
import {sideKey,rigClips} from './valley-rig-spec.js';
import {poseFor} from './valley-world-life.js';
// Original compact 3D cartoon proportions. No licensed character assets.
function joint(parent,name,x,y,z){const b=new T.Bone();b.name=name;b.position.set(x,y,z);parent.add(b);return b}
const toon=(c,r=.82)=>material(c,{roughness:r});
function rounded(parent,mat,x,y,z,w,h,d){return ell(parent,mat,x,y,z,w,h,d)}
function headGeometry(form){
 const g=new T.SphereGeometry(1,40,28),a=g.attributes.position;
 for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i),lower=Math.exp(-(((y+.32)/.48)**2)),cheek=.035*lower*(form==='round'?1.25:1);a.setXYZ(i,x*(.225+cheek)*(form==='angular'?.96:1),y*.236,z*(.171+lower*.009)+.019*lower)}
 g.computeVertexNormals();return g;
}
function hairStyle(head,p,mat){
 if(p.hairStyle==='bald')return;
 const glint=toon(new T.Color(p.hair).lerp(new T.Color(0xb99a73),.13));
 const cap=new T.SphereGeometry(1,32,18,0,Math.PI*2,0,Math.PI*.42);cap.scale(.229,.242,.177);cap.translate(0,.014,-.01);mesh(head,cap,mat);
 const back=rounded(head,mat,0,.019,-.089,.226,.210,.108);
 const long=['long','wavy','braid','ponytail','bob'].includes(p.hairStyle);
 if(long)for(const s of [-1,1]){const len=p.hairStyle==='bob'?.22:p.hairStyle==='ponytail'?.30:.40;for(let i=0;i<4;i++)mesh(head,taperedLock([[s*(.155+i*.015),.14,-.035],[s*.223,.055,-.05],[s*(.185+i*.012),-.10,-.10],[s*(.12+i*.018),-len,-.065]],.052,12,8),i===1?glint:mat)}
 if(p.hairStyle==='ponytail'||p.hairStyle==='bun'){rounded(head,mat,0,.13,-.18,.102,.088,.10);if(p.hairStyle==='ponytail')mesh(head,taperedLock([[0,.16,-.19],[0,.08,-.27],[.045,-.10,-.28],[.06,-.27,-.21]],.083,16,10),mat)}
 if(p.hairStyle==='braid')for(let i=0;i<9;i++){const o=rounded(head,i%3?mat:glint,(i%2?1:-1)*.022,-.03-i*.035,-.19,.055,.039,.044);o.rotation.z=(i%2?1:-1)*.5}
 const fringe=['fringe','bob','sidepart','wavy','long','braid'].includes(p.hairStyle);
 for(let i=0;i<7;i++){const x=(i-3)*.048;const sweep=p.hairStyle==='sidepart'?.055:0;const tip=fringe?.045+.021*Math.cos(i):.115+.012*Math.cos(i);mesh(head,taperedLock([[x*.72,.209,.05],[x,.175,.113],[x+sweep,.125,.155],[x+sweep,tip,.166]],.040,10,8),i===2?glint:mat)}
 if(p.hairStyle==='spiky')for(let i=0;i<7;i++){const a=i*Math.PI*2/7;mesh(head,taperedLock([[Math.cos(a)*.09,.18,Math.sin(a)*.07],[Math.cos(a)*.13,.24,Math.sin(a)*.10],[Math.cos(a)*.19,.27+.025*Math.sin(i),Math.sin(a)*.14]],.044,10,7),mat)}
 bake(head);
}
function expression(head,p,skin,hair){
 const face=mesh(head,headGeometry(p.face),skin),dark=toon(0x252326),white=toon(0xfffbf0,.4),pupil=toon({brown:0x392d29,blue:0x405c75,green:0x456652,grey:0x52575d}[p.eyes],.48),pink=toon(new T.Color(p.skin).lerp(new T.Color(0xd77c73),.35)),lip=toon(0x88494b),iris=[],brows=[];
 for(const s of [-1,1]){
 rounded(head,skin,s*.232,-.022,-.008,.045,.065,.038);rounded(head,pink,s*.249,-.027,.020,.018,.035,.011);
 rounded(head,pink,s*.151,-.090,.129,.035,.014,.009);
 const eye=new T.Group();eye.position.set(s*.076,.013,.158);eye.rotation.y=s*.13;head.add(eye);
 rounded(eye,white,0,0,0,.047,.061,.021);rounded(eye,pupil,s*.004,-.006,.018,.025,.037,.008);rounded(eye,white,-.008,.010,.025,.007,.009,.0025);bake(eye);iris.push(eye);
 const brow=new T.Group();brow.position.set(s*.079,.091,.158);head.add(brow);curveDetail(brow,dark,[[-.050,-.002,0],[-.024,.010,.012],[.009,.013,.015],[.050,.002,0]],.013,12);bake(brow);brows.push(brow);
 }
 rounded(head,skin,0,-.046,.178,.030,.027,.022);
 const mouth=new T.Group();mouth.position.set(0,-.111,.156);head.add(mouth);curveDetail(mouth,lip,[[-.039,.005,0],[-.022,-.006,.012],[0,-.009,.019],[.022,-.006,.012],[.039,.005,0]],.005,14);bake(mouth);
 if(p.accessory==='glasses'){for(const s of [-1,1]){const r=mesh(head,new T.TorusGeometry(.061,.005,8,28),dark,s*.076,.014,.185);r.scale.x=.79}box(head,dark,0,.021,.188,.036,.007,.008)}
 bake(head);
 return {update(t,pose,jump){const blink=t%4.7,open=blink>4.50?Math.max(.08,Math.abs(blink-4.60)/.10):1;for(const eye of iris)eye.scale.y=open;for(const [i,b] of brows.entries()){b.position.y=.091+(jump?.012:pose==='use'?.006:Math.sin(t*.8+i)*.003);b.rotation.z=(i?1:-1)*.06*Math.sin(t*1.1)}mouth.scale.set(1,pose==='use'?1.6+.5*Math.sin(t*7):1,1)}};
}
export function toonAvatar(p,{detail=true}={}){
 const root=new T.Group(),body=joint(root,'ValleyBody',0,0,0),skin=toon(p.skin,.69),top=toon(p.shirt),bottom=toon(p.pants),hair=toon(p.hair,.67),seam=toon(new T.Color(p.shirt).multiplyScalar(.72)),shoe=toon({dark:0x33343a,white:0xece7df,brown:0x805940}[p.shoes]),sole=toon(0x565358),trim=toon(new T.Color(p.shirt).lerp(new T.Color(0xe4dfcd),.5));
 const width={slim:.88,regular:1,athletic:1.08,stocky:1.16}[p.build];body.scale.x=width;
 const head=joint(body,'ValleyHead',0,1.20,0);const face=expression(head,p,skin,hair);hairStyle(head,p,hair);
 rounded(body,skin,0,.984,0,.062,.068,.061);
 // Body and clothing maintain independent silhouettes per profile.
 mesh(body,silhouette([[.51,.096,.079],[.58,.137,.092],[.71,.158,.098],[.84,.161,.092],[.94,.122,.079],[.982,.066,.058]],24),top);
 rounded(body,bottom,0,.51,0,.135,.095,.085);
 const long=['jacket','cardigan','hoodie','coat','blouse','pajamas'].includes(p.outfit);
 if(long){curveDetail(body,seam,[[0,.56,.082],[0,.75,.100],[0,.94,.079]],.007);for(const s of [-1,1]){box(body,seam,s*.081,.65,.086,.073,.045,.014);curveDetail(body,trim,[[s*.06,.956,.056],[s*.04,.875,.095],[s*.08,.84,.095]],.008)}for(let i=0;i<3;i++)rounded(body,trim,.015,.66+i*.07,.103,.009,.009,.005)}
 else curveDetail(body,seam,[[-.06,.959,.050],[0,.920,.082],[.06,.959,.050]],.008);
 if(p.outfit==='hoodie'){rounded(body,top,0,.924,-.072,.111,.090,.064);box(body,seam,0,.64,.097,.16,.06,.016)}
 if(p.outfit==='coat')mesh(body,silhouette([[.43,.145,.09],[.51,.15,.097],[.58,.137,.092]],24),top);
 if(p.outfit==='sport')for(const s of [-1,1])curveDetail(body,trim,[[s*.113,.90,.06],[s*.14,.77,.06],[s*.122,.58,.06]],.009);
 const arms=[],legs=[];
 for(const s of [-1,1]){
 const k=sideKey(s),arm=joint(body,k+'UpperArm',s*.145,.87,0),fore=joint(arm,k+'Forearm',0,-.141,0),hand=joint(fore,k+'Hand',0,-.128,0);
 rounded(arm,top,0,-.057,0,.052,.098,.053);rounded(fore,long?top:skin,0,-.061,0,.037,.086,.038);
 rounded(hand,skin,0,-.025,.003,.041,.047,.026);rounded(hand,skin,-s*.035,-.014,.013,.017,.029,.019);
 for(let i=0;i<4;i++){const finger=joint(hand,k+'Digit'+i,s*(i-1.5)*.017,-.042,.006);rounded(finger,skin,0,-.018,0,.0105,.028-i%3*.003,.012);bake(finger)}
 if(p.accessory==='watch'&&s<0){const band=mesh(fore,new T.TorusGeometry(.038,.007,7,16),shoe,0,-.102,0);band.rotation.x=Math.PI/2;box(fore,trim,0,-.102,.037,.038,.027,.009)}
 const hip=joint(body,k+'Thigh',s*.075,.49,0),shin=joint(hip,k+'Shin',0,-.196,0),short=p.bottom==='shorts';rounded(hip,bottom,0,-.074,0,.061,.122,.062);rounded(shin,short?skin:bottom,0,-.083,0,.046,.12,.045);
 if(p.bottom==='joggers')rounded(shin,seam,0,-.176,0,.049,.024,.046);
 if(p.shoeStyle==='boot')rounded(shin,shoe,0,-.12,.004,.059,.086,.054);
 rounded(shin,p.shoeStyle==='sandal'?skin:shoe,0,-.214,.046,.071,.048,.108);rounded(shin,sole,0,-.244,.047,.075,.019,.111);
 if(p.shoeStyle==='sandal'){box(shin,shoe,0,-.184,.065,.106,.017,.038);box(shin,shoe,0,-.181,.015,.096,.018,.026)}
 else if(p.shoeStyle==='loafer')box(shin,trim,0,-.183,.065,.090,.015,.018);
 else for(let i=0;i<3;i++)box(shin,trim,0,-.182,.035+i*.023,.064,.005,.009);
 bake(arm);bake(fore);bake(hand);bake(hip);bake(shin);arms.push({arm,fore,hand});legs.push({hip,shin});
 }
 bake(body);root.userData.style='round-cartoon';root.userData.rig='toon-articulated';root.userData.hands=arms.map(a=>a.hand);
 let phase=0,clock=0,blend=0;
 return {root,update(state,dx,dz,moving,dt,action=null,motion={}){
 dt=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));root.position.set(state.x,state.height+.022,state.z);clock+=dt;
 if(moving&&Math.hypot(dx,dz)>.001){const goal=Math.atan2(dx,dz),d=Math.atan2(Math.sin(goal-root.rotation.y),Math.cos(goal-root.rotation.y));root.rotation.y+=d*(1-Math.exp(-dt*15));phase+=dt*(motion.run?15:10)}
 blend+=(Number(moving)-blend)*(1-Math.exp(-dt*12));const pose=poseFor(action),walk=pose==='idle'?blend:0,jump=motion.jump||0;
 body.position.y=pose==='sleep'?.24:pose==='sit'?-.19:Math.abs(Math.sin(phase))*walk*.037+Math.sin(clock*2)*.004+jump;body.rotation.x=pose==='sleep'?-Math.PI/2:motion.run&&moving?.09:0;body.rotation.z=Math.sin(phase)*walk*.047;head.rotation.z=-Math.sin(phase)*walk*.035;head.rotation.y=.05*Math.sin(clock*.6);face.update(clock,pose,jump>0);
 for(let i=0;i<2;i++){const s=i?1:-1,w=Math.sin(phase+i*Math.PI),{arm,fore,hand}=arms[i],{hip,shin}=legs[i];hip.rotation.x=pose==='sit'?-1.4:w*walk*(motion.run?.72:.51)-jump*.5;shin.rotation.x=pose==='sit'?1.4:Math.max(0,-w)*walk*.76+jump;arm.rotation.x=pose==='use'?-.8:-w*walk*.57-jump*.6;arm.rotation.z=s*(.09+walk*.035);fore.rotation.x=pose==='use'?-.95:-.13-Math.max(0,w)*walk*.28;hand.rotation.x=pose==='use'?.20:.08*Math.sin(phase+i*Math.PI)}
 }};
}
// The same named limb tracks can also be exported as portable GLB clips.
export function toonClips(){return rigClips()}
