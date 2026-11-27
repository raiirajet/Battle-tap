import * as T from 'three';
import {createRig,MORPHS,sideKey,rigClips} from '../src/valley-rig-spec.js';
// Connected implicit anatomical surface: smooth unions of shaped body sections.
// Field raster is bounded; the resulting indexed surface is welded across all cells.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),gauss=(x,s)=>Math.exp(-((x/s)**2));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,k)=>{const h=clamp(.5+.5*(b-a)/k,0,1);return mix(b,a,h)-k*h*(1-h)};
const lerpWeights=(a,b,t)=>[[a,1-t],[b,t]];
function primitives(rig){
 const list=[],idx=n=>rig.bones.indexOf(rig.map.get(n)),wp=n=>rig.map.get(n).getWorldPosition(new T.Vector3());
 function add(name,c,r,weight=null,k=.007){const [x,y,z]=c,[rx,ry,rz]=r;list.push({min:[x-rx-k*2,y-ry-k*2,z-rz-k*2],max:[x+rx+k*2,y+ry+k*2,z+rz+k*2],k,dist:(a,b,d)=>(Math.hypot((a-x)/rx,(b-y)/ry,(d-z)/rz)-1)*Math.min(rx,ry,rz),weight:weight||(()=>[[idx(name),1]])})}
 add('ValleyBody',[0,.88,0],[.137,.15,.087]);add('ValleyBody',[0,1.075,0],[.144,.245,.087]);add('ValleyBody',[0,1.205,0],[.174,.118,.085]);add('ValleyBody',[0,1.345,0],[.057,.128,.055],(x,y)=>lerpWeights(idx('ValleyBody'),idx('ValleyHead'),clamp((y-1.34)/.13,0,1)),.012);
 const rings=[[-.146,.001,.002,.022],[-.135,.037,.035,.020],[-.113,.066,.061,.019],[-.078,.086,.080,.014],[-.026,.104,.094,.002],[.027,.109,.100,-.005],[.075,.103,.096,-.014],[.121,.078,.073,-.016],[.149,.035,.041,-.016],[.156,.001,.001,-.017]];
 function ring(y,k){let i=0;while(i<rings.length-2&&y>rings[i+1][0])i++;const t=clamp((y-rings[i][0])/(rings[i+1][0]-rings[i][0]),0,1),a=rings[i][k],b=rings[i+1][k],prev=rings[Math.max(0,i-1)],next=rings[Math.min(rings.length-1,i+2)],span=rings[i+1][0]-rings[i][0],m0=(b-prev[k])/(rings[i+1][0]-prev[0])*span,m1=(next[k]-a)/(next[0]-rings[i][0])*span;return (2*t**3-3*t*t+1)*a+(t**3-2*t*t+t)*m0+(-2*t**3+3*t*t)*b+(t**3-t*t)*m1}
 list.push({min:[-.14,1.37,-.14],max:[.14,1.70,.15],k:.008,weight:()=>[[idx('ValleyHead'),1]],dist:(x,y,z)=>{const h=y-1.53;if(h<-.146||h>.156)return Math.max(-.146-h,h-.156)+.001;const w=Math.max(.001,ring(h,1)),d=Math.max(.001,ring(h,2)),off=ring(h,3);let zz=z-off;if(zz>0){const front=clamp(zz/d,0,1),nose=gauss(x,.017)*(gauss(h+.013,.043)*.018+gauss(h+.040,.014)*.022),cheek=gauss(Math.abs(x)-.062,.027)*gauss(h+.035,.028)*.009,socket=gauss(Math.abs(x)-.044,.027)*gauss(h-.018,.018)*.010,mouth=gauss(x,.040)*gauss(h+.078,.022)*.005;zz-=(nose+cheek-socket+mouth)*front}return (Math.hypot(x/w,zz/d)-1)*Math.min(w,d)}});
 for(const s of [-1,1]){const k=sideKey(s),ua=idx(k+'UpperArm'),fa=idx(k+'Forearm'),ha=idx(k+'Hand'),th=idx(k+'Thigh'),sh=idx(k+'Shin'),body=idx('ValleyBody');
 const armWeight=(x,y)=>y>1.16?lerpWeights(body,ua,clamp((1.29-y)/.13,0,1)):lerpWeights(ua,fa,clamp((1.045-y)/.09,0,1));
 add(k+'UpperArm',[s*.181,1.19,0],[.060,.10,.055],armWeight,.014);add(k+'UpperArm',[s*.195,1.125,0],[.047,.154,.045],armWeight);
 add(k+'Forearm',[s*.195,.922,0],[.040,.122,.036],(x,y)=>y> .965?lerpWeights(ua,fa,clamp((1.045-y)/.09,0,1)):lerpWeights(fa,ha,clamp((.835-y)/.06,0,1)),.008);
 add(k+'Hand',[s*.195,.780,0],[.032,.043,.019],(x,y)=>lerpWeights(fa,ha,clamp((.825-y)/.047,0,1)),.005);
 add(k+'Hand',[s*.195-s*.023,.784,.010],[.014,.027,.013],null,.004);
 // Each digit is an implicit tapered capsule chain, joined to palm and its neighbouring phalanges.
 for(let i=0;i<5;i++){const n=k+'Digit'+i,thumb=i===4,l=[.057,.065,.060,.047,.045][i],l1=l*(thumb?.52:.43),l2=l*(thumb?.24:.32),l3=l-l1-l2,rad=thumb?.0095:.008;const names=[n,n+'Mid',n+'Tip'],lengths=[l1,l2,l3];
 for(let j=0;j<3;j++){const b=rig.map.get(names[j]),a=wp(names[j]),end=b.localToWorld(new T.Vector3(0,-lengths[j],0)),v=end.clone().sub(a),len=v.lengthSq(),r=rad*(1-j*.12),pad=r+.005,dist=(x,y,z)=>{const t=clamp(((x-a.x)*v.x+(y-a.y)*v.y+(z-a.z)*v.z)/len,0,1);return Math.hypot(x-a.x-v.x*t,y-a.y-v.y*t,z-a.z-v.z*t)-r*(1-t*.12)};
 list.push({min:[Math.min(a.x,end.x)-pad,Math.min(a.y,end.y)-pad,Math.min(a.z,end.z)-pad],max:[Math.max(a.x,end.x)+pad,Math.max(a.y,end.y)+pad,Math.max(a.z,end.z)+pad],dist,k:.0025,weight:(x,y,z)=>{const t=clamp(((x-a.x)*v.x+(y-a.y)*v.y+(z-a.z)*v.z)/len,0,1);return t<.25?lerpWeights(j===0?ha:idx(names[j-1]),idx(names[j]),.5+t*2):t>.75&&j<2?lerpWeights(idx(names[j]),idx(names[j+1]),(t-.75)*2):[[idx(names[j]),1]]}})
 }}
 add(k+'Thigh',[s*.089,.735,0],[.071,.126,.072],(x,y)=>lerpWeights(body,th,clamp((.83-y)/.12,0,1)),.012);
 add(k+'Thigh',[s*.095,.607,0],[.065,.188,.063],(x,y)=>lerpWeights(th,sh,clamp((.49-y)/.085,0,1)),.008);
 add(k+'Shin',[s*.095,.303,0],[.049,.174,.045],(x,y)=>lerpWeights(th,sh,clamp((.49-y)/.085,0,1)),.009);
 add(k+'Shin',[s*.095,.116,0],[.039,.066,.039]);add(k+'Shin',[s*.095,.076,.046],[.047,.040,.099]);
 }return list;
}
export function buildSkin(rig,{step=.006}={}){
 const shapes=primitives(rig),lo=[-.34,.015,-.15],hi=[.34,1.71,.18],dims=hi.map((v,i)=>Math.ceil((v-lo[i])/step)+1),[nx,ny,nz]=dims,count=nx*ny*nz,field=new Float32Array(count).fill(.1),index=(x,y,z)=>(z*ny+y)*nx+x;
 for(const p of shapes){const min=p.min.map((v,i)=>clamp(Math.floor((v-lo[i])/step),0,dims[i]-1)),max=p.max.map((v,i)=>clamp(Math.ceil((v-lo[i])/step),0,dims[i]-1));
 for(let z=min[2];z<=max[2];z++)for(let y=min[1];y<=max[1];y++)for(let x=min[0];x<=max[0];x++){const i=index(x,y,z),d=p.dist(lo[0]+x*step,lo[1]+y*step,lo[2]+z*step);field[i]=smooth(field[i],d,p.k)}}
 const pos=[],indices=[],edges=new Map(),skinIndex=[],skinWeight=[],uv=[],colors=[];
 function point(i){return [lo[0]+(i%nx)*step,lo[1]+(Math.floor(i/nx)%ny)*step,lo[2]+Math.floor(i/(nx*ny))*step]}
 function vertex(a,b){if(a>b)[a,b]=[b,a];const key=a*count+b;if(edges.has(key))return edges.get(key);const A=point(a),B=point(b),t=clamp(field[a]/(field[a]-field[b]),0,1),P=A.map((v,i)=>mix(v,B[i],t)),[x,y,z]=P,j=pos.length/3;pos.push(...P);uv.push(.5+Math.atan2(x,z)/(2*Math.PI),y/1.72);const candidates=shapes.map(p=>({p,d:p.dist(x,y,z)})).sort((a,b)=>a.d-b.d).slice(0,2);const weights=new Map();for(const {p,d} of candidates){const k=Math.exp(-Math.max(0,d-candidates[0].d)/.008);for(const [bone,w] of p.weight(x,y,z))weights.set(bone,(weights.get(bone)||0)+w*k)}const list=[...weights].sort((a,b)=>b[1]-a[1]).slice(0,4),sum=list.reduce((s,v)=>s+v[1],0);while(list.length<4)list.push([0,0]);skinIndex.push(...list.map(v=>v[0]));skinWeight.push(...list.map(v=>v[1]/sum));const blush=y>1.38&&z>0?gauss(Math.abs(x)-.064,.029)*gauss(y-1.49,.022):0;colors.push(1,1-blush*.09,1-blush*.12);edges.set(key,j);return j}
 const tet=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
 function tri(a,b,c,out){const A=new T.Vector3().fromArray(pos,a*3),B=new T.Vector3().fromArray(pos,b*3),C=new T.Vector3().fromArray(pos,c*3);if(B.sub(A).cross(C.sub(A)).dot(new T.Vector3(...out).sub(A))<0)indices.push(a,c,b);else indices.push(a,b,c)}
 for(let z=0;z<nz-1;z++)for(let y=0;y<ny-1;y++)for(let x=0;x<nx-1;x++){const p=index(x,y,z),q=nx*ny,ids=[p,p+1,p+nx+1,p+nx,p+q,p+q+1,p+q+nx+1,p+q+nx];if(ids.every(i=>field[i]>=0)||ids.every(i=>field[i]<0))continue;
 for(const t of tet){const v=t.map(i=>ids[i]),inside=v.filter(i=>field[i]<0),outside=v.filter(i=>field[i]>=0);if(!inside.length||!outside.length)continue;const out=point(outside[0]);if(inside.length===1){const e=outside.map(i=>vertex(inside[0],i));tri(...e,out)}else if(inside.length===3){const e=inside.map(i=>vertex(i,outside[0]));tri(...e,out)}else{const [a,b]=inside,[c,d]=outside,A=vertex(a,c),B=vertex(a,d),C=vertex(b,c),D=vertex(b,d);tri(A,B,C,out);tri(B,D,C,out)}}
 }
 // Remove any disconnected voxel specks; compact the largest anatomical component.
 const n=pos.length/3,parents=new Int32Array(n);for(let i=0;i<n;i++)parents[i]=i;function find(x){while(parents[x]!==x){parents[x]=parents[parents[x]];x=parents[x]}return x}function join(a,b){a=find(a);b=find(b);if(a!==b)parents[b]=a}for(let i=0;i<indices.length;i+=3){join(indices[i],indices[i+1]);join(indices[i],indices[i+2])}const counts=new Map();for(let i=0;i<n;i++){const k=find(i);counts.set(k,(counts.get(k)||0)+1)}const main=[...counts].sort((a,b)=>b[1]-a[1])[0][0],remap=new Int32Array(n).fill(-1),keep=[];for(let i=0;i<n;i++)if(find(i)===main){remap[i]=keep.length;keep.push(i)}const compact=(a,stride)=>keep.flatMap(i=>a.slice(i*stride,i*stride+stride));const newIndices=indices.filter(i=>remap[i]>=0).map(i=>remap[i]);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(compact(pos,3),3));g.setAttribute('uv',new T.Float32BufferAttribute(compact(uv,2),2));g.setAttribute('color',new T.Float32BufferAttribute(compact(colors,3),3));g.setAttribute('skinIndex',new T.Uint16BufferAttribute(compact(skinIndex,4),4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(compact(skinWeight,4),4));g.setIndex(newIndices);g.computeVertexNormals();
 g.morphTargetsRelative=true;g.morphAttributes.position=MORPHS.map(name=>{const p=g.attributes.position.array,a=new Float32Array(p.length);for(let i=0;i<p.length;i+=3){const x=p[i],y=p[i+1]-1.53,z=p[i+2];if(y<-.147||y>.16)continue;const front=clamp(z/.085,0,1),eye=gauss(Math.abs(x)-.045,.034)*gauss(y-.019,.023)*front,mouth=gauss(x,.044)*gauss(y+.080,.028)*front;
 if(name==='Blink')a[i+1]=-(y-.018)*eye*.65;if(name==='Smile'){a[i+1]=Math.abs(x)*mouth*.28;a[i+2]=mouth*.003}if(name==='JawOpen')a[i+1]=-mouth*clamp((-.062-y)/.04,0,1)*.024;if(name==='BrowRaise')a[i+1]=gauss(Math.abs(x)-.043,.040)*gauss(y-.054,.022)*front*.009;if(name==='FaceAngular')a[i]=x*.12*gauss(y+.095,.045);if(name==='FaceRound')a[i]=x*.09*gauss(y+.035,.085);
 }const b=new T.BufferAttribute(a,3);b.name=name;return b});
 return g;
}
export function createSkinCharacter(options={}){const rig=createRig(),g=buildSkin(rig,options),mat=new T.MeshStandardMaterial({color:0xc68c65,roughness:.65,vertexColors:true}),skin=new T.SkinnedMesh(g,mat);skin.name='ValleySkin';skin.add(rig.root);skin.bind(new T.Skeleton(rig.bones));skin.updateMorphTargets();skin.castShadow=true;return {skin,rig,animations:rigClips()}}
