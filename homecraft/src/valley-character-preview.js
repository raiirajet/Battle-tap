import * as T from 'three';
import {avatarMesh} from './valley-avatar.js';
import {disposeHouse} from './valley-house-render.js';
export function characterPreview(host){
 const renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setSize(300,240,false);renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
 const scene=new T.Scene(),cam=new T.PerspectiveCamera(31,300/240,.1,20);cam.position.set(2.4,1.55,3.0);cam.lookAt(0,.86,0);scene.add(new T.HemisphereLight(0xfff6e5,0x7e8580,2.4));const sun=new T.DirectionalLight(0xffeddb,2.5);sun.position.set(3,5,4);scene.add(sun);const rim=new T.DirectionalLight(0xd1e6ff,1.45);rim.position.set(-2,2,-3);scene.add(rim);const zoom=document.createElement('button');zoom.type='button';zoom.textContent='Ansicht: Ganzkörper';zoom.onclick=()=>{view=(view+1)%3;zoom.textContent=['Ansicht: Ganzkörper','Ansicht: Gesicht','Ansicht: Hände'][view];render()};host.replaceChildren(renderer.domElement,zoom);let actor=null,angle=.15,view=0;
 function render(){if(!actor)return;if(view===1){cam.position.set(.12,1.57,.69);cam.lookAt(0,1.53,0)}else if(view===2){cam.position.set(.52,.78,.70);cam.lookAt(.21,.79,0)}else{cam.position.set(2.4,1.55,3.0);cam.lookAt(0,.86,0)}actor.root.rotation.y=angle;renderer.render(scene,cam)}
 function turn(e){view=e.deltaY<0?1:0;zoom.textContent=['Ansicht: Ganzkörper','Ansicht: Gesicht'][view];render();e.preventDefault()}
 let pointer=null;function down(e){pointer=e.clientX;renderer.domElement.setPointerCapture(e.pointerId)}function move(e){if(pointer===null)return;angle+=(e.clientX-pointer)*.018;pointer=e.clientX;render()}function up(){pointer=null}
 const canvas=renderer.domElement;canvas.setAttribute('aria-label','Drehbare 3D-Charaktervorschau');canvas.addEventListener('wheel',turn,{passive:false});canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('lostpointercapture',up);
 return {update(p){disposeHouse(actor?.root);actor=avatarMesh(p);actor.update({x:0,z:0,height:0},0,0,false,0);scene.add(actor.root);render()},destroy(){disposeHouse(actor?.root);renderer.dispose();renderer.forceContextLoss();canvas.remove();zoom.remove()}};
}
