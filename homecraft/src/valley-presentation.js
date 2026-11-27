// D8 visual settings and navigation are deliberately independent from game rules.
export const QUALITY=Object.freeze({low:Object.freeze({label:'Niedrig',pixel:0.85,particles:100,detail:0,shadows:0,lights:2,house:'low'}),medium:Object.freeze({label:'Mittel',pixel:1.25,particles:230,detail:1,shadows:0,lights:4,house:'medium'}),high:Object.freeze({label:'Hoch',pixel:1.5,particles:360,detail:2,shadows:1024,lights:6,house:'high'}),ultra:Object.freeze({label:'Ultra',pixel:2,particles:460,detail:3,shadows:2048,lights:8,house:'high'})});
export function qualityKey(value){return typeof value==='string'&&Object.hasOwn(QUALITY,value)?value:'medium'}
export function loadQuality(){try{return qualityKey(localStorage.getItem('homecraft-valley-quality'))}catch{return 'medium'}}
export function storeQuality(value){const q=qualityKey(value);try{localStorage.setItem('homecraft-valley-quality',q)}catch{}return q}
export function mapBounds(mode='town'){return mode==='world'?{x:0,z:0,w:1024,h:1024}:{x:255,z:265,w:330,h:330}}
export function mapContains(p,b){return !!p&&p.x>=b.x&&p.x<=b.x+b.w&&p.z>=b.z&&p.z<=b.z+b.h}
export function mapPoint(p,b,w,h){const scale=Math.min(w/b.w,h/b.h),ox=(w-b.w*scale)/2,oz=(h-b.h*scale)/2;return {x:ox+(p.x-b.x)*scale,y:oz+(p.z-b.z)*scale,scale}}
export function waypointInfo(p,target){if(!target)return null;const dx=target.x-p.x,dz=target.z-p.z,distance=Math.hypot(dx,dz),bearing=(Math.atan2(dx,-dz)*180/Math.PI+360)%360;return {distance,bearing,direction:['N','NO','O','SO','S','SW','W','NW'][Math.round(bearing/45)%8]}}
export function frameRate(samples){const valid=samples.filter(x=>Number.isFinite(x)&&x>0&&x<1000);return valid.length?Math.round(1000*valid.length/valid.reduce((a,b)=>a+b,0)):0}
