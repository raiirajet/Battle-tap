export const VERSION=1;
import {findPath,nearestCell,advanceActor,naval} from './movement.mjs';
import {claimMission as claimCampaign} from './campaign.mjs';
import {buildings,units,heroes,technologies,ages,achievementThresholds,implementedTech} from './catalog.mjs';
export {heroes,technologies,ages,achievementThresholds,implementedTech};
export const BUILD=buildings;
for(const [k,res,rate] of [['wood','H',12],['stone','S',8],['farm','N',10],['hunt','N',14],['fish','N',12],['iron','E',6],['gold','G',5],['town','W',2],['school','W',3],['library','W',4],['academy','W',6],['ranch','N',8]])Object.assign(BUILD[k],{res,rate});
BUILD.town.cap=10;BUILD.house.cap=5;
export const UNITS={...units,hero:{name:'Kriegsherr',hp:620,atk:24,armor:10,pop:1}};
export const SIZE=48;
export const sources=(x,y)=>x<4&&y<17?'forest':x>=20&&x<24&&y<12?'rock':null;
export const isWater=(x,y)=>x>=18&&y>=18&&x<24&&y<24;
const building=(type,x,y,left=0)=>({type,x,y,left,workers:0,level:1});
export function create(name='Neues Banner',hero='Aldric Valen'){return extend({version:VERSION,name,hero,t:0,r:{H:300,S:150,N:350,G:100,E:0,W:0,I:0},pop:8,buildings:[building('town',10,10),building('house',8,10)],units:[{type:'scout',hp:65},{type:'hero',hp:heroes[hero]?.hp||620}],queue:[],focus:100,cooldown:0,morale:50,enemy:[],battle:false,won:false,reward:false,delivered:0,explored:false,chronicle:[]});}
export const done=(s,type)=>s.buildings.filter(b=>b.type===type&&b.left===0);
export const capacity=s=>Math.min([0,30,80,150,250,350][s.age],s.buildings.reduce((n,b)=>n+(b.left===0?(b.type==='house'?5*b.level:b.type==='town'?10:0):0),0));
export const occupied=s=>s.pop+s.units.reduce((n,u)=>n+(UNITS[u.type].pop||1),0)+s.queue.reduce((n,q)=>n+(UNITS[q.type]?.pop||1),0);
export const builders=s=>s.buildings.filter(b=>b.left>0).length;
export const free=s=>s.pop-builders(s)-s.buildings.reduce((n,b)=>n+b.workers,0);
export const canPay=(s,c)=>Object.entries(c).every(([k,v])=>s.r[k]>=v);
const pay=(s,c)=>{for(const[k,v]of Object.entries(c))s.r[k]-=v};
export const limit=(s,k)=>k==='G'?1000+done(s,'bank').length*3000:['H','S','N','E'].includes(k)?500+done(s,'storage').reduce((n,b)=>n+Math.floor(500*(1+.2*(b.level-1))),0):Infinity;
const add=(s,k,v)=>s.r[k]=Math.max(0,Math.min(limit(s,k),s.r[k]+v));
export function place(s,type,x,y){
 const d=BUILD[type];if(!d||['town','province','wonder'].includes(type)||d.age>s.age||!Number.isInteger(x)||!Number.isInteger(y)||free(s)<1||builders(s)>=Math.min(24,12+4*done(s,'yard').length)||!canPay(s,d.cost))return false;
 const[w,h]=d.size;if(x<0||y<0||x+w>SIZE||y+h>SIZE)return false;
 for(let a=x;a<x+w;a++)for(let b=y;b<y+h;b++)if(sources(a,b)||isWater(a,b)||s.roads.some(r=>r.x===a&&r.y===b)||s.units.some(u=>u.hp>0&&Math.floor(u.x)===a&&Math.floor(u.y)===b))return false;
 if(s.buildings.some(b=>x<b.x+BUILD[b.type].size[0]&&x+w>b.x&&y<b.y+BUILD[b.type].size[1]&&y+h>b.y))return false;
 if(['fish','port','shipyard'].includes(type)&&!Array.from({length:w*h},(_,i)=>[x+i%w,y+Math.floor(i/w)]).some(([a,b])=>[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>isWater(a+dx,b+dy))))return false;
 pay(s,d.cost);const b=building(type,x,y,Math.ceil(d.time*(1-bonus(s,'B02',.05)-bonus(s,'B09',.10))));b.total=b.left;b.reserved={...d.cost};s.buildings.push(b);return true;
}
export function assign(s,index,delta){const b=s.buildings[index];if(!b||b.left||![-1,1].includes(delta)||b.workers+delta<0||b.workers+delta>(BUILD[b.type].jobs||0)||(delta>0&&free(s)<1))return false;b.workers+=delta;return true;}
export function train(s,type){const d=type==='citizen'?{cost:{N:50},time:25}:UNITS[type];if(!d?.cost||occupied(s)+(d?.pop||1)>capacity(s)||!canPay(s,d.cost))return false;if(type==='citizen'?s.satisfaction<30||s.queue.some(q=>q.type==='citizen'):d.age>s.age||!done(s,d.site).length||s.queue.filter(q=>q.type!=='citizen'&&UNITS[q.type]?.site===d.site).length>=5*done(s,d.site).length||!unitAllowed(s,type))return false;pay(s,d.cost);if(type!=='citizen')for(const [k,v] of Object.entries(gear[type]||{}))s.goods[k]-=v;s.queue.push({type,left:Math.ceil(d.time*(1-(type==='citizen'?bonus(s,'P04',.1):type==='militia'?bonus(s,'M01',.1):0)))});return true;}
export function water(s){return 20+40*done(s,'well').length*(1+bonus(s,'W06',.2))}
export function beginBattle(s){if(s.won||s.battle||s.expeditions.length||s.negotiated||s.units.filter(u=>u.type==='militia'&&u.hp>0).length<2||!s.explored)return false;s.enemy=[40,40,40];s.battle=true;return true;}
export function rally(s){if(heroes[s.hero]?.role!=='Kriegsherr'||!s.battle||s.focus<20||s.cooldown||!s.units.some(u=>u.type==='hero'&&u.hp>0))return false;s.focus-=20;s.cooldown=35;s.morale=Math.min(100,s.morale+15);return true;}
export const damage=(atk,armor)=>Math.max(1,Math.round(atk*100/(100+armor)));
export function tick(s,advanceMovement=true){
 s.t++;const previousFood=s.r.N;if(advanceMovement)moveUnits(s,1);society(s);progressResearch(s);s.focus=Math.min(100,s.focus+(s.battle?2:5));s.cooldown=Math.max(0,s.cooldown-1);
 for(const b of s.buildings)if(b.left>0){b.left--;if(!b.left){delete b.reserved;delete b.total;if(b.upgrade){b.level=b.upgrade;delete b.upgrade;}else{const k=b.type+':'+b.x+':'+b.y;if(!s.history[k]||s.t-s.history[k]>=600){s.stats.AUF++;s.history[k]=s.t}}}}
 const citizen=s.queue.find(q=>q.type==='citizen'),military=s.queue.find(q=>q.type!=='citizen');
 for(const q of [citizen,military].filter(Boolean)){q.left--;if(q.left<=0){if(q.type==='citizen'){s.pop++;s.recruited++;}else{s.units.push({type:q.type,hp:UNITS[q.type].hp});syncActors(s);s.trained++;}s.queue.splice(s.queue.indexOf(q),1);}}
 let farmWorkers=0;for(const b of done(s,'farm'))farmWorkers+=b.workers;
 const irrigated=Math.max(0,Math.min(farmWorkers,Math.floor((water(s)-s.pop)/2)));
 let n=irrigated;
 for(const b of s.buildings){if(b.left||!b.workers)continue;const d=BUILD[b.type];if(!d.res){recipe(s,b,b.workers);continue;}const workers=b.type==='farm'?Math.min(n,b.workers):b.workers;if(b.type==='farm')n-=workers;if(recipe(s,b,workers))continue;const before=s.r[d.res];const multiplier=production(s,b);add(s,d.res,d.rate*workers*multiplier/60);const delta=s.r[d.res]-before;s.stats.WIR+=Math.max(0,delta);if(b.type==='wood')s.delivered+=delta;if(b.type==='ranch')s.goods.wool=Math.min(100,s.goods.wool+workers*2/60);}
 add(s,'N',-(2*s.pop+s.units.reduce((n,u)=>n+(u.type==='hero'?3:2),0))/60);
 if(s.satisfaction>=30)add(s,'G',s.pop*.2*(s.tax/10)/60);s.positiveFood=s.r.N>previousFood||s.r.N>=limit(s,'N')?s.positiveFood+1:0;s.peakCapacity=Math.max(s.peakCapacity,capacity(s));tickExtras(s);
 if(s.battle&&s.t%2===0){
 const living=s.units.filter(u=>u.hp>0);for(const u of living){const i=s.enemy.findIndex(h=>h>0);if(i<0)break;if(!UNITS[u.type].atk||['ram','fishing','merchant','patrol','cart'].includes(u.type))continue;s.enemy[i]=Math.max(0,s.enemy[i]-damage((u.type==='hero'?(heroes[s.hero]?.atk||24):UNITS[u.type].atk)*(1+(s.morale-50)/200)*(1+(u.type==='bow'?bonus(s,'M04',.05):['ram','catapult','trebuchet'].includes(u.type)?bonus(s,'M09',.1):0)),3));}
 for(const hp of s.enemy)if(hp>0){const u=s.units.find(u=>u.type==='militia'&&u.hp>0)||s.units.find(u=>u.hp>0);if(u)u.hp=Math.max(0,u.hp-damage(8,UNITS[u.type].armor));}
 if(s.enemy.every(h=>h===0)){s.battle=false;s.won=true;s.stats.MIL++;s.chronicle.push('Das Übungslager ist besiegt.');}else if(!s.units.some(u=>u.hp>0)){s.battle=false;s.chronicle.push('Der Angriff scheiterte.');}
 s.units=s.units.filter(u=>u.hp>0||u.type==='hero');
 }
}
export function goal(s){if(s.reward)return ['Gründerbanner','Dein Reich ist gegründet. Baue weiter.'];if(s.delivered<24)return ['Das neue Banner','Baue ein Holzfällerlager und liefere 24 Holz mit zwei Arbeitern.'];if(!done(s,'farm').some(b=>b.workers>=3))return ['Brot für alle','Baue einen Bauernhof und weise drei Bewohner zu.'];if(done(s,'house').length<2||s.pop<9)return ['Ein sicheres Dach','Baue ein weiteres Haus und wirb im Arbeitsmenü einen Bewohner an.'];if(!done(s,'well').length||!done(s,'stone').some(b=>b.workers>0))return ['Wasser des Tals','Errichte Brunnen und Steinbruch; weise einen Steinmetz zu.'];if(s.units.filter(u=>u.type==='militia').length<2&&!s.won&&!s.negotiated)return ['Das erste Banner','Baue das Milizlager und bilde zwei Milizen aus.'];if(!s.explored)return ['Die Grenzbünde','Erkunde das Übungslager im Armeemenü.'];if(!s.won&&!s.negotiated)return ['Verteidige dein Reich','Starte den freiwilligen Übungskampf.'];return ['Der Rat','Weise dem Rathaus einen Berater zu und gründe dein Haus.'];}
export function claim(s){if(s.reward||s.delivered<24||!done(s,'farm').some(b=>b.workers>=3)||done(s,'house').length<2||s.pop<9||!done(s,'well').length||!done(s,'stone').some(b=>b.workers>0)||(!s.won&&!s.negotiated)||!done(s,'town').some(b=>b.workers))return false;s.reward=true;add(s,'I',50);add(s,'H',100);add(s,'S',75);add(s,'N',100);s.chronicle.push('Gründerbanner verliehen.');return true;}
export function load(raw){try{const s=JSON.parse(raw);if(s?.version!==VERSION||typeof s.name!=='string'||!Number.isInteger(s.t)||!Number.isInteger(s.pop)||!Array.isArray(s.buildings)||!Array.isArray(s.units)||!Array.isArray(s.queue)||!Array.isArray(s.enemy)||!Array.isArray(s.chronicle)||Object.keys(create().r).some(k=>!Number.isFinite(s.r?.[k])||s.r[k]<0)||s.buildings.some(b=>!BUILD[b.type]||!Number.isFinite(b.left)||!Number.isInteger(b.workers))||s.units.some(u=>!UNITS[u.type]||!Number.isFinite(u.hp)))return null;const migrated=extend(s);if(!validSave(migrated))return null;return migrated;}catch{return null;}}

