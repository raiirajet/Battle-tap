import test from 'node:test';import assert from 'node:assert/strict';import {project,rectangle,rooms,wall,addOpening,wallCells,validate,object} from '../src/core.js';
test('rectangle net area accounts for wall thickness',()=>{const p=project();rectangle(p.levels[0],{x:0,y:0},{x:6,y:4});const r=rooms(p.levels[0]);assert.equal(r.length,1);assert.ok(Math.abs(r[0].area-5.8*3.8)<1e-8)});
test('wall contains real void and preserves solid area',()=>{const w=wall({x:0,y:0},{x:6,y:0},.3,2.5);addOpening(w,2,'door',1,2,0);const a=wallCells(w).reduce((s,c)=>s+c.width*c.height,0);assert.equal(a,13);assert.throws(()=>addOpening(w,2.1,'door',1,2,0));});
test('open wall chain no room',()=>{const p=project();p.levels[0].walls.push(wall({x:0,y:0},{x:2,y:0}));assert.equal(rooms(p.levels[0]).length,0)});
test('invalid opening and invalid imported furniture rejected',()=>{const p=project();const l=p.levels[0];l.walls.push(wall({x:0,y:0},{x:3,y:0}));assert.throws(()=>addOpening(l.walls[0],.1,'window'));l.objects.push(object('sofa',{x:1,y:1}));assert.equal(validate(p),p);l.objects[0].width=-1;assert.throws(()=>validate(p))});
import {insertWall,template,stairLinks} from '../src/core.js';
import {planPDF} from '../src/pdf.js';
test('T junction splits rectangular floor into two rooms',()=>{const p=project(),l=p.levels[0];rectangle(l,{x:0,y:0},{x:6,y:4});insertWall(l,{x:3,y:0},{x:3,y:4});const r=rooms(l);assert.equal(r.length,2);assert.ok(r.every(x=>Math.abs(x.area-2.8*3.8)<1e-6))});
test('dangling partition preserves closed room',()=>{const p=project(),l=p.levels[0];rectangle(l,{x:0,y:0},{x:6,y:4});insertWall(l,{x:3,y:0},{x:3,y:2});assert.equal(rooms(l).length,1)});
test('overlapping wall rejected',()=>{const p=project(),l=p.levels[0];rectangle(l,{x:0,y:0},{x:6,y:4});assert.throws(()=>insertWall(l,{x:1,y:0},{x:3,y:0}))});
test('family template has valid stair opening and PDF pages',()=>{const p=template('family','Test');validate(p);assert.equal(stairLinks(p).length,1);const pdf=planPDF(p,100);assert.match(pdf,/\/Count 2/);assert.ok(pdf.startsWith('%PDF-1.4'));assert.throws(()=>planPDF(p,20))});

import {stairHeight,walkTarget} from '../src/core.js';
test('stair height is orientation-aware and increases along run',()=>{const p=template('family','Test'),a=stairLinks(p)[0],o=a.object;assert.ok(stairHeight(a,{x:o.x,y:o.y-1})<stairHeight(a,{x:o.x,y:o.y+1}));assert.equal(stairHeight(a,{x:o.x+2,y:o.y}),null)});
test('walker cannot cross solid wall or climb from stair side',()=>{const p=template('family','Test'),a=stairLinks(p)[0],l=p.levels[0];assert.equal(walkTarget(p,l.id,{x:.3,y:2,height:0},{x:.05,y:2}),null);assert.equal(walkTarget(p,l.id,{x:a.object.x+1,y:a.object.y,height:0},{x:a.object.x,y:a.object.y}),null)});

import {catalog,object,quantities,roofProfile,curvePoints} from '../src/core.js';
test('catalog IDs unique and variants instantiate',()=>{const ids=catalog.map(c=>c.modelId||c.kind);assert.equal(new Set(ids).size,ids.length);assert.ok(catalog.length>300);const o=object('sofa-eiche',{x:0,y:0});assert.equal(o.kind,'sofa');assert.equal(o.color,'#b68b5d')});
test('all six roof profiles finite and indexed',()=>{for(const type of ['flat','gable','shed','hip','mansard','butterfly']){const r=roofProfile(type,8,10,30);assert.ok(r.vertices.flat().every(Number.isFinite));assert.ok(r.faces.flat().every(i=>i>=0&&i<r.vertices.length))}});
test('curve contains endpoints and interior bend',()=>{const p=curvePoints({x:0,y:0},{x:2,y:2},{x:4,y:0});assert.equal(p.length,17);assert.deepEqual(p[0],{x:0,y:0});assert.deepEqual(p[16],{x:4,y:0});assert.equal(p[8].y,1)});
test('quantity report subtracts openings and counts objects',()=>{const p=template('studio','Test'),q=quantities(p)[0];assert.equal(q.doors,1);assert.equal(q.windows,1);assert.equal(q.objects,4);assert.ok(q.wallArea>0&&q.floor>0)});
