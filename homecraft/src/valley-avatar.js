import * as T from 'three';
import {profile,poseFor} from './valley-world-life.js';
import {material,mesh,ell,box,bake} from './valley-realism.js';
function joint(parent,x,y,z){const b=new T.Bone();b.position.set(x,y,z);parent.add(b);return b}
export function avatarMesh(input){
 const p=profile(input),root=new T.Group(),body=joint(root,0,0,0);
 const skin=material(p.skin),shirt=material(p.shirt),pants=material(p.pants),shoe=material({dark:0x292c30,white:0xe5e4dd,brown:0x6c4a37}[p.shoes]),sole=material(0x4a4945),hair=material(p.hair),white=material(0xf1eae4),iris=material(0x50443c),lip=material(0x946457),seam=material(new T.Color(p.shirt).multiplyScalar(.76));
 const width={slim:.88,regular:1,athletic:1.09}[p.build];body.scale.x=width;
 // Natural proportions and layered clothes, with articulated elbows and knees.
 ell(body,pants,0,.82,0,.166,.15,.112);ell(body,shirt,0,1.075,0,.185,.29,.116);ell(body,shirt,0,1.25,0,.22,.105,.113);
 ell(body,skin,0,1.382,0,.074,.09,.069);ell(body,seam,0,1.325,0,.104,.034,.084);box(body,seam,0,1.07,.116,.025,.33,.008);
 const head=joint(body,0,1.53,0);
 ell(head,skin,0,0,0,.112,.154,.105);ell(head,skin,0,-.074,.024,.090,.075,.087);
 for(const s of [-1,1]){ell(head,skin,s*.113,-.005,0,.025,.047,.021);ell(head,white,s*.045,.025,.094,.030,.016,.019);ell(head,iris,s*.045,.025,.111,.011,.012,.006);ell(head,hair,s*.045,.055,.096,.032,.007,.009)}
 ell(head,skin,0,-.009,.104,.023,.036,.032);ell(head,lip,0,-.065,.094,.035,.009,.012);
 if(p.hairStyle!=='bald'){ell(head,hair,0,.081,-.018,.118,.086,.109);for(const s of [-1,1])ell(head,hair,s*.099,.035,-.035,.023,.075,.075);ell(head,hair,0,.105,.04,.092,.056,.07);if(p.hairStyle==='long'){ell(head,hair,0,-.055,-.077,.112,.17,.054);for(const s of [-1,1])ell(head,hair,s*.105,-.085,-.025,.032,.15,.046)}}
 if(p.hairStyle==='bun')ell(head,hair,0,.09,-.12,.066,.066,.065);if(p.hairStyle==='wavy')for(let i=0;i<5;i++)ell(head,hair,(i-2)*.04,.105,.058,.036,.047,.04);
 if(p.accessory==='glasses'){const frame=material(0x282b30);for(const s of [-1,1]){const ring=mesh(head,new T.TorusGeometry(.033,.004,6,16),frame,s*.045,.024,.125);ring.scale.y=.65;box(head,frame,s*.096,.025,.064,.008,.008,.11)}box(head,frame,0,.027,.127,.033,.007,.008)}
 for(const s of [-1,1]){ell(head,skin,s*.072,-.035,.077,.039,.049,.025);ell(head,skin,s*.025,-.032,.113,.016,.012,.014)}
 if(p.outfit==='jacket'){for(const s of [-1,1]){const flap=box(body,seam,s*.067,1.20,.119,.054,.18,.014);flap.rotation.z=s*.22;box(body,seam,s*.103,.94,.112,.096,.044,.018)}}else if(p.outfit==='sport'){for(const s of [-1,1])box(body,seam,s*.125,1.12,.087,.027,.29,.018)}
 const arms=[],legs=[];
 for(const s of [-1,1]){
  const a=joint(body,s*.205,1.25,0),elbow=joint(a,0,-.245,0);
  ell(a,shirt,0,-.105,0,.077,.15,.074);ell(elbow,skin,0,-.10,0,.048,.125,.049);ell(elbow,skin,0,-.23,.006,.051,.065,.03);ell(elbow,skin,-s*.039,-.209,.016,.021,.041,.02);if(p.outfit==='jacket')ell(elbow,shirt,0,-.10,0,.060,.126,.060);if(p.accessory==='watch'&&s<0){const band=mesh(elbow,new T.TorusGeometry(.050,.010,6,16),shoe,0,-.184,0);band.rotation.x=Math.PI/2;box(elbow,sole,0,-.184,.049,.048,.035,.012)}arms.push({a,elbow});
  const hip=joint(body,s*.10,.79,0),knee=joint(hip,0,-.345,0);
  ell(hip,pants,0,-.16,0,.086,.205,.086);ell(knee,pants,0,-.15,0,.069,.18,.071);ell(knee,shoe,0,-.342,.058,.075,.072,.136);box(knee,sole,0,-.389,.058,.143,.029,.205);for(let j=0;j<3;j++)box(knee,sole,0,-.316,.075+j*.025,.075,.006,.008);legs.push({hip,knee});
  bake(a);bake(elbow);bake(hip);bake(knee);
 }
 bake(head);bake(body);
 let phase=0,weight=0,clock=0;root.userData.rig='articulated-bones';
 return {root,update(state,dx,dz,moving,dt,action=null,motion={}){
  dt=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));root.position.set(state.x,state.height+.025,state.z);
  if(moving&&Math.hypot(dx,dz)>.001){const target=Math.atan2(dx,dz),delta=Math.atan2(Math.sin(target-root.rotation.y),Math.cos(target-root.rotation.y));root.rotation.y+=delta*(1-Math.exp(-dt*14));phase+=dt*(motion.run?14:9.5)}
  weight+=(Number(moving)-weight)*(1-Math.exp(-dt*12));const pose=poseFor(action),walk=pose==='idle'?weight:0;clock+=dt;const jump=Math.max(0,motion.jump||0),run=motion.run?1.28:1;
  body.rotation.x=pose==='sleep'?-Math.PI/2:0;body.rotation.z=walk*Math.sin(phase)*.035;body.position.y=pose==='sleep'?.31:pose==='sit'?-.32:Math.abs(Math.sin(phase))*walk*.034+(1-walk)*Math.sin(clock*2)*.006+jump;
  head.rotation.y=walk*Math.sin(phase*.5)*.055;
  for(let i=0;i<2;i++){const t=phase+i*Math.PI,s=Math.sin(t),{hip,knee}=legs[i],{a,elbow}=arms[i];hip.rotation.x=pose==='sit'?-Math.PI/2:walk*s*.51*run-jump*.6;knee.rotation.x=pose==='sit'?Math.PI/2:Math.max(0,-s)*walk*.65+jump*1.3;a.rotation.x=pose==='use'?-.82:pose==='sit'?-.35:-walk*s*.40*run-jump*.5;elbow.rotation.x=pose==='use'?-1.05:pose==='sit'?-.35:-.12-Math.max(0,s)*walk*.37;a.rotation.z=(i?1:-1)*.055}
 }};
}
