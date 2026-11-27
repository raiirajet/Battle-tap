import * as T from 'three';
import {mesh,ell,box,material,bake} from './valley-realism.js';
// Shaped closed cross-sections in metres; normals and UVs for mobile PBR.
export function silhouette(rings,segments=24){
 const pos=[],uv=[],idx=[];
 for(let i=0;i<rings.length;i++){const [y,w,d,front=0]=rings[i];for(let j=0;j<=segments;j++){const a=j/segments*Math.PI*2;pos.push(Math.sin(a)*w,y,Math.cos(a)*d+front);uv.push(j/segments,i/(rings.length-1))}}
 for(let i=0;i<rings.length-1;i++)for(let j=0;j<segments;j++){const a=i*(segments+1)+j,b=a+segments+1;idx.push(a,a+1,b,b,a+1,b+1)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
export function taperedLock(points,radius,segments=12,sides=6){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),pos=[],uv=[],idx=[];
 const frames=curve.computeFrenetFrames(segments,false);
 for(let i=0;i<=segments;i++){const t=i/segments,p=curve.getPointAt(t),r=radius*Math.max(.045,Math.pow(1-t,.65))*(.8+.2*Math.sin(t*Math.PI));for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2;const q=p.clone().addScaledVector(frames.normals[i],Math.cos(a)*r).addScaledVector(frames.binormals[i],Math.sin(a)*r*.64);pos.push(q.x,q.y,q.z);uv.push(j/sides,t)}}
 for(let i=0;i<segments;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;idx.push(a,a+1,b,b,a+1,b+1)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
export function curveDetail(parent,mat,points,r=.003,steps=12){return mesh(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),steps,r,5,false),mat)}
function bone(parent,x,y,z){const b=new T.Bone();b.position.set(x,y,z);parent.add(b);return b}
export function makeHand(parent,skin,side,detail=true){
 const hand=bone(parent,0,-.205,0),nail=material(new T.Color(skin.color).lerp(new T.Color(0xffe0ca),.26),{roughness:.48});hand.userData.hand=true;
 mesh(hand,silhouette([[-.057,.014,.011],[-.042,.033,.019],[-.012,.034,.021],[.012,.025,.021],[.026,.020,.019]],16),skin);
 const digits=[];for(let i=0;i<5;i++){const thumb=i===4,l=[.055,.065,.061,.045,.042][i],x=thumb?-side*.030:side*(i-1.5)*.016,z=thumb?.012:.004;
 const finger=bone(hand,x,thumb?-.015:-.039,z);finger.userData.digit=i;finger.rotation.z=thumb?-side*.65:side*(i-1.5)*.065;
 const r=thumb?.010:.0085;mesh(finger,silhouette([[-l*.66,r*.70,r*.76],[-l*.58,r,r],[-.004,r,r],[.003,r*.72,r*.76]],10),skin);
 const tip=bone(finger,0,-l*.59,0);mesh(tip,silhouette([[-l*.42,.001,.001],[-l*.30,r*.72,r*.7],[-.002,r*.9,r*.9],[.003,r*.73,r*.73]],10),skin);
 if(detail){ell(tip,nail,0,-l*.23,r*.62,r*.58,l*.13,.0022)}
 bake(finger);bake(tip);digits.push({finger,tip,thumb});
 }
 if(!detail)nail.dispose();bake(hand);
 return {hand,digits,update(grip,phase){hand.rotation.x=-.06+grip*.15;for(const {finger,tip,thumb} of digits){finger.rotation.x=grip*(thumb?.40:.78)+.04*Math.sin(phase);tip.rotation.x=grip*(thumb?.38:.82)}}};
}
export function makeFace(head,p,skin,hair,detail=true){
 const seg=detail?32:20;
 mesh(head,silhouette([[-.146,.001,.002,.022],[-.135,.037,.035,.020],[-.113,.066,.061,.019],[-.078,.086,.080,.014],[-.026,.104,.094,.002],[.027,.109,.100,-.005],[.075,.103,.096,-.014],[.121,.078,.073,-.016],[.149,.035,.041,-.016],[.156,.001,.001,-.017]],seg),skin);
 const dark=material(0x30272a,{roughness:.72}),white=material(0xfff6ed,{roughness:.42}),iris=material({brown:0x72513e,blue:0x547da3,green:0x54826c,grey:0x777f89}[p.eyes],{roughness:.3}),pupil=material(0x1b2028,{roughness:.3}),catchlight=material(0xfff9ed,{emissive:0xffffff,emissiveIntensity:.35}),lip=material(new T.Color(p.skin).lerp(new T.Color(0xb45f60),.40),{roughness:.58}),earMat=material(new T.Color(p.skin).multiplyScalar(.83));
 const eyes=[];for(const side of [-1,1]){const x=side*.045;ell(head,skin,side*.109,-.014,-.002,.019,.038,.019);ell(head,earMat,side*.119,-.012,.006,.006,.023,.010);
 const eye=new T.Group();eye.position.set(x,.018,.083);eye.rotation.y=side*.14;head.add(eye);ell(eye,white,0,0,0,.030,.017,.014);ell(eye,iris,0,0,.011,.012,.014,.0045);ell(eye,pupil,0,0,.015,.0058,.009,.0027);ell(eye,catchlight,-.004,.005,.017,.003,.003,.0015);curveDetail(eye,dark,[[-.03,-.001,0],[-.018,.012,.010],[0,.017,.012],[.018,.012,.010],[.03,-.001,0]],.0025);curveDetail(eye,earMat,[[-.028,-.002,0],[0,-.015,.010],[.028,-.002,0]],.0018);bake(eye);eyes.push(eye);
 curveDetail(head,hair,[[x-.028,.050,.079],[x-.009,.058,.090],[x+.013,.055,.093],[x+.028,.047,.079]],.0042);
 }
 ell(head,skin,0,-.018,.099,.015,.029,.018);ell(head,skin,0,-.041,.110,.020,.012,.014);
 curveDetail(head,lip,[[-.025,-.078,.083],[-.011,-.075,.096],[0,-.079,.100],[.011,-.075,.096],[.025,-.078,.083]],.0033);
 curveDetail(head,earMat,[[-.020,-.082,.085],[0,-.084,.100],[.020,-.082,.085]],.0018);
 if(p.accessory==='glasses'){const frame=material(0x3a3130,{metalness:.35});for(const s of [-1,1]){const ring=mesh(head,new T.TorusGeometry(.033,.0028,6,24),frame,s*.045,.018,.107);ring.scale.y=.66;box(head,frame,s*.096,.020,.054,.006,.006,.10)}box(head,frame,0,.023,.112,.027,.006,.006)}
 bake(head);return {eyes,update(t){const phase=t%5.8,blink=phase>5.60?Math.max(.07,Math.abs(phase-5.70)/.10):1;for(const eye of eyes)eye.scale.y=blink}};
}
export function makeHair(head,p,hair,detail=true){
 if(p.hairStyle==='bald')return {update(){}};
 const hairRoot=new T.Group();head.add(hairRoot);const highlight=material(new T.Color(p.hair).lerp(new T.Color(0xcba47f),.13),{roughness:.57});hair.roughness=.59;
 // Scalp cap is confined to the top/back, leaving the face clear.
 const cap=new T.SphereGeometry(1,detail?28:18,12,0,Math.PI*2,0,Math.PI*.56);cap.scale(.114,.133,.112);cap.translate(0,.027,-.018);mesh(hairRoot,cap,hair);
 const count=detail?17:10;
 for(let i=0;i<count;i++){const a=(i/(count-1)-.5)*Math.PI*1.62,s=Math.sin(a),c=Math.cos(a),sweep=p.hairStyle==='wavy'?.035:.017;
 const points=[[s*.045,.146,-.028],[s*.104,.112,c*.067-.012],[s*.111+sweep,.060,c*.088-.018],[s*.100+sweep,p.hairStyle==='short'?.015:.005,c*.092-.020]];
 mesh(hairRoot,taperedLock(points,.028,detail?12:8,7),i%5===0?highlight:hair);
 }
 const tails=[];if(['long','wavy','ponytail'].includes(p.hairStyle)){
 for(const side of [-1,1]){const tail=bone(hairRoot,side*.085,.02,-.055);const count=detail?7:4;for(let i=0;i<count;i++){const dx=(i-(count-1)/2)*.014,len=p.hairStyle==='ponytail'?.27:.33+(i%3)*.035;mesh(tail,taperedLock([[dx,0,0],[dx+side*.027,-.085,-.035],[dx-side*.012,-len*.63,-.055],[dx+side*.019,-len,-.025]],.026,12,6),i%4===0?highlight:hair)}bake(tail);tails.push(tail)}
 }
 if(p.hairStyle==='bun'||p.hairStyle==='ponytail'){ell(hairRoot,hair,0,.078,-.13,.072,.063,.065);for(let i=0;i<5;i++)curveDetail(hairRoot,highlight,[[-.053,.08+i*.005,-.13],[0,.11+i*.004,-.184],[.053,.08+i*.005,-.13]],.004)}
 bake(hairRoot);return {update(clock,walk){for(const [i,t] of tails.entries()){t.rotation.x=Math.sin(clock*5+i)*walk*.09;t.rotation.z=Math.sin(clock*4+i)*(.035+walk*.045)}}};
}
export function garment(parent,shirt,seam,p,detail){
 const lining=material(new T.Color(p.shirt).lerp(new T.Color(0xe6ded0),.55),{roughness:.94}),button=material(0x827465,{roughness:.55});shirt.roughness=.94;
 mesh(parent,silhouette([[.832,.151,.103],[.87,.165,.112],[.95,.155,.111],[1.07,.168,.117],[1.18,.198,.117],[1.255,.208,.101],[1.30,.161,.087],[1.344,.080,.066]],detail?32:20),shirt);
 const jacket=p.outfit==='jacket'||p.outfit==='cardigan';
 if(jacket){mesh(parent,silhouette([[.84,.107,.103],[.95,.103,.118],[1.14,.111,.121],[1.27,.085,.092],[1.32,.065,.07]],20),lining);for(const side of [-1,1]){curveDetail(parent,seam,[[side*.11,1.30,.065],[side*.065,1.17,.121],[side*.09,1.04,.119],[side*.087,.86,.108]],.009);box(parent,seam,side*.12,.96,.103,.082,.067,.012);curveDetail(parent,lining,[[side*.08,.995,.116],[side*.158,.995,.099]],.003);for(let i=0;i<4;i++)ell(parent,button,side*.075,.91+i*.09,.121,.006,.006,.003)}}else{curveDetail(parent,seam,[[-.08,1.33,.065],[0,1.294,.089],[.08,1.33,.065]],.007);if(p.outfit==='sport')for(const s of [-1,1])curveDetail(parent,lining,[[s*.165,1.23,.064],[s*.15,1.1,.095],[s*.13,.87,.09]],.012)}
 for(const side of [-1,1])for(let i=0;i<(detail?4:2);i++){const y=.89+i*.045;curveDetail(parent,seam,[[side*.135,y,.074],[side*.106,y+.013,.105],[side*.075,y+.020,.111]],.0023)}
 if(!jacket&&p.outfit!=='sport')lining.dispose();if(!jacket)button.dispose();
}
