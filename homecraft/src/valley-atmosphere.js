import * as T from 'three';
import {box,material,mesh,bake,joint} from './valley-realism.js';
import {seasonalDaylight} from './valley-climate.js';

// Procedural PBR maps: independent linear-space normal/roughness maps.
export function surfaceMaps(kind='grass',size=128){
 const h=new Float32Array(size*size),rgba=new Uint8Array(size*size*4),normal=new Uint8Array(rgba.length),rough=new Uint8Array(rgba.length);
 let s=20261127;const rand=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);
 const at=(x,y)=>((y+size)%size)*size+(x+size)%size;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size*Math.PI*2,v=y/size*Math.PI*2,n=rand()-.5;
  let value=.5+.08*Math.sin(u*6+v*3)+n*.14;
  if(kind==='roof')value=.52+.09*Math.sin(u*8)-((y%16)<2?.21:0)-((x+(Math.floor(y/16)%2)*8)%16<2?.12:0)+n*.025;
  if(kind==='plaster')value=.5+n*.09+.035*Math.sin(u*12+v*7)+.028*Math.cos(u*17-v*11);
  if(kind==='grass')value=.47+.12*Math.sin(u*6+v*3)+.08*Math.cos(u*13-v*9)+n*.18;
  if(kind==='stone'){const row=Math.floor(y/24),xx=(x+(row%2)*24)%48,yy=y%24,edge=Math.min(xx,48-xx,yy,24-yy);value=edge<2?.19:.62+n*.16+.055*Math.cos(u*17+v*13)}
  if(kind==='bark'){
   const grooves=Math.sin(u*13+Math.sin(v*2)*.55+Math.sin(v*5)*.14);
   value=.47+.21*grooves+.075*Math.sin(u*29+v*2)+n*.13;
  }
  if(kind==='asphalt')value=.5+n*.28+.025*Math.sin(u*4+v*6);
  h[at(x,y)]=value;
 }
 const strength=kind==='roof'?2.4:kind==='asphalt'?1.2:1.7;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=at(x,y),k=i*4,v=h[i],dx=(h[at(x-1,y)]-h[at(x+1,y)])*strength,dy=(h[at(x,y-1)]-h[at(x,y+1)])*strength,len=Math.hypot(dx,dy,1);
  const grey=Math.round(T.MathUtils.clamp(.72+v*.34,0,1)*255);
  rgba.set(kind==='grass'?[Math.min(255,grey+3),grey,Math.round(grey*.86),255]:kind==='stone'?[grey,Math.round(grey*.96),Math.round(grey*.88),255]:[grey,grey,grey,255],k);normal.set([Math.round(127.5+127.5*dx/len),Math.round(127.5+127.5*dy/len),Math.round(127.5+127.5/len),255],k);
  const r=Math.round(T.MathUtils.clamp((kind==='roof'?.70:kind==='stone'?.82:.90)+(v-.5)*.26,0,1)*255);rough.set([r,r,r,255],k);
 }
 function tex(data,srgb=false){const t=new T.DataTexture(data,size,size,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.generateMipmaps=true;if(srgb)t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;return t}
 return {map:tex(rgba,true),normalMap:tex(normal),roughnessMap:tex(rough)};
}
export function setSurface(mat,maps,repeatX,repeatY,detail=true){for(const t of Object.values(maps))t.repeat.set(repeatX,repeatY);mat.map=maps.map;mat.normalMap=detail?maps.normalMap:null;mat.roughnessMap=detail?maps.roughnessMap:null;mat.normalScale.set(.65,.65);mat.needsUpdate=true}
export function lightState(minute,climate={}){
 const a=seasonalDaylight(minute,climate.season||0),cloud=T.MathUtils.clamp(climate.cloud||0,0,1),twilight=Math.max(0,1-Math.min(Math.abs(a.angle),Math.abs(a.angle-Math.PI))*3.2);
 return {day:a.day,night:1-a.day,angle:a.angle,cloud,twilight,wet:climate.type==='rain'||climate.type==='storm',sunColor:new T.Color(0xfff3dc).lerp(new T.Color(0xffaa68),twilight),sky:new T.Color(0x14243d).lerp(new T.Color(cloud>.65?0x9caebd:0xbcd9eb),a.brightness)};
}
// World-space sky gradient, sun disc and stars; no network assets.
export function atmosphere(scene){
 const uniforms={top:{value:new T.Color(0x72a8d8)},horizon:{value:new T.Color(0xe0eced)},sunDir:{value:new T.Vector3(.3,.7,-.4).normalize()},day:{value:1},cloud:{value:.18},time:{value:0},twilight:{value:0},detail:{value:1}};
 const m=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,toneMapped:false,uniforms,vertexShader:'varying vec3 vDir; void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`
 varying vec3 vDir;uniform vec3 top,horizon,sunDir;uniform float day,cloud,time,twilight,detail;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
 float fbm(vec2 p){float n=.52*noise2(p);p=p*2.07+12.;n+=.25*noise2(p);p=p*2.03-8.;n+=.13*noise2(p);if(detail>1.5)n+=.07*noise2(p*2.);return n;}
 void main(){vec3 d=normalize(vDir);float y=max(0.,d.y);vec3 c=mix(horizon,top,pow(y,.58));
 float s=max(0.,dot(d,sunDir));float sunset=pow(s,9.)*twilight;c+=vec3(.62,.20,.09)*sunset*(1.-y)*.6; c+=vec3(1.,.65,.3)*(pow(s,55.)*.25+smoothstep(.9993,.9998,s)*1.2)*max(day,twilight*.65)*(1.-cloud*.85);
 if(d.y>.005){vec2 p=d.xz/(d.y+.30)*3.8+vec2(time*.016,time*.005);float n=fbm(p);float cover=smoothstep(.66-cloud*.40,.81-cloud*.35,n)*smoothstep(.005,.15,d.y);float shade=fbm(p+vec2(.09,-.12));vec3 lit=mix(vec3(.12,.17,.25),vec3(.88,.89,.90),day);lit=mix(lit,vec3(.92,.43,.25),twilight*pow(s,.6)*.85);vec3 shadow=mix(vec3(.07,.10,.17),vec3(.30,.39,.50),day);shadow=mix(shadow,vec3(.37,.20,.36),twilight*.8);c=mix(c,mix(shadow,lit,smoothstep(.34,.75,shade)),cover*.91);}
 vec3 moonDir=normalize(vec3(-sunDir.x,max(.28,-sunDir.y),-sunDir.z));float md=dot(d,moonDir);float moon=smoothstep(.9990,.99955,md);float crescent=smoothstep(.9990,.99955,dot(d,normalize(moonDir+vec3(.018,.007,0.))));c+=vec3(.70,.78,.94)*max(0.,moon-.62*crescent)*(1.-day)*(1.-cloud);
 vec2 uv=vec2(atan(d.z,d.x),asin(clamp(d.y,-1.,1.)))*180.;float star=step(.997,hash(floor(uv)))*(1.-smoothstep(.05,.20,length(fract(uv)-.5)));c+=star*(1.-day)*(.4+.6*y)*(1.-cloud);
 gl_FragColor=vec4(c,1.); #include <colorspace_fragment>
 }`.replace('; #include',';\n#include')});
 const dome=new T.Mesh(new T.SphereGeometry(950,32,16),m);dome.renderOrder=-1000;dome.frustumCulled=false;scene.add(dome);
 return {setQuality(q){uniforms.detail.value=q.detail},update(minute,c,sunDir,center,dt=0){const a=lightState(minute,c);uniforms.day.value=a.day;uniforms.cloud.value=a.cloud;uniforms.twilight.value=a.twilight;uniforms.top.value.set(0x08152e).lerp(new T.Color(a.cloud>.65?0x718394:0x518ec6),a.day);uniforms.top.value.lerp(new T.Color(0x66628b),a.twilight*.32);uniforms.horizon.value.copy(a.sky).lerp(new T.Color(0xffa365),a.twilight*.72);uniforms.sunDir.value.copy(sunDir).normalize();uniforms.time.value+=dt;dome.position.copy(center);return a},destroy(){dome.removeFromParent();dome.geometry.dispose();m.dispose()}};
}
// Fine town architecture stays attached to existing buildings (no new collisions).
export function townArchitecture(scene,homes,sites){
 const root=new T.Group();scene.add(root);const wood=material(0x725747),metal=material(0x555c60,{metalness:.35}),stone=material(0xb5a99b),glass=material(0x91acb6,{roughness:.22,emissive:0xffcc83,emissiveIntensity:0}),dark=material(0x384047),sign=material(0xe9dbc2);
 for(const h of homes){for(const side of [-1,1]){for(const dx of [-h.w*.29,h.w*.29]){box(root,wood,h.x+dx,1.22,h.z+side*(h.d/2+.095),1.82,.09,.18);for(const a of [-1,1]){box(root,wood,h.x+dx+a*.99,1.96,h.z+side*(h.d/2+.047),.26,1.22,.04);for(let j=0;j<6;j++)box(root,stone,h.x+dx+a*.99,1.49+j*.18,h.z+side*(h.d/2+.072),.20,.022,.015)}box(root,glass,h.x+dx,1.96,h.z+side*(h.d/2+.081),1.36,1.1,.012)}box(root,metal,h.x+side*(h.w/2-.08),3.54,h.z,.11,.12,h.d+.27);for(const dz of [-1,1])box(root,metal,h.x+side*(h.w/2+.025),1.78,h.z+dz*(h.d/2-.19),.075,3.43,.075)}}
 for(const [key,s] of Object.entries(sites)){const z=s.z+s.d/2+.23;box(root,metal,s.x,2.64,z,s.w*.88,.13,.48);box(root,sign,s.x,2.91,z,.8*s.w,.34,.05);for(const dx of [-s.w*.31,s.w*.31]){box(root,glass,s.x+dx,1.75,z-.08,2.48,1.36,.025);box(root,dark,s.x+dx,1.75,z-.055,.045,1.35,.025);box(root,dark,s.x+dx,1.75,z-.055,2.48,.045,.025)}
 // Distinct roller-door slats at the workshop, storefront awning ribs at the market.
 if(key==='work'){for(let i=0;i<8;i++)box(root,metal,s.x, .35+i*.25,z-.10,1.36,.035,.035)}else for(let i=0;i<8;i++)box(root,wood,s.x+(i-3.5)*.75,2.59,z,.36,.08,.47);
 }
 bake(root);return {update(day){glass.emissiveIntensity=(1-day)**2*.65},destroy(){root.removeFromParent();const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material)});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose())}};
}
