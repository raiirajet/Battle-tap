import * as T from 'three';
import {guestPositionAllowed} from './valley-access.js';
import {avatarMesh} from './valley-avatar.js';
import {RESIDENTS} from './valley-town.js';
import {familyPosition,ageLabel} from './valley-family.js';
import {worldGround} from './valley-world-life.js';
import {disposeHouse} from './valley-house-render.js';
import {material,ell,mesh,joint,bake} from './valley-realism.js';
export function petMesh(kind){
 const cat=kind==='cat',root=new T.Group(),body=joint(root,0,0,0),fur=material(cat?0xc8aa8a:0x96603b),dark=material(0x49362d),cream=material(0xe8d7bb),eyes=material(cat?0x7d924b:0x664632),nose=material(0x382a2b),pink=material(0xb47a70);
 root.scale.setScalar(cat?.75:1.15);
 ell(body,fur,0,.39,0,.19,.20,.39);ell(body,fur,0,.41,.24,.18,.22,.18);ell(body,cream,0,.32,.24,.145,.16,.14);ell(body,fur,0,.39,-.26,.18,.2,.19);
 const head=joint(body,0,.52,.36);ell(head,fur,0,0,0,.16,.145,.15);ell(head,cream,0,-.049,.115,.107,.075,cat?.078:.135);ell(head,nose,0,-.035,cat?.177:.235,.047,.030,.027);
 for(const s of [-1,1]){ell(head,eyes,s*.083,.042,.117,.029,.028,.023);ell(head,nose,s*.083,.042,.138,cat?.008:.014,.019,.008);if(cat){const e=mesh(head,new T.ConeGeometry(.075,.18,4),fur,s*.104,.164,-.014);e.rotation.z=-s*.18;ell(head,pink,s*.102,.15,.035,.039,.058,.014);for(let i=0;i<3;i++){const o=mesh(head,new T.CylinderGeometry(.0025,.0025,.18,5),cream,s*.155,-.054+i*.022,.126);o.rotation.z=Math.PI/2+s*(i-1)*.14}}else ell(head,dark,s*.16,-.016,-.025,.064,.15,.065)}
 if(!cat){const collar=mesh(body,new T.TorusGeometry(.143,.017,8,20),material(0x2d7a86),0,.46,.265);ell(body,material(0xd2ae59),0,.34,.385,.033,.04,.018)}
 const legs=[];for(const s of [-1,1])for(const z of [-.25,.25]){const g=joint(body,s*.132,.33,z),k=joint(g,0,-.15,0);ell(g,fur,0,-.065,0,.063,.113,.065);ell(k,fur,0,-.082,0,.043,.112,.047);ell(k,cream,0,-.154,.034,.063,.043,.084);bake(g);bake(k);legs.push({g,k,sign:(s*(z<0?-1:1))})}
 const tail=joint(body,0,.43,-.32),mid=joint(tail,0,.13,-.16);const t=ell(tail,fur,0,.067,-.08,.043,.043,.115);t.rotation.x=.7;const tip=ell(mid,cat?dark:fur,0,.09,-.12,.038,.038,.15);tip.rotation.x=.6;bake(tail);bake(mid);bake(head);bake(body);
 return {root,update(p,phase,angle){root.position.set(p.x,p.height,p.z);root.rotation.y=angle;body.position.y=Math.abs(Math.sin(phase))*.016;for(const {g,k,sign} of legs){const step=Math.sin(phase)*sign;g.rotation.x=step*.32;k.rotation.x=Math.max(0,-step)*.35}tail.rotation.y=Math.sin(phase*.8)*.48;mid.rotation.y=Math.sin(phase*.8-.5)*.24;head.rotation.y=Math.sin(phase*.22)*.09}};
}
export function familyActors(scene,seed){const root=new T.Group();scene.add(root);const actors=new Map();return {update(save,needs,dt){const members=save.life?.family?.members||[];for(const [id,a] of actors)if(!members.some(m=>m.id===id)){disposeHouse(a.root);actors.delete(id)}for(const [i,m] of members.entries()){let a=actors.get(m.id);if(!a){a=m.kind==='cat'||m.kind==='dog'?petMesh(m.kind):avatarMesh(m.kind==='partner'?RESIDENTS.find(r=>r.id===m.id)?.profile:undefined,{detail:false});actors.set(m.id,a);root.add(a.root)}const p=familyPosition(save.plotId,i),phase=needs.minute*.045+i*1.7,r=m.kind==='cat'||m.kind==='dog'?.45:.24,angle=phase+Math.PI/2,x=p.x+Math.cos(phase)*r,z=p.z+Math.sin(phase)*r,state=guestPositionAllowed(save,'household:'+m.id,x,z)?{x,z,height:worldGround(x,z,seed)}:{x,z:save.rect.z-2,height:worldGround(x,save.rect.z-2,seed)};if(m.kind==='cat'||m.kind==='dog')a.update(state,phase*4,angle);else{const scale=m.kind==='partner'?1:ageLabel(m,needs.day)==='Kleinkind'?.50:ageLabel(m,needs.day)==='Kind'?.68:.85;a.root.scale.setScalar(scale);a.update(state,-Math.sin(phase),Math.cos(phase),dt>0,dt)}}root.visible=true},hide(){root.visible=false},destroy(){disposeHouse(root);actors.clear()}}}
