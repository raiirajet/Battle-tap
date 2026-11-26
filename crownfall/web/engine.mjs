export const VERSION=1;
export const BUILD={
 house:{id:'B02',name:'Wohnhaus',size:[2,2],cost:{H:60,S:15},time:25,cap:5},
 wood:{id:'B11',name:'Holzfällerlager',size:[2,2],cost:{H:50,S:10},time:25,jobs:4,res:'H',rate:12},
 stone:{id:'B12',name:'Steinbruch',size:[3,2],cost:{H:70},time:35,jobs:4,res:'S',rate:8},
 farm:{id:'B13',name:'Bauernhof',size:[3,3],cost:{H:70},time:35,jobs:4,res:'N',rate:10},
 well:{id:'B16',name:'Brunnen',size:[1,1],cost:{H:25,S:40},time:25},
 camp:{id:'B34',name:'Milizlager',size:[3,2],cost:{H:100,S:40,G:20},time:45},
 town:{id:'B01',name:'Rathaus',size:[4,4],cost:{},time:0,jobs:2,res:'W',rate:2,cap:10}
};
export const UNITS={militia:{name:'Miliz',cost:{N:45,H:10},time:20,hp:80,atk:12,armor:3},scout:{name:'Scout',cost:{N:50,G:20},time:25,hp:65,atk:6,armor:1},hero:{name:'Kriegsherr',hp:620,atk:24,armor:10}};
export const SIZE=24;
export const sources=(x,y)=>x<4&&y<17?'forest':x>19&&y<12?'rock':null;
const building=(type,x,y,left=0)=>({type,x,y,left,workers:0});
export function create(name='Neues Banner',hero='Aldric Valen'){return {version:VERSION,name,hero,t:0,r:{H:300,S:150,N:350,G:100,E:0,W:0,I:0},pop:8,buildings:[building('town',10,10),building('house',8,10)],units:[{type:'scout',hp:65},{type:'hero',hp:620}],queue:[],focus:100,cooldown:0,morale:50,enemy:[],battle:false,won:false,reward:false,delivered:0,explored:false,chronicle:[]};}
export const done=(s,type)=>s.buildings.filter(b=>b.type===type&&b.left===0);
export const capacity=s=>Math.min(30,s.buildings.reduce((n,b)=>n+(b.left===0?(BUILD[b.type].cap||0):0),0));
export const occupied=s=>s.pop+s.units.length+s.queue.length;
export const builders=s=>s.buildings.some(b=>b.left>0)?1:0;
export const free=s=>s.pop-builders(s)-s.buildings.reduce((n,b)=>n+b.workers,0);
export const canPay=(s,c)=>Object.entries(c).every(([k,v])=>s.r[k]>=v);
const pay=(s,c)=>{for(const[k,v]of Object.entries(c))s.r[k]-=v};
const add=(s,k,v)=>s.r[k]=Math.max(0,Math.min(k==='G'?1000:['H','S','N','E'].includes(k)?500:Infinity,s.r[k]+v));
export function place(s,type,x,y){
 const d=BUILD[type];if(!d||type==='town'||!Number.isInteger(x)||!Number.isInteger(y)||free(s)<1||builders(s)||!canPay(s,d.cost))return false;
 const[w,h]=d.size;if(x<0||y<0||x+w>SIZE||y+h>SIZE)return false;
 for(let a=x;a<x+w;a++)for(let b=y;b<y+h;b++)if(sources(a,b)||(a>=18&&b>=18))return false;
 if(s.buildings.some(b=>x<b.x+BUILD[b.type].size[0]&&x+w>b.x&&y<b.y+BUILD[b.type].size[1]&&y+h>b.y))return false;
 pay(s,d.cost);s.buildings.push(building(type,x,y,d.time));return true;
}
export function assign(s,index,delta){const b=s.buildings[index];if(!b||b.left||![-1,1].includes(delta)||b.workers+delta<0||b.workers+delta>(BUILD[b.type].jobs||0)||(delta>0&&free(s)<1))return false;b.workers+=delta;return true;}
export function train(s,type){const d=type==='citizen'?{cost:{N:50},time:25}:UNITS[type];if(!d?.cost||occupied(s)>=capacity(s)||!canPay(s,d.cost))return false;if(type==='citizen'?s.queue.some(q=>q.type==='citizen'):(!done(s,'camp').length||s.queue.filter(q=>q.type!=='citizen').length>=5))return false;pay(s,d.cost);s.queue.push({type,left:d.time});return true;}
export function water(s){return 20+40*done(s,'well').length}
export function beginBattle(s){if(s.won||s.battle||s.units.filter(u=>u.type==='militia'&&u.hp>0).length<2||!s.explored)return false;s.enemy=[40,40,40];s.battle=true;return true;}
export function rally(s){if(!s.battle||s.focus<20||s.cooldown||!s.units.some(u=>u.type==='hero'&&u.hp>0))return false;s.focus-=20;s.cooldown=35;s.morale=Math.min(100,s.morale+15);return true;}
export const damage=(atk,armor)=>Math.max(1,Math.round(atk*100/(100+armor)));
export function tick(s){
 s.t++;s.focus=Math.min(100,s.focus+(s.battle?2:5));s.cooldown=Math.max(0,s.cooldown-1);
 for(const b of s.buildings)if(b.left>0)b.left--;
 const citizen=s.queue.find(q=>q.type==='citizen'),military=s.queue.find(q=>q.type!=='citizen');
 for(const q of [citizen,military].filter(Boolean)){q.left--;if(q.left<=0){if(q.type==='citizen')s.pop++;else s.units.push({type:q.type,hp:UNITS[q.type].hp});s.queue.splice(s.queue.indexOf(q),1);}}
 let farmWorkers=0;for(const b of done(s,'farm'))farmWorkers+=b.workers;
 const irrigated=Math.max(0,Math.min(farmWorkers,Math.floor((water(s)-s.pop)/2)));
 let n=irrigated;
 for(const b of s.buildings){if(b.left||!b.workers)continue;const d=BUILD[b.type];if(!d.res)continue;const workers=b.type==='farm'?Math.min(n,b.workers):b.workers;if(b.type==='farm')n-=workers;const before=s.r[d.res];add(s,d.res,d.rate*workers*(b.type==='wood'?1.2:1)/60);if(b.type==='wood')s.delivered+=s.r.H-before;}
 add(s,'N',-(2*s.pop+s.units.reduce((n,u)=>n+(u.type==='hero'?3:2),0))/60);
 add(s,'G',s.pop*.2/60);
 if(s.battle&&s.t%2===0){
 const living=s.units.filter(u=>u.hp>0);for(const u of living){const i=s.enemy.findIndex(h=>h>0);if(i<0)break;s.enemy[i]=Math.max(0,s.enemy[i]-damage(UNITS[u.type].atk*(1+(s.morale-50)/200),3));}
 for(const hp of s.enemy)if(hp>0){const u=s.units.find(u=>u.type==='militia'&&u.hp>0)||s.units.find(u=>u.hp>0);if(u)u.hp=Math.max(0,u.hp-damage(8,UNITS[u.type].armor));}
 if(s.enemy.every(h=>h===0)){s.battle=false;s.won=true;s.chronicle.push('Das Übungslager ist besiegt.');}else if(!s.units.some(u=>u.hp>0)){s.battle=false;s.chronicle.push('Der Angriff scheiterte.');}
 s.units=s.units.filter(u=>u.hp>0||u.type==='hero');
 }
}
export function goal(s){if(s.reward)return ['Gründerbanner','Dein Reich ist gegründet. Baue weiter.'];if(s.delivered<24)return ['Das neue Banner','Baue ein Holzfällerlager und liefere 24 Holz mit zwei Arbeitern.'];if(!done(s,'farm').some(b=>b.workers>=3))return ['Brot für alle','Baue einen Bauernhof und weise drei Bewohner zu.'];if(done(s,'house').length<2||s.pop<9)return ['Ein sicheres Dach','Baue ein weiteres Haus und wirb im Arbeitsmenü einen Bewohner an.'];if(!done(s,'well').length||!done(s,'stone').some(b=>b.workers>0))return ['Wasser des Tals','Errichte Brunnen und Steinbruch; weise einen Steinmetz zu.'];if(s.units.filter(u=>u.type==='militia').length<2&&!s.won)return ['Das erste Banner','Baue das Milizlager und bilde zwei Milizen aus.'];if(!s.explored)return ['Die Grenzbünde','Erkunde das Übungslager im Armeemenü.'];if(!s.won)return ['Verteidige dein Reich','Starte den freiwilligen Übungskampf.'];return ['Der Rat','Weise dem Rathaus einen Berater zu und gründe dein Haus.'];}
export function claim(s){if(s.reward||s.delivered<24||!done(s,'farm').some(b=>b.workers>=3)||done(s,'house').length<2||s.pop<9||!done(s,'well').length||!done(s,'stone').some(b=>b.workers>0)||!s.won||!done(s,'town').some(b=>b.workers))return false;s.reward=true;add(s,'H',100);add(s,'S',75);add(s,'N',100);s.chronicle.push('Gründerbanner verliehen.');return true;}
export function load(raw){try{const s=JSON.parse(raw);if(s?.version!==VERSION||typeof s.name!=='string'||!Number.isInteger(s.t)||!Number.isInteger(s.pop)||!Array.isArray(s.buildings)||!Array.isArray(s.units)||!Array.isArray(s.queue)||!Array.isArray(s.enemy)||!Array.isArray(s.chronicle)||Object.keys(create().r).some(k=>!Number.isFinite(s.r?.[k])||s.r[k]<0)||s.buildings.some(b=>!BUILD[b.type]||!Number.isFinite(b.left)||!Number.isInteger(b.workers))||s.units.some(u=>!UNITS[u.type]||!Number.isFinite(u.hp)))return null;return s;}catch{return null;}}
