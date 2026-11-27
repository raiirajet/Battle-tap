import * as T from 'three';
import {material,box,ell,mesh,bake} from './valley-realism.js';
// Decoration is bounded by the original catalog dimensions. No new physics or save data.
export function interiorDetail(o){
 const {width:w,height:h,depth:d,kind}=o;if(![w,h,d].every(v=>Number.isFinite(v)&&v>0))return null;
 const g=new T.Group(),metal=material(0x9ba2a4,{metalness:.72,roughness:.27}),black=material(0x252a2e),cream=material(0xe6ddd0),wood=material(0x8c6d51),cloth=material(0xa69a8d),screen=material(0x223746,{emissive:0x315974,emissiveIntensity:.3});
 const b=(m,x,y,z,a,e,f)=>box(g,m,x*w,y*h,z*d,a*w,e*h,f*d);
 const e=(m,x,y,z,a,e,f)=>ell(g,m,x*w,y*h,z*d,a*w,e*h,f*d);
 if(['sofa','armchair','cornerSofa','bed','single'].includes(kind)){
  const bed=kind==='bed'||kind==='single';const y=bed?.56:.43;
  for(const x of [-.31,.31]){b(cloth,x,y,-.10,.22,.035,.5);b(cream,x,y+.025,-.20,.19,.04,.22)}
  for(let i=0;i<7;i++)b(cloth,-.36+i*.12,y+.045,.26,.08,.012,.18);
 }else if(['fridge','oven','washer','dishwasher','microwave'].includes(kind)){
  for(let i=0;i<5;i++)b(black,-.23+i*.11,.84,.49,.065,.025,.014);
  b(screen,.12,.9,.49,.22,.08,.015);b(metal,.32,.60,.49,.035,.26,.015);
  if(kind==='fridge')b(black,0,.34,.49,.94,.015,.012);
 }else if(['kitchen','sink','basin','island','hob'].includes(kind)){
  for(const x of [-.25,.25]){b(metal,x,.65,.49,.24,.025,.018);b(black,x,.43,.49,.42,.010,.01)}
  if(kind==='sink'||kind==='basin'){b(metal,0,.96,-.20,.20,.055,.24);e(black,0,.97,-.20,.063,.012,.063)}
  else if(kind==='hob'){for(const x of [-.23,.23])for(const z of [-.23,.23]){const ring=mesh(g,new T.TorusGeometry(Math.min(w,d)*.13,.006,6,24),metal,x*w,h*.99,z*d);ring.rotation.x=-Math.PI/2}}
 }else if(['toilet','bath','shower','showerGlass'].includes(kind)){
  if(kind==='toilet')b(metal,0,.98,-.24,.18,.025,.12);
  else if(kind==='bath'){b(metal,0,.96,-.43,.25,.035,.06);b(black,0,.08,-.23,.09,.012,.09)}
  else{b(metal,-.43,.60,-.43,.04,.45,.04);b(metal,-.40,.83,-.30,.12,.025,.16);b(metal,-.42,.39,-.42,.10,.05,.10)}
 }else if(['desk','table','coffee'].includes(kind)){
  b(wood,.25,.972,-.20,.23,.035,.23);b(cream,.25,.99,-.20,.19,.012,.19);
  b(black,-.23,.97,-.20,.20,.04,.11);
 }else if(['bookcase','shelf','dresser','upper'].includes(kind)){
  for(let i=0;i<4;i++)b(metal,.0,.16+i*.20,.49,.25,.025,.012);
 }else return null;
 // Dispose materials not referenced by generated meshes.
 const used=new Set(g.children.map(o=>o.material));for(const m of [metal,black,cream,wood,cloth,screen])if(!used.has(m))m.dispose();
 bake(g);g.userData.interiorDetail=true;return g;
}
export function enrichInterior(root,project,quality){if(quality==='low')return 0;const items=new Map(project.levels.flatMap(l=>l.objects.map(o=>[o.id,o]))),targets=[];root.traverse(n=>{if(n.userData.objectId&&items.has(n.userData.objectId))targets.push(n)});let count=0;for(const target of targets){const item=items.get(target.userData.objectId);if(item.hidden||item.modelData||item.modelId)continue;const detail=interiorDetail(item);if(detail){target.add(detail);count++}}return count}
