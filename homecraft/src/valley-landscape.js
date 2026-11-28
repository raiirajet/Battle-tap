import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {roads} from './valley-core.js';
import {worldGround} from './valley-world-life.js';
import {material,box,mesh,bake} from './valley-realism.js';
import {Reflector} from 'three/addons/objects/Reflector.js';

export function renderDue(now,last,quality){return !Number.isFinite(last)||now-last>=(quality==='low'?1000/30-1:1000/60-1)}
export function reflectionEligible(quality,x,z){return quality==='ultra'||quality==='high'?Math.hypot(x-760,z-390)<190:false}
export function lakeReflection(scene,water){
 const g=new T.CircleGeometry(1,64),reflector=new Reflector(g,{color:0x8daab0,textureWidth:512,textureHeight:512,clipBias:.003});reflector.rotation.x=-Math.PI/2;reflector.scale.set(70,48,1);reflector.position.set(760,.19,390);reflector.visible=false;scene.add(reflector);
 const original=reflector.onBeforeRender;let last=-Infinity,clock=0,active=false;
 reflector.onBeforeRender=function(...args){if(!active||clock-last<.12)return;last=clock;const was=water.visible;water.visible=false;try{original.apply(this,args)}finally{water.visible=was}};
 return {update(quality,camera,dt){clock+=Math.max(0,dt);const next=reflectionEligible(quality,camera.position.x,camera.position.z);if(next!==active){active=next;reflector.visible=active;water.material.transparent=active;water.material.opacity=active?.65:1;water.material.depthWrite=!active;water.material.needsUpdate=true;last=-Infinity}if(active){const size=quality==='ultra'?768:384;const rt=reflector.getRenderTarget();if(rt.width!==size){rt.setSize(size,size);last=-Infinity}}},destroy(){reflector.removeFromParent();reflector.dispose();g.dispose()}};
}
export function terrainScenery(scene,seed){
 const root=new T.Group(),far=new T.Group(),town=new T.Group(),nature=new T.Group();root.add(far,town,nature);scene.add(root);let n=seed>>>0;const rand=()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);
 // Background mountain ridges stay outside playable world bounds.
 const stone=material(0x657b80),snow=material(0xd1dce0),ridge=material(0x536e6b);
 for(let i=0;i<28;i++){const angle=i*Math.PI*2/28,r=830+rand()*90,x=512+Math.cos(angle)*r,z=512+Math.sin(angle)*r,h=55+rand()*95,w=95+rand()*70;const g=new T.ConeGeometry(w,h,7);g.rotateY(rand()*6.28);const m=mesh(far,g,i%2?stone:ridge,x,h*.35-10,z);m.castShadow=false;if(h>100){const cap=mesh(far,new T.ConeGeometry(w*.31,h*.31,7),snow,x,h*.69-10,z);cap.rotation.y=m.rotation.y;cap.castShadow=false}}
 // Low-profile pavement curbs, drains and crossing markings; not collision objects.
 const curb=material(0xb7b9b2),paint=material(0xe2e0d4),iron=material(0x555d5f),graph=roads(),nodes=Object.fromEntries(graph.nodes.map(p=>[p.id,p]));
 for(const edge of graph.edges){const a=nodes[edge.a],b=nodes[edge.b],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),ux=dx/len,uz=dz/len,angle=Math.atan2(dx,dz);
 for(const side of [-1,1]){const x=(a.x+b.x)/2+uz*side*3.12,z=(a.z+b.z)/2-ux*side*3.12;for(let k=12;k<len-8;k+=25){box(town,iron,a.x+ux*k+uz*side*2.7,.101,a.z+uz*k-ux*side*2.7,.38,.015,.62).rotation.y=angle}}
 if(len>25)for(let k=-2;k<=2;k++)box(town,paint,a.x+ux*7+uz*k*.84,.112,a.z+uz*7-ux*k*.84,.45,.014,2.1).rotation.y=angle;
 }
 // Shore and forest scatter are low-profile decorative stones; never block a route.
 const rocks=material(0x8b9287),rockGeo=new T.DodecahedronGeometry(1,0),dummy=new T.Object3D(),inst=new T.InstancedMesh(rockGeo,rocks,180);
 for(let i=0;i<180;i++){const theta=rand()*Math.PI*2,dist=1.12+rand()*.14,x=760+Math.cos(theta)*70*dist,z=390+Math.sin(theta)*48*dist,y=worldGround(x,z,seed);dummy.position.set(x,y-.06,z);dummy.rotation.set(rand(),rand()*6.28,rand());const size=.18+rand()*.48;dummy.scale.set(size,size*.48,size*.7);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix)}inst.receiveShadow=true;nature.add(inst);
 bake(far);for(const o of far.children)o.castShadow=false;bake(town);return {setQuality(q){far.visible=q.detail>=1;town.visible=q.detail>=1;nature.visible=q.detail>=2},destroy(){root.removeFromParent();const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);if(o.isInstancedMesh)o.dispose()});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose())}};
}
export function shopDisplays(scene,sites){
 const root=new T.Group();scene.add(root);const steel=material(0x525e64),wood=material(0x917454),glass=material(0x89a9b1,{transparent:true,opacity:.26,roughness:.2,depthWrite:false}),glow=material(0xffe0a8,{emissive:0xffca7b,emissiveIntensity:.4}),colors=[0xc45b48,0x9ab660,0xe6c46a,0xa9c6cd].map(c=>material(c));
 for(const [key,s] of Object.entries(sites)){const z=s.z+s.d/2+.20;for(const dx of [-s.w*.31,s.w*.31]){const x=s.x+dx;box(root,steel,x,1.27,z,2.28,.09,.18);box(root,steel,x,2.28,z,2.28,.075,.18);box(root,glow,x,2.23,z+.07,1.9,.045,.035);for(let i=0;i<6;i++){const m=key==='meal'?colors[i%4]:steel;box(root,m,x-.86+i*.34,1.46+(i%2)*.06,z+.07,.22,.29+(i%2)*.12,.14)}box(root,wood,x,1.72,z+.03,2.15,.06,.16);for(let i=0;i<5;i++)box(root,colors[(i+2)%4],x-.75+i*.37,1.90,z+.07,.24,.23,.13);box(root,glass,x,1.77,z+.17,2.30,1.13,.018)}}
 bake(root);return {update(day){glow.emissiveIntensity=.25+(1-day)*1.2},setQuality(q){root.visible=q.detail>=1},destroy(){root.removeFromParent();const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material)});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose())}};
}
