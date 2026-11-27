import * as T from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import {MORPHS} from './valley-rig-spec.js';
let source=null,pending=null;
export function preloadValleyRig(){if(source)return Promise.resolve(source);if(!pending)pending=new GLTFLoader().loadAsync(new URL('./assets/characters/valley-human.glb',document.baseURI).href).then(g=>{let skin;g.scene.traverse(o=>{if(o.isSkinnedMesh&&o.name==='ValleySkin')skin=o});if(!skin||!skin.morphTargetInfluences||!g.animations.length)throw Error('Valley rig incomplete');source={skin,clips:g.animations};return source}).catch(e=>{pending=null;console.warn('Valley GLB fallback:',e);return null});return pending}
export function getValleyRig(){return source}
export function attachValleyRig(root,source,profile,legacySkin){
 const map=new Map();root.traverse(o=>{if(o.isBone&&o.name)map.set(o.name,o)});
 const bones=source.skin.skeleton.bones.map(b=>map.get(b.name));if(bones.some(b=>!b))return null;
 // Rebind to the existing character rig. Clothes and hair remain attached to the same bones.
 const g=source.skin.geometry.clone(),mat=source.skin.material.clone();mat.color.set(profile.skin);const skin=new T.SkinnedMesh(g,mat);skin.name='ValleySkin';skin.frustumCulled=false;skin.castShadow=true;skin.receiveShadow=true;
 const body=map.get('ValleyBody'),scale=body.scale.clone();body.scale.setScalar(1);root.updateMatrixWorld(true);root.add(skin);const inv=source.skin.skeleton.boneInverses.map(m=>m.clone());skin.bind(new T.Skeleton(bones,inv),new T.Matrix4());body.scale.copy(scale);
 skin.updateMorphTargets();const morph=skin.morphTargetDictionary||{};const set=(n,v)=>{if(morph[n]!==undefined)skin.morphTargetInfluences[morph[n]]=v};set('FaceAngular',profile.face==='angular'?1:0);set('FaceRound',profile.face==='round'?1:0);
 // Skin under clothing is intentionally slightly conservative; hide only the old body surfaces.
 for(const mesh of legacySkin)mesh.visible=false;
 const mixer=new T.AnimationMixer(root),actions=new Map(source.clips.map(c=>[c.name,mixer.clipAction(c)]));let active=null,clock=0;
 root.userData.rig='glb-skinned';root.userData.morphTargets=Object.keys(morph);root.userData.animationClips=[...actions.keys()];
 return {skin,update(dt,{moving,run,jump,pose}){clock+=dt;const name=jump>0?'Jump':pose==='sit'?'Sit':pose==='sleep'?'Sleep':pose==='use'?'Interact':moving?(run?'Run':'Walk'):'Idle';if(name!==active){const next=actions.get(name);if(next){next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();if(active)actions.get(active)?.crossFadeTo(next,.16,false);active=name}}mixer.update(dt);const t=clock%5.8;set('Blink',t>5.6?1-Math.min(1,Math.abs(t-5.7)/.1):0);set('Smile',pose==='use'?.28:.12);set('JawOpen',pose==='use'?.15+.12*Math.sin(clock*7):0);set('BrowRaise',jump>0?.5:.08)},dispose(){mixer.stopAllAction();mixer.uncacheRoot(root);skin.skeleton.dispose()}};
}
