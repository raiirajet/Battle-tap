import {createSkinCharacter} from '../../scripts/valley-skin-builder.mjs';
import {packSkin} from './skinCodec.js';
// No network or GLB load. Transfer vertex buffers without copying.
self.onmessage=({data})=>{try{const {skin}=createSkinCharacter({step:data.step});const packed=packSkin(skin.geometry),transfers=[packed.index.buffer,...Object.values(packed.attributes).map(a=>a.array.buffer),...packed.morphs.map(a=>a.array.buffer)];self.postMessage(packed,[...new Set(transfers)])}catch(e){self.postMessage({error:String(e.message||e)})}};
