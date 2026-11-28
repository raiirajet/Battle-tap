import * as T from 'three';
// Soft local contact shading, no dynamic light or shadow-map allocation.
export function contactPixels(size=32){const pixels=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const r=Math.hypot((x+.5-size/2)/(size/2),(y+.5-size/2)/(size/2)),i=(y*size+x)*4;pixels[i]=pixels[i+1]=pixels[i+2]=0;pixels[i+3]=Math.round(255*Math.max(0,1-r)**2)}return pixels}
export function characterContactShadow(scene){
 const map=new T.DataTexture(contactPixels(),32,32,T.RGBAFormat);map.needsUpdate=true;map.magFilter=T.LinearFilter;map.minFilter=T.LinearFilter;
 const material=new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,opacity:.32,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 const shadow=new T.Mesh(new T.PlaneGeometry(.9,.75),material);shadow.rotation.x=-Math.PI/2;shadow.visible=false;shadow.renderOrder=2;scene.add(shadow);
 return {update(state,{visible=true,jump=0,day=1,shadows=false}={}){shadow.visible=!!state&&visible;if(!shadow.visible)return;shadow.position.set(state.x,state.height+.045,state.z);const h=Math.max(0,Math.min(1,jump||0));shadow.scale.setScalar(1+h*.55);material.opacity=(shadows?.24:.43)*(.55+.45*Math.max(0,Math.min(1,day)))*(1-h*.65)},dispose(){shadow.removeFromParent();shadow.geometry.dispose();material.dispose();map.dispose()}};
}
