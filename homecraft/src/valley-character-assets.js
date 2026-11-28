import * as T from 'three';
import {faceRelief,faceTint,smoothRingSeam} from './valley-anatomy.js';
import {mesh,ell,box,material,bake} from './valley-realism.js';

// Repeatable offline textile microstructure, independent textures per avatar.
export function textileMaps(kind='cotton',size=64){
 const data=new Uint8Array(size*size*4),normal=new Uint8Array(data.length),rough=new Uint8Array(data.length);
 const freq=kind==='knit'?8:kind==='denim'?16:kind==='leather'?8:12;
 const height=(x,y)=>{const u=x/size*6.28318530718*freq,v=y/size*6.28318530718*freq;
  return kind==='knit'?.5+.17*Math.cos(u+Math.sin(v)*.9)+.11*Math.cos(v*2):kind==='denim'?.5+.13*Math.sin(u+v*2)+.06*Math.cos(v):kind==='leather'?.5+.10*Math.sin(u*1.25)*Math.cos(v*.75):.5+.09*Math.cos(u)+.09*Math.cos(v)};
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,h=height(x,y),dx=(height(x-1,y)-height(x+1,y))*.9,dy=(height(x,y-1)-height(x,y+1))*.9,n=Math.hypot(dx,dy,1),g=Math.round(220+h*30);data.set([g,g,g,255],i);normal.set([Math.round(127.5+127.5*dx/n),Math.round(127.5+127.5*dy/n),Math.round(127.5+127.5/n),255],i);const r=kind==='leather'?135:Math.round(210+h*35);rough.set([r,r,r,255],i)}
 function tex(bytes,srgb=false){const t=new T.DataTexture(bytes,size,size,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.generateMipmaps=true;if(srgb)t.colorSpace=T.SRGBColorSpace;t.repeat.set(3,3);t.needsUpdate=true;return t}
 return {map:tex(data,true),normalMap:tex(normal),roughnessMap:tex(rough)};
}
export function applyTextile(mat,kind,detail){if(!detail)return;Object.assign(mat,textileMaps(kind,128));mat.normalScale.set(.27,.27);mat.needsUpdate=true}

const gaussian=(v,s)=>Math.exp(-((v/s)**2));
export function faceGeometry(form='soft',detail=true){
 const rings=[[-.146,.001,.002,.022],[-.135,.037,.035,.020],[-.113,.066,.061,.019],[-.078,.086,.080,.014],[-.026,.104,.094,.002],[.027,.109,.100,-.005],[.075,.103,.096,-.014],[.121,.078,.073,-.016],[.149,.035,.041,-.016],[.156,.001,.001,-.017]];
 const rows=detail?64:30,cols=detail?80:36,pos=[],uv=[],color=[],idx=[];
 function sample(y,k){let i=0;while(i<rings.length-2&&y>rings[i+1][0])i++;const t=(y-rings[i][0])/(rings[i+1][0]-rings[i][0]);const a=rings[i][k],b=rings[i+1][k],prev=rings[Math.max(0,i-1)],next=rings[Math.min(rings.length-1,i+2)],span=rings[i+1][0]-rings[i][0],m0=(b-prev[k])/(rings[i+1][0]-prev[0])*span,m1=(next[k]-a)/(next[0]-rings[i][0])*span;return (2*t**3-3*t*t+1)*a+(t**3-2*t*t+t)*m0+(-2*t**3+3*t*t)*b+(t**3-t*t)*m1}
 for(let i=0;i<=rows;i++){const y=-.146+i/rows*.302,w=Math.max(.001,sample(y,1)),d=Math.max(.001,sample(y,2)),off=sample(y,3);
  for(let j=0;j<=cols;j++){const a=j/cols*2*Math.PI,front=Math.max(0,Math.cos(a)),jaw=form==='angular'?1+.12*gaussian(y+.095,.045):form==='round'?1+.09*gaussian(y+.035,.085):1,x=Math.sin(a)*w*jaw;let z=Math.cos(a)*d+off;
   z+=faceRelief(x,y)*front*front;
   pos.push(x,y,z);uv.push(j/cols,i/rows);
   color.push(...faceTint(x,y,front));
  }}
 for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*(cols+1)+j,b=a+cols+1;idx.push(a,a+1,b,b,a+1,b+1)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(color,3));g.setIndex(idx);g.computeVertexNormals();return smoothRingSeam(g,rows+1,cols);
}
export function irisGeometry(radius=.013,detail=true){const n=detail?40:24,g=new T.CircleGeometry(radius,n);return g}
export function irisTexture(color,size=64){const bytes=new Uint8Array(size*size*4),c=new T.Color(color);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const u=(x+.5-size/2)/(size/2),v=(y+.5-size/2)/(size/2),r=Math.hypot(u,v),a=Math.atan2(v,u),fiber=.12*Math.sin(a*31+r*16)+.08*Math.sin(a*53-r*12),edge=Math.min(1,Math.max(0,(1-r)*9)),light=(.72+fiber+.20*Math.sin(r*9))*edge+.10;const i=(y*size+x)*4;bytes.set([Math.min(255,Math.round(c.r*255*light)),Math.min(255,Math.round(c.g*255*light)),Math.min(255,Math.round(c.b*255*light)),255],i)}const t=new T.DataTexture(bytes,size,size,T.RGBAFormat);t.magFilter=T.LinearFilter;t.minFilter=T.LinearFilter;t.needsUpdate=true;return t}

