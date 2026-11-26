import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
const meter=2;
const base=new URL('./assets3d/',document.baseURI);
const keyOf=(x,y)=>x+','+y;
export async function createWorld(canvas,E,status){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.setClearColor(0x526b49);
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-10,10,10,-10,.1,400);
 scene.add(new THREE.HemisphereLight(0xe7efff,0x777451,2.1));const sun=new THREE.DirectionalLight(0xffe4bf,2.7);sun.position.set(28,48,19);scene.add(sun);
 const manifest=await fetch(new URL('manifest.json',base)).then(r=>{if(!r.ok)throw Error('Assetmanifest '+r.status);return r.json()});
 if(manifest.version!=='0.3.0')throw Error('Unerwartete Assetversion '+manifest.version);
 const assets=new Map(manifest.assets.map(a=>[a.assetId,a])),heroes=new Map(manifest.assets.filter(a=>/^H\d\d$/.test(a.assetId)).map(a=>[a.name,a.assetId])),workers=new Map(Object.keys({farmer:1,wood:1,miner:1,builder:1,carrier:1,fisher:1,smith:1,scholar:1}).map(k=>[k,'CIV_'+({wood:'woodcutter',scholar:'merchant'}[k]||k)+'_1']));
 const loader=new GLTFLoader(),cache=new Map(),queue=[];let loading=0,failures=0,loaded=0,rendered=0,quality='auto';
 function pump(){while(loading<3&&queue.length){const {path,resolve,reject}=queue.shift();loading++;loader.load(new URL(path,base).href,g=>{loaded++;resolve(g);loading--;pump()},undefined,e=>{failures++;reject(e);loading--;pump()});}}
 function getAsset(id,level=0){const a=assets.get(id);if(!a)return Promise.reject(Error('Missing '+id));const path=level?(a.lods?.find(v=>v.level===level)?.path||a.path):a.path;if(!cache.has(path)){const p=new Promise((resolve,reject)=>{queue.push({path,resolve,reject});pump()});cache.set(path,p);}return cache.get(path);}
 const root=new THREE.Group();scene.add(root);
 const groundGeometry=new THREE.PlaneGeometry(2,2);groundGeometry.rotateX(-Math.PI/2);
 const ground=new THREE.InstancedMesh(groundGeometry,new THREE.MeshStandardMaterial({roughness:.98,metalness:0}),E.SIZE*E.SIZE),matrix=new THREE.Matrix4(),color=new THREE.Color();let n=0;
 for(let x=0;x<E.SIZE;x++)for(let z=0;z<E.SIZE;z++){matrix.makeTranslation((x+.5)*2,-.02,(z+.5)*2);ground.setMatrixAt(n,matrix);const src=E.sources(x,z);color.set(E.isWater(x,z)?0x426f84:src==='forest'?0x416346:src==='rock'?0x85867a:(x*19+z*7)%3===0?0x85935b:0x75864e);ground.setColorAt(n++,color);}
 ground.instanceMatrix.needsUpdate=true;scene.add(ground);
 // Subtle grid matching the authoritative simulation, not a mismatched height-map.
 const grid=new THREE.GridHelper(E.SIZE*2,E.SIZE,0x536548,0x68784e);grid.position.set(E.SIZE,E.SIZE>0?.015:0,E.SIZE);grid.material.transparent=true;grid.material.opacity=.20;scene.add(grid);
 const shadowGeo=new THREE.CircleGeometry(1,20);shadowGeo.rotateX(-Math.PI/2);const shadowMat=new THREE.MeshBasicMaterial({color:0x14251c,transparent:true,opacity:.24,depthWrite:false});
 const entities=new Map();
 const fallbackGeo=new THREE.BoxGeometry(1,1,1),fallbackMat=new THREE.MeshStandardMaterial({color:0x87936b,roughness:.95});
 function remove(key){const obj=entities.get(key);if(!obj)return;obj.alive=false;obj.mixer?.stopAllAction();root.remove(obj.group);entities.delete(key);}
 function ensure(key,id,level,x,z,kind,scale=1){
 const signature=id+':'+level;let obj=entities.get(key);
 if(obj&&obj.signature!==signature){remove(key);obj=null;}
 if(!obj){const group=new THREE.Group(),shadow=new THREE.Mesh(shadowGeo,shadowMat);shadow.position.y=.025;shadow.scale.set(kind==='building'?2:.6,1,kind==='building'?2:.6);group.add(shadow);const placeholder=new THREE.Mesh(fallbackGeo,fallbackMat);placeholder.scale.set(kind==='building'?2:.38,kind==='building'?1.6:.8,kind==='building'?2:.38);placeholder.position.y=placeholder.scale.y/2;group.add(placeholder);root.add(group);obj={group,signature,alive:true,model:null,mixer:null,action:null,clip:null};entities.set(key,obj);
 const ref=obj;getAsset(id,level).then(g=>{if(!ref.alive)return;const model=clone(g.scene);model.scale.setScalar(scale);model.traverse(o=>{if(o.isMesh){o.frustumCulled=!o.isSkinnedMesh;}});ref.group.remove(placeholder);ref.group.add(model);ref.model=model;ref.clips=g.animations;ref.mixer=new THREE.AnimationMixer(model);}).catch(()=>{if(ref.alive)ref.error=true;});}
 obj.group.position.set(x*meter,0,z*meter);return obj;
 }
 function play(obj,name,dt,phase){if(!obj.mixer)return;const clip=obj.clips.find(c=>c.name===name)||obj.clips.find(c=>c.name==='idle')||null;
 if(clip&&obj.clip!==clip){const next=obj.mixer.clipAction(clip);next.reset().play();if(obj.action)obj.action.crossFadeTo(next,.12,false);obj.action=next;obj.clip=clip;}
 if(clip&&Number.isFinite(phase)&&obj.action){obj.action.time=((phase%1)+1)%1*clip.duration;obj.mixer.update(0);}else obj.mixer.update(dt);}
 function setQuality(q){quality=q;renderer.setPixelRatio(Math.min(devicePixelRatio||1,q==='high'?1.6:q==='low'?1:1.25));}
 setQuality('auto');
 function frame(s,g,w,h,view){
 if(w<=1||h<=1)return;renderer.setSize(w,h,false);
 const ppu=g.a/(2*Math.SQRT2),dx=(w/2-g.ox)*2/g.a,dy=(h/2-g.oy)*4/g.a,tx=dx+dy,tz=dy-dx;
 camera.left=-w/2/ppu;camera.right=w/2/ppu;camera.top=h/2/ppu;camera.bottom=-h/2/ppu;camera.position.set(tx+86.60254,70.710678,tz+86.60254);camera.lookAt(tx,0,tz); // elevation 30 degrees, corrected below
 camera.position.set(tx+86.60254,70.710678,tz+86.60254);camera.position.y=Math.hypot(86.60254,86.60254)/Math.sqrt(3);camera.lookAt(tx,0,tz);camera.updateProjectionMatrix();
 const seen=new Set(),dt=view.paused?0:Math.min(.05,view.dt),level=quality==='low'?2:quality==='high'?0:g.a<14?2:g.a<25?1:0;
 const visible=(x,z,pad=110)=>{const sx=g.ox+(x-z)*g.a/2,sy=g.oy+(x+z)*g.a/4;return sx>=-pad&&sx<=w+pad&&sy>=-pad&&sy<=h+pad;};
 const add=(key,id,l,x,z,kind,scale=1)=>{seen.add(key);return ensure(key,id,l,x,z,kind,scale);};
 for(const b of s.buildings){const d=E.BUILD[b.type],x=b.x+d.size[0]/2,z=b.y+d.size[1]/2;if(!visible(x,z,170))continue;const phase=b.left&&!b.upgrade?Math.min(3,Math.floor(4*(1-b.left/Math.max(b.total||d.time,1)))):null,id=phase===null?d.id:d.id+'_phase'+phase;const obj=add('b:'+keyOf(b.x,b.y),id,phase===null?level:0,x,z,'building');play(obj,'work',dt);}
 for(const road of s.roads){const x=road.x+.5,z=road.y+.5;if(visible(x,z,30))add('r:'+keyOf(road.x,road.y),'ROAD_'+road.kind,0,x,z,'road');}
 // Source trees and rocks use the actual asset catalogue; cap decoration to protect mobile GPU.
 let decorations=0;for(let x=0;x<E.SIZE&&decorations<95;x++)for(let z=0;z<E.SIZE&&decorations<95;z++){const source=E.sources(x,z);if(!source||!visible(x+.5,z+.5,60)||(x+z)%2)continue;const id=source==='forest'?'TREE_'+(['oak','beech','fir','pine'][(x*3+z)%4])+'_adult':'ROCK_granite_'+(1+(x+z)%4);add('d:'+keyOf(x,z),id,0,x+.5,z+.5,'nature',source==='forest'?.83:1.4);decorations++;}
 let workerCount=0;for(const b of s.buildings){const d=E.BUILD[b.type],cnt=b.left?1:b.workers;for(let i=0;i<cnt&&workerCount<40;i++){const x=b.x+.45+i*.48,z=b.y+d.size[1]+.22;if(!visible(x,z))continue;const role=b.left?'builder':view.workerRole(b.type),id=workers.get(role)||'CIV_carrier_1';const o=add('w:'+keyOf(b.x,b.y)+':'+i,id,0,x,z,'worker',1.2);o.group.rotation.y=Math.PI/4;play(o,b.left?'build':({farmer:'farm',wood:'woodcut',miner:'mine',smith:'smith',carrier:'carry',builder:'build'}[role]||'work'),dt);workerCount++;}}
 for(const u of s.units){if(s.expeditions.length)continue;const p=view.position(u);if(!visible(p.x,p.y,80))continue;const id=u.type==='hero'?heroes.get(s.hero):E.UNITS[u.type]?.id;if(!id)continue;const o=add('u:'+u.id,id,u.type==='hero'?Math.min(level,1):level,p.x,p.y,'unit',u.type==='hero'?1.6:1.4);o.group.rotation.y=Math.PI/2-u.facing;const mounted=['cavalry','knight','sunrider'].includes(u.type),ship=['fishing','merchant','patrol'].includes(u.type),machine=['ram','catapult','trebuchet','cart'].includes(u.type);const clip=u.hp<=0?'down':ship?'sail':machine?'roll':mounted?(u.moving?(u.run?'horse_gallop':'horse_trot'):'idle'):(u.moving?(u.run?'run':'walk'):'idle');play(o,clip,dt,u.moving&&!ship?p.stride/(u.run?.75:.55):undefined);}
 for(const k of entities.keys())if(!seen.has(k))remove(k);
 renderer.render(scene,camera);rendered++;status.textContent='3D · '+(quality==='auto'?'Auto':quality==='high'?'Hoch':'Niedrig')+(loading||queue.length?' · lädt '+(loading+queue.length):'')+(failures?' · '+failures+' Ladefehler':'');
 }
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();status.textContent='3D-Kontext verloren';});
 return {frame,setQuality,stats:()=>({loaded,failures,rendered,entities:entities.size,visibleModels:[...entities].filter(([,o])=>o.model).map(([k,o])=>({key:k,asset:o.signature,clip:o.clip?.name})),version:manifest.version}),dispose(){renderer.dispose();}};
}
