import * as T from 'three';
const smooth=t=>t*t*(3-2*t),mix=(a,b,t)=>a+(b-a)*t,clamp=T.MathUtils.clamp;
function hash(x,y,seed){let h=Math.imul(x+seed,374761393)+Math.imul(y,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295}
export function tileNoise(u,v,period,seed=7){let x=u*period,y=v*period,i=Math.floor(x),j=Math.floor(y),a=smooth(x-i),b=smooth(y-j),wrap=n=>((n%period)+period)%period;let h=(p,q)=>hash(wrap(p),wrap(q),seed);return mix(mix(h(i,j),h(i+1,j),a),mix(h(i,j+1),h(i+1,j+1),a),b)}
export function surfaceMaps(kind='grass',size=128){
 if(!Number.isInteger(size)||size<16||size>1024)throw RangeError('Texture size');
 const height=new Float32Array(size*size),rgba=new Uint8Array(size*size*4),normal=new Uint8Array(rgba.length),rough=new Uint8Array(rgba.length),at=(x,y)=>((y+size)%size)*size+(x+size)%size;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){let u=x/size,v=y/size,a=tileNoise(u,v,4,13),b=tileNoise(u,v,16,29),c=tileNoise(u,v,64,51),grain=hash(x,y,41)-.5;
 let h=.46+.18*a+.15*b+.10*c+grain*.09;
 if(kind==='grass')h=.32+.23*a+.17*b+.12*c+grain*.10;
 if(kind==='asphalt')h=.44+.08*a+.12*c+grain*.24;
 if(kind==='plaster')h=.48+.06*b+.07*c+grain*.11;
 if(kind==='bark')h=.44+.22*Math.sin(u*Math.PI*2*14+Math.sin(v*Math.PI*4)*.8)+.10*c+grain*.08;
 if(kind==='roof'||kind==='stone'){let rows=kind==='roof'?12:8,cols=kind==='roof'?10:6,r=v*rows,col=u*cols+(Math.floor(r)%2)*.5,edge=Math.min(r%1,1-r%1,col%1,1-col%1);h=edge<.035?.23:.55+.13*b+.10*c+grain*.04}
 if(kind==='wood')h=.48+.18*Math.sin(u*Math.PI*2*18+Math.sin(v*Math.PI*4)*.5)+.09*b;
 height[at(x,y)]=h}
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const k=at(x,y)*4,h=height[at(x,y)],dx=(height[at(x-1,y)]-height[at(x+1,y)])*1.9,dy=(height[at(x,y-1)]-height[at(x,y+1)])*1.9,n=Math.hypot(dx,dy,1),g=Math.round(clamp(.72+h*.34,0,1)*255);
 rgba.set(kind==='grass'?[Math.min(255,g+3),g,Math.round(g*.88),255]:kind==='stone'?[g,Math.round(g*.96),Math.round(g*.88),255]:[g,g,g,255],k);normal.set([Math.round(127.5+127.5*dx/n),Math.round(127.5+127.5*dy/n),Math.round(127.5+127.5/n),255],k);let r=Math.round(clamp((kind==='roof'?.72:kind==='stone'?.83:.91)+(h-.5)*.28,0,1)*255);rough.set([r,r,r,255],k)}
 function tex(data,color=false){let t=new T.DataTexture(data,size,size,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.generateMipmaps=true;t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;t.needsUpdate=true;return t}
 return {map:tex(rgba,true),normalMap:tex(normal),roughnessMap:tex(rough)}
}
