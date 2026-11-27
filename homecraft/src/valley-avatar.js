import {wardrobeLayers} from './valley-wardrobe.js';
import {bodyShape} from './valley-body-shape.js';
import {characterSeed} from './valley-character-motion.js';
import {toonAvatar} from './valley-toon.js';
import {sideKey} from './valley-rig-spec.js';
import {getValleyRig,attachValleyRig,preloadValleyRig} from './valley-rig-runtime.js';
import {applyTextile,shoeAsset,applySkinDetail} from './valley-character-assets.js';
import * as T from 'three';
import {profile,poseFor} from './valley-world-life.js';
import {material,mesh,ell,box,bake} from './valley-realism.js';
import {silhouette,curveDetail,makeHand,makeFace,makeHair,garment} from './valley-character-model.js';
function joint(parent,x,y,z){const b=new T.Bone();b.position.set(x,y,z);parent.add(b);return b}
export function avatarMesh(input,{detail=true}={}){
 const p=profile(input);if(p.style==='cartoon')return toonAvatar(p,{detail});const root=new T.Group(),body=joint(root,0,0,0);body.name='ValleyBody';root.userData.expressionSeed=characterSeed([p.skin,p.hair,p.shirt,p.eyes,p.face].join('|'));
 const skin=material(p.skin,{roughness:.65}),shirt=material(p.shirt),pants=material(p.pants,{roughness:.96}),shoe=material({dark:0x292c30,white:0xe5e4dd,brown:0x6c4a37}[p.shoes]),sole=material(0x4a4945),hair=material(p.hair),seam=material(new T.Color(p.shirt).multiplyScalar(.76)),denim=material(new T.Color(p.pants).multiplyScalar(.78));
 applySkinDetail(skin,detail);skin.userData.valleyLegacySkin=true;body.scale.set(...bodyShape(p.build));applyTextile(shirt,p.outfit==='cardigan'?'knit':p.outfit==='jacket'?'denim':'cotton',detail);applyTextile(pants,p.bottom==='jeans'?'denim':'cotton',detail);applyTextile(shoe,'leather',detail);
 mesh(body,silhouette([[.73,.13,.093],[.81,.166,.112],[.88,.151,.105],[.96,.135,.095]],20),pants);
 garment(body,shirt,seam,p,detail);mesh(body,silhouette([[1.30,.066,.064],[1.39,.059,.059],[1.45,.056,.053]],20),skin);
 const head=joint(body,0,1.53,0);head.name='ValleyHead';const face=makeFace(head,p,skin,hair,detail),hairstyle=makeHair(head,p,hair,detail);
 const wardrobe=wardrobeLayers(body,head,p,detail);const arms=[],legs=[];
 for(const s of [-1,1]){
 const k=sideKey(s),a=joint(body,s*.195,1.25,0),elbow=joint(a,0,-.25,0);a.name=k+'UpperArm';elbow.name=k+'Forearm';
 mesh(a,silhouette([[-.26,.047,.043],[-.19,.055,.052],[-.09,.067,.065],[.00,.063,.060],[.04,.039,.041]],20),shirt);
 const long=['jacket','cardigan','hoodie','coat','blouse','pajamas'].includes(p.outfit);mesh(elbow,silhouette([[-.205,.024,.023],[-.16,.035,.033],[-.08,.043,.042],[0,.045,.044]],20),long?shirt:skin);
 if(long){mesh(elbow,silhouette([[-.207,.030,.028],[-.175,.034,.031]],16),seam);if(detail)for(let j=0;j<3;j++){const y=-.09-j*.022;curveDetail(elbow,seam,[[-.028,y,.030],[0,y+.008,.041],[.030,y,.025]],.0015,8)}}
 else mesh(a,silhouette([[-.252,.046,.045],[-.219,.051,.048]],16),seam);
 const hand=makeHand(elbow,skin,s,detail);if(p.accessory==='watch'&&s<0){const band=mesh(elbow,new T.TorusGeometry(.032,.006,6,16),shoe,0,-.168,0);band.rotation.x=Math.PI/2;box(elbow,sole,0,-.168,.030,.035,.031,.009)}arms.push({a,elbow,hand});
 const hip=joint(body,s*.095,.79,0),knee=joint(hip,0,-.345,0);hip.name=k+'Thigh';knee.name=k+'Shin';
 const shorts=p.bottom==='shorts',joggers=p.bottom==='joggers',chinos=p.bottom==='chinos',legMat=shorts?skin:pants;mesh(hip,silhouette([[-.35,joggers?.065:.058,.058],[-.26,joggers?.078:.065,.064],[-.14,joggers?.090:.081,.076],[-.055,chinos?.083:.088,.084],[.05,.074,.080]],22),shorts?skin:pants);if(shorts)mesh(hip,silhouette([[-.19,.082,.079],[-.10,.085,.082],[.05,.080,.084]],22),pants);
 mesh(knee,silhouette([[-.315,joggers?.043:chinos?.054:.047,.043],[-.24,joggers?.067:chinos?.059:.051,.047],[-.14,joggers?.074:.065,.061],[-.04,.063,.058],[.02,.058,.058]],20),legMat);
 if(joggers)mesh(knee,silhouette([[-.315,.046,.045],[-.285,.052,.049]],16),denim);if(!shorts){curveDetail(hip,denim,[[s*.073,.025,.048],[s*.079,-.14,.043],[s*.052,-.34,.031]],.003);
 curveDetail(knee,denim,[[s*.056,-.02,.025],[s*.059,-.15,.022],[s*.043,-.30,.016]],.0027);
 if(chinos)curveDetail(knee,denim,[[0,-.025,.056],[0,-.16,.062],[0,-.29,.043]],.0021);for(let j=0;j<3;j++)curveDetail(knee,denim,[[s*.052,-.08-j*.023,.035],[0,-.065-j*.023,.061],[-s*.034,-.08-j*.023,.043]], .0024);}
 if(detail&&!shorts&&p.bottom==='jeans'){
 const pocket=material(new T.Color(p.pants).lerp(new T.Color(0x88765e),.15),{roughness:.90});
 // Rounded cargo pocket flap and topstitching follow the thigh.
 ell(hip,pocket,s*.055,-.153,.061,.038,.025,.012);
 curveDetail(hip,denim,[[s*.025,-.162,.075],[s*.047,-.178,.076],[s*.073,-.163,.066]],.0016,10);
 }
 shoeAsset(knee,p.shoeStyle,shoe,sole,skin,detail); legs.push({hip,knee});
 bake(a);bake(elbow);bake(hip);bake(knee);
 }
 if(p.bottom==='shorts')denim.dispose();bake(body);root.userData.rig='articulated-bones';root.userData.style='semi-realistic-anime';root.userData.hands=arms.map(a=>a.hand.hand);
 let phase=0,weight=0,clock=0,glb=null;const legacySkin=[];root.traverse(o=>{if(o.isMesh&&(o.material===skin&&o.parent!==head||o.material?.userData?.valleyFace))legacySkin.push(o)});function useRig(src){if(src&&!glb&&!root.userData.disposed){glb=attachValleyRig(root,src,p,legacySkin);if(glb)root.userData.disposeRig=()=>glb.dispose()}}if(typeof document!=='undefined'){const src=getValleyRig(detail);if(src)useRig(src);else preloadValleyRig(detail).then(useRig)}
 return {root,update(state,dx,dz,moving,dt,action=null,motion={}){
 dt=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));root.position.set(state.x,state.height+.025,state.z);
 if(moving&&Math.hypot(dx,dz)>.001){const target=Math.atan2(dx,dz),delta=Math.atan2(Math.sin(target-root.rotation.y),Math.cos(target-root.rotation.y));root.rotation.y+=delta*(1-Math.exp(-dt*14));phase+=dt*(motion.run?14:9.5)}
 weight+=(Number(moving)-weight)*(1-Math.exp(-dt*12));const pose=poseFor(action),walk=pose==='idle'?weight:0;clock+=dt;const jump=Math.max(0,motion.jump||0),run=motion.run?1.28:1;
 body.rotation.x=pose==='sleep'?-Math.PI/2:0;body.rotation.z=walk*Math.sin(phase)*.027;body.position.y=pose==='sleep'?.31:pose==='sit'?-.32:Math.abs(Math.sin(phase))*walk*.034+(1-walk)*Math.sin(clock*2)*.006+jump;
 head.rotation.y=walk*Math.sin(phase*.5)*.045;face.update(clock,{pose,jump,moving,seed:root.userData.expressionSeed});hairstyle.update(clock,walk);
 for(let i=0;i<2;i++){const t=phase+i*Math.PI,s=Math.sin(t),{hip,knee}=legs[i],{a,elbow,hand}=arms[i];hip.rotation.x=pose==='sit'?-Math.PI/2:walk*s*.51*run-jump*.6;knee.rotation.x=pose==='sit'?Math.PI/2:Math.max(0,-s)*walk*.65+jump*1.3;a.rotation.x=pose==='use'?-.82:pose==='sit'?-.35:-walk*s*.40*run-jump*.5;elbow.rotation.x=pose==='use'?-1.05:pose==='sit'?-.35:-.12-Math.max(0,s)*walk*.37;a.rotation.z=(i?1:-1)*.055;hand.update(pose==='use'?.78:pose==='sit'?.22:.16+walk*(motion.run?.48:.16),t)}glb?.update(dt,{moving,run:motion.run,jump,pose});
 }};
}
