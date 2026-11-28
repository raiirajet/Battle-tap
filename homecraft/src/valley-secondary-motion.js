// Critically damped secondary motion in bounded substeps, in radians.
export function springStep(state,target,dt,{stiffness=74,damping=15,limit=.24}={}){
 const elapsed=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0)),goal=Math.max(-limit,Math.min(limit,Number.isFinite(target)?target:0));let left=elapsed;
 while(left>1e-8){const h=Math.min(left,1/120);state.velocity+=(stiffness*(goal-state.value)-damping*state.velocity)*h;state.value+=state.velocity*h;if(Math.abs(state.value)>limit){state.value=Math.sign(state.value)*limit;state.velocity=0}left-=h}
 return state.value;
}
