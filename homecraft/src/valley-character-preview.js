import * as T from 'three';
import {avatarMesh} from './valley-avatar.js';
import {disposeHouse} from './valley-house-render.js';
export function characterPreview(host){
 const renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setSize(220,188,false);renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
 const scene=new T.Scene(),cam=new T.PerspectiveCamera(34,220/188,.1,20);cam.position.set(2.4,1.55,3.0);cam.lookAt(0,.86,0);scene.add(new T.HemisphereLight(0xfff6e5,0x7e8580,2.4));const sun=new T.DirectionalLight(0xffeddb,2.5);sun.position.set(3,5,4);scene.add(sun);host.replaceChildren(renderer.domElement);let actor=null,angle=.15;
 function render(){if(!actor)return;actor.root.rotation.y=angle;renderer.render(scene,cam)}
 function turn(e){angle+=e.deltaY*.005;render();e.preventDefault()}
 let pointer=null;function down(e){pointer=e.clientX;renderer.domElement.setPointerCapture(e.pointerId)}function move(e){if(pointer===null)return;angle+=(e.clientX-pointer)*.018;pointer=e.clientX;render()}function up(){pointer=null}
 const canvas=renderer.domElement;canvas.setAttribute('aria-label','Drehbare 3D-Charaktervorschau');canvas.addEventListener('wheel',turn,{passive:false});canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('lostpointercapture',up);
 return {update(p){disposeHouse(actor?.root);actor=avatarMesh(p);actor.update({x:0,z:0,height:0},0,0,false,0);scene.add(actor.root);render()},destroy(){disposeHouse(actor?.root);renderer.dispose();renderer.forceContextLoss();canvas.remove()}};
}
