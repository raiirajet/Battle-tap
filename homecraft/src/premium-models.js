import {sixthPack} from './premium-pack6.js';
import {fifthPack} from './premium-pack5.js';
import {fourthPack} from './premium-pack4.js';
import {thirdPack} from './premium-pack3.js';
import {secondPack} from './premium-pack2.js';
// Original procedural 3D assets. Each entry has a distinct component recipe,
// not a colour/size variant. Normalized dimensions: x,z centered; y starts at floor.
const B=(x,y,z,w,h,d,color='body',shape='box',extra={})=>({x,y,z,w,h,d,color,shape,...extra});
const S=(x,y,z,w,h,d,c='body')=>B(x,y,z,w,h,d,c,'soft');
const C=(x,y,z,w,h,d,c='body',top=1)=>B(x,y,z,w,h,d,c,'cylinder',{top});
const E=(x,y,z,w,h,d,c='body')=>B(x,y,z,w,h,d,c,'sphere');
const R=(x,y,z,w,h,d,c='body')=>B(x,y,z,w,h,d,c,'ring');
const glass='#80b5c7',dark='#30383b',metal='#92999b',wood='#9b7351',white='#f2eee6',green='#557e4a';
const feet=(y=.16)=>[-1,1].flatMap(x=>[-1,1].map(z=>B(x*.38,y/2,z*.36,.07,y,.07,wood)));
const shelf=(n=3)=>[B(-.47,.5,0,.06,1,.96),B(.47,.5,0,.06,1,.96),B(0,.5,-.46,.9,1,.06),...Array.from({length:n+1},(_,i)=>B(0,.04+i*.92/n,0,.9,.06,.92))];
const wheels=(y=.22)=>[-1,1].flatMap(x=>[-1,1].flatMap(z=>[B(x*.43,y,z*.30,.15,.36,.24,dark,'wheel'),B(x*.43,y,z*.30,.12,.19,.13,metal,'hub')]));
const defs=[
 ['chaise','Chaiselongue','Wohnen',1.8,.85,.85,'#a29a88',[...feet(.12),S(0,.30,0,.94,.34,.88),S(-.35,.62,-.17,.28,.70,.60),S(-.12,.53,-.40,.72,.35,.15),S(.21,.48,0,.42,.12,.80,white)]],
 ['beanbag','Sitzsack','Wohnen',.95,.95,.85,'#8d9c92',[E(0,.32,0,.96,.64,.98),E(0,.61,-.15,.65,.66,.66),S(0,.35,.18,.60,.13,.52)]],
 ['rocker','Schaukelstuhl','Wohnen',.72,1.05,1.12,'#b48f6c',[...[-1,1].flatMap(x=>[S(x*.39,.06,0,.10,.12,.98,wood),B(x*.39,.28,0,.07,.4,.07,wood),B(x*.39,.55,0,.08,.06,.65,wood)]),S(0,.46,0,.83,.12,.65),S(0,.73,-.28,.83,.52,.13)]],
 ['daybed','Tagesbett','Schlafen',2.1,.95,.88,'#b8a599',[...feet(.1),S(0,.22,0,.97,.25,.93,wood),S(0,.42,0,.94,.22,.91,white),S(0,.66,-.42,.96,.58,.12),S(-.40,.59,0,.13,.42,.94),S(.40,.59,0,.13,.42,.94)]],
 ['bunk','Etagenbett','Schlafen',1.05,2.1,1.85,'#c7a17d',[...[-1,1].flatMap(x=>[-1,1].map(z=>B(x*.45,.50,z*.45,.08,1,.08))),...([.25,.73].flatMap(y=>[B(0,y,0,.94,.06,.94),S(0,y+.06,0,.85,.07,.86,white),B(0,y+.13,-.44,.9,.09,.06)])),...Array.from({length:5},(_,i)=>B(.31,.12+i*.15,.46,.26,.035,.05,wood)),B(.17,.42,.46,.035,.84,.045,wood),B(.45,.42,.46,.035,.84,.045,wood)]],
 ['crib','Babybett','Schlafen',.75,1.4,1.02,'#d7d1c0',[...feet(.12),B(0,.23,0,.95,.07,.95),S(0,.33,0,.84,.10,.84,white),...[-1,1].flatMap(x=>[B(x*.45,.75,0,.09,.06,.96),...Array.from({length:7},(_,i)=>B(x*.45,.52,-.42+i*.14,.045,.46,.035))]),B(0,.59,-.45,.90,.37,.07),B(0,.59,.45,.90,.37,.07)]],
 ['roundDining','Runder Esstisch','Wohnen',1.25,1.25,.76,'#a57e59',[C(0,.95,0,1,.10,1),C(0,.48,0,.19,.88,.19,dark),C(0,.045,0,.68,.09,.68,dark)]],
 ['trestle','Tisch mit Böcken','Büro',1.6,.8,.75,'#bb976e',[B(0,.95,0,1,.1,1),...[-1,1].flatMap(x=>[B(x*.34,.47,-.32,.07,.89,.07,dark),B(x*.34,.47,.32,.07,.89,.07,dark),B(x*.34,.18,0,.08,.07,.68,dark)]),B(0,.43,0,.75,.07,.07,wood)]],
 ['nestTables','Satztische','Wohnen',.98,.64,.54,'#9e8062',[C(-.19,.94,-.12,.61,.12,.70),C(-.19,.49,-.12,.08,.90,.09,dark),C(-.19,.05,-.12,.50,.10,.52,dark),C(.25,.67,.19,.48,.10,.57,white),C(.25,.34,.19,.07,.62,.08,dark),C(.25,.045,.19,.36,.09,.38,dark)]],
 ['openBookcase','Offenes Bücherregal','Büro',.95,.34,1.8,'#ac855d',[...shelf(4),...Array.from({length:12},(_,i)=>B(-.36+(i%4)*.15,.15+Math.floor(i/4)*.23,.05,.10,.15,.57,['#875a4b','#758e87','#c3b273'][i%3]))]],
 ['displayCabinet','Glasvitrine','Wohnen',.9,.42,1.85,'#ab967e',[...shelf(3),B(0,.5,.46,.86,.92,.025,glass,'box',{glass:true}),B(0,.5,.48,.035,.90,.04,dark),B(.15,.52,.49,.04,.10,.02,metal)]],
 ['shoeBench','Schuhbank','Wohnen',1.0,.38,.48,'#b99a75',[B(0,.91,0,.98,.18,.98),B(-.46,.42,0,.08,.84,.92),B(.46,.42,0,.08,.84,.92),B(0,.32,0,.9,.08,.85),B(0,.60,0,.9,.08,.85)]],
 ['kitchenIsland','Kücheninsel mit Sitzseite','Küche',1.85,.95,.93,'#d4d0c6',[B(-.12,.44,0,.72,.82,.8),B(0,.94,0,1,.12,1,white),...[-1,1].map(z=>B(-.12,.48,z*.42,.64,.04,.035,metal)),B(-.12,.045,0,.68,.09,.76,dark)]],
 ['rangeCooker','Freistehender Herd','Küche',.9,.65,.91,'#a7aeb0',[B(0,.46,0,.98,.92,.94),B(0,.95,0,.98,.10,.95,dark),...[-1,1].flatMap(x=>[-1,1].map(z=>C(x*.24,.994,z*.24,.28,.012,.28,metal))),B(0,.43,.48,.83,.42,.04,dark),B(0,.70,.48,.68,.035,.035,metal),...[-.3,0,.3].map(x=>C(x,.84,.48,.10,.045,.06,dark))]],
 ['espresso','Siebträgermaschine','Küche',.32,.43,.40,'#aeb5b6',[S(0,.46,-.16,.95,.9,.64),B(0,.96,-.16,.86,.08,.64,metal),B(0,.08,.22,.95,.16,.55,dark),C(0,.62,.20,.35,.13,.32,metal),B(.24,.58,.24,.45,.07,.08,dark),C(0,.29,.22,.22,.24,.20,white)]],
 ['toaster','Doppelschlitz-Toaster','Küche',.32,.2,.22,'#c0c3c1',[S(0,.49,0,1,.98,1),...[-1,1].map(z=>B(0,.98,z*.17,.68,.04,.13,dark)),B(.48,.59,0,.04,.10,.27,dark)]],
 ['standMixer','Küchenmaschine','Küche',.36,.25,.39,'#b27b65',[S(-.18,.08,0,.64,.16,.95),S(-.28,.52,0,.34,.85,.78),S(0,.83,0,.95,.30,.72),C(.18,.34,0,.50,.45,.86,metal,.75),C(.18,.60,0,.08,.18,.10,metal)]],
 ['wineCooler','Weinkühlschrank','Küche',.6,.62,1.25,'#434b50',[B(0,.5,0,1,1,.94),B(0,.50,.47,.82,.86,.035,glass,'box',{glass:true}),...Array.from({length:5},(_,i)=>B(0,.15+i*.16,.09,.81,.025,.68,wood)),B(.44,.53,.49,.045,.30,.025,metal)]],
 ['laundryTower','Waschturm','Bad',.68,.69,1.85,'#deded8',[B(0,.25,0,1,.50,.94),B(0,.75,0,1,.50,.94),...([.23,.73].flatMap(y=>[R(0,y,.48,.76,.34,.04,dark),E(0,y,.48,.60,.26,.025,glass),B(0,y+.19,.48,.78,.055,.035,metal)]))]],
 ['vanityRound','Waschtisch mit Aufsatzbecken','Bad',1.0,.55,.90,'#a88b6d',[B(0,.35,0,.97,.70,.95),B(0,.74,0,1,.08,1,white),C(0,.86,0,.50,.24,.65,white,.72),C(0,.988,-.32,.06,.024,.08,metal),B(0,.86,-.33,.045,.25,.045,metal)]],
 ['saunaBench','Saunabank zweistufig','Bad',1.8,.95,.90,'#c49b6b',[...Array.from({length:6},(_,i)=>B(0,.95,-.45+i*.083,.98,.10,.066)),...Array.from({length:5},(_,i)=>B(0,.5,.06+i*.095,.98,.10,.075)),...[-1,1].flatMap(x=>[B(x*.42,.47,-.28,.07,.93,.08,wood),B(x*.42,.24,.3,.07,.48,.08,wood)])]],
 ['mirrorCabinet','Spiegelschrank','Bad',.9,.18,.75,'#b9c8cb',[B(0,.5,0,1,1,.86,white),...[-1,1].map(x=>B(x*.23,.5,.46,.44,.86,.04,glass)),B(0,.96,.47,.90,.05,.04,white)]],
 ['tripodLamp','Dreibein-Stehlampe','Licht',.62,.62,1.55,'#c2a37e',[...[-1,1].map(x=>B(x*.24,.34,.16,.045,.70,.055,wood,'box',{rz:x*.20})),B(0,.34,-.26,.05,.70,.05,wood,'box',{rx:-.25}),C(0,.79,0,.055,.24,.055,metal),C(0,.91,0,.76,.18,.76,white,.65)]],
 ['pendantCluster','Drei Pendelleuchten','Licht',.78,.34,.86,'#c3a576',[B(0,.98,0,.92,.04,.30,metal),...[-1,0,1].flatMap((x,i)=>{const y=.26+i*.13;return [C(x*.31,(1+y)/2,0,.025,1-y,.045,dark),C(x*.31,y,0,.29,.25,.82,i===1?white:'#aa8e69',.55)]})]],
 ['wallSconce','Wandleuchte mit Kugel','Licht',.24,.19,.32,'#c4a16a',[B(0,.48,-.42,.55,.86,.12,metal),B(0,.32,-.11,.12,.10,.58,dark),E(0,.67,.12,.82,.65,.76,white)]],
 ['deskAdjustable','Steh-Sitz-Schreibtisch','Büro',1.45,.75,1.18,'#b6a085',[B(0,.975,0,1,.05,1),...[-1,1].flatMap(x=>[B(x*.39,.36,0,.08,.65,.10,dark),B(x*.39,.79,0,.06,.25,.08,metal),B(x*.39,.03,0,.08,.06,.88,dark)]),B(0,.53,0,.76,.045,.08,dark)]],
 ['monitorDual','Doppelmonitor-Arbeitsplatz','Technik',1.1,.27,.54,'#323b41',[...[-1,1].flatMap(x=>[S(x*.25,.65,-.15,.48,.65,.20,dark),B(x*.25,.65,-.045,.43,.57,.035,'#687e8b'),B(x*.25,.22,-.15,.04,.28,.12,metal),B(x*.25,.04,.05,.28,.08,.85,dark)])]],
 ['serverRack','Netzwerkschrank','Technik',.6,.65,1.3,'#434b51',[B(0,.5,0,1,1,.94),...Array.from({length:8},(_,i)=>[B(0,.15+i*.10,.48,.84,.07,.035,i%2?metal:dark),B(-.34,.15+i*.10,.50,.04,.02,.012,'#69bc75')]).flat()]],
 ['treadmill','Laufband','Sport',.85,1.8,1.35,'#434b50',[S(0,.08,0,.93,.16,.98),B(0,.16,0,.75,.025,.78,dark),...[-1,1].map(x=>B(x*.41,.5,-.34,.06,.75,.06,metal)),S(0,.90,-.34,.80,.18,.22),B(0,.96,-.31,.54,.03,.14,dark)]],
 ['weightsRack','Hantelregal','Sport',1.1,.48,.85,'#5a656a',[...[-1,1].map(x=>B(x*.43,.45,0,.09,.90,.8,dark)),...([.28,.67].flatMap(y=>[B(0,y,0,.93,.06,.72),...[-.27,0,.27].flatMap(x=>[C(x,y+.11,0,.18,.16,.28,metal),B(x,y+.11,0,.23,.06,.09,dark)])]))]],
 ['planterRaised','Hochbeet','Garten',1.4,.7,.8,'#ad8861',[...feet(.15),B(0,.51,0,.98,.72,.98),B(0,.88,0,.84,.04,.84,'#65533f'),...[-.3,0,.3].map(x=>E(x,.94,0,.24,.12,.45,green))]],
 ['greenhouse','Gewächshaus','Garten',2.6,3.2,2.4,'#9ba4a0',[...[-1,1].flatMap(x=>[-1,1].map(z=>B(x*.46,.36,z*.46,.035,.72,.035,metal))),...[-1,1].flatMap(x=>[B(x*.48,.36,0,.025,.72,.95,glass,'box',{glass:true}),B(x*.24,.84,0,.50,.025,.95,glass,'box',{glass:true,rz:x*-.48})]),B(0,.98,0,.035,.025,.96,metal),B(0,.36,-.48,.96,.72,.025,glass,'box',{glass:true}),B(0,.34,.48,.32,.68,.03,glass,'box',{glass:true})]],
 ['pergola','Gartenpergola','Garten',3.2,3.2,2.45,'#a78963',[...[-1,1].flatMap(x=>[-1,1].map(z=>B(x*.45,.47,z*.45,.045,.94,.045))),...[-1,1].map(z=>B(0,.95,z*.45,.98,.06,.06)),...Array.from({length:8},(_,i)=>B(-.45+i*.129,.985,0,.035,.03,1))]],
 ['gardenSwing','Gartenschaukel','Garten',2.0,1.45,2.1,'#aa8761',[...[-1,1].flatMap(x=>[-1,1].map(z=>B(x*.45,.48,z*.23,.055,.96,.055,wood,'box',{rx:z*.25}))),B(0,.96,0,.98,.08,.08,wood),...[-1,1].map(x=>B(x*.28,.60,0,.018,.66,.025,metal)),B(0,.25,0,.68,.08,.42)]],
 ['barbecueCart','Grillwagen','Garten',1.25,.58,1.12,'#60686c',[...feet(.42),S(0,.69,0,.60,.38,.90),S(0,.91,0,.60,.18,.90,dark),B(-.40,.70,0,.20,.045,.72,metal),B(.40,.70,0,.20,.045,.72,metal),B(0,.39,0,.62,.05,.80,metal)]],
 ['gardenFountain','Gartenbrunnen','Garten',1.3,1.3,1.2,'#9fa7a3',[C(0,.12,0,1,.24,1,'#9da5a1'),C(0,.25,0,.90,.035,.90,glass),C(0,.51,0,.13,.51,.13,metal),C(0,.74,0,.54,.09,.54,'#aab1a9',.55),C(0,.79,0,.44,.025,.44,glass),E(0,.91,0,.14,.18,.14,glass)]],
 ['oliveTree','Olivenbaum im Kübel','Dekoration',1.05,1.05,1.85,'#74865e',[C(0,.12,0,.45,.24,.45,'#a47d62',.70),C(0,.43,0,.075,.55,.075,wood),...[-1,0,1].flatMap(x=>[E(x*.23,.70+Math.abs(x)*.03,-.08,.50,.48,.60,green),E(x*.19,.83,.17,.44,.30,.48,'body')])]],
 ['cactusTall','Säulenkaktus','Dekoration',.5,.5,1.25,'#658c56',[C(0,.14,0,.80,.28,.80,'#b98969',.75),S(0,.59,0,.27,.82,.28),S(-.28,.52,0,.22,.48,.23),S(.28,.68,0,.22,.44,.23),S(-.14,.36,0,.29,.13,.23),S(.14,.49,0,.29,.13,.23)]],
 ['suv','SUV','Fahrzeuge',1.95,4.65,1.75,'#879ba3',[...wheels(.20),S(0,.38,0,.98,.46,.98),S(0,.73,-.07,.83,.45,.57),B(0,.77,.22,.74,.27,.035,glass),B(0,.76,-.36,.71,.25,.035,glass),...[-1,1].map(x=>B(x*.425,.77,-.06,.02,.26,.49,glass)),B(0,.42,.49,.62,.13,.02,dark),...[-1,1].map(x=>B(x*.36,.49,.49,.21,.08,.02,white))]],
 ['pickup','Pickup','Fahrzeuge',2.0,5.25,1.85,'#a59079',[...wheels(.20),S(0,.38,0,.96,.43,.98),S(0,.73,.15,.84,.46,.43),B(0,.77,.37,.75,.26,.03,glass),B(0,.77,-.07,.75,.26,.03,glass),B(0,.58,-.28,.73,.035,.37,dark),...[-1,1].map(x=>B(x*.44,.58,-.29,.08,.22,.40)),B(0,.57,-.48,.86,.22,.04)]],
 ['van','Transporter','Fahrzeuge',2.05,5.1,2.5,'#d0d3cd',[...wheels(.16),S(0,.52,-.06,.98,.92,.86),S(0,.53,.42,.94,.68,.15),B(0,.67,.49,.82,.24,.02,glass),...[-1,1].map(x=>B(x*.48,.65,.32,.025,.25,.24,glass)),B(0,.49,-.49,.035,.70,.02,dark),...[-1,1].map(x=>B(x*.38,.25,-.49,.12,.15,.02,'#ad4840'))]],
 ['chargingPost','Wallbox-Ladestation','Technik',.32,.28,1.3,'#c5c9c4',[B(0,.45,0,.27,.9,.32,metal),S(0,.84,0,.92,.32,.87),B(0,.88,.44,.45,.10,.04,dark),R(0,.39,.26,.72,.37,.05,dark),B(.35,.58,.35,.12,.12,.10,dark)]]
];
const allDefs=[...defs,...secondPack,...thirdPack,...fourthPack,...fifthPack,...sixthPack];
export const premiumCatalog=allDefs.map(([id,name,category,width,depth,height,color])=>({kind:'pro_'+id,name,category,width,depth,height,color,collection:sixthPack.some(q=>q[0]===id)?'pro17f':fifthPack.some(q=>q[0]===id)?'pro17e':fourthPack.some(q=>q[0]===id)?'pro17d':thirdPack.some(q=>q[0]===id)?'pro17c':secondPack.some(q=>q[0]===id)?'pro17b':'pro17'}));
const recipes=new Map(allDefs.map(([id,,,,,,,parts])=>['pro_'+id,parts]));
export function premiumParts(o){const parts=recipes.get(o.kind);if(!parts)return null;return parts.map(q=>({...q,color:q.color==='body'?o.color:q.color,x:q.x*o.width,y:q.y*o.height,z:q.z*o.depth,w:q.w*o.width,h:q.h*o.height,d:q.d*o.depth}))}
export function isPremium(o){return recipes.has(o.kind)}
// Lightweight deterministic isometric SVG thumbnail generated from the same component geometry.
export function premiumThumbnail(o){const parts=premiumParts(o);if(!parts)return '';const scale=32/Math.max(o.width+o.depth*.55,o.height+o.depth*.35,.03),X=(x,z)=>48+(x-z*.55)*scale,Y=(y,z)=>74-(y+z*.35)*scale;const esc=c=>/^#[0-9a-f]{6}$/i.test(c)?c:'#9ba4a0';return '<svg viewBox="0 0 96 82" width="96" height="82" aria-hidden="true">'+parts.slice().sort((a,b)=>a.z-b.z||a.y-b.y).map(q=>{const x=X(q.x,q.z),y=Y(q.y,q.z),w=Math.max(1,(q.w+q.d*.35)*scale),h=Math.max(1,(q.h+q.d*.20)*scale),c=esc(q.color);return ['sphere','ring','wheel'].includes(q.shape)?'<ellipse cx="'+x+'" cy="'+y+'" rx="'+w/2+'" ry="'+h/2+'" fill="'+(['ring','wheel'].includes(q.shape)?'none':c)+'" stroke="'+c+'" stroke-width="'+(['ring','wheel'].includes(q.shape)?2:0)+'"/>':'<rect x="'+(x-w/2)+'" y="'+(y-h/2)+'" width="'+w+'" height="'+h+'" rx="'+(q.shape==='soft'?3:1)+'" fill="'+c+'" stroke="#52625e" stroke-width=".35" opacity="'+(q.glass?.5:1)+'"/>'}).join('')+'</svg>'}
