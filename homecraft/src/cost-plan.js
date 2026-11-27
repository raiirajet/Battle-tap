// User-provided planning rates; all default to zero, no assumed market prices.
export const costRates=[['floor','Bodenmaterial','m²'],['floorLabor','Boden verlegen','m²'],['paint','Wandoberflächen beidseitig','m²'],['wall','Wandkonstruktion','m³'],['door','Türen','Stk'],['window','Fenster','Stk'],['facade','Fassadenabschnitte (zusätzlich)','m²'],['roof','Dachdeckung','m²'],['route','Leitung ohne eigenen Preis','m'],['land','Grundstück','m²']];
export function costSettings(p){return {rates:Object.fromEntries(costRates.map(([id])=>[id,0])),waste:0,reserve:0,tax:0,target:0,extras:[],...p.costPlan}}
export function validateCost(p){if(p.costPlan===undefined)return;const a=p.costPlan,n=(v,l,h)=>Number.isFinite(v)&&v>=l&&v<=h;if(!a||typeof a!=='object'||Array.isArray(a)||!a.rates||!costRates.every(([id])=>n(a.rates[id],0,100000000))||!n(a.waste,0,100)||!n(a.reserve,0,100)||!n(a.tax,0,100)||!n(a.target,0,1e12)||!Array.isArray(a.extras)||a.extras.length>100||a.extras.some(q=>!q||typeof q.name!=='string'||!q.name.trim()||q.name.length>100||!n(q.qty,0,1e7)||!n(q.rate,0,1e8)))throw Error('Ungültiger Kostenplan')}
export function calculateCost(a,quantities,explicit=[]){
 const rows=costRates.map(([id,name,unit])=>({id,name,unit,qty:(quantities[id]||0)*(id==='floor'?1+a.waste/100:1),rate:a.rates[id]}));
 for(const q of explicit)rows.push({name:q.name,unit:q.unit||'Stk',qty:q.qty,rate:q.rate});
 for(const q of a.extras)rows.push({...q,unit:'Einheit'});
 for(const q of rows)q.total=q.qty*q.rate;
 const subtotal=rows.reduce((s,q)=>s+q.total,0),reserve=subtotal*a.reserve/100,tax=(subtotal+reserve)*a.tax/100,total=subtotal+reserve+tax;
 return {rows,subtotal,reserve,tax,total,remaining:a.target>0?a.target-total:null}
}
