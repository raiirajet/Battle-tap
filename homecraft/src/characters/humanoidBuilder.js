import {decodeSkin} from './skinBinary.js';
import {SKIN_STEPS,unpackSkin} from './skinCodec.js';
export function generateHumanoidWorker(detail=true){const key=detail?'high':'npc';return new Promise((resolve,reject)=>{if(typeof Worker==='undefined'){reject(Error('Worker unavailable'));return}let worker;try{worker=new Worker(new URL('./skin.worker.js',import.meta.url),{type:'module'})}catch(e){reject(e);return}
 let done=false;const finish=(err,data)=>{if(done)return;done=true;clearTimeout(timer);worker.terminate();if(err){reject(err);return}try{resolve(unpackSkin(data,detail))}catch(e){reject(e)}};
 const timer=setTimeout(()=>finish(Error('Skin generation timeout')),90000);worker.onmessage=e=>e.data.error?finish(Error(e.data.error)):finish(null,e.data);worker.onerror=e=>finish(Error(e.message||'Skin worker error'));worker.postMessage({step:SKIN_STEPS[key]})})}

export async function generateHumanoid(detail=true){const key=detail?'high':'npc';try{const url=new URL('./assets/humanoids/'+key+'.bin',document.baseURI);const response=await fetch(url);if(!response.ok)throw Error('Humanoid cache HTTP '+response.status);const src=unpackSkin(decodeSkin(await response.arrayBuffer()),detail);src.origin='packaged';return src}catch(e){console.warn('HomeCraft offline humanoid cache unavailable, generating:',e);const src=await generateHumanoidWorker(detail);src.origin='worker';return src}}
