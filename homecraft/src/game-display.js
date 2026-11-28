import {Capacitor,registerPlugin} from '@capacitor/core';
const native=Capacitor.isNativePlatform(),display=registerPlugin('GameDisplay');
let enabled=false,landscape=true;try{landscape=localStorage.getItem('homecraft-game-landscape')!=='0'}catch{}
export function preferLandscape(){return landscape}
export function setLandscape(v){landscape=!!v;try{localStorage.setItem('homecraft-game-landscape',landscape?'1':'0')}catch{}if(enabled)setGameDisplay(true)}
export function safeInsets(raw={}){return Object.fromEntries(['top','right','bottom','left'].map(k=>[k,Math.min(240,Math.max(0,Number.isFinite(raw[k])?Math.ceil(raw[k]):0))]))}
function apply(raw){const s=safeInsets(raw);for(const [k,v] of Object.entries(s))document.documentElement.style.setProperty('--hc-native-'+k,v+'px')}
export function initGameDisplay(){if(!native)return;display.addListener('insetsChanged',apply).catch(console.warn);const sync=()=>display.insets().then(apply).catch(()=>{});window.addEventListener('resize',sync);document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});sync()}
export function setGameDisplay(active){enabled=!!active;document.documentElement.classList.toggle('hc-game-active',enabled);if(native)display.setGameMode({active:enabled,landscape}).then(apply).catch(console.warn)}
