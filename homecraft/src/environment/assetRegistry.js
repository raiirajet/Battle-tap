// Scene-owned shared resource registry. Consumers remove meshes before registry disposal.
export class AssetRegistry {
 #entries=new Map(); #closed=false;
 get(key,create){if(this.#closed)throw Error('AssetRegistry disposed');if(!this.#entries.has(key))this.#entries.set(key,create());return this.#entries.get(key)}
 dispose(){if(this.#closed)return;this.#closed=true;const visited=new Set();const release=v=>{if(!v||typeof v!=='object'||visited.has(v))return;visited.add(v);if(typeof v.dispose==='function'){v.dispose();return}if(Array.isArray(v))v.forEach(release);else Object.values(v).forEach(release)};this.#entries.forEach(release);this.#entries.clear()}
 get size(){return this.#entries.size}
}
export function seeded(seed){let s=seed>>>0;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296)}
