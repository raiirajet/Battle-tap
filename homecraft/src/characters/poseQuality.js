import * as T from 'three';
export function fingerPose(grip,phase,index,greeting=false){const g=T.MathUtils.clamp(grip,0,1),thumb=index===4,curl=g*(thumb?.45:1)*[.89,1,1.06,1.12,1][index];return {base:curl*.70+Math.sin(phase+index*.35)*.018,mid:curl*.89,tip:curl*.52,spread:greeting?(index-1.5)*.055:0}}
export function gaitStep(phase,dt,distance,run,moving){if(!moving)return phase;const stride=run?1.18:.78;return phase+(Number.isFinite(distance)&&distance>0&&distance<.5?distance/stride*Math.PI*2:dt*(run?14:9.5))}
export function solveLeg(y,z,l1=.345,l2=.385){const len=T.MathUtils.clamp(Math.hypot(y,z),Math.abs(l1-l2)+.001,l1+l2-.001),knee=Math.acos(T.MathUtils.clamp((len*len-l1*l1-l2*l2)/(2*l1*l2),-1,1)),hip=Math.atan2(-z,-y)-Math.atan2(l2*Math.sin(knee),l1+l2*Math.cos(knee));return {hip,knee}}
export function applyFootIK(body,legs,root,state,phase,walk,motion,pose,jump){
 if(typeof motion.ground!=='function'||pose!=='idle'||jump>.015||!Number.isFinite(state.height))return;
 const scale=body.scale.y,blend=.82;body.position.y-=.052*scale;root.updateMatrixWorld(true);
 for(let i=0;i<legs.length;i++){const {hip,knee,ankle}=legs[i],t=phase+i*Math.PI,lift=Math.max(0,-Math.sin(t))*walk*.105,step=-Math.cos(t)*walk*.16;
 const pos=body.localToWorld(new T.Vector3(hip.position.x,0,step)),ground=motion.ground(pos.x,pos.z);if(!Number.isFinite(ground))continue;
 const y=T.MathUtils.clamp((ground+lift-root.position.y-body.position.y)/scale-hip.position.y,-.729,-.50),v=solveLeg(y,step);
 hip.rotation.x=T.MathUtils.lerp(hip.rotation.x,v.hip,blend);knee.rotation.x=T.MathUtils.lerp(knee.rotation.x,v.knee,blend);ankle.rotation.x=-(hip.rotation.x+knee.rotation.x)*blend;
 }}