const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const bonus=(s,id,n)=>s.tech.includes(id)?n:0;
export const gear={sword:{weapon:1},shield:{weapon:1,armor:1},knight:{horse:1,armor:1},cavalry:{horse:1},royal:{armor:1},ram:{tool:1},catapult:{tool:1},trebuchet:{tool:1},crown:{armor:1},ironwatch:{armor:1},sunrider:{horse:1}};
export const cultures=['Aurenthische Krone','Sylvanischer Bund','Eisenclans','Sonnenreich','Bund der Gezeiten','Nordische Häuser'];
function unitAllowed(s,type){const d=UNITS[type];if(!d)return false;if(type==='sword'&&!s.tech.includes('M03')||type==='royal'&&!s.tech.includes('M11'))return false;const elite=['crown','ranger','ironwatch','sunrider','tide','frost'];if(elite.includes(type)&&(elite[cultures.indexOf(s.culture)]!==type||s.units.filter(u=>elite.includes(u.type)).length+s.queue.filter(u=>elite.includes(u.type)).length>=Math.floor(occupied(s)*.1)))return false;return Object.entries(gear[type]||{}).every(([k,v])=>s.goods[k]>=v)}
const goodsKeys=['grain','flour','rawwood','hide','wool','leather','cloth','tool','weapon','armor','horse','medicine','luxury'];
function extend(s){s.age??=1;s.tech??=[];s.research??=[];s.tax??=10;s.health??=100;s.satisfaction??=80;s.hunger??=0;s.culture??=cultures[0];s.goods??=Object.fromEntries(goodsKeys.map(k=>[k,0]));s.stats??={AUF:s.buildings.filter(b=>!b.left).length,WIR:0,BEV:0,FOR:0,HAN:0,MIL:s.won?1:0,VER:0,ERK:0,DYN:0,DIP:0,PVP:0,END:0};s.history??={};s.badges??=[];s.profileXP??=0;s.market??={H:1,S:1,N:1,E:1};s.expeditions??=[];s.discovered??=[];s.seed??=12345;s.relation??=0;s.contract??=0;s.lastSuccession??=0;s.lineage??=0;s.legacy??=false;s.healCD??=0;s.treatments??=0;s.mode??='kingdom';s.campaignDone??=[];s.campaignXP??=0;s.roads??=[];s.cameraUsed??=false;s.scout??={x:14,y:10,path:[],credit:0};s.recruited??=Math.max(0,s.pop-8);s.trained??=Math.max(0,s.units.length-2);s.positiveFood??=0;s.peakCapacity??=0;s.waterCoverage??=1;s.negotiated??=false;s.localTrade??=0;s.produced??={tool:0,grain:0,flour:0,bakery:0};s.buildings.forEach(b=>{b.level??=1;b.mode??='direct';b.recipeProgress??=0});if(!Number.isFinite(s.peakCapacity)||s.peakCapacity<capacity(s))s.peakCapacity=capacity(s);syncActors(s);return s;}
export const season=s=>['Frühling','Sommer','Herbst','Winter'][Math.floor(s.t/8400)%4];
function society(s){const need=(2*s.pop+s.units.length*2)*5;const food=Math.min(100,s.r.N/Math.max(1,need)*100);const housing=Math.min(100,capacity(s)/Math.max(1,occupied(s))*100);const safety=clamp(50+Math.min(25,5*done(s,'tower').filter(b=>b.workers).length)-(s.battle?20:0),0,100);const culture=clamp(50+(done(s,'tavern').length?10:0)+(done(s,'temple').length?12:0)+(done(s,'theatre').length?15:0)+bonus(s,'P01',3)+bonus(s,'P12',8),0,100);s.waterCoverage=Math.min(1,water(s)/Math.max(1,s.pop+2*done(s,'farm').reduce((n,b)=>n+b.workers,0)));s.hunger=s.r.N<=0?s.hunger+1:0;if(s.hunger>120||water(s)<s.pop)s.health=Math.max(0,s.health-.05);else if(s.r.N>0)s.health=Math.min(100,s.health+.01);if(season(s)==='Winter'&&!done(s,'fire').length)s.health=Math.max(0,s.health-.02);s.satisfaction=clamp(.3*food+.2*housing+.2*safety+.15*s.health+.15*culture-1.2*Math.max(0,s.tax-10),0,100);if(s.health>=70&&food>=100&&housing>=100&&water(s)>=s.pop)s.stats.BEV=Math.max(s.stats.BEV,s.pop);}
function production(s,b){let m=s.satisfaction>=85?1.1:s.satisfaction>=70?1:s.satisfaction>=50?.9:s.satisfaction>=30?.75:.55;if(s.health<=0)return 0;let extra=0;if(b.type==='wood'){m*=1.2;extra+=bonus(s,'W01',.1)}if(b.type==='stone')extra+=bonus(s,'W04',.1);if(b.type==='iron')extra+=bonus(s,'W08',.15);if(b.type==='farm'){extra+=bonus(s,'W03',.15)+bonus(s,'W11',.15);m*=season(s)==='Winter'?(s.t<33600?.8:.6):season(s)==='Sommer'?1.2:1.1;}if(BUILD[b.type].res==='W')extra+=bonus(s,'K09',.15)+(b.type==='town'?bonus(s,'K01',.1):b.type==='school'?bonus(s,'K03',.1):b.type==='library'?bonus(s,'K06',.1):0);return Math.min(2,m*(1+extra));}
export function setTax(s,value){if(!Number.isInteger(value)||value<0||value>30)return false;s.tax=value;return true}
const recipes={farm:{chain:[{}, {grain:12},60]},wood:{chain:[{}, {rawwood:12},60]},hunt:{chain:[{}, {N:12,hide:1},60]},sawmill:{direct:[{rawwood:12},{H:15},60]},mill:{direct:[{grain:10},{flour:10},40]},bakery:{direct:[{flour:10,H:2},{N:15},40]},smith:{direct:[{E:4,H:3},{tool:1},35],weapon:[{E:5,H:2},{weapon:1},45]},armor:{direct:[{E:8,leather:2},{armor:1},60]},weaver:{direct:[{wool:4},{cloth:2},35]},tanner:{direct:[{hide:4},{leather:2},30]},horse:{direct:[{N:15},{horse:1},90]},clinic:{direct:[{N:5,G:2},{medicine:1},45]},luxury:{direct:[{cloth:2,G:2},{luxury:1},45]}};
export const modes=type=>Object.keys(recipes[type]||{});
export function setMode(s,index,mode){const b=s.buildings[index];if(!b||b.left||!['direct',...modes(b.type)].includes(mode)||b.recipeProgress>0)return false;if(mode==='weapon'&&!s.tech.includes('M03'))return false;b.mode=mode;return true}
function recipe(s,b,workers){const r=recipes[b.type]?.[b.mode||'direct'];if(!r)return false;const [input,output,time]=r;const stock=k=>Object.hasOwn(s.r,k)?s.r:s.goods;const cap=k=>Object.hasOwn(s.r,k)?limit(s,k):100;if(!workers||b.type==='horse'&&water(s)<s.pop+3*workers)return true;
 // Aggregate single-worker-equivalent cycles. Check input and output before each atomic exchange.
 const rate=production(s,b)*(1+bonus(s,'W12',.1)+(b.type==='bakery'?bonus(s,'W07',.1):b.type==='clinic'?bonus(s,'K08',.15):0));
 if(Object.entries(input).some(([k,v])=>stock(k)[k]<v)||Object.entries(output).some(([k,v])=>stock(k)[k]+v>cap(k)))return true;
 b.recipeProgress=(b.recipeProgress||0)+workers*rate;while(b.recipeProgress>=time){if(Object.entries(input).some(([k,v])=>stock(k)[k]<v)||Object.entries(output).some(([k,v])=>stock(k)[k]+v>cap(k))){b.recipeProgress=Math.min(b.recipeProgress,time);break;}for(const[k,v]of Object.entries(input))stock(k)[k]-=v;for(const[k,v]of Object.entries(output)){stock(k)[k]+=v;if(Object.hasOwn(s.produced,k))s.produced[k]+=v;if(b.type==='bakery'&&k==='N')s.produced.bakery+=v;if(Object.hasOwn(s.r,k)){s.stats.WIR+=v;if(k==='H')s.delivered+=v}}b.recipeProgress-=time;}return true;}
