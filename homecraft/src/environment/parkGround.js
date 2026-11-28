import * as T from 'three';
import {seeded} from './assetRegistry.js';
export function grassClump(variant=0,level=0){
 const rand=seeded(448+variant*103),p=[],uv=[],colors=[],count=[13,8,4][level],steps=[4,3,2][level];
 for(let k=0;k<count;k++){let a=k*2.399+rand()*.7,dx=Math.cos(a),dz=Math.sin(a),h=.12+rand()*.23,w=.004+rand()*.008,lean=.045+rand()*.12,ox=(rand()-.5)*.13,oz=(rand()-.5)*.13;
 const pt=(t,s)=>[ox+dx*lean*t*t+dz*w*(1-t)*s,h*t,oz+dz*lean*t*t-dx*w*(1-t)*s];
 const put=(t,s)=>{p.push(...pt(t,s));uv.push((s+1)/2,t);let light=.50+t*.50;colors.push(light*.94,light,light*.91)};
 for(let j=0;j<steps;j++){let t=j/steps,u=(j+1)/steps;put(t,-1);put(t,1);put(u,j===steps-1?0:1);if(j!==steps-1){put(t,-1);put(u,1);put(u,-1)}}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();g.computeBoundingSphere();g.boundingSphere.radius+=.25;return g
}
export function groundColor(x,z){const a=Math.sin(x*.071+z*.09)*Math.sin(z*.133-x*.029),b=Math.cos(x*.31-z*.16),v=.55*a+.25*b;return new T.Color().setHSL(.247+v*.04,.34+v*.13,.39+v*.075)}
export function windMaterial(material,wind,time){
 material.onBeforeCompile=s=>{s.uniforms.parkWind=wind;s.uniforms.parkTime=time;s.vertexShader='uniform float parkWind; uniform float parkTime;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING\n float ph=parkTime*2.0+instanceMatrix[3].x*.73+instanceMatrix[3].z*.51; transformed.x += sin(ph)*position.y*position.y*(.6+parkWind); transformed.z += cos(ph*.73)*position.y*position.y*.32*(.6+parkWind);\n#endif')};material.customProgramCacheKey=()=> 'park-wind-v2';return material
}
