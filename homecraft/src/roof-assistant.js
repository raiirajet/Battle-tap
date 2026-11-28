import {rooms,contains,uid,dist} from './core.js';
import {bodyDefaults,combinedRoof,roofJunctions,polygonArea} from './roof-bodies.js';
const EPS=1e-5;
// Decompose the union of room centreline polygons into disjoint rectangles in a user-selected frame.
// This is a bounded architectural suggestion, not a structural or waterproofing design.
export function roofRectangles(polys,rotation=0){
 if(!Number.isFinite(rotation)||Math.abs(rotation)>360||!Array.isArray(polys)||!polys.length)throw Error('Geschlossener rechtwinkliger Grundriss erforderlich');
 const a=rotation*Math.PI/180,c=Math.cos(a),s=Math.sin(a),local=q=>({x:q.x*c+q.y*s,y:-q.x*s+q.y*c}),world=q=>({x:q.x*c-q.y*s,y:q.x*s+q.y*c}),snap=v=>Math.round(v/EPS)*EPS,pp=polys.map(poly=>poly.map(q=>{const p=local(q);return{x:snap(p.x),y:snap(p.y)}}));
 for(const poly of pp){if(poly.length<4||poly.some((q,i)=>{const n=poly[(i+1)%poly.length];return Math.abs(q.x-n.x)>EPS&&Math.abs(q.y-n.y)>EPS}))throw Error('Nicht rechtwinklige Kontur: Dachachse anpassen oder manuelle Dachflächen verwenden')}
 const xs=[...new Set(pp.flat().map(q=>q.x))].sort((a,b)=>a-b),ys=[...new Set(pp.flat().map(q=>q.y))].sort((a,b)=>a-b);
 const nx=xs.length-1,ny=ys.length-1;if(nx<1||ny<1||nx*ny>2500)throw Error('Grundriss zu komplex für den automatischen Dachassistenten');
 const cells=Array.from({length:ny},(_,j)=>Array.from({length:nx},(_,i)=>pp.some(poly=>contains(poly,{x:(xs[i]+xs[i+1])/2,y:(ys[j]+ys[j+1])/2}))));
 const rectangles=[];let target=0;for(let j=0;j<ny;j++)for(let i=0;i<nx;i++)if(cells[j][i])target+=(xs[i+1]-xs[i])*(ys[j+1]-ys[j]);
 // Greedily pick maximum-area contiguous rectangles, with deterministic tie-breaks.
 while(cells.some(row=>row.some(Boolean))){
  let best=null;
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){if(!cells[j][i])continue;let end=nx;for(let y=j;y<ny&&cells[y][i];y++){let x=i;while(x<end&&cells[y][x])x++;end=x;const area=(xs[end]-xs[i])*(ys[y+1]-ys[j]);if(!best||area>best.area+EPS)best={i,j,x:end,y:y+1,area}}}
  if(!best)throw Error('Dachzerlegung fehlgeschlagen');
  const {i,j,x,y}=best,width=xs[x]-xs[i],depth=ys[y]-ys[j];
  if(width<.5-EPS||depth<.5-EPS)throw Error('Dachabschnitt schmaler als 50 cm: manuell ergänzen');
  rectangles.push({...world({x:(xs[i]+xs[x])/2,y:(ys[j]+ys[y])/2}),width,depth,rotation});
  if(rectangles.length>12)throw Error('Mehr als zwölf Dachkörper nötig: Grundriss vereinfachen oder manuell planen');
  for(let row=j;row<y;row++)for(let col=i;col<x;col++)cells[row][col]=false;
 }
 if(!rectangles.length||Math.abs(rectangles.reduce((n,r)=>n+r.width*r.depth,0)-target)>1e-5*Math.max(1,target))throw Error('Dachflächen konnten nicht eindeutig zerlegt werden');
 return {rectangles,area:target};
}
export function suggestRoof(p,l,{rotation=0,type='gable',pitch=30,overhang=.25,thickness=.22,material='tile',color='#59616b',gutters=true,rafters=false}={}){
 if(!l||!['flat','gable','shed','hip','pyramid','mansard','butterfly'].includes(type)||!Number.isFinite(pitch)||pitch<1||pitch>65||!Number.isFinite(overhang)||overhang<0||overhang>2||!Number.isFinite(thickness)||thickness<.05||thickness>.8||!['tile','metal','gravel','bitumen','wood'].includes(material)||!/^#[0-9a-f]{6}$/i.test(color))throw Error('Ungültige Dachparameter');
 const rr=rooms(l);if(!rr.length)throw Error('Zuerst geschlossene Räume zeichnen');
 const {rectangles,area}=roofRectangles(rr.map(r=>r.centerline),rotation),half=Math.max(...rr.flatMap(r=>r.edgeWidths));
 const bodies=rectangles.map((r,i)=>({...bodyDefaults(l),...r,id:uid(),name:'Automatik '+(i+1),width:r.width+2*half,depth:r.depth+2*half,type,pitch,overhang,thickness,material,color,gutters,rafters,trim:true}));
 if(bodies.some(b=>b.width>100||b.depth>100))throw Error('Dachkörper grösser als 100 m');
 const draft={...p,roofBodies:bodies},roof=combinedRoof(draft),joins=roofJunctions(roof),projection=roof.pieces.reduce((n,r)=>n+polygonArea(r.points),0);
 if(projection+1e-5<area)throw Error('Dach deckt den erkannten Grundriss nicht vollständig ab');
 return {bodies,roof,joins,area,projection,half,notes:['Dachkörper aus Raum-Mittellinien; Wandstärke und Überstände werden rechteckig erweitert. Innenhöfe und freie Aussenflächen nicht automatisch als Dachfläche einplanen.','Nur gewähltes Geschoss; Überstände und Anschlüsse an andere Geschosse manuell prüfen.','Keine statische oder bauphysikalische Bemessung.']};
}
