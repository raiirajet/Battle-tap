import {deflateSync} from 'node:zlib';
const table=Uint32Array.from({length:256},(_,i)=>{for(let j=0;j<8;j++)i=i&1?0xedb88320^(i>>>1):i>>>1;return i>>>0});
function crc(b){let c=0xffffffff;for(const v of b)c=table[(c^v)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function chunk(type,data){const t=Buffer.from(type),h=Buffer.alloc(4),end=Buffer.alloc(4);h.writeUInt32BE(data.length);end.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([h,t,data,end]);}
function png(n,pixels){const h=Buffer.alloc(13);h.writeUInt32BE(n);h.writeUInt32BE(n,4);h[8]=8;h[9]=2;const raw=Buffer.alloc(n*(n*3+1));for(let y=0;y<n;y++)pixels.copy(raw,y*(n*3+1)+1,y*n*3,(y+1)*n*3);return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',h),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
const clamp=x=>Math.min(255,Math.max(0,Math.round(x)));

const cache=new Map();
export function maps(name,rough,metal,n=256){const key=[name,rough,metal,n].join(':');if(cache.has(key))return cache.get(key);
const height=new Float32Array(n*n),c=Buffer.alloc(n*n*3),nr=Buffer.alloc(n*n*3),orm=Buffer.alloc(n*n*3);
const wood=/oak|bark|wood/.test(name),leather=/leather/.test(name),stone=/stone|limestone|plaster|terracotta|earth|ground|soil|road/.test(name),masonry=/limestone|terracotta|masonry/.test(name),cloth=/linen|cloth|hair|parchment/.test(name),metallic=metal>.3,smooth=/skin|eye|window|water|flame/.test(name);
const fract=x=>x-Math.floor(x),mix=(a,b,f)=>a+(b-a)*f,ease=x=>x*x*(3-2*x);
function hash(x,y){let k=Math.imul(x+1,374761393)^Math.imul(y+1,668265263);k=Math.imul(k^(k>>>13),1274126177);return ((k^(k>>>16))>>>0)/4294967295;}
function noise(u,v,k){const x=u*k,y=v*k,i=Math.floor(x),j=Math.floor(y),f=ease(fract(x)),g=ease(fract(y)),h=(a,b)=>hash((a+k)%k,(b+k)%k);return mix(mix(h(i,j),h(i+1,j),f),mix(h(i,j+1),h(i+1,j+1),f),g);}
for(let y=0;y<n;y++)for(let x=0;x<n;x++){const u=x/n,v=y/n,f=noise(u,v,4)*.55+noise(u,v,16)*.27+noise(u,v,64)*.13+noise(u,v,128)*.05;let z=(f-.5)*.12;
if(wood)z+=.045*Math.sin(2*Math.PI*(u*18+noise(u,v,4)*.65))+.018*Math.sin(2*Math.PI*u*80);
if(masonry){const row=Math.floor(v*8),a=fract(u*5+(row%2)*.5),b=fract(v*8),edge=Math.min(a,1-a,b,1-b);z+=.09*ease(Math.min(1,edge*24))-.06;}
else if(stone)z+=(noise(u,v,32)-.5)*.06;
if(cloth)z+=.013*(Math.cos(2*Math.PI*u*96)+Math.cos(2*Math.PI*v*96))+.023*Math.sin(2*Math.PI*(u*5+noise(u,v,4)*.3));
if(leather)z+=(noise(u,v,96)-.5)*.035;
if(metallic)z=(f-.5)*.025+.004*Math.sin(2*Math.PI*u*112);
if(smooth)z*=.16;height[y*n+x]=z;}
const h=(x,y)=>height[((y+n)%n)*n+((x+n)%n)];
for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=(y*n+x)*3,z=h(x,y),f=noise(x/n,y/n,4),v=clamp(235+z*(masonry?360:190)+(f-.5)*(smooth?6:20)),strength=n/256*.85,dx=(h(x-1,y)-h(x+1,y))*strength,dy=(h(x,y-1)-h(x,y+1))*strength,l=Math.hypot(dx,dy,1);c[i]=v;c[i+1]=clamp(v-(wood?3:0));c[i+2]=clamp(v-(wood?8:0));nr[i]=clamp(127.5+127.5*dx/l);nr[i+1]=clamp(127.5+127.5*dy/l);nr[i+2]=clamp(127.5+127.5/l);orm[i]=clamp(247+z*100);orm[i+1]=clamp((rough+(smooth?0:z*.4))*255);orm[i+2]=clamp(metal*255);}
const out=[png(n,c),png(n,nr),png(n,orm)];cache.set(key,out);return out;}
