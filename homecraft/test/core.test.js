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

import {catalog,quantities,roofProfile,curvePoints} from '../src/core.js';
test('catalog IDs unique and variants instantiate',()=>{const ids=catalog.map(c=>c.modelId||c.kind);assert.equal(new Set(ids).size,ids.length);assert.ok(catalog.length>300);const o=object('sofa-eiche',{x:0,y:0});assert.equal(o.kind,'sofa');assert.equal(o.color,'#b68b5d')});
test('all six roof profiles finite and indexed',()=>{for(const type of ['flat','gable','shed','hip','mansard','butterfly']){const r=roofProfile(type,8,10,30);assert.ok(r.vertices.flat().every(Number.isFinite));assert.ok(r.faces.flat().every(i=>i>=0&&i<r.vertices.length))}});
test('curve contains endpoints and interior bend',()=>{const p=curvePoints({x:0,y:0},{x:2,y:2},{x:4,y:0});assert.equal(p.length,17);assert.deepEqual(p[0],{x:0,y:0});assert.deepEqual(p[16],{x:4,y:0});assert.equal(p[8].y,1)});
test('quantity report subtracts openings and counts objects',()=>{const p=template('studio','Test'),q=quantities(p)[0];assert.equal(q.doors,1);assert.equal(q.windows,1);assert.equal(q.objects,4);assert.ok(q.wallArea>0&&q.floor>0)});

test('PDF paper sizes and orientation',()=>{const p=template('studio','Test');assert.match(planPDF(p,100,'A4',false),/MediaBox \[0 0 595.28 841.89\]/);assert.throws(()=>planPDF(p,100,'A0'))});

import {templateChoices} from '../src/core.js';
test('all 60 parametric presets create valid nonempty projects',()=>{assert.equal(templateChoices.length,60);for(const t of templateChoices){const p=template(t.id,t.name);validate(p);assert.ok(rooms(p.levels[0]).length>0)}});

import {editWall,angleSnap,catalogStats} from '../src/core.js';
test('moving wall endpoints keeps adjacent endpoints joined',()=>{const p=project(),l=p.levels[0];rectangle(l,{x:0,y:0},{x:6,y:4});editWall(l,l.walls[0],{a:{x:0,y:-1},b:{x:6,y:-1}});assert.deepEqual(l.walls[1].a,{x:6,y:-1});assert.deepEqual(l.walls[3].b,{x:0,y:-1});assert.equal(rooms(l).length,1)});
test('angle snapping preserves length',()=>{const a={x:0,y:0},b={x:3,y:.1},p=angleSnap(a,b,90);assert.ok(Math.abs(p.y)<1e-9);assert.ok(Math.abs(Math.hypot(p.x,p.y)-Math.hypot(b.x,b.y))<1e-9)});
test('catalog count separates base types from finish variants',()=>{const s=catalogStats();assert.equal(s.base,54);assert.equal(s.entries,s.base+s.variants)});

import {materials,finish,kitchenLayout,bathroomLayout,overlap,roomCosts} from '../src/core.js';
test('128 finish presets have unique identifiers and valid descriptors',()=>{assert.equal(materials.length,128);assert.equal(new Set(materials.map(x=>x.id)).size,128);assert.ok(materials.every(x=>/^#[0-9a-f]{6}$/i.test(finish(x.id).color)))});
test('kitchen layouts generate grouped modules and worktops',()=>{for(const shape of ['straight','L','U','island']){const a=kitchenLayout({x:2,y:3},{shape,rotation:90});assert.ok(a.length>=5);assert.equal(new Set(a.map(x=>x.groupId)).size,1);assert.ok(a.some(x=>x.name==='Arbeitsplatte'));assert.ok(a.every(x=>Number.isFinite(x.x)&&Number.isFinite(x.y)))}});
test('bathroom layout has required fixtures',()=>{const a=bathroomLayout({x:0,y:0},{bath:true});assert.ok(a.some(x=>x.kind==='bath'));assert.ok(a.some(x=>x.kind==='toilet'));assert.throws(()=>bathroomLayout({x:0,y:0},{width:1}))});
test('rotated overlap respects vertical separation',()=>{const a=object('table',{x:0,y:0}),b=object('chair',{x:.2,y:0});b.rotation=45;assert.ok(overlap(a,b));b.elevation=2;assert.equal(overlap(a,b),false)});
test('cost rates are calculated per level',()=>{const p=template('studio','Test'),q=roomCosts(p,{floor:40,waste:10,labor:20})[0];assert.ok(Math.abs(q.cost-q.floor*64)<1e-8)});
