// RC25 local single-player ownership. No server authentication or multiplayer claims.
import {ownedModel} from './valley-vehicle.js';
export function isOwner(save,actorId){return !!save&&typeof actorId==='string'&&actorId.length>0&&save.ownerId===save.id&&actorId===save.ownerId}
export function canUsePrivate(save,actorId,kind,asset){
 if(!isOwner(save,actorId))return false;
 if(kind==='land')return asset===save.plotId;
 if(kind==='house')return !!save.building&&asset===save.building.id&&save.building.plotId===save.plotId;
 if(kind==='car')return !!asset&&asset.model===ownedModel(save.ledger||[]);
 return false
}
export function onPrivateLand(save,x,z){const r=save?.rect;return !!r&&Number.isFinite(x)&&Number.isFinite(z)&&x>=r.x&&x<=r.x+r.w&&z>=r.z&&z<=r.z+r.d}
export function guestPositionAllowed(save,actorId,x,z){return !onPrivateLand(save,x,z)||isOwner(save,actorId)}