export function medicine(s){if(s.goods.medicine<1||s.healCD||s.health>=100)return false;s.goods.medicine--;s.health=Math.min(100,s.health+20+bonus(s,'K02',5));s.healCD=60;return true;}
export function upgrade(s,index){const b=s.buildings[index],d=b&&BUILD[b.type];if(!d||b.left||b.type==='wonder'||b.level>=Math.min(s.age+1,b.type==='palisade'?1:['gate','wall'].includes(b.type)?3:5)||free(s)<1)return false;const target=b.level+1,c=Object.fromEntries(Object.entries(d.cost).map(([k,v])=>[k,Math.ceil(v*.6*target)]));if(!canPay(s,c))return false;pay(s,c);b.upgrade=target;b.left=Math.ceil(d.time*.7*target);b.total=b.left;b.reserved=c;return true;}
export function demolish(s,index){const b=s.buildings[index];if(!b||b.left||b.type==='town')return false;for(const[k,v]of Object.entries(BUILD[b.type].cost))add(s,k,Math.floor(v*.25));s.buildings.splice(index,1);return true;}
export function research(s,id){const d=technologies[id];if(!d||!implementedTech.has(id)||s.research.length>=3||s.age<d.age||s.tech.includes(id)||s.research.some(q=>q.id===id)||!d.req.every(r=>s.tech.includes(r))||!canPay(s,d.cost))return false;pay(s,d.cost);s.research.push({id,left:Math.ceil(d.time*(1-bonus(s,'K12',.15))),cost:d.cost,started:false});return true;}
export function advance(s){const next=s.age+1,d=ages[next];if(!d||s.research.length>=3||s.research.some(q=>q.age)||occupied(s)-s.units.filter(u=>u.type==='hero').length<d.pop||!canPay(s,d.cost)||!done(s,'town').some(b=>b.level>=next-1))return false;const requirements=next===2?s.reward&&done(s,'farm').length&&done(s,'storage').length:next===3?done(s,'market').length&&done(s,'school').length&&s.stats.DIP>0:next===4?s.discovered.length>=3&&done(s,'library').length:s.legacy&&done(s,'academy').length;if(!requirements)return false;pay(s,d.cost);s.research.push({id:'AGE'+next,age:next,left:d.time,cost:d.cost,started:false});return true;}
export function cancelResearch(s,index){const q=s.research[index];if(!q)return false;for(const[k,v]of Object.entries(q.cost))add(s,k,Math.floor(v*(q.started?.5:1)));s.research.splice(index,1);return true;}
function progressResearch(s){const q=s.research[0];if(!q||!done(s,'town').length)return;q.started=true;if(--q.left>0)return;s.research.shift();if(q.age){s.age=q.age;s.chronicle.push('Zeitalter '+q.age+' erreicht.')}else{s.tech.push(q.id);s.stats.FOR=s.tech.length;if(q.id==='K05')s.health=Math.min(100,s.health+5);s.chronicle.push('Forschung '+q.id+' abgeschlossen.');}}
export function quote(s,k,buy){const base={H:100,S:130,N:100,E:180}[k];if(!base)return null;return buy?Math.ceil(base*s.market[k]):Math.floor(base*s.market[k]*(s.tech.includes('P03')?.82:.8));}
export function exchange(s,k,buy,expected){const p=quote(s,k,buy);if(p===null||expected!==p||!done(s,'market').length)return false;if(buy){if(s.r.G<p||s.r[k]+100>limit(s,k))return false;s.r.G-=p;s.r[k]+=100;}else{if(s.r[k]<100||s.r.G+p>limit(s,'G'))return false;s.r[k]-=100;s.r.G+=p;}s.market[k]=clamp(s.market[k]+(buy?.02:-.02),.5,2);s.localTrade+=100;return true;}
export const sites=[{name:'Verlassener Hof',age:1,time:180,cost:{N:20},risk:.05,reward:{N:60,H:40}},{name:'Alte Mine',age:2,time:300,cost:{N:35,G:10},risk:.15,reward:{E:60}},{name:'Banditenlager',age:2,time:480,cost:{N:50,G:20},risk:.25,reward:{G:120,I:15}},{name:'Versunkene Bibliothek',age:3,time:720,cost:{N:80,G:40},risk:.20,reward:{W:120}},{name:'Vergessene Festung',age:3,time:1200,cost:{N:120,G:60},risk:.35,reward:{I:40}},{name:'Kaiserliche Ruine',age:4,time:1800,cost:{N:200,G:100},risk:.45,reward:{W:200}}];
function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
export function expedition(s,index){const d=sites[index];if(!d||s.age<d.age||s.expeditions.length||s.discovered.includes(index)||s.battle||!s.units.some(u=>u.type==='hero'&&u.hp>0)||!canPay(s,d.cost))return false;pay(s,d.cost);s.expeditions.push({index,left:Math.ceil(d.time*(1-bonus(s,'K04',.1))),success:random(s)>=Math.max(.05,d.risk-(heroes[s.hero]?.role==='Waldläufer'?.05:0)+.1)});return true;}
export function treaty(s){if(s.age<2||s.contract>0||s.r.I<40)return false;s.r.I-=40;s.contract=7200;s.stats.DIP++;s.relation=Math.min(100,s.relation+10);return true;}
export function succession(s){if(s.age<3||!s.tech.includes('P08')||s.pop<50||s.r.I<200||s.t-s.lastSuccession<3600||!s.units.some(u=>u.type==='hero'&&u.hp>0)||s.battle||s.expeditions.length)return false;s.r.I-=200;s.lastSuccession=s.t;s.lineage++;s.stats.DYN=s.lineage;s.chronicle.push('Herrscherwechsel '+s.lineage);return true;}
function tickExtras(s){s.healCD=Math.max(0,s.healCD-1);if(s.contract>0)s.contract--;if(s.t%60===0)for(const k of Object.keys(s.market)){const d=1-s.market[k];s.market[k]+=Math.sign(d)*Math.min(.01,Math.abs(d));}for(const x of s.expeditions){if(--x.left>0)continue;const d=sites[x.index];for(const[k,v]of Object.entries(d.reward))add(s,k,Math.floor(v*(x.success?1:.25)));if(x.success){s.discovered.push(x.index);s.stats.ERK=s.discovered.length;}s.chronicle.push(d.name+(x.success?' erkundet':' – Rückkehr mit Verlusten'));}s.expeditions=s.expeditions.filter(x=>x.left>0);s.legacy||=s.tech.length>=40;s.stats.END=[s.age===5,occupied(s)>=200,s.tech.length===60,s.lineage>=10,s.discovered.length>=10].filter(Boolean).length;for(const [key,thresholds]of Object.entries(achievementThresholds))thresholds.forEach((n,i)=>{const id=key+'-'+String(i+1).padStart(2,'0');if(s.stats[key]>=n&&!s.badges.includes(id)){s.badges.push(id);s.profileXP+=50*(i+1);}});}

