import {faceTarget,createConversationMotion} from './characters/leaNpc.js';
import * as T from 'three';
import {guestPositionAllowed} from './valley-access.js';
import {npcInterval} from './valley-character-quality.js';
import {avatarMesh} from './valley-avatar.js';
import {RESIDENTS,CARS,residentAt,carAt} from './valley-town.js';
import {worldGround} from './valley-world-life.js';
import {disposeHouse} from './valley-house-render.js';
import {material,mesh,ell,box,joint,bake,loft} from './valley-realism.js';
export function carMesh(color,model='city'){
 const root=new T.Group(),paint=material(color,{roughness:.27,metalness:.32}),glass=material(0x30485a,{roughness:.16,metalness:.25}),rubber=material(0x212429),rim=material(0xb0b8be,{metalness:.65,roughness:.34}),trim=material(0x242a2d),lamp=material(0xf4f0d8,{emissive:0xf4e6b5,emissiveIntensity:.35}),rear=material(0xb32630,{emissive:0xb32630,emissiveIntensity:.25});
 const utility=model==='utility',touring=model==='touring',length=utility?4.6:touring?4.4:3.7,width=utility?1.86:1.75,half=length/2,w=width/2,top=utility?1.73:1.48;
 const bodyRing=(f,y)=>[[-w*f,.35],[w*f,.35],[w*f,.60],[w*f*.91,y],[-w*f*.91,y],[-w*f,.60]];
 mesh(root,loft([{z:-half,ring:bodyRing(.87,.83)},{z:-half+.23,ring:bodyRing(1,.98)},{z:half-.5,ring:bodyRing(1,.94)},{z:half,ring:bodyRing(.84,.78)}]),paint);
 const cabinRear=utility?-.46:touring?-1.47:-1.12,cabinFront=utility?1.13:.91;
 const cab=(f,y)=>[[-w*.86*f,.91],[w*.86*f,.91],[w*.68*f,y],[-w*.68*f,y]];
 mesh(root,loft([{z:cabinRear,ring:cab(.96,1.03)},{z:cabinRear+.30,ring:cab(1,top)},{z:cabinFront-.39,ring:cab(1,top)},{z:cabinFront,ring:cab(.95,1.00)}]),glass);
 box(root,paint,0,top+.015,(cabinRear+cabinFront-.09)/2,w*1.39,.055,cabinFront-cabinRear-.69);
 for(const s of [-1,1]){
  for(const z of [cabinRear+.32,(cabinRear+cabinFront)/2,cabinFront-.40]){const pillar=box(root,trim,s*w*.72,(top+.95)/2,z,.065,top-.92,.073);pillar.rotation.z=-s*.18}
  box(root,trim,s*w*.94,.78,.02,.027,.035,length*.72);box(root,trim,s*w*.94,.90,.18,.04,.055,.23);
  ell(root,paint,s*(w+.055),1.10,cabinFront-.12,.14,.073,.12);ell(root,glass,s*(w+.09),1.10,cabinFront-.21,.096,.053,.014);
  box(root,lamp,s*w*.61,.73,half-.016,.39,.13,.045);box(root,rear,s*w*.62,.73,-half+.014,.36,.15,.045);
 }
 box(root,trim,0,.49,half-.015,w*1.27,.14,.075);box(root,trim,0,.46,-half+.025,w*1.49,.10,.07);box(root,rim,0,.56,-half-.018,.44,.11,.035);
 if(utility){box(root,trim,0,.995,-1.36,w*1.55,.045,1.28);for(const s of [-1,1])box(root,paint,s*w*.87,1.10,-1.35,.12,.27,1.40);box(root,paint,0,1.10,-half+.07,w*1.74,.27,.12)}
 const wheels=[],steering=[];for(const s of [-1,1])for(const z of [-length*.31,length*.31]){const knuckle=joint(root,s*w*.92,.35,z);if(z>0)steering.push(knuckle);const g=joint(knuckle,0,0,0),tire=mesh(g,new T.CylinderGeometry(.35,.35,.23,24),rubber);tire.rotation.z=Math.PI/2;const hub=mesh(g,new T.CylinderGeometry(.235,.235,.245,24),rim);hub.rotation.z=Math.PI/2;for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const spoke=box(g,trim,s*.129,Math.cos(a)*.12,Math.sin(a)*.12,.015,.19,.045);spoke.rotation.x=a}bake(g);wheels.push(g)}
 const cabin=joint(root,0,0,0);const upholstery=material(0x343b42),dash=material(0x242a30),screen=material(0x142d3b,{emissive:0x437a8f,emissiveIntensity:.4});for(const x of [-.34,.34]){box(cabin,upholstery,x,1.01,-.20,.44,.10,.45);box(cabin,upholstery,x,1.23,-.39,.40,.41,.11);box(cabin,upholstery,x,1.47,-.39,.19,.13,.10)}box(cabin,dash,0,1.12,.62,width*.79,.16,.29);box(cabin,screen,.0,1.22,.56,.24,.11,.018);const wheel=mesh(cabin,new T.TorusGeometry(.14,.025,8,24),dash,-.34,1.24,.42);wheel.rotation.x=.30;box(cabin,dash,-.34,1.24,.42,.21,.035,.035);box(cabin,dash,0,1.03,.04,.20,.20,.43);bake(cabin);cabin.visible=false;const shell=[];bake(root);for(const m of root.children)if(m.isMesh)shell.push(m);root.userData.cabin=cabin;root.userData.shell=shell;root.userData.wheels=wheels;root.userData.steering=steering;root.userData.lamps={lamp,rear};return root;
}
export function rollCar(root,x,z,heading,steer=0){for(const g of root.userData.steering||[])g.rotation.y=T.MathUtils.clamp(steer,-1,1)*.40;const p=root.userData.lastWheelPosition;if(p){const dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);if(d<8){const signed=dx*Math.sin(heading)+dz*Math.cos(heading);for(const g of root.userData.wheels)g.rotation.x+=signed/.35}}root.userData.lastWheelPosition={x,z}}
export function cockpitView(root,on){if(!root)return;root.userData.cabin.visible=!!on;for(const o of root.userData.shell)o.visible=!on}
export function carLights(root,{night=0,braking=false,beams=false}={}){const m=root.userData.lamps;if(!m)return;m.lamp.emissiveIntensity=.14+Math.max(0,Math.min(1,night))*2.1;m.rear.emissiveIntensity=braking?2.7:.15+night*.65;if(beams&&!root.userData.beams){const group=new T.Group();for(const x of [-.48,.48]){const light=new T.SpotLight(0xffedc8,0,26,.31,.55,2);light.position.set(x,.80,1.9);light.target.position.set(x,.12,15);group.add(light,light.target)}root.add(group);root.userData.beams=group}if(root.userData.beams){root.userData.beams.visible=beams&&night>.35;for(const o of root.userData.beams.children)if(o.isSpotLight)o.intensity=beams?night*85:0}}
export function turnToward(root, target, dt) {
 return faceTarget(root,target,dt);
}

