// Building construction is geometric planning, not structural or energy certification.
export const wallLayerTypes=[['plaster','Putz','#dedbd2'],['brick','Mauerwerk','#b76d53'],['concrete','Beton','#999e9f'],['wood','Holz','#b79468'],['insulation','Dämmung','#e4c86c'],['board','Platte','#c7bfab'],['air','Luftschicht','#d6e4ea'],['cladding','Fassadenbekleidung','#777e7d']];
const finite=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
const length=w=>Math.hypot(w.b.x-w.a.x,w.b.y-w.a.y);
export function wallLayerPreset(id){
 const defs={masonry:[['plaster',.015],['brick',.24],['insulation',.16],['plaster',.015]],concrete:[['plaster',.015],['concrete',.20],['insulation',.14],['cladding',.025]],timber:[['board',.025],['wood',.16],['insulation',.08],['air',.04],['cladding',.025]],partition:[['board',.025],['insulation',.075],['board',.025]]};
 if(!defs[id])throw Error('Unbekannter Wandaufbau');
 return defs[id].map(([kind,thickness])=>({kind,thickness}));
}
export function layerThickness(layers){return layers.reduce((n,q)=>n+q.thickness,0)}
export function validateWallConstruction(w){
 if(w.assembly!==undefined){const a=w.assembly;if(!Array.isArray(a)||!a.length||a.length>12||a.some(q=>!q||!wallLayerTypes.some(t=>t[0]===q.kind)||!finite(q.thickness,.005,2))||!finite(layerThickness(a),.02,5)||Math.abs(layerThickness(a)-w.thickness)>1e-6)throw Error('Wandaufbau und Wandstärke stimmen nicht überein')}
 if(w.foundation!==undefined){const a=w.foundation;if(!a||typeof a!=='object'||Array.isArray(a)||!finite(a.width,.1,5)||!finite(a.depth,.1,3)||!finite(a.offset,-2,2)||!finite(a.cover,0,3))throw Error('Ungültiges Streifenfundament')}
}
export function wallLayerBands(w){let edge=-w.thickness/2;return (w.assembly||[]).map(q=>{const z=edge+q.thickness/2;edge+=q.thickness;return {...q,z,color:wallLayerTypes.find(t=>t[0]===q.kind)[2]}})}
export function foundationGeometry(l,w){if(!w.foundation)return null;const a=w.foundation;return {length:length(w),width:a.width,height:a.depth,x:length(w)/2,y:-(l.slab??.2)-a.cover-a.depth/2,z:a.offset,color:'#929895'}}
export function constructionQuantities(p){const rows=[];for(const l of p.levels)for(const [i,w] of l.walls.entries()){
 const net=Math.max(0,length(w)*w.height-w.openings.reduce((s,o)=>s+o.width*o.height,0));
 for(const q of w.assembly||[])rows.push({level:l.name,wall:i+1,kind:wallLayerTypes.find(t=>t[0]===q.kind)[1],area:net,volume:net*q.thickness});
 const f=foundationGeometry(l,w);if(f)rows.push({level:l.name,wall:i+1,kind:'Streifenfundament',area:f.length*f.width,volume:f.length*f.width*f.height})
 }return rows}
export function constructionWarnings(p,l){const out=[];for(const w of l.walls){const a=w.foundation;if(!a)continue;if(a.width<w.thickness+2*Math.abs(a.offset)-1e-6)out.push('Fundament deckt die Wandbreite nicht vollständig ab.');if(p.levels.some(q=>q.id!==l.id&&q.z<l.z-.01))out.push('Fundament oberhalb eines tieferen Geschosses: Auflager prüfen.')}return [...new Set(out)]}
export function basementWalls(source,height,layers,makeId){
 if(!finite(height,.5,20))throw Error('Ungültige Kellerhöhe');
 const thickness=layerThickness(layers);
 return source.walls.map(w=>{const q={id:makeId(),a:{...w.a},b:{...w.b},thickness,height,color:'#dedbd2',outer:'#999e9f',role:w.role||'unspecified',openings:[],assembly:layers.map(a=>({...a}))};validateWallConstruction(q);return q})
}