export function blocked(s,x,y){return !!sources(x,y)||isWater(x,y)||s.buildings.some(b=>x>=b.x&&y>=b.y&&x<b.x+BUILD[b.type].size[0]&&y<b.y+BUILD[b.type].size[1]);}
export function layRoad(s,x,y,kind='path'){const costs={path:{},dirt:{H:1},gravel:{S:2},paved:{S:4},imperial:{S:6,G:1}};const tech={gravel:'B03',paved:'B07',imperial:'B10'};if(!costs[kind]||!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=SIZE||y>=SIZE||blocked(s,x,y)||s.roads.some(r=>r.x===x&&r.y===y)||tech[kind]&&!s.tech.includes(tech[kind])||!canPay(s,costs[kind]))return false;pay(s,costs[kind]);s.roads.push({x,y,kind});return true;}
export function scoutTo(s,x,y){const u=s.units.find(u=>u.type==='scout'&&u.hp>0);return !!u&&commandUnit(s,u.id,x,y);}
export function negotiateCamp(s){if(s.mode!=='campaign'||s.won||s.negotiated||s.battle||!s.explored||s.r.G<80)return false;s.r.G-=80;s.negotiated=true;s.chronicle.push('Banditenlager friedlich befriedet.');return true;}
export function cancelBuild(s,index){const b=s.buildings[index];if(!b||!b.left||b.type==='town'&&!b.upgrade||!b.reserved||!b.total)return false;const fraction=b.left===b.total?1:.75*b.left/b.total;for(const[k,v]of Object.entries(b.reserved))add(s,k,Math.floor(v*fraction));if(b.upgrade){delete b.upgrade;delete b.reserved;delete b.total;b.left=0}else s.buildings.splice(index,1);return true;}
export function claimMission(s,id){return claimCampaign(s,id,(state,k)=>limit(state,k));}

