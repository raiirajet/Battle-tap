import * as T from 'three';
import {avatarMesh} from './valley-avatar.js';
import {RESIDENTS,CARS,residentAt,carAt} from './valley-town.js';
import {worldGround} from './valley-world-life.js';
import {disposeHouse} from './valley-house-render.js';
function carMesh(color){const root=new T.Group(),paint=new T.MeshStandardMaterial({color,roughness:.45}),glass=new T.MeshStandardMaterial({color:0x354b5d,roughness:.25}),rubber=new T.MeshStandardMaterial({color:0x222528}),light=new T.MeshBasicMaterial({color:0xffedbc}),rear=new T.MeshBasicMaterial({color:0xc93132});
function box(w,h,d,m,x,y,z){const q=new T.Mesh(new T.BoxGeometry(w,h,d),m);q.position.set(x,y,z);root.add(q)}
box(1.75,.54,4.15,paint,0,.65,0);box(1.48,.62,2.15,glass,0,1.17,-.18);box(1.52,.09,2.2,paint,0,1.51,-.18);for(const x of [-.65,.65]){box(.35,.18,.045,light,x,.72,2.09);box(.35,.16,.045,rear,x,.7,-2.09)}for(const x of [-.9,.9])for(const z of [-1.3,1.3]){const w=new T.Mesh(new T.CylinderGeometry(.35,.35,.22,14),rubber);w.rotation.z=Math.PI/2;w.position.set(x,.35,z);root.add(w)}return root}
export function townActors(scene,seed){const root=new T.Group();scene.add(root);const people=RESIDENTS.map(r=>({r,avatar:avatarMesh(r.profile)}));for(const p of people)root.add(p.avatar.root);const cars=CARS.map(c=>({c,mesh:carMesh(c.color)}));for(const c of cars)root.add(c.mesh);root.visible=false;return {show(on){root.visible=on},update(minute,dt){if(!root.visible)return;for(const {r,avatar} of people){const p=residentAt(r,minute);avatar.update({...p,height:worldGround(p.x,p.z,seed)},p.dx,p.dz,p.moving,dt)}for(const {c,mesh} of cars){const p=carAt(c,minute);mesh.position.set(p.x,worldGround(p.x,p.z,seed)+.12,p.z);mesh.rotation.y=Math.atan2(p.dx,p.dz)}},destroy(){disposeHouse(root)}}}
