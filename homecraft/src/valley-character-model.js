import {smoothRingSeam} from './valley-anatomy.js';
import {characterExpression} from './valley-character-motion.js';
import {sideKey} from './valley-rig-spec.js';
import {faceGeometry,irisGeometry,irisTexture} from './valley-character-assets.js';
import * as T from 'three';
import {mesh,ell,box,material,bake} from './valley-realism.js';
// Shaped closed cross-sections in metres; normals and UVs for mobile PBR.
export function silhouette(rings,segments=24){
 // Interpolate section contours without changing the rig's dimensions.
 const source=rings;const refined=[];const mix=(a,b,t)=>a+(b-a)*t;
 for(let i=0;i<source.length-1;i++){const a=source[i],b=source[i+1],p=source[Math.max(0,i-1)],q=source[Math.min(source.length-1,i+2)],steps=segments>=24?4:2;
 for(let k=0;k<steps;k++){const t=k/steps,u=t*t*(3-2*t),row=[mix(a[0],b[0],t)];for(let j=1;j<=3;j++){const av=a[j]??0,bv=b[j]??0,pv=p[j]??0,qv=q[j]??0;const v=mix(av,bv,u)+(t*(1-t)**2)*(bv-pv)*.5-(t*t*(1-t))*(qv-av)*.5;row.push(j<3?Math.max(.0005,Math.min(Math.max(av,bv)*1.05,v)):v)}refined.push(row)}}
 refined.push(source.at(-1));rings=refined;
 const pos=[],uv=[],idx=[];
 for(let i=0;i<rings.length;i++){const [y,w,d,front=0]=rings[i];for(let j=0;j<=segments;j++){const a=j/segments*Math.PI*2;pos.push(Math.sin(a)*w,y,Math.cos(a)*d+front);uv.push(j/segments,i/(rings.length-1))}}
 for(let i=0;i<rings.length-1;i++)for(let j=0;j<segments;j++){const a=i*(segments+1)+j,b=a+segments+1;idx.push(a,a+1,b,b,a+1,b+1)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return smoothRingSeam(g,rings.length,segments);
}
export function taperedLock(points,radius,segments=12,sides=6){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),pos=[],uv=[],idx=[];
 const frames=curve.computeFrenetFrames(segments,false);
 for(let i=0;i<=segments;i++){const t=i/segments,p=curve.getPointAt(t),r=radius*Math.max(.045,Math.pow(1-t,.65))*(.8+.2*Math.sin(t*Math.PI));for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2;const q=p.clone().addScaledVector(frames.normals[i],Math.cos(a)*r).addScaledVector(frames.binormals[i],Math.sin(a)*r*.64);pos.push(q.x,q.y,q.z);uv.push(j/sides,t)}}
 for(let i=0;i<segments;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;idx.push(a,a+1,b,b,a+1,b+1)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return smoothRingSeam(g,segments+1,sides);
}
export function curveDetail(parent,mat,points,r=.003,steps=12){return mesh(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),steps,r,5,false),mat)}
function bone(parent,x,y,z){const b=new T.Bone();b.position.set(x,y,z);parent.add(b);return b}
export function makeHand(parent,skin,side,detail=true){
 const hand=bone(parent,0,-.205,0),nail=material(new T.Color(skin.color).lerp(new T.Color(0xffe0ca),.26),{roughness:.38});hand.userData.hand=true;hand.name=sideKey(side)+'Hand';
 const crease=material(new T.Color(skin.color).multiplyScalar(.87));
 mesh(hand,silhouette([[-.046,.027,.013,.002],[-.034,.035,.018,0],[-.012,.035,.021,0],[.012,.026,.019,0],[.027,.020,.018,0]],detail?24:16),skin);
 ell(hand,skin,-side*.022,-.009,.011,.018,.031,.013);
 if(detail){curveDetail(hand,crease,[[-side*.020,.008,-.018],[0,-.008,-.021],[side*.022,-.023,-.015]],.0011);curveDetail(hand,crease,[[side*.018,.002,-.018],[side*.004,-.016,-.023],[-side*.012,-.030,-.017]],.001)}
 const digits=[];for(let i=0;i<5;i++){const thumb=i===4,l=[.057,.065,.060,.047,.045][i],x=thumb?-side*.031:side*(i-1.5)*.016,z=thumb?.009:.001;
 const finger=bone(hand,x,thumb?-.006:-.035,z);finger.userData.digit=i;finger.name=sideKey(side)+'Digit'+i;finger.rotation.z=thumb?-side*.64:side*(i-1.5)*.055;
 const r=thumb?.0095:.008;const l1=l*(thumb?.52:.43),l2=l*(thumb?.24:.32),l3=l-l1-l2;
 function part(parent,len,rad,last=false){mesh(parent,silhouette([[-len-.002,last?.001:rad*.70,last?.001:rad*.71],[-len*.76,rad*.84,rad*.80],[-len*.18,rad,rad*.93],[.003,rad*.74,rad*.73]],detail?14:8),skin)}
 part(finger,l1,r);const middle=bone(finger,0,-l1,0);part(middle,l2,r*.88);const tip=bone(middle,0,-l2,0);middle.name=finger.name+'Mid';tip.name=finger.name+'Tip';part(tip,l3,r*.76,true);
 if(detail){ell(tip,nail,0,-l3*.43,r*.67,r*.56,l3*.36,.0014);ell(finger,skin,0,-l1*.93,0,r*.84,.005,r*.88);curveDetail(middle,crease,[[-r*.55,-l2*.65,-r*.69],[0,-l2*.69,-r*.81],[r*.55,-l2*.65,-r*.69]],.0006,5)}
 bake(finger);bake(middle);bake(tip);digits.push({finger,middle,tip,thumb});
 }
 if(!detail){nail.dispose();crease.dispose()}bake(hand);
 return {hand,digits,update(grip,phase){hand.rotation.x=-.06+grip*.15;for(const {finger,middle,tip,thumb} of digits){finger.rotation.x=grip*(thumb?.32:.72)+.025*Math.sin(phase);middle.rotation.x=grip*(thumb?.25:.90);tip.rotation.x=grip*(thumb?.18:.52)}}};
}
export function makeFace(head,p,skin,hair,detail=true){
 const faceMat=skin.clone();faceMat.vertexColors=true;faceMat.roughness=.60;faceMat.userData.valleyFace=true;mesh(head,faceGeometry(p.face,detail),faceMat);
 const dark=material(0x30272a,{roughness:.72}),white=material(0xfff6ed,{roughness:.42}),iris=material({brown:0x72513e,blue:0x547da3,green:0x54826c,grey:0x777f89}[p.eyes],{roughness:.3}),pupil=material(0x1b2028,{roughness:.3}),catchlight=material(0xfff9ed,{emissive:0xffffff,emissiveIntensity:.35}),lip=material(new T.Color(p.skin).lerp(new T.Color(0xb45f60),.40),{roughness:.58}),earMat=material(new T.Color(p.skin).multiplyScalar(.83));
 const eyes=[];const irisMat=iris.clone();irisMat.color.set(0xffffff);irisMat.map=irisTexture(iris.color);iris.dispose();const gaze=[];for(const side of [-1,1]){const x=side*.045;ell(head,skin,side*.109,-.014,-.002,.019,.038,.019);ell(head,earMat,side*.119,-.012,.006,.006,.023,.010);if(detail){curveDetail(head,skin,[[side*.119,.011,.009],[side*.124,.001,.012],[side*.122,-.016,.014],[side*.114,-.030,.010]],.003,10);ell(head,skin,side*.113,-.016,.014,.004,.008,.004)}
 const eye=new T.Group();eye.position.set(x,.018,.084);eye.rotation.y=side*.14;head.add(eye);ell(eye,white,0,0,0,.030,.017,.014);const look=new T.Group();eye.add(look);const ring=mesh(look,irisGeometry(.013,detail),irisMat,0,0,.0144);ring.scale.y=1.05;ell(look,pupil,0,0,.0155,.0058,.0088,.0022);ell(look,catchlight,-.004,.006,.018,.003,.003,.0015);ell(look,catchlight,.004,-.005,.018,.0015,.0015,.001);bake(look);gaze.push(look);curveDetail(eye,dark,[[-.03,-.001,0],[-.018,.012,.010],[0,.017,.012],[.018,.012,.010],[.03,-.001,0]],.0025);curveDetail(eye,earMat,[[-.028,-.002,0],[0,-.015,.010],[.028,-.002,0]],.0018);if(detail)for(let i=0;i<4;i++){const x=side*(.012+i*.0045),y=.015-i*.0025;curveDetail(eye,dark,[[x,y,.010],[x+side*.003,y+.006,.008],[x+side*.005,y+.009,.006]],.0011,5)}bake(eye);eyes.push(eye);
 curveDetail(head,hair,[[x-.028,.050,.079],[x-.009,.058,.090],[x+.013,.055,.093],[x+.028,.047,.079]],.0031);if(detail)for(let j=0;j<10;j++){const u=j/9,xx=x-.025+u*.05,yy=.050+Math.sin(u*Math.PI)*.008,zz=.080+Math.sin(u*Math.PI)*.012;curveDetail(head,hair,[[xx,yy-.002,zz],[xx+.002,yy+.002,zz+.001],[xx+.005,yy+.004,zz]],.0008,4)}
 }
 for(const s of [-1,1]){ell(head,skin,s*.012,-.044,.118,.008,.007,.007);ell(head,earMat,s*.010,-.050,.119,.0035,.0021,.0017)}
 const mouth=new T.Group();head.add(mouth);curveDetail(mouth,lip,[[-.025,-.077,.083],[-.011,-.074,.094],[0,-.078,.100],[.011,-.074,.094],[.025,-.077,.083]],.0028);ell(mouth,lip,0,-.082,.097,.017,.0035,.004);if(detail){const lower=material(new T.Color(p.skin).lerp(new T.Color(0xba7770),.32),{roughness:.49});curveDetail(mouth,lower,[[-.020,-.080,.086],[-.010,-.085,.095],[0,-.086,.101],[.010,-.085,.095],[.020,-.080,.086]],.002,12)}bake(mouth);
 curveDetail(head,earMat,[[-.020,-.082,.085],[0,-.084,.100],[.020,-.082,.085]],.0018);
 if(p.accessory==='glasses'){const frame=material(0x3a3130,{metalness:.35});for(const s of [-1,1]){const ring=mesh(head,new T.TorusGeometry(.033,.0028,6,24),frame,s*.045,.018,.107);ring.scale.y=.66;box(head,frame,s*.096,.020,.054,.006,.006,.10)}box(head,frame,0,.023,.112,.027,.006,.006)}
 bake(head);return {eyes,update(t,context={}){const e=characterExpression(t,context);for(const eye of eyes)eye.scale.y=Math.max(.07,1-e.blink);for(const look of gaze){look.position.x=e.gazeX;look.position.y=e.gazeY}mouth.scale.y=1+e.jaw*2;mouth.scale.x=1+e.smile*.14}};
}
export function makeHair(head,p,hair,detail=true){
 if(p.hairStyle==='bald')return {update(){}};
 const hairRoot=new T.Group();head.add(hairRoot);const highlight=material(new T.Color(p.hair).lerp(new T.Color(0xcba47f),.13),{roughness:.57});hair.roughness=.59;
 // Scalp cap is confined to the top/back, leaving the face clear.
 const cap=new T.SphereGeometry(1,detail?28:18,12,0,Math.PI*2,0,Math.PI*.39);cap.scale(.114,.133,.112);cap.translate(0,.027,-.018);mesh(hairRoot,cap,hair);const back=new T.SphereGeometry(1,detail?24:16,10,0,Math.PI,Math.PI*.23,Math.PI*.47);back.scale(.112,.135,.108);back.rotateY(Math.PI);back.translate(0,.025,-.021);mesh(hairRoot,back,hair);
 const count=detail?40:14;
 for(let i=0;i<count;i++){const a=(i/(count-1)-.5)*Math.PI*1.62,s=Math.sin(a),c=Math.cos(a),sweep=p.hairStyle==='wavy'?.035:.017;
 const fringe=p.hairStyle==='bob'||p.hairStyle==='fringe',spiky=p.hairStyle==='spiky',sidepart=p.hairStyle==='sidepart',shift=sidepart?.025:0;const points=[[s*.045+shift,.146+(spiky?.012*Math.cos(i*2):0),-.028],[s*.104+shift,.112+(spiky?.025*Math.sin(i):0),c*.067-.012],[s*.111+sweep,.060,c*.077-.025],[s*.100+sweep,(fringe?.029:p.hairStyle==='short'?.057:.043)+(spiky?.034*Math.sin(i*1.7):0),c*.082-.026]];
 mesh(hairRoot,taperedLock(points,detail?.020:.027,detail?16:8,8),i%5===0?highlight:hair);
 }
 // Fine tapered ribbon-like locks, layered over the main hair silhouette.
 if(detail)for(let i=0;i<30;i++){const a=(i/29-.5)*Math.PI*1.75,s=Math.sin(a),c=Math.cos(a),shift=p.hairStyle==='sidepart'?.023:0;
 const wave=p.hairStyle==='wavy'?.018:0;
 mesh(hairRoot,taperedLock([[s*.054+shift,.149,-.029],[s*.103+shift,.124,c*.073-.014],[s*.119+shift+wave,.081,c*.083-.025],[s*.108+shift+wave,.047,c*.089-.026]],.0045,14,5),i%6===0?highlight:hair)}
 if(p.hairStyle==='fringe'||p.hairStyle==='sidepart'){for(let i=0;i<7;i++){const x=(i-3)*.022,dx=p.hairStyle==='sidepart'?.038:.005;mesh(hairRoot,taperedLock([[x*.5,.139,.045],[x,.111,.086],[x+dx,.081,.106],[x+dx,.062+(i%3)*.008,.101]],.017,detail?16:8,6),i%4===0?highlight:hair)}}
 const tails=[];if(['long','wavy','bob'].includes(p.hairStyle)){
 for(const side of [-1,1]){const tail=bone(hairRoot,side*.085,.02,-.055);const count=detail?12:5;for(let i=0;i<count;i++){const dx=(i-(count-1)/2)*.014,len=p.hairStyle==='bob'?.13:p.hairStyle==='ponytail'?.27:p.hairStyle==='braid'?.34:.33+(i%3)*.035;mesh(tail,taperedLock([[dx,0,0],[dx+side*.027,-.085,-.035],[dx-side*.012,-len*.63,-.055],[dx+side*.019,-len,-.025]],.026,12,6),i%4===0?highlight:hair)}bake(tail);tails.push(tail)}
 }
 if(p.hairStyle==='spiky'){for(let i=0;i<6;i++){const a=i*1.047;mesh(hairRoot,taperedLock([[Math.cos(a)*.045,.131,Math.sin(a)*.04],[Math.cos(a)*.072,.166,Math.sin(a)*.071],[Math.cos(a)*.103,.186,Math.sin(a)*.09]],.023,10,6),hair)}}
 if(p.hairStyle==='ponytail'){
 const tail=bone(hairRoot,0,.070,-.112),count=detail?17:7;
 for(let i=0;i<count;i++){const a=i/count*Math.PI*2,x=Math.cos(a)*.025,z=Math.sin(a)*.021;mesh(tail,taperedLock([[x,0,z],[x*1.4,-.065,-.055+z],[x*1.2,-.17,-.09+z],[x*.5,-.29,-.061+z],[0,-.34,-.025]],.018,detail?20:10,6),i%5===0?highlight:hair)}
 const tie=material(0x433b38);const band=mesh(tail,new T.TorusGeometry(.029,.004,6,18),tie,0,-.014,-.013);band.rotation.x=Math.PI/2;bake(tail);tails.push(tail);
 }
 if(p.hairStyle==='braid'){const tail=bone(hairRoot,0,.025,-.112);for(let i=0;i<(detail?16:10);i++){const y=-i*.022;const l=ell(tail,i%3?hair:highlight,(i%2?1:-1)*.015,y,-.012,.028,.022,.024);l.rotation.z=(i%2?1:-1)*.40}ell(tail,highlight,0,-.34,-.011,.024,.012,.025);bake(tail);tails.push(tail)}
 if(p.hairStyle==='bun'){ell(hairRoot,hair,0,.078,-.13,.064,.056,.061);for(let i=0;i<5;i++)curveDetail(hairRoot,highlight,[[-.053,.08+i*.005,-.13],[0,.11+i*.004,-.184],[.053,.08+i*.005,-.13]],.004)}
 bake(hairRoot);return {update(clock,walk){for(const [i,t] of tails.entries()){t.rotation.x=Math.sin(clock*5+i)*walk*.09;t.rotation.z=Math.sin(clock*4+i)*(.035+walk*.045)}}};
}
export function garment(parent,shirt,seam,p,detail){
 const lining=material(new T.Color(p.shirt).lerp(new T.Color(0xe6ded0),.55),{roughness:.94}),button=material(0x827465,{roughness:.55});shirt.roughness=.94;
 const waist=p.build==='athletic'?.148:p.build==='slim'?.146:p.build==='stocky'?.162:.155;mesh(parent,silhouette([[.832,.151,.103],[.87,.165,.112],[.95,waist,.111],[1.07,.168,.117],[1.18,.198,.117],[1.255,.208,.101],[1.30,.161,.087],[1.344,.080,.066]],detail?32:20),shirt);
 const jacket=['jacket','cardigan','hoodie','coat','blouse'].includes(p.outfit);
 if(jacket){mesh(parent,silhouette([[.84,.107,.103],[.95,.103,.118],[1.14,.111,.121],[1.27,.085,.092],[1.32,.065,.07]],20),lining);for(const side of [-1,1]){curveDetail(parent,seam,[[side*.11,1.30,.065],[side*.065,1.17,.121],[side*.09,1.04,.119],[side*.087,.86,.108]],.009);box(parent,seam,side*.12,.96,.103,.082,.067,.012);curveDetail(parent,lining,[[side*.08,.995,.116],[side*.158,.995,.099]],.003);for(let i=0;i<4;i++)ell(parent,button,side*.075,.91+i*.09,.121,.006,.006,.003)}}else{curveDetail(parent,seam,[[-.08,1.33,.065],[0,1.294,.089],[.08,1.33,.065]],.007);if(p.outfit==='sport')for(const s of [-1,1])curveDetail(parent,lining,[[s*.165,1.23,.064],[s*.15,1.1,.095],[s*.13,.87,.09]],.012)}
 if(p.outfit==='hoodie'){ell(parent,shirt,0,1.27,-.094,.116,.113,.066);for(const s of [-1,1])curveDetail(parent,lining,[[s*.050,1.31,.073],[s*.044,1.19,.120],[s*.038,1.13,.122]],.004);box(parent,seam,0,.94,.113,.18,.075,.016)}
 if(p.outfit==='blouse'){for(const s of [-1,1]){const collar=box(parent,lining,s*.048,1.294,.084,.072,.060,.012);collar.rotation.z=s*.48}}
 if(p.outfit==='coat'){mesh(parent,silhouette([[.758,.177,.116],[.80,.180,.119],[.88,.166,.110]],24),shirt);for(const s of [-1,1])box(parent,seam,s*.115,.854,.098,.070,.035,.015)}
 if(p.outfit==='pajamas'){for(let i=0;i<4;i++)ell(parent,seam,0,.93+i*.085,.122,.006,.006,.003)}
 for(const side of [-1,1])for(let i=0;i<(detail?4:2);i++){const y=.89+i*.045;curveDetail(parent,seam,[[side*.135,y,.074],[side*.106,y+.013,.105],[side*.075,y+.020,.111]],.0023)}
 if(detail){
 // Folded hems and visible stitch lines, with subtle contrast.
 const thread=material(new T.Color(p.shirt).lerp(new T.Color(0xd8c7ae),.20),{roughness:.91});
 for(const s of [-1,1]){
 curveDetail(parent,thread,[[s*.12,.868,.080],[s*.09,.864,.105],[s*.035,.862,.112]],.0016,10);
 if(jacket){for(let j=0;j<7;j++){const y=.94+j*.037;curveDetail(parent,thread,[[s*.094,y,.122],[s*.094,y+.012,.122]],.0011,3)}}
 if(p.outfit==='jacket'||p.outfit==='cardigan'||p.outfit==='blouse'||p.outfit==='coat'){curveDetail(parent,thread,[[s*.175,1.245,.058],[s*.145,1.284,.073],[s*.103,1.302,.075]],.002,12)}
 }
 if(['jacket','coat','cardigan','blouse'].includes(p.outfit)){
 for(const side of [-1,1]){curveDetail(parent,seam,[[side*.063,1.324,.083],[side*.139,1.263,.092],[side*.075,1.205,.123],[side*.038,1.285,.102]],.008,16);}
 }
 if(p.outfit==='sport'){const zip=material(0xb9b8b3,{metalness:.55,roughness:.42});curveDetail(parent,zip,[[0,1.30,.086],[0,1.255,.105],[0,1.21,.116]],.0028);box(parent,zip,0,1.264,.114,.011,.021,.006)}
 }
 if(!jacket&&p.outfit!=='sport')lining.dispose();if(!jacket)button.dispose();
}