function validSave(s){
 if(!Number.isInteger(s.age)||s.age<1||s.age>5||s.t<0||s.pop<0||s.pop>350||s.name.length>24||!heroes[s.hero]||!['kingdom','campaign'].includes(s.mode)||!cultures.includes(s.culture))return false;
 if(s.buildings.length>SIZE*SIZE||s.buildings.some(b=>!Number.isInteger(b.x)||!Number.isInteger(b.y)||b.x<0||b.y<0||b.x+BUILD[b.type].size[0]>SIZE||b.y+BUILD[b.type].size[1]>SIZE||!Number.isInteger(b.level)||b.level<1||b.level>5||b.left<0||b.workers<0||b.workers>BUILD[b.type].jobs))return false;
 if(!Array.isArray(s.tech)||s.tech.some(id=>!technologies[id])||new Set(s.tech).size!==s.tech.length||!Array.isArray(s.research)||s.research.length>3||s.research.some(q=>!q||(!technologies[q.id]&&!(q.age>=2&&q.age<=5))||!Number.isFinite(q.left)||q.left<0||!q.cost||Object.entries(q.cost).some(([k,v])=>!Object.hasOwn(s.r,k)||!Number.isFinite(v)||v<0)))return false;
 if(!Array.isArray(s.roads)||s.roads.length>SIZE*SIZE||s.roads.some(r=>!r||!Number.isInteger(r.x)||!Number.isInteger(r.y)||r.x<0||r.y<0||r.x>=SIZE||r.y>=SIZE))return false;
 if(!s.scout||!Number.isInteger(s.scout.x)||!Number.isInteger(s.scout.y)||s.scout.x<0||s.scout.y<0||s.scout.x>=SIZE||s.scout.y>=SIZE||!Array.isArray(s.scout.path)||s.scout.path.length>SIZE*SIZE||s.scout.path.some(p=>!p||!Number.isInteger(p.x)||!Number.isInteger(p.y)||p.x<0||p.y<0||p.x>=SIZE||p.y>=SIZE))return false;
 if(!Array.isArray(s.expeditions)||s.expeditions.length>1||s.expeditions.some(x=>!sites[x.index]||!Number.isFinite(x.left)||x.left<0)||!Array.isArray(s.discovered)||s.discovered.some(i=>!sites[i]))return false;
 if(!Array.isArray(s.campaignDone)||!Array.isArray(s.badges)||!s.stats||Object.keys(achievementThresholds).some(k=>!Number.isFinite(s.stats[k])||s.stats[k]<0)||goodsKeys.some(k=>!Number.isFinite(s.goods[k])||s.goods[k]<0)||!s.produced||!Object.keys({tool:0,grain:0,flour:0,bakery:0}).every(k=>Number.isFinite(s.produced[k])))return false;
 if(s.units.some(u=>!Number.isFinite(u.x)||!Number.isFinite(u.y)||u.x<0||u.y<0||u.x>=SIZE||u.y>=SIZE||!Number.isFinite(u.facing)||!Number.isFinite(u.stride)||!Array.isArray(u.path)||u.path.length>SIZE*SIZE||u.path.some(p=>!p||!Number.isInteger(p.x)||!Number.isInteger(p.y)||p.x<0||p.y<0||p.x>=SIZE||p.y>=SIZE)))return false;
 if(s.queue.length>350||s.queue.some(q=>!q||q.type!=='citizen'&&!UNITS[q.type]||!Number.isFinite(q.left)||q.left<=0)||s.units.length>350||s.units.some(u=>u.hp<0)||!Number.isFinite(s.health)||!Number.isFinite(s.tax)||s.tax<0||s.tax>30||!Number.isFinite(s.satisfaction))return false;
 return true;
}

