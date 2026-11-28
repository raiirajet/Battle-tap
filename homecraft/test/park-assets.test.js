import test from 'node:test';
import assert from 'node:assert/strict';
import {parkPack} from '../scripts/park-asset-source.mjs';
test('38 standalone GLBs with valid headers, bounds, data ranges and decreasing LOD triangle counts',()=>{
 const entries=parkPack();assert.equal(entries.length,38);assert.equal(new Set(entries.map(p=>p.name)).size,38);
 for(const p of entries){const d=new DataView(p.bytes.buffer),n=d.getUint32(12,true),j=JSON.parse(new TextDecoder().decode(p.bytes.subarray(20,20+n)));
 assert.equal(d.getUint32(0,true),0x46546c67,p.name);assert.equal(d.getUint32(4,true),2);assert.equal(d.getUint32(8,true),p.bytes.length);assert.equal(d.getUint32(16,true),0x4e4f534a);assert.equal(d.getUint32(24+n,true),0x004e4942);assert.equal(d.getUint32(20+n,true),j.buffers[0].byteLength);
 for(const v of j.bufferViews){assert.equal(v.byteOffset%4,0);assert.ok(v.byteOffset+v.byteLength<=j.buffers[0].byteLength)}
 for(const mesh of j.meshes)for(const q of mesh.primitives){const p=j.accessors[q.attributes.POSITION];assert.ok(p.count>0&&p.count%3===0);assert.equal(j.accessors[q.attributes.NORMAL].count,p.count);assert.equal(j.accessors[q.attributes.TEXCOORD_0].count,p.count);assert.ok(p.min.every(Number.isFinite)&&p.max.every(Number.isFinite));assert.ok(q.material<j.materials.length)}
 }
 for(let i=0;i<30;i+=3){assert.ok(entries[i].meta.triangles>entries[i+1].meta.triangles);assert.ok(entries[i+1].meta.triangles>entries[i+2].meta.triangles)}
});
