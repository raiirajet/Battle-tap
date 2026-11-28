import * as T from 'three';
export function naturalLight(day,cloud,twilight){const d=T.MathUtils.clamp(day,0,1),c=T.MathUtils.clamp(cloud,0,1),t=T.MathUtils.clamp(twilight,0,1);return {sky:new T.Color(0x637aab).lerp(new T.Color(0xe5efff),d).lerp(new T.Color(0xffcda3),t*.42),ground:new T.Color(0x364850).lerp(new T.Color(0x869175),d),hemi:.30+d*1.36*(1-c*.22),direct:.05+d*2.75*(1-c*.67),lamp:(1-d)**2*24}}
// Stable projected shadow centre: snap the target in the world plane to a shadow texel.
export function shadowAnchor(x,z,size=512,extent=70){const step=extent/Math.max(1,size);return {x:Math.round(x/step)*step,z:Math.round(z/step)*step}}
