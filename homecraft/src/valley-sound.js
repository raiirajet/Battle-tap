// Offline, synthesized audio. One Web Audio context; started only by user input.
const KEY='homecraft-valley-sound-v1';
const clamp=(v,d)=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.min(1,v)):d;
export function soundSettings(v={}){return {enabled:v?.enabled!==false,ambient:v?.ambient!==false,effects:v?.effects!==false,master:clamp(v?.master,.65),ambience:clamp(v?.ambience,.45),effectVolume:clamp(v?.effectVolume,.75)}}
export function loadSound(){try{return soundSettings(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return soundSettings()}}
export function valleySound(){let settings=loadSound(),ctx=null,master=null,fx=null,noise=null,weatherGain=null,weatherFilter=null,engine=null,engineGain=null,stepClock=0;const active=new Set();
 const set=(p,n,t=.06)=>p?.setTargetAtTime(n,ctx.currentTime,t);
 const hidden=()=>typeof document!=='undefined'&&document.hidden;
 function levels(){if(ctx){set(master.gain,settings.enabled&&!hidden()?settings.master:0);set(fx.gain,settings.effects?settings.effectVolume:0)}}
 function mute(){if(ctx){set(weatherGain.gain,0);set(engineGain.gain,0)}stepClock=0}
 function unlock(startPlayback=true){if(!settings.enabled)return false;try{if(!ctx){const AC=globalThis.AudioContext||globalThis.webkitAudioContext;if(!AC)return false;ctx=new AC();master=ctx.createGain();fx=ctx.createGain();master.gain.value=0;fx.gain.value=0;fx.connect(master);master.connect(ctx.destination);noise=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const a=noise.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;const source=ctx.createBufferSource();source.buffer=noise;source.loop=true;weatherFilter=ctx.createBiquadFilter();weatherFilter.type='lowpass';weatherGain=ctx.createGain();weatherGain.gain.value=0;source.connect(weatherFilter).connect(weatherGain).connect(master);source.start();engine=ctx.createOscillator();engine.type='triangle';engine.frequency.value=42;engineGain=ctx.createGain();engineGain.gain.value=0;engine.connect(engineGain).connect(fx);engine.start();levels()}if(startPlayback)resume();return true}catch{stop();return false}}
 function resume(){
   if(!ctx||ctx.state==='running')return Promise.resolve();
   try{return ctx.resume().catch(()=>{})}catch{return Promise.resolve()}
 }
 function resumeOnInput(){
   if(ctx&&settings.enabled&&!hidden())resume();
 }
 async function test(){
   if(hidden())return 'unavailable';
   if(!settings.enabled)return 'sound-disabled';
   if(!settings.effects)return 'effects-disabled';
   if(settings.master===0||settings.effectVolume===0)return 'volume-zero';
   if(!unlock(false))return 'unavailable';
   const context=ctx;
   let timeout;
   try{
     await Promise.race([resume(),new Promise(resolve=>{timeout=setTimeout(resolve,1200)})]);
   }finally{clearTimeout(timeout)}
   if(context!==ctx||context.state!=='running'||hidden())return 'unavailable';
   if(!settings.enabled)return 'sound-disabled';
   if(!settings.effects)return 'effects-disabled';
   if(settings.master===0||settings.effectVolume===0)return 'volume-zero';
   play('success');
   return 'playing';
 }
 function configure(v){settings=soundSettings({...settings,...v});try{localStorage.setItem(KEY,JSON.stringify(settings))}catch{}if(settings.enabled)unlock();levels();if(!settings.enabled||!settings.ambient)if(ctx)set(weatherGain.gain,0);if(!settings.enabled||!settings.effects)if(ctx)set(engineGain.gain,0);return {...settings}}
 function transient(freq,end,duration,volume,type='sine',delay=0){if(!ctx||active.size>=24)return;const t=ctx.currentTime+delay,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(fx);active.add(o);o.onended=()=>{active.delete(o);o.disconnect();g.disconnect()};o.start(t);o.stop(t+duration+.02)}
 function burst(duration,volume,frequency){if(!ctx||!noise||active.size>=24)return;const t=ctx.currentTime,o=ctx.createBufferSource(),b=ctx.createBiquadFilter(),g=ctx.createGain();o.buffer=noise;b.type='lowpass';b.frequency.value=frequency;g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(b).connect(g).connect(fx);active.add(o);o.onended=()=>{active.delete(o);o.disconnect();b.disconnect();g.disconnect()};o.start(t,Math.random());o.stop(t+duration)}
 function play(name){if(!ctx||!settings.enabled||!settings.effects||hidden())return;switch(name){case 'tap':transient(550,420,.065,.04);break;case 'step':burst(.13,.11,550);break;case 'stepInside':burst(.095,.075,950);break;case 'doorOpen':burst(.22,.13,900);transient(180,95,.19,.055,'triangle');break;case 'doorClose':burst(.12,.18,420);transient(125,48,.12,.10,'triangle');break;case 'carIn':case 'carOut':burst(.16,.15,650);transient(100,50,.15,.08,'triangle');break;case 'success':transient(523,660,.16,.085);transient(784,784,.20,.075,'sine',.13);break;case 'spend':transient(420,270,.20,.07,'triangle');break;case 'deny':transient(150,95,.24,.13,'square');break;case 'pet':transient(440,690,.22,.06,'triangle');break}}
 function update(c,inside){if(!ctx)return;const wet=c?.type==='rain'||c?.type==='storm';set(weatherFilter.frequency,wet?1700:380,.25);set(weatherGain.gain,settings.ambient&&settings.enabled?(wet?.12:c?.type==='snow'?.035:.022)*(inside?.22:1)*settings.ambience:0,.25)}
 function motion(dt,moving,inside,driving,speed){if(!ctx)return;set(engine.frequency,42+Math.min(120,Math.abs(speed)*8),.12);set(engineGain.gain,settings.enabled&&settings.effects&&driving?.055+Math.min(.09,Math.abs(speed)*.006):0,.10);if(!moving||driving){stepClock=0;return}stepClock+=Math.min(.1,Math.max(0,dt));if(stepClock>=.38){stepClock=0;play(inside?'stepInside':'step')}}
 function stop(){const old=ctx;ctx=null;for(const o of active){try{o.stop()}catch{}}active.clear();if(old)old.close().catch(()=>{});master=fx=noise=weatherGain=weatherFilter=engine=engineGain=null;stepClock=0}
 function onVisibility(){
   if(!ctx)return;
   levels();
   if(hidden())mute();
   else if(settings.enabled)resume();
 }
 const events=typeof document==='undefined'?null:document;
 events?.addEventListener('visibilitychange',onVisibility);
 events?.addEventListener('pointerup',resumeOnInput,true);
 events?.addEventListener('keydown',resumeOnInput,true);
 return {unlock,test,configure,settings:()=>({...settings}),play,update,motion,mute,stop,toggle(){return configure({ambient:!settings.ambient}).ambient},destroy(){stop();events?.removeEventListener('visibilitychange',onVisibility);events?.removeEventListener('pointerup',resumeOnInput,true);events?.removeEventListener('keydown',resumeOnInput,true)}}
}
