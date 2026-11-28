import * as T from 'three';
import {seeded} from './assetRegistry.js';
// Folded leaf blades with a central raised vein; every blade has its own normal and colour.
export function leafSpray(center,radius,phase,level=0,needle=false){
 const random=seeded((Math.floor((phase+20)*10000)^Math.floor(center[1]*100000))>>>0),p=[],uv=[],colors=[],count=needle?(level===0?27:12):(level===0?22:9);
 const C=new T.Vector3(...center),up=new T.Vector3(0,1,0);
 for(let i=0;i<count;i++){
  const a=i*2.399+phase+random()*.35,b=random()*2-1,k=Math.sqrt(1-b*b),n=new T.Vector3(Math.cos(a)*k,b,Math.sin(a)*k),anchor=C.clone().addScaledVector(n,radius*(.52+random()*.60));
  const dir=n.clone().addScaledVector(up,.35-random()*.55).normalize(),side=new T.Vector3().crossVectors(dir,Math.abs(dir.y)>.94?new T.Vector3(1,0,0):up).normalize(),normal=new T.Vector3().crossVectors(side,dir).normalize();
  const len=radius*(needle?.68:.56)*(.6+random()*.65),w=len*(needle?.075:.31),tip=anchor.clone().addScaledVector(dir,len),mid=anchor.clone().addScaledVector(dir,len*.46),vein=mid.clone().addScaledVector(normal,w*.23),left=mid.clone().addScaledVector(side,w),right=mid.clone().addScaledVector(side,-w),shade=.71+random()*.29;
  const vertices=[anchor,left,vein,anchor,vein,right,left,tip,vein,vein,tip,right],tex=[[.5,0],[0,.46],[.5,.46],[.5,0],[.5,.46],[1,.46],[0,.46],[.5,1],[.5,.46],[.5,.46],[.5,1],[1,.46]];
  vertices.forEach((v,j)=>{p.push(v.x,v.y,v.z);uv.push(...tex[j]);const light=shade*(tex[j][1]===0?.70:tex[j][1]===1?1:.91);colors.push(light*.94,light,light*.87)})
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g
}
export function foliageLight(material){material.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>','outgoingLight += diffuseColor.rgb * 0.075 * (1.0 - clamp(roughnessFactor,0.0,1.0)*0.35);\n#include <opaque_fragment>')};material.customProgramCacheKey=()=> 'foliage-soft-transmission-v1';return material}
