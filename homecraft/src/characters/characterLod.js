import * as T from 'three';
import {avatarMesh} from '../valley-avatar.js';
import {profile} from '../valley-world-life.js';
import {disposeHouse} from '../valley-house-render.js';
export function characterLevel(distance,quality='medium',previous=1){if(!Number.isFinite(distance))return 1;const near=quality==='ultra'?23:quality==='high'?18:quality==='medium'?12:0,far=quality==='low'?22:quality==='medium'?38:55;
 if(previous===0&&near>0&&distance<near+2)return 0;
 if(previous===2&&distance>far-4)return 2;
 if(near>0&&distance<near-1)return 0;return distance>far+2?2:1}
function farAvatar(input){const p=profile(input),root=new T.Group(),body=new T.Group();root.add(body);const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.85}),skin=mat(p.skin),shirt=mat(p.shirt),pants=mat(p.pants),hair=mat(p.hair),shoe=mat(p.shoes==='white'?0xe5e4dd:p.shoes==='brown'?0x6c4a37:0x292c30);
 function oval(parent,m,x,y,z,w,h,d){const o=new T.Mesh(new T.SphereGeometry(1,8,6),m);o.position.set(x,y,z);o.scale.set(w,h,d);o.receiveShadow=true;parent.add(o);return o}
 oval(body,shirt,0,1.08,0,.18,.29,.10);oval(body,pants,0,.82,0,.15,.14,.10);oval(body,skin,0,1.39,0,.055,.075,.05);oval(body,skin,0,1.53,0,.107,.145,.097);oval(body,hair,0,1.59,-.025,.114,.105,.105);if(['long','ponytail','bob'].includes(p.hairStyle))oval(body,hair,0,1.43,-.07,.113,.17,.056);
 const arms=[],legs=[];for(const s of [-1,1]){const a=new T.Group();a.position.set(s*.195,1.25,0);body.add(a);oval(a,shirt,0,-.12,0,.048,.15,.048);oval(a,skin,0,-.34,0,.038,.12,.034);oval(a,skin,0,-.45,0,.029,.05,.024);arms.push(a);const leg=new T.Group();leg.position.set(s*.095,.79,0);body.add(leg);oval(leg,pants,0,-.33,0,.067,.34,.063);oval(leg,shoe,0,-.73,.035,.068,.055,.115);legs.push(leg)}
 let phase=0;return {root,update(_s,_x,_z,moving,dt,_action,motion={}){phase+=dt*(motion.run?13:8);for(let i=0;i<2;i++){const swing=moving?Math.sin(phase+i*Math.PI)*.43:0;legs[i].rotation.x=swing;arms[i].rotation.x=-swing*.7}body.position.y=moving?Math.abs(Math.sin(phase))*.016:0}}
}
// Keep a single transform and only instantiate near/middle meshes when needed.
// No changes to resident position, schedule, profile or ownership rules.
export function createCharacterLOD(input,{identity='',factory=avatarMesh}={}){
 const root=new T.LOD();root.autoUpdate=false;const slots=[new T.Group(),new T.Group(),new T.Group()],actors=[null,null,farAvatar(input)];slots[2].add(actors[2].root);for(let i=0;i<3;i++)root.addLevel(slots[i],[0,14,40][i],.12);
 let level=2,disposed=false;root.userData.characterLOD=2;root.userData.style=profile(input).style;
 function select(next){if(disposed)return;if(!actors[next]){actors[next]=factory(input,{detail:next===0,identity});slots[next].add(actors[next].root)}level=next;root.userData.characterLOD=next;slots.forEach((s,i)=>s.visible=i===next)}
 select(2);
 return {root,setDistance(distance,quality){select(characterLevel(distance,quality,level))},forceNear(){select(0)},update(state,dx,dz,moving,dt,action=null,motion={}){root.position.set(state.x,state.height,state.z);if(moving&&Math.hypot(dx,dz)>.001){const yaw=Math.atan2(dx,dz),d=yaw-root.rotation.y;root.rotation.y+=Math.atan2(Math.sin(d),Math.cos(d))*(1-Math.exp(-dt*14))}const a=actors[level];a.update({x:0,z:0,height:0},0,1,moving,dt,action,motion);a.root.rotation.y=0;a.root.traverse(o=>{if(o.isMesh)o.castShadow=level<2})},dispose(){if(disposed)return;disposed=true;disposeHouse(root)}};
}
