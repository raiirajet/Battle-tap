import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {CHARACTER_PRESETS,profile} from '../src/valley-world-life.js';
import {avatarMesh} from '../src/valley-avatar.js';
import {silhouette} from '../src/valley-character-model.js';
import {applySkinDetail} from '../src/valley-character-assets.js';
test('six presets use supported save fields and animate',()=>{assert.equal(CHARACTER_PRESETS.length,6);for(const p of CHARACTER_PRESETS){assert.deepEqual(profile(p.profile),p.profile);const a=avatarMesh(p.profile,{detail:false});a.update({x:0,z:0,height:0},1,0,true,.05,null,{run:true});a.root.updateMatrixWorld(true);a.root.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)));assert.ok(new T.Box3().setFromObject(a.root).max.y<2.1)}});
test('contour interpolation adds finite geometry',()=>{const g=silhouette([[0,.05,.04],[.5,.1,.08],[1,.06,.04]],24);assert.ok(g.attributes.position.count>75);assert.ok(g.attributes.normal.array.every(Number.isFinite));g.dispose()});
test('skin grain is independent and optional',()=>{const m=new T.MeshStandardMaterial();applySkinDetail(m,false);assert.equal(m.normalMap,null);applySkinDetail(m,true);assert.equal(m.normalMap.image.width,128);assert.notEqual(m.normalMap,m.roughnessMap);m.normalMap.dispose();m.roughnessMap.dispose();m.dispose()});
