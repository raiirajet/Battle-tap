import * as T from 'three';import {characterExpression} from './valley-character-motion.js';import {applySkinDetail} from './valley-character-assets.js';import {generateHumanoid} from './characters/humanoidBuilder.js';import {MORPHS} from './valley-rig-spec.js';
const sources=new Map(),pending=new Map();
// Cache one generated template per quality. Existing articulated body stays visible until ready.
let queue=Promise.resolve();
export function preloadValleyRig(detail=true){const key=detail?'high':'npc';if(sources.has(key))return Promise.resolve(sources.get(key));if(!pending.has(key)){const task=queue.then(()=>generateHumanoid(detail));queue=task.catch(()=>null);pending.set(key,task.then(source=>{sources.set(key,source);pending.delete(key);return source}).catch(e=>{pending.delete(key);console.warn('Valley procedural skin fallback:',e);return null}))}return pending.get(key)}
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
 const mixer=new T.AnimationMixer(root),actions=new Map(source.clips.map(c=>[c.name,mixer.clipAction(c)]));let active=null,clock=0;const weights=new Map();
 root.userData.rig='procedural-skinned';root.userData.morphTargets=Object.keys(morph);root.userData.animationClips=[...actions.keys()];
 return {skin,update(dt,{moving,run,jump,pose,speaking=false,greeting=false}){clock+=dt;const name=greeting?'Wave':jump>0?'Jump':pose==='sit'?'Sit':pose==='sleep'?'Sleep':pose==='use'?'Interact':moving?(run?'Run':'Walk'):'Idle';if(name!==active){const next=actions.get(name);if(next){if(!weights.has(name)){next.reset().setEffectiveTimeScale(1).setEffectiveWeight(active?0:1).play();weights.set(name,active?0:1)}active=name}}const blend=1-Math.exp(-Math.max(0,dt)*16);for(const [key,w] of weights){const target=key===active?1:0,value=w+(target-w)*blend;const action=actions.get(key);if(key!==active&&value<.002){action.stop();weights.delete(key)}else{weights.set(key,value);action.setEffectiveWeight(value)}}mixer.update(dt);const e=characterExpression(clock,{pose,jump,moving,speaking,seed:root.userData.expressionSeed||0});set('Blink',e.blink);set('Smile',e.smile);set('JawOpen',e.jaw);set('BrowRaise',e.brow)},dispose(){mixer.stopAllAction();mixer.uncacheRoot(root);skin.skeleton.dispose()}};
}
