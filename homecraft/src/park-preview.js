import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const host=document.querySelector('#viewport'),status=document.querySelector('#status'),select=document.querySelector('#asset');
const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;host.append(renderer.domElement);
const scene=new T.Scene(),camera=new T.PerspectiveCamera(45,1,.05,150),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;
const hemi=new T.HemisphereLight(0xe0eef9,0x78825c,1.7),sun=new T.DirectionalLight(0xffecd2,2.1);sun.position.set(-8,13,7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:.5,far:40});sun.shadow.normalBias=.025;scene.add(hemi,sun,sun.target);
const park=new T.Group(),gallery=new T.Group();scene.add(park,gallery);gallery.visible=false;
const floor=new T.Mesh(new T.PlaneGeometry(30,30),new T.MeshStandardMaterial({color:0x829265,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.025;floor.receiveShadow=true;park.add(floor);
const loader=new GLTFLoader(),cache=new Map(),base=import.meta.env.BASE_URL+'assets/park/';
function load(name){if(!cache.has(name))cache.set(name,loader.loadAsync(base+name).then(g=>{g.scene.traverse(o=>{if(o.isMesh){o.castShadow=!name.includes('grass')&&!name.includes('wiese')&&!name.includes('strasse');o.receiveShadow=true}});return g.scene}).catch(e=>{cache.delete(name);throw e}));return cache.get(name)}
async function place(name,x,z,rotation=0){let obj=(await load(name)).clone(true);obj.position.set(x,0,z);obj.rotation.y=rotation;park.add(obj);return obj}
function view(eye=false){gallery.visible=false;park.visible=true;controls.target.set(0,eye?1.45:.65,0);camera.position.set(eye?1:10,eye?1.65:8.5,eye?7:13);controls.update()}
let cloudy=false;
function weather(){scene.background=new T.Color(cloudy?0xc8d1d2:0xabc9dd);hemi.intensity=cloudy?2.0:1.7;sun.intensity=cloudy?.42:2.1;sun.castShadow=!cloudy;document.querySelector('#weather').textContent=cloudy?'Sonne':'Bewölkung'}
weather();view();
const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(w&&h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}};new ResizeObserver(resize).observe(host);resize();
document.querySelector('#park').onclick=()=>view(false);document.querySelector('#eye').onclick=()=>view(true);document.querySelector('#overview').onclick=()=>view(false);document.querySelector('#weather').onclick=()=>{cloudy=!cloudy;weather()};
let request=0;
document.querySelector('#inspect').onclick=async()=>{let id=++request,name=select.value;if(!name)return;try{let obj=(await load(name)).clone(true);if(id!==request)return;gallery.clear();gallery.add(obj);gallery.visible=true;park.visible=false;const b=new T.Box3().setFromObject(obj),center=b.getCenter(new T.Vector3()),size=b.getSize(new T.Vector3()),dist=Math.max(.2,size.length()*1.3);controls.target.copy(center);camera.position.copy(center).add(new T.Vector3(dist*.7,dist*.5,dist));controls.update();status.textContent=name+' · frei drehbare GLB-Vorschau'}catch(e){status.textContent='GLB konnte nicht geladen werden: '+name}};
for(let id of ['park','eye','overview'])document.querySelector('#'+id).addEventListener('click',()=>request++);
async function init(){const res=await fetch(base+'manifest.json');if(!res.ok)throw Error('Manifest HTTP '+res.status);const m=await res.json();for(let a of m.assets){const option=document.createElement('option');option.value=a.file;option.textContent=a.file+' · '+a.triangles+' Dreiecke';select.append(option)}
const items=[['park_wiese_8m.glb',-3,0],['park_strasse_12m.glb',6.8,0],['park_laubbaum_lod0.glb',-5,-2.8],['park_birke_lod0.glb',-.8,-3],['park_nadelbaum_lod0.glb',-5.8,3],['park_busch_1_lod0.glb',-4,-3.8],['park_busch_2_lod0.glb',-1,-3.8],['park_busch_3_lod0.glb',-5,3.7],['park_bank.glb',-.6,1.8],['park_laterne.glb',2,-3.4],['park_mauer_2m.glb',-3,-4.3],['park_hausfront_6m.glb',12.4,-3, -Math.PI/2],['park_wildblumen.glb',-1.6,-.8],['park_klee.glb',-4,1.5]];
const results=await Promise.allSettled(items.map(a=>place(...a)));let failed=results.filter(r=>r.status==='rejected').length;
let seed=4821;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
for(let k=1;k<=4;k++){try{let template=await load('park_grass_'+k+'_lod0.glb'),positions=[];for(let i=0;i<125;i++){let x=-6.7+rand()*7.4,z=-3.7+rand()*7.4;if(Math.abs(z-1.8)<.8&&x>-1.8||Math.abs(x+3)<.55)continue;positions.push([x,z,rand()*Math.PI*2,.65+rand()*.45])}template.updateMatrixWorld(true);template.traverse(o=>{if(!o.isMesh)return;let inst=new T.InstancedMesh(o.geometry,o.material,positions.length),dummy=new T.Object3D();positions.forEach(([x,z,a,s],i)=>{dummy.position.set(x,.01,z);dummy.rotation.y=a;dummy.scale.setScalar(s);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix.clone().multiply(o.matrixWorld))});inst.receiveShadow=true;park.add(inst)})}catch(e){failed++}}
status.textContent=m.assets.length+' GLBs im Katalog · '+(failed?failed+' Ladefehler':'Parkvorschau geladen')+' · separater Testausschnitt, nicht die Live-Spielwelt';}
init().catch(e=>{status.textContent='Vorschaufehler: '+e.message});renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera)});
