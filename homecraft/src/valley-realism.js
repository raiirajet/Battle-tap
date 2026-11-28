import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// All geometry is local, offline, and in metres. No external asset dependencies.
export const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.78,...extra});
export function mesh(parent,geometry,mat,x=0,y=0,z=0){const o=new T.Mesh(geometry,mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
export function ell(parent,mat,x,y,z,w,h,d){const o=mesh(parent,new T.SphereGeometry(1,16,12),mat,x,y,z);o.scale.set(w,h,d);return o}
export function box(parent,mat,x,y,z,w,h,d){return mesh(parent,new T.BoxGeometry(w,h,d),mat,x,y,z)}
export function joint(parent,x,y,z){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g}
// Bake only immediate static meshes by material; articulated child groups stay movable.
export function bake(parent){const buckets=new Map();for(const m of [...parent.children])if(m.isMesh&&!Array.isArray(m.material)){m.updateMatrix();const g=m.geometry.clone().applyMatrix4(m.matrix);const n=g.index?g.toNonIndexed():g;if(n!==g)g.dispose();if(!buckets.has(m.material))buckets.set(m.material,[]);buckets.get(m.material).push(n);m.geometry.dispose();parent.remove(m)}for(const [m,gs] of buckets){const g=mergeGeometries(gs);gs.forEach(x=>x.dispose());if(!g)throw Error('Incompatible model geometry');mesh(parent,g,m)}return parent}
export function loft(sections){const size=sections[0].ring.length,positions=[],indices=[],uv=[];for(let i=0;i<sections.length;i++){const {z,ring}=sections[i];for(let j=0;j<size;j++){const [x,y]=ring[j];positions.push(x,y,z);uv.push(j/size,i/(sections.length-1))}}for(let i=0;i<sections.length-1;i++)for(let j=0;j<size;j++){const a=i*size+j,b=i*size+(j+1)%size,c=a+size,d=b+size;indices.push(a,b,d,a,d,c)}for(let j=1;j<size-1;j++){indices.push(0,j+1,j);const k=(sections.length-1)*size;indices.push(k,k+j,k+j+1)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g}
export function gableGeometry(w,d,h){const ring=[[-w/2,0],[w/2,0],[w/2,.12],[0,h],[-w/2,.12]];return loft([{z:-d/2,ring},{z:d/2,ring}])}
export function crownGeometry(type){
 const layers=[];
 // Spruce boughs overlap; broadleaf crowns have irregular lobes at different depths.
 const layer=(x,y,z,width,height,depth,phase,tint)=>{
  const g=new T.SphereGeometry(1,8,5);
  const position=g.attributes.position,colors=[];
  for(let i=0;i<position.count;i++){
   const px=position.getX(i),py=position.getY(i),pz=position.getZ(i);
   const uneven=1+.12*Math.sin(px*7+py*4+phase)*Math.cos(pz*6-py*3);
   const light=tint*(.83+.19*(py+1)*.5+.07*Math.sin(px*4+pz*5+phase));
   position.setXYZ(i,px*uneven,py*uneven,pz*uneven);
   colors.push(light*.97,light,light*.94);
  }
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  g.rotateY(phase);
  g.scale(width,height,depth);
  g.translate(x,y,z);
  layers.push(g);
 };
 if(type===0){
  for(let j=0;j<5;j++){
   const y=-.55+j*.32,r=.8-j*.135;
   layer(Math.sin(j*2.4)*.09,y,Math.cos(j*2.4)*.08,r,.36,r*.85,j*.9,.76+j*.065);
  }
 }else{
  const tall=type===1?1:.76;
  layer(0,.03,0,.66,.66*tall,.66,0,.75);
  for(let j=0;j<7;j++){
   const a=j*2.4+type,y=(-.32+(j%4)*.22)*tall,s=.31+(j%3)*.065;
   const r=.46+(j%3)*.04;
   layer(Math.cos(a)*r,y,Math.sin(a)*r,s,s*tall,s*.87,a,.81+(j%4)*.08);
  }
  layer(-.10,.65*tall,.12,.38,.35*tall,.35,1.4,1.04);
 }
 const g=mergeGeometries(layers);
 layers.forEach(part=>part.dispose());
 return g;
}
// Periodic colour variation; tileable offline ground/albedo maps.
export function surfaceTexture(kind='grass',size=64){const bytes=new Uint8Array(size*size*4);let seed=827;for(let y=0;y<size;y++)for(let x=0;x<size;x++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const u=x/size*Math.PI*2,v=y/size*Math.PI*2,n=(seed/4294967296-.5),wave=Math.sin(u*5+v*3)*.5+Math.cos(v*9-u*2)*.3;const k=kind==='grass'?218+n*47+wave*20:kind==='roof'?205+n*25-((y%16)<2?39:0)-((x+(Math.floor(y/16)%2)*8)%16<1?20:0):222+n*36+wave*8;const i=(y*size+x)*4;bytes[i]=bytes[i+1]=bytes[i+2]=Math.max(0,Math.min(255,Math.round(k)));bytes[i+3]=255}const t=new T.DataTexture(bytes,size,size,T.RGBAFormat);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t}
export function facadeDetail(root,h){const frame=material(0xe4ded1),glass=material(0x7194aa,{roughness:.22,metalness:.12}),trim=material(0x474a49),base=material(0x8a8374);const x=h.x,z=h.z,w=h.w,d=h.d;
// Details remain on the existing footprint; never add navigation obstacles.
for(const side of [-1,1]){for(const dx of [-w*.29,w*.29]){box(root,frame,x+dx,1.96,z+side*(d/2+.016),1.65,1.4,.045);box(root,glass,x+dx,1.96,z+side*(d/2+.047),1.43,1.18,.025);box(root,frame,x+dx,1.96,z+side*(d/2+.069),.055,1.18,.025);box(root,frame,x+dx,1.96,z+side*(d/2+.069),1.43,.055,.025)}box(root,base,x,.22,z+side*(d/2+.01),w,.36,.025);box(root,trim,x,3.43,z+side*(d/2+.02),w,.12,.05)}
for(const dz of [-3,3]){box(root,frame,x+w/2+.083,2.04,z+dz,.04,1.32,2.02);box(root,glass,x+w/2+.109,2.04,z+dz,.025,1.09,1.77);box(root,frame,x+w/2+.129,2.04,z+dz,.025,1.09,.055)}
box(root,frame,x+w/2+.10,1.16,z,.045,2.32,1.36);box(root,trim,x+w/2+.13,1.15,z,.03,2.18,1.13);box(root,frame,x+w/2+.153,1.10,z+.36,.035,.05,.16);
box(root,base,x-w*.27,4.58,z-d*.23,.56,1.46,.65);box(root,trim,x-w*.27,5.32,z-d*.23,.68,.12,.78);return bake(root)}