export function unitBlocked(s,u,x,y){return x<0||y<0||x>=SIZE||y>=SIZE||(naval.has(u.type)?!isWater(x,y):blocked(s,x,y));}
export function syncActors(s){
 let next=Math.max(1,Number.isSafeInteger(s.nextUnitId)?s.nextUnitId:1,...s.units.map(u=>Number.isSafeInteger(u.id)?u.id+1:1));const seen=new Set();
 for(const u of s.units){
 if(!Number.isSafeInteger(u.id)||u.id<1||seen.has(u.id))u.id=next++;seen.add(u.id);
 if(!Number.isFinite(u.x)||!Number.isFinite(u.y)){const from=u.type==='scout'?s.scout:u.type==='hero'?{x:14,y:12}:naval.has(u.type)?{x:19,y:19}:{x:14,y:14};const p=nearestCell(SIZE,from.x,from.y,(x,y)=>unitBlocked(s,u,x,y),(x,y)=>s.units.some(v=>v!==u&&Math.floor(v.x)===x&&Math.floor(v.y)===y));u.x=(p?.x??from.x)+.5;u.y=(p?.y??from.y)+.5;}
 u.path??=[];u.facing??=Math.PI/2;u.stride??=0;u.moving??=false;u.run??=false;
 }s.nextUnitId=next;
}
export const unitSpeed=(s,u)=>(u.type==='hero'?heroes[s.hero]?.speed||2.5:UNITS[u.type].speed||2.5)*(u.run?1.25:1);
export function commandUnit(s,id,x,y){
 const u=s.units.find(v=>v.id===id);if(!u||u.hp<=0||s.expeditions.length||!Number.isInteger(x)||!Number.isInteger(y))return false;
 const start={x:Math.floor(u.x),y:Math.floor(u.y)},path=findPath(SIZE,start,{x,y},(a,b)=>unitBlocked(s,u,a,b));if(!path)return false;
 // Recenter on the current tile before changing direction, avoiding corner cutting.
 if(Math.hypot(u.x-start.x-.5,u.y-start.y-.5)>.001)path.unshift(start);
 u.path=path;u.moving=!!path.length;return true;
}
export function stopUnit(s,id){const u=s.units.find(v=>v.id===id);if(!u)return false;u.path=[];u.moving=false;return true;}
export function moveUnits(s,dt){
 syncActors(s);
 for(const u of s.units){if(s.expeditions.length||u.hp<=0){u.moving=false;continue;}advanceActor(u,dt,unitSpeed(s,u),(x,y)=>unitBlocked(s,u,x,y));}
 const scouts=s.units.filter(u=>u.type==='scout'&&u.hp>0);const u=scouts[0];if(u){s.scout.x=Math.floor(u.x);s.scout.y=Math.floor(u.y);s.scout.path=u.path.map(p=>({...p}));s.scout.credit=0;}
 if(!s.explored&&!s.expeditions.length&&scouts.some(v=>Math.abs(v.x-17.5)+Math.abs(v.y-4.5)<=2)){s.explored=true;s.chronicle.push('Grenzposten entdeckt.');}
}