export function townActors(scene,seed){
 const root=new T.Group();
 scene.add(root);
 const people=RESIDENTS.map(r=>({r,elapsed:0,avatar:avatarMesh(r.profile,{detail:false,identity:r.id})}));
 for(const p of people)root.add(p.avatar.root);
 const cars=CARS.map(c=>({c,mesh:carMesh(c.color)}));
 for(const c of cars)root.add(c.mesh);
 root.visible=false;
 return {
  show(on){root.visible=on;for(const p of people)p.elapsed=0},
  speaker(id,minute,save){
   const entry=people.find(p=>p.r.id===id);
   if(!root.visible||!entry?.avatar.root.visible)return null;
   const p=residentAt(entry.r,minute);
   if(!guestPositionAllowed(save,'npc:'+id,p.x,p.z))return null;
   const state={...p,height:worldGround(p.x,p.z,seed)};
   const {avatar}=entry;
   const motion=createConversationMotion();return {state,speak:motion.speak,update(player,dt){
    const gaze=faceTarget(avatar.root,player,dt);avatar.update(state,0,0,false,dt,null,{...motion.update(dt),gaze});
   }};
  },
  update(minute,dt,excluded=null,privateSave=null,observer=null,quality='medium'){
   if(!root.visible)return;
   for(const entry of people){
    const {r,avatar}=entry,p=residentAt(r,minute);
    avatar.root.visible=r.id!==excluded&&guestPositionAllowed(privateSave,'npc:'+r.id,p.x,p.z);
    if(!avatar.root.visible)continue;
    const state={...p,height:worldGround(p.x,p.z,seed)},interval=npcInterval(observer?Math.hypot(observer.x-p.x,observer.z-p.z):0,quality);
    entry.elapsed=Math.min(.1,entry.elapsed+Math.max(0,dt));
    if(dt>0&&entry.elapsed+1e-6<interval){avatar.root.position.set(p.x,state.height+.025,p.z);continue}
    avatar.update(state,p.dx,p.dz,p.moving&&dt>0,entry.elapsed);
    entry.elapsed=0;
   }
   for(const {c,mesh} of cars){
    const p=carAt(c,minute);
    mesh.position.set(p.x,worldGround(p.x,p.z,seed)+.12,p.z);
    mesh.rotation.y=Math.atan2(p.dx,p.dz);
    rollCar(mesh,p.x,p.z,mesh.rotation.y);
    carLights(mesh,{night:minute<420||minute>1140?1:0});
   }
  },
  destroy(){disposeHouse(root)}
 };
}
