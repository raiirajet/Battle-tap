// 10 independent local slots. Slot 1 preserves the 0.1 save key.
export const slotKey=n=>n===1?'crownfall.save.v1':'crownfall.save.v1.slot'+n;
export const slots=Array.from({length:10},(_,i)=>i+1);
export function activeSlot(storage){try{const n=Number(storage.getItem('crownfall.activeSlot'));return slots.includes(n)?n:1}catch{return 1}}
export function setSlot(storage,n){if(!slots.includes(n))return false;try{storage.setItem('crownfall.activeSlot',String(n));return true}catch{return false}}
export function encodeSave(s){return JSON.stringify({format:'crownfall-local-v1',state:s});}
export function decodeSave(text,load){try{if(text.length>2_000_000)return null;const x=JSON.parse(text);return x.format==='crownfall-local-v1'?load(JSON.stringify(x.state)):null}catch{return null}}
