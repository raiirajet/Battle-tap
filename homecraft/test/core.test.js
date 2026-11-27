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
test('catalog count separates base types from finish variants',()=>{const s=catalogStats();assert.equal(s.base,423);assert.equal(s.entries,s.base+s.variants)});

import {materials,finish,kitchenLayout,bathroomLayout,overlap,roomCosts} from '../src/core.js';
test('128 finish presets have unique identifiers and valid descriptors',()=>{assert.equal(materials.length,128);assert.equal(new Set(materials.map(x=>x.id)).size,128);assert.ok(materials.every(x=>/^#[0-9a-f]{6}$/i.test(finish(x.id).color)))});
test('kitchen layouts generate grouped modules and worktops',()=>{for(const shape of ['straight','L','U','island']){const a=kitchenLayout({x:2,y:3},{shape,rotation:90});assert.ok(a.length>=5);assert.equal(new Set(a.map(x=>x.groupId)).size,1);assert.ok(a.some(x=>x.name==='Arbeitsplatte'));assert.ok(a.every(x=>Number.isFinite(x.x)&&Number.isFinite(x.y)))}});
test('bathroom layout has required fixtures',()=>{const a=bathroomLayout({x:0,y:0},{bath:true});assert.ok(a.some(x=>x.kind==='bath'));assert.ok(a.some(x=>x.kind==='toilet'));assert.throws(()=>bathroomLayout({x:0,y:0},{width:1}))});
test('rotated overlap respects vertical separation',()=>{const a=object('table',{x:0,y:0}),b=object('chair',{x:.2,y:0});b.rotation=45;assert.ok(overlap(a,b));b.elevation=2;assert.equal(overlap(a,b),false)});
test('cost rates are calculated per level',()=>{const p=template('studio','Test'),q=roomCosts(p,{floor:40,waste:10,labor:20})[0];assert.ok(Math.abs(q.cost-q.floor*64)<1e-8)});

import {polygonValid,addLandscape,addRoute,solarPosition,moveGroup} from '../src/core.js';
test('landscape polygon rejects self crossing and preserves valid concave shape',()=>{const p=project(),pts=[{x:0,y:0},{x:4,y:0},{x:4,y:4},{x:2,y:2},{x:0,y:4}];assert.ok(polygonValid(pts));addLandscape(p,'grass',pts);assert.equal(validate(p),p);assert.equal(polygonValid([{x:0,y:0},{x:3,y:3},{x:0,y:3},{x:3,y:0}]),false)});
test('schematic route length and invalid system',()=>{const p=project(),l=p.levels[0],r=addRoute(l,'water',[{x:0,y:0},{x:3,y:0},{x:3,y:4}]);assert.equal(r.length,7);assert.equal(validate(p),p);assert.throws(()=>addRoute(l,'invalid',r.points))});
test('solar elevation in Swiss summer exceeds winter and night is below horizon',()=>{const a=solarPosition('2026-06-21',12,47,8,2),b=solarPosition('2026-12-21',12,47,8,1),n=solarPosition('2026-06-21',0,47,8,2);assert.ok(a.altitude>b.altitude&&a.altitude>50&&n.altitude<0)});
test('module group moves as one',()=>{const p=project(),l=p.levels[0];l.objects=kitchenLayout({x:0,y:0});const old=l.objects.map(o=>o.x);moveGroup(l,l.objects[0].groupId,2,1);assert.ok(l.objects.every((o,i)=>Math.abs(o.x-old[i]-2)<1e-8))});

import {openingFromPreset,openingPresets} from '../src/core.js';
test('opening styles generate correctly dimensioned voids',()=>{const w=wall({x:0,y:0},{x:6,y:0});const o=openingFromPreset(w,2,'door','double');assert.equal(o.width,1.6);assert.equal(o.style,'double');assert.throws(()=>openingFromPreset(w,.2,'window','panorama'));assert.equal(openingPresets.door.length,5)});

import {validCamera,storeCamera} from '../src/core.js';
test('camera positions persist with valid level and finite geometry',()=>{const p=project(),c={position:[1,2,3],target:[0,0,0],quaternion:[0,0,0,1],fov:55,level:p.levels[0].id,walk:false};assert.ok(validCamera(c));storeCamera(p,'Wohnzimmer',c);assert.equal(validate(p),p);assert.throws(()=>storeCamera(p,'Invalid',{...c,level:'missing'}))});

import {stairSteps,isStair,addRoofPatch,terrainHeight,furnishRoom} from '../src/core.js';
test('all staircase shapes have rising treads and maximum height',()=>{for(const kind of ['stair','stairL','stairU','stairSpiral']){const o=object(kind,{x:0,y:0}),s=stairSteps(o,2.7);assert.ok(isStair(o));assert.ok(s.every((v,i)=>v.height>0&&(!i||v.height>s[i-1].height)));assert.equal(s.at(-1).height,2.7);assert.ok(s.every(v=>v.polygon.length===4))}});
test('custom roof patches preserve vertex heights and valid level reference',()=>{const p=project();addRoofPatch(p,p.levels[0].id,[{x:0,y:0,z:0},{x:4,y:0,z:1},{x:4,y:4,z:1},{x:0,y:4,z:0}]);assert.equal(validate(p),p);assert.throws(()=>addRoofPatch(p,'missing',p.roofPatches[0].points))});
test('terrain gradient is anchored at first polygon vertex',()=>{assert.ok(Math.abs(terrainHeight({points:[{x:1,y:1}],elevation:2,slopeX:.1,slopeY:.2},{x:4,y:3})-2.7)<1e-9)});
test('automatic furnishing proposes in-room placements without overlaps',()=>{const p=project(),l=p.levels[0];rectangle(l,{x:0,y:0},{x:6,y:6});const r=rooms(l)[0],q=furnishRoom(l,r,'living');assert.ok(q.objects.length>=3);for(let i=0;i<q.objects.length;i++)for(let j=i+1;j<q.objects.length;j++)assert.equal(overlap(q.objects[i],q.objects[j]),false);assert.equal(l.objects.length,0)});

import {roomTemplates,compareLevels,reusableModels} from '../src/core.js';
test('all 30 room templates are editable populated projects',()=>{assert.equal(roomTemplates.length,30);for(const t of roomTemplates){const p=template(t.id,t.name);validate(p);assert.equal(rooms(p.levels[0]).length,1);assert.ok(p.levels[0].objects.length>0)}});
test('comparison calculates geometric deltas',()=>{const a=project(),b=project();rectangle(a.levels[0],{x:0,y:0},{x:4,y:4});rectangle(b.levels[0],{x:0,y:0},{x:5,y:4});assert.ok(compareLevels(a.levels[0],b.levels[0]).delta.floor>0);assert.equal(compareLevels(a.levels[0],a.levels[0]).delta.walls,0)});
test('reusable model collection deduplicates embedded content',()=>{const p=project();p.levels[0].objects=[{kind:'custom',modelData:'abc'},{kind:'custom',modelData:'abc'},{kind:'custom',modelData:'def'}];assert.equal(reusableModels([p]).length,2)});

import {normalizePolygon,rectanglePoints,setParcel,setPolygonParcel,polygonMetrics,parcelCoverage} from '../src/core.js';
test('closed landscape accepts repeated first vertex and preserves exact area',()=>{const p=project(),pts=rectanglePoints({x:0,y:0},{x:5,y:4});const a=addLandscape(p,'grass',[...pts,pts[0]]);assert.equal(a.points.length,4);assert.equal(polygonMetrics(a.points).area,20);assert.equal(validate(p),p)});
test('dimensioned rotated parcel keeps exact area and perimeter',()=>{const p=project();setParcel(p,{x:2,y:3,width:20,depth:30,rotation:37});const q=parcelCoverage(p);assert.ok(Math.abs(q.area-600)<1e-7);assert.ok(Math.abs(q.perimeter-100)<1e-7);assert.equal(validate(p),p)});
test('free parcel normalizes closure and rejects bow tie',()=>{const p=project(),a=rectanglePoints({x:0,y:0},{x:4,y:5});setPolygonParcel(p,[...a,a[0]]);assert.equal(p.parcel.points.length,4);assert.throws(()=>setPolygonParcel(p,[a[0],a[2],a[1],a[3]]))});

import {endpointAt,landscapeFinish} from '../src/core.js';
test('exact line endpoint preserves length and angle',()=>{const a={x:2,y:3},q=endpointAt(a,4,30);assert.ok(Math.abs(Math.hypot(q.x-a.x,q.y-a.y)-4)<1e-9);assert.ok(Math.abs(q.y-5)<1e-9);assert.throws(()=>endpointAt(a,0,0));assert.equal(landscapeFinish('gravel'),'gravel-1')});

import {lineAngle,cornerAngle,displaySettings,elementDimensions} from '../src/core.js';
test('drawing angle uses clockwise plan coordinates and interior corner',()=>{const a={x:0,y:0};assert.equal(lineAngle(a,{x:0,y:1}),90);assert.equal(lineAngle(a,{x:0,y:-1}),270);assert.equal(cornerAngle(a,{x:2,y:0},{x:2,y:2}),90)});test('display settings accept only boolean flags',()=>{const d=displaySettings({grid:false,angles:'bad'});assert.equal(d.grid,false);assert.equal(d.angles,true)});

import {dimensionNotes} from '../src/core.js';
test('context measurements use wall and rotated furniture geometry without duplicates',()=>{const p=project(),l=p.levels[0];rectangle(l,{x:0,y:0},{x:6,y:4});const w=l.walls[0];assert.equal(dimensionNotes(l,{type:'wall',id:w.id},p),1);assert.equal(dimensionNotes(l,{type:'wall',id:w.id},p),0);const o=object('table',{x:2,y:2});o.rotation=37;l.objects.push(o);assert.equal(dimensionNotes(l,{type:'object',id:o.id},p),2);assert.equal(l.notes.length,3)});
