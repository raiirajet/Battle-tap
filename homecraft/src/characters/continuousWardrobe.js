import * as T from 'three';
import {applyTextile,applySkinDetail} from '../valley-character-assets.js';
// One indexed, weighted surface for skin and garment regions, not independent rigid cylinders.
const longSleeves=new Set(['jacket','cardigan','hoodie','coat','blouse','pajamas']);
const smooth=(a,b,v)=>T.MathUtils.smoothstep(v,a,b);
export function sleeveEnd(outfit){return longSleeves.has(outfit)?.812:outfit==='casual'?.925:1.065}
export function garmentRegion(x,y,z,arm,profile){
 if(y>1.315)return 0;
 if(arm>.52&&y<1.17){return y>=sleeveEnd(profile.outfit)?1:0}
 if(y>=.866)return 1;
 if(y<.125&&profile.shoeStyle!=='sandal')return 3;
 if(profile.bottom==='shorts'&&y<.60)return 0;
 return 2;
}
function armInfluence(g,i,armBones){const idx=g.attributes.skinIndex,w=g.attributes.skinWeight;let sum=0;for(let k=0;k<4;k++){const j=idx.array[i*4+k];if(armBones.has(j))sum+=w.array[i*4+k]}return sum}
export function garmentGeometry(source,profile,boneNames){
 const base=source.attributes.position,normal=source.attributes.normal,colors=source.attributes.color,armBones=new Set(boneNames.flatMap((n,i)=>/UpperArm|Forearm|Hand|Digit/.test(n)?[i]:[])),regions=new Uint8Array(base.count),influences=new Float32Array(base.count),p=new Float32Array(base.array),c=new Float32Array(colors.array),groups=[[],[],[],[]];
 const style=profile.outfit,thick=['coat','hoodie','jacket','cardigan'].includes(style)?.021:.012;
 for(let i=0;i<base.count;i++){
  const x=base.getX(i),y=base.getY(i),z=base.getZ(i),arm=armInfluence(source,i,armBones),r=garmentRegion(x,y,z,arm,profile);regions[i]=r;influences[i]=arm;if(r!==1&&r!==2)continue;
  const angle=Math.atan2(x,z),waist=Math.exp(-(((y-.90)/.095)**2)),elbow=Math.exp(-(((y-1.0)/.075)**2))*arm,knee=Math.exp(-(((y-.45)/.075)**2)),ankle=Math.exp(-(((y-.17)/.065)**2));
  const fold=r===1?(.0035*waist*Math.sin(angle*7+y*38)+.004*elbow*Math.cos(y*128+angle*3)):(.004*knee*Math.sin(y*104+angle*4)+.0025*ankle*Math.sin(y*132+angle*3));
  const neckline=smooth(1.28,1.315,y),hem=r===1?1-smooth(.866,.89,y):0,cuff=arm>.52?1-smooth(sleeveEnd(style),sleeveEnd(style)+.035,y):0;
  const pad=r===1?(thick*(1-.45*neckline)+fold+.004*hem+.004*cuff):.012+fold;
  p[i*3]+=normal.getX(i)*pad;p[i*3+1]+=normal.getY(i)*pad;p[i*3+2]+=normal.getZ(i)*pad;
  const sideSeam=r===2?Math.exp(-(((Math.abs(x)-.156)/.006)**2)):.0,collar=r===1?Math.exp(-(((y-1.306)/.009)**2))*(1-arm):0;
  const fly=r===2&&z>.045?Math.exp(-((x/.009)**2))*Math.exp(-(((y-.805)/.055)**2)):0;
  const pocket=r===2&&z>.045?Math.exp(-(((Math.abs(x)-.075)/.03)**2))*Math.exp(-(((y-(.81-Math.abs(x)*.25))/.009)**2)):0;
  const shade=T.MathUtils.clamp(.98+fold*7-.075*sideSeam-.09*collar-.08*fly-.11*pocket,.75,1);
  c.set([shade,shade,shade],i*3)
 }
 for(let i=0;i<source.index.count;i+=3){const a=source.index.getX(i),b=source.index.getX(i+1),d=source.index.getX(i+2),x=(base.getX(a)+base.getX(b)+base.getX(d))/3,y=(base.getY(a)+base.getY(b)+base.getY(d))/3,z=(base.getZ(a)+base.getZ(b)+base.getZ(d))/3,arm=(influences[a]+influences[b]+influences[d])/3,r=garmentRegion(x,y,z,arm,profile);groups[r].push(a,b,d)}
 const g=new T.BufferGeometry();
 // All immutable skin weights and facial morph targets are retained; position/normal/colour are actor-specific.
 for(const [name,a] of Object.entries(source.attributes))if(!['position','normal','color'].includes(name))g.setAttribute(name,a.clone());
 g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('color',new T.BufferAttribute(c,3));
 g.setIndex(groups.slice(0,3).flat());let offset=0;for(let i=0;i<3;i++){g.addGroup(offset,groups[i].length,i);offset+=groups[i].length}
 g.morphAttributes.position=source.morphAttributes.position.map(a=>a.clone());g.morphTargetsRelative=source.morphTargetsRelative;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g
}
export function wardrobeMaterials(profile,detail){const skin=new T.MeshStandardMaterial({color:profile.skin,roughness:.73,vertexColors:true}),shirt=new T.MeshStandardMaterial({color:profile.shirt,roughness:.94,vertexColors:true}),pants=new T.MeshStandardMaterial({color:profile.pants,roughness:.92,vertexColors:true});applySkinDetail(skin,detail);applyTextile(shirt,profile.outfit==='cardigan'?'knit':profile.outfit==='jacket'?'denim':'cotton',detail);applyTextile(pants,profile.bottom==='jeans'?'denim':'cotton',detail);return [skin,shirt,pants]}
