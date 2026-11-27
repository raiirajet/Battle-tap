// Rendering-only quality policy. No navigation or NPC schedule changes.
export function playerDetail(quality){return quality!=='low'}
export function npcInterval(distance,quality){if(!Number.isFinite(distance)||distance<20)return 0;if(quality==='low')return .10;if(distance>60)return .10;return quality==='medium'?.075:0}
