import * as T from 'three';import {characterExpression} from './valley-character-motion.js';import {applySkinDetail} from './valley-character-assets.js';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import {MORPHS} from './valley-rig-spec.js';
const sources=new Map(),pending=new Map();
export function preloadValleyRig(detail=true){const key=detail?'high':'npc';if(sources.has(key))return Promise.resolve(sources.get(key));if(!pending.has(key))pending.set(key,new GLTFLoader().loadAsync(new URL('./assets/characters/'+(detail?'valley-human':'valley-human-npc')+'.glb',document.baseURI).href).then(g=>{let skin;g.scene.traverse(o=>{if(o.isSkinnedMesh&&o.name==='ValleySkin')skin=o});if(!skin||!skin.morphTargetInfluences||g.animations.length!==8)throw Error('Valley rig incomplete');const source={skin,clips:g.animations,detail};sources.set(key,source);return source}).catch(e=>{pending.delete(key);console.warn('Valley GLB fallback:',e);return null}));return pending.get(key)}
export function getValleyRig(detail=true){return sources.get(detail?'high':'npc')}
export function attachValleyRig(root,source,profile,legacySkin){
 const map=new Map();root.traverse(o=>{if(o.isBone&&o.name)map.set(o.name,o)});
 const bones=source.skin.skeleton.bones.map(b=>map.get(b.name));if(bones.some(b=>!b))return null;
 // Rebind to the existing character rig. Clothes and hair remain attached to the same bones.
 // BufferAttributes are immutable: per-character geometry wrappers share their large vertex arrays.
 const base=source.skin.geometry,g=new T.BufferGeometry();for(const [k,v] of Object.entries(base.attributes))g.setAttribute(k,v);g.setIndex(base.index);g.morphAttributes={...base.morphAttributes};g.morphTargetsRelative=base.morphTargetsRelative;const mat=source.skin.material.clone();mat.color.set(profile.skin);applySkinDetail(mat,source.detail!==false);const skin=new T.SkinnedMesh(g,mat);skin.name='ValleySkin';skin.frustumCulled=false;skin.castShadow=true;skin.receiveShadow=true;
 const body=map.get('ValleyBody'),scale=body.scale.clone();body.scale.setScalar(1);root.updateMatrixWorld(true);root.add(skin);const inv=source.skin.skeleton.boneInverses.map(m=>m.clone());skin.bind(new T.Skeleton(bones,inv),new T.Matrix4());body.scale.copy(scale);
 skin.updateMorphTargets();const morph=skin.morphTargetDictionary||{};const set=(n,v)=>{if(morph[n]!==undefined)skin.morphTargetInfluences[morph[n]]=v};set('FaceAngular',profile.face==='angular'?1:0);set('FaceRound',profile.face==='round'?1:0);
 // Skin under clothing is intentionally slightly conservative; hide only the old body surfaces.
 for(const mesh of legacySkin)mesh.visible=false;
 const mixer=new T.AnimationMixer(root),actions=new Map(source.clips.map(c=>[c.name,mixer.clipAction(c)]));let active=null,clock=0;
 root.userData.rig='glb-skinned';root.userData.morphTargets=Object.keys(morph);root.userData.animationClips=[...actions.keys()];
 return {skin,update(dt,{moving,run,jump,pose}){clock+=dt;const name=jump>0?'Jump':pose==='sit'?'Sit':pose==='sleep'?'Sleep':pose==='use'?'Interact':moving?(run?'Run':'Walk'):'Idle';if(name!==active){const next=actions.get(name);if(next){next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();if(active)actions.get(active)?.crossFadeTo(next,.16,false);active=name}}mixer.update(dt);const e=characterExpression(clock,{pose,jump,moving,seed:root.userData.expressionSeed||0});set('Blink',e.blink);set('Smile',e.smile);set('JawOpen',e.jaw);set('BrowRaise',e.brow)},dispose(){mixer.stopAllAction();mixer.uncacheRoot(root);skin.skeleton.dispose()}};
}