// Assets built in local coordinates, attached to existing articulated bones.
export function shoeAsset(parent,style,color,sole,skin,detail=true){
 const g=new T.Group();g.userData.shoeStyle=style;parent.add(g);
 const stitch=material(new T.Color(color.color).lerp(new T.Color(0xe4d8c5),.35)),rubber=material(0xb6b0a5,{roughness:.94}),hardware=material(0x8a9091,{metalness:.6,roughness:.35});
 const soleGeo=new T.Shape();soleGeo.moveTo(-.044,-.049);soleGeo.bezierCurveTo(-.067,-.016,-.065,.095,-.038,.155);soleGeo.quadraticCurveTo(0,.177,.047,.152);soleGeo.bezierCurveTo(.067,.10,.06,-.027,.044,-.049);soleGeo.closePath();
 const extrude=new T.ExtrudeGeometry(soleGeo,{depth:.022,bevelEnabled:true,bevelSegments:detail?3:1,steps:1,bevelSize:.004,bevelThickness:.003,curveSegments:detail?16:10});extrude.rotateX(Math.PI/2);
 mesh(g,extrude,sole,0,-.361,0);
 if(style==='sandal'){ell(g,skin,0,-.333,.061,.052,.031,.108);for(const z of [.04,.095]){const strap=box(g,color,0,-.310,z,.108,.018,.032);strap.rotation.x=.10}box(g,color,0,-.32,-.019,.092,.023,.027)}
 else{ell(g,color,0,-.329,.069,.058,.037,.099);ell(g,color,0,-.306,-.014,.054,style==='boot'?.091:.050,.047);if(style==='boot'){mesh(g,new T.CylinderGeometry(.056,.049,.11,18),color,0,-.246,-.01);for(let i=0;i<3;i++)box(g,hardware,0,-.222-i*.027,.043,.027,.006,.009)}
 if(style==='sneaker'){ell(g,rubber,0,-.348,.125,.053,.018,.039);box(g,stitch,0,-.320,.106,.073,.006,.012)}
 if(style==='loafer'){box(g,stitch,0,-.299,.066,.090,.014,.023);box(g,hardware,0,-.289,.066,.025,.005,.018)}
 else for(let i=0;i<(detail?5:3);i++){const z=.008+i*.017;const l=box(g,stitch,0,-.286-i*.005,z,.057,.005,.007);l.rotation.y=(i%2?1:-1)*.16}}
 for(let i=0;i<6;i++)box(g,sole,0,-.383,-.025+i*.029,.087,.007,.009);
 if(detail){
 function line(mat,points,r){return mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),10,r,5,false),mat)}
 if(style!=='sandal'){
 for(const s of [-1,1])line(stitch,[[s*.044,-.345,-.036],[s*.055,-.343,.025],[s*.053,-.343,.098],[s*.028,-.346,.15]],.0019);
 if(style==='boot'||style==='sneaker'){
 for(let i=0;i<5;i++){const z=.015+i*.016,y=-.285-i*.005;for(const s of [-1,1]){const eyelet=mesh(g,new T.TorusGeometry(.0035,.001,5,10),hardware,s*.027,y,z);eyelet.rotation.x=Math.PI/2}if(i<4){line(stitch,[[-.025,y+.002,z],[0,y+.006,z+.008],[.025,y-.003,z+.016]],.002);line(stitch,[[.025,y+.002,z],[0,y+.009,z+.008],[-.025,y-.003,z+.016]],.002)}}
 }else line(stitch,[[-.039,-.307,.044],[-.040,-.304,.109],[0,-.307,.145],[.040,-.304,.109],[.039,-.307,.044]],.0016);
 }
 }
 // Bake by material; dispose unused materials.
 const used=new Set(g.children.map(o=>o.material));for(const m of [stitch,rubber,hardware])if(!used.has(m))m.dispose();bake(g);return g;
}

// Fine deterministic skin grain; no external or photographic assets.
export function applySkinDetail(mat,detail=true){
 if(!detail)return;const size=128,data=new Uint8Array(size*size*4),rough=new Uint8Array(data.length);let seed=41719;
 for(let i=0;i<data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const a=(seed>>>24)/255;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const b=(seed>>>24)/255;data.set([Math.round(128+(a-.5)*18),Math.round(128+(b-.5)*18),255,255],i);const r=Math.round(151+a*15);rough.set([r,r,r,255],i)}
 function tex(d){const t=new T.DataTexture(d,size,size,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(8,8);t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t}
 mat.normalMap=tex(data);mat.roughnessMap=tex(rough);mat.normalScale.set(.16,.16);mat.needsUpdate=true;
}
