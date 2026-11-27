// Fixed, offline-only economy. Inventory is reconstructed from the same ledger as the wallet.
const entries={
 work:{label:'Werkstattschicht',amount:350,site:'work',energy:-15,hunger:-10,minute:60,cooldown:true},
 garden:{label:'Gartenpflege',amount:240,site:'work',energy:-10,hunger:-8,minute:40,cooldown:true},
 delivery:{label:'Lieferdienst',amount:480,site:'work',energy:-24,hunger:-15,minute:90,cooldown:true},
 meal:{label:'Warme Mahlzeit',amount:-35,site:'meal',hunger:35,minute:10},
 buySnack:{label:'Proviant kaufen',amount:-22,site:'meal',item:'snack',quantity:1},
 buyCoffee:{label:'Kaffee kaufen',amount:-18,site:'meal',item:'coffee',quantity:1},
 eatSnack:{label:'Proviant essen',amount:0,item:'snack',quantity:-1,hunger:25,minute:5},
 drinkCoffee:{label:'Kaffee trinken',amount:0,item:'coffee',quantity:-1,energy:15,minute:5}
};
export const ECONOMY=Object.freeze(Object.fromEntries(Object.entries(entries).map(([k,v])=>[k,Object.freeze(v)])));
export const ITEMS=Object.freeze({snack:'Proviant',coffee:'Kaffee'});
export const CAPACITY=12;
export const TRADE=Object.freeze(Object.fromEntries(Object.entries(ECONOMY).map(([k,v])=>[k,v.amount])));
export function ruleFor(type){return Object.hasOwn(ECONOMY,type)?ECONOMY[type]:null}
export function inventory(save){const counts={snack:0,coffee:0};for(const e of save.ledger){const r=ruleFor(e.type);if(r?.item)counts[r.item]+=r.quantity}return counts}
export function tradeSite(type,site){const rule=ruleFor(type);return !!rule&&(!rule.site||rule.site===site)}
export function tradeSummary(type){const r=ruleFor(type);if(!r)return '';const parts=[];if(r.amount)parts.push((r.amount>0?'+':'')+r.amount+' HC');for(const [key,name] of [['energy','Energie'],['hunger','Sättigung']])if(r[key])parts.push((r[key]>0?'+':'')+r[key]+' '+name);if(r.minute)parts.push('+'+r.minute+' Spielmin.');if(r.item&&r.quantity>0)parts.push('+1 '+ITEMS[r.item]);return parts.join(' · ')}
export function applyTradeNeeds(needs,type){const r=ruleFor(type);if(!r)throw Error('Unbekannter Wirtschaftsvorgang.');if(r.cooldown&&(needs.energy<Math.abs(r.energy)+5||needs.hunger<Math.abs(r.hunger)+5))throw Error('Zu müde oder hungrig für diese Arbeit.');const cap=v=>Math.max(0,Math.min(100,v));return {...needs,energy:cap(needs.energy+(r.energy||0)),hunger:cap(needs.hunger+(r.hunger||0)),minute:(needs.minute+(r.minute||0))%1440}}
