import {deflateSync} from 'node:zlib';
const table=Uint32Array.from({length:256},(_,i)=>{for(let j=0;j<8;j++)i=i&1?0xedb88320^(i>>>1):i>>>1;return i>>>0});
function crc(b){let c=0xffffffff;for(const v of b)c=table[(c^v)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function chunk(type,data){const t=Buffer.from(type),h=Buffer.alloc(4),end=Buffer.alloc(4);h.writeUInt32BE(data.length);end.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([h,t,data,end]);}
function png(n,pixels){const h=Buffer.alloc(13);h.writeUInt32BE(n);h.writeUInt32BE(n,4);h[8]=8;h[9]=2;const raw=Buffer.alloc(n*(n*3+1));for(let y=0;y<n;y++)pixels.copy(raw,y*(n*3+1)+1,y*n*3,(y+1)*n*3);return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',h),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
const clamp=x=>Math.min(255,Math.max(0,Math.round(x)));
const cache=new Map();
export function maps(name,rough,metal){const key=name+rough+metal;if(cache.has(key))return cache.get(key);
 const n=128,height=new Float32Array(n*n),c=Buffer.alloc(n*n*3),nr=Buffer.alloc(n*n*3),orm=Buffer.alloc(n*n*3);
 const wood=/oak|bark|wood|leather/.test(name),stone=/stone|limestone|plaster|terracotta|earth|ground|soil|road/.test(name),cloth=/linen|cloth|hair|parchment/.test(name),smooth=/skin|eye|window|water|flame/.test(name);
 function noise(x,y){let k=Math.imul(x+1,374761393)^Math.imul(y+1,668265263);k=Math.imul(k^(k>>>13),1274126177);return ((k^(k>>>16))>>>0)/4294967295;}
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){let z=(noise(x,y)-.5)*.10;if(wood)z+=.11*Math.sin(2*Math.PI*(x/16+.15*Math.sin(y*Math.PI/32)))+.035*Math.sin(x*Math.PI/2);if(stone)z+=.05*Math.sin(x*Math.PI/8)*Math.sin(y*Math.PI/16);if(cloth)z+=.034*(Math.sin(x*Math.PI/2)+Math.sin(y*Math.PI/2));if(smooth)z*=.1;height[y*n+x]=z;}
 const h=(x,y)=>height[((y+n)%n)*n+((x+n)%n)];
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=(y*n+x)*3,z=h(x,y),v=clamp(226+z*150),dx=(h(x-1,y)-h(x+1,y))*.9,dy=(h(x,y-1)-h(x,y+1))*.9,l=Math.hypot(dx,dy,1);c[i]=c[i+1]=c[i+2]=v;nr[i]=clamp(127.5+127.5*dx/l);nr[i+1]=clamp(127.5+127.5*dy/l);nr[i+2]=clamp(127.5+127.5/l);orm[i]=clamp(250+z*35);orm[i+1]=clamp((rough+(smooth?0:z*.25))*255);orm[i+2]=clamp(metal*255);}
 const out=[png(n,c),png(n,nr),png(n,orm)];cache.set(key,out);return out;
}
