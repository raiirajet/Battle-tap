import * as T from 'three';
export const sideKey=s=>s<0?'L':'R';
export function rigSpec(){
 const entries=[],add=(name,parent,position,rz=0)=>{entries.push({name,parent,position,rz});return name};
 add('ValleyBody',null,[0,0,0]);add('ValleyHead','ValleyBody',[0,1.53,0]);
 for(const s of [-1,1]){const k=sideKey(s),arm=add(k+'UpperArm','ValleyBody',[s*.195,1.25,0]),elbow=add(k+'Forearm',arm,[0,-.25,0]),hand=add(k+'Hand',elbow,[0,-.205,0]);
 for(let i=0;i<5;i++){const thumb=i===4,l=[.057,.065,.060,.047,.045][i],x=thumb?-s*.031:s*(i-1.5)*.016,z=thumb?.009:.001,l1=l*(thumb?.52:.43),l2=l*(thumb?.24:.32),n=k+'Digit'+i;
 add(n,hand,[x,thumb?-.006:-.035,z],thumb?-s*.64:s*(i-1.5)*.055);add(n+'Mid',n,[0,-l1,0]);add(n+'Tip',n+'Mid',[0,-l2,0]);
 }
 const hip=add(k+'Thigh','ValleyBody',[s*.095,.79,0]);add(k+'Shin',hip,[0,-.345,0]);
 }return entries;
}
export function createRig(){const list=rigSpec(),map=new Map();for(const e of list){const b=new T.Bone();b.name=e.name;b.position.set(...e.position);b.rotation.z=e.rz;if(e.parent)map.get(e.parent).add(b);map.set(e.name,b)}const root=map.get('ValleyBody');root.updateMatrixWorld(true);return {root,bones:[...map.values()],map}}
export const MORPHS=['Blink','Smile','JawOpen','BrowRaise','FaceAngular','FaceRound'];
export const CLIPS=['Idle','Walk','Run','Jump','Sit','Sleep','Interact','Wave'];
// Pose curves deliberately authored in seconds, not game-time. Each clip has no root translation.
export function rigClips(){
 const output=[],q=(x=0,y=0,z=0)=>new T.Quaternion().setFromEuler(new T.Euler(x,y,z)).toArray();
 function clip(name,duration,frames,fn){const tracks=[],times=Array.from({length:frames+1},(_,i)=>duration*i/frames);
 for(const s of [-1,1]){const k=sideKey(s);for(const part of ['UpperArm','Forearm','Thigh','Shin']){const values=times.flatMap(t=>q(...fn(part,s,t/duration)));tracks.push(new T.QuaternionKeyframeTrack(k+part+'.quaternion',times,values))}}
 output.push(new T.AnimationClip(name,duration,tracks));}
 const gait=(run)=>(p,s,t)=>{const a=t*2*Math.PI+(s>0?Math.PI:0),v=Math.sin(a),lift=Math.max(0,-v);if(p==='Thigh')return [v*(run?.80:.53),0,0];if(p==='Shin')return [lift*(run?1.10:.72),0,0];if(p==='UpperArm')return [-v*(run?.63:.40),0,s*.055];return [-(run?.78:.16)-Math.max(0,v)*.35,0,0]};
 clip('Idle',3.6,16,(p,s,t)=>p==='UpperArm'?[.025*Math.sin(t*6.28),0,s*.055]:p==='Forearm'?[-.12,0,0]:[0,0,0]);
 clip('Walk',1.03,32,gait(false));clip('Run',.67,24,gait(true));
 clip('Jump',.65,20,(p,s,t)=>{const h=Math.sin(t*Math.PI);return p==='Thigh'?[-.37*h,0,0]:p==='Shin'?[.95*h,0,0]:p==='UpperArm'?[-.62*h,0,s*.10]:[-.22-.38*h,0,0]});
 clip('Sit',1,2,(p,s)=>p==='Thigh'?[-Math.PI/2,0,0]:p==='Shin'?[Math.PI/2,0,0]:p==='UpperArm'?[-.35,0,s*.055]:[-.35,0,0]);
 clip('Sleep',2.5,12,(p,s,t)=>p==='UpperArm'?[.02*Math.sin(t*6.28),0,s*.12]:p==='Forearm'?[-.10,0,0]:[0,0,0]);
 clip('Interact',1.5,24,(p,s,t)=>p==='UpperArm'?[-.76-.09*Math.sin(t*6.28),0,s*.08]:p==='Forearm'?[-1.0-.11*Math.sin(t*6.28),0,0]:[0,0,0]);
 clip('Wave',1.6,24,(p,s,t)=>p==='UpperArm'?(s>0?[-1.3,0,.60]:[0,0,-.055]):p==='Forearm'?(s>0?[-1.1,.35*Math.sin(t*6.28*3),0]:[-.1,0,0]):[0,0,0]);return output;
}
