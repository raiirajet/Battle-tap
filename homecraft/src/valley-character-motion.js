// Independent, deterministic animation helpers; no rendering or game-rule dependencies.
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
export function characterExpression(clock,{pose='idle',jump=0,moving=false,speaking=false,seed=0}={}){
 const t=Math.max(0,Number.isFinite(clock)?clock:0)+(Number.isFinite(seed)?seed:0);
 const cycle=5.2+.6*Math.sin(seed||0),phase=((t%cycle)+cycle)%cycle;
 const blink=pose==='sleep'?1:Math.max(0,1-Math.abs(phase-(cycle-.12))/.12);
 const smile=pose==='use'?.34: .10+.045*Math.sin(t*.71);
 return {blink,smile,jaw:speaking?.08+.08*Math.sin(t*11):pose==='use'?.12+.08*Math.sin(t*7):0,brow:jump>0?.48:.08+.025*Math.sin(t*.8),gazeX:pose==='sleep'?0:Math.sin(t*.79)*.0028,gazeY:moving?-.0007:Math.sin(t*.43)*.0013};
}
export function characterSeed(value=''){let h=2166136261;for(const c of String(value))h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0)%4000/1000}
