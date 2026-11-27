
export const buildingParts=[
['balconyDeck','Balkon mit Geländer',3,1.8,1.25,'#b6b2a8'],
['coveredTerrace','Überdachte Terrasse',4,3,2.8,'#b8b5ab'],
['rectColumn','Rechteckige Stütze',.3,.3,2.5,'#b7b9b4'],
['roundColumn','Runde Stütze',.35,.35,2.5,'#b7b9b4'],
['beam','Unterzug / Träger',4,.25,.35,'#b7b9b4'],
['landing','Treppenpodest',1.5,1.2,.2,'#b8b4a9'],
['parapetWall','Brüstungsmauer',3,.18,1.05,'#c7c5bb'],
['cantilever','Auskragende Bodenplatte',3,1.5,.22,'#b8b6ad'],
['facadePanel','Fassadenelement / Lamellen',2,.12,2.5,'#9d8264']];
export const isBuildingPart=o=>buildingParts.some(q=>q[0]===o?.kind);
export const isDeck=o=>['balconyDeck','coveredTerrace','landing','cantilever'].includes(o.kind);
export const hasRails=o=>['balconyDeck','coveredTerrace','landing','cantilever'].includes(o.kind);
export function partSettings(o){const slab=Math.min(.2,o.height*.4);return {slab:o.kind==='landing'||o.kind==='cantilever'?o.height:slab,rail:o.kind==='balconyDeck'?'metal':'none',edges:'three',railHeight:1.05,post:.12,posts:'four',roofThickness:.15,finish:'concrete-1',railColor:'#6b7777',roofColor:'#65736e',panel:'solid',spacing:.18,...o.part}}
export function checkPart(o){if(!isBuildingPart(o))return;if(![o.width,o.depth,o.height,o.x,o.y,o.rotation,o.elevation??0].every(Number.isFinite)||Math.min(o.width,o.depth,o.height)<.03)throw Error('Ungültige Bauteilmasse');const a=partSettings(o),num=(v,l,h)=>Number.isFinite(v)&&v>=l&&v<=h,color=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);if(!num(a.slab,.01,1)||!num(a.railHeight,.5,1.5)||!num(a.post,.04,.8)||!num(a.roofThickness,.03,.8)||!num(a.spacing,.06,1)||!['none','metal','glass','solid'].includes(a.rail)||!['three','all','front','left','right'].includes(a.edges)||!['none','two','four'].includes(a.posts)||!['solid','slats'].includes(a.panel)||typeof a.finish!=='string'||a.finish.length>100||!color(a.railColor)||!color(a.roofColor))throw Error('Ungültige Bauteilparameter');if(isDeck(o)&&a.slab>o.height+1e-7)throw Error('Platte ist höher als das Bauteil');if(o.kind==='coveredTerrace'&&(a.slab+a.roofThickness+.3>o.height||a.posts!=='none'&&Math.min(o.width,o.depth)<a.post*2+.04))throw Error('Überdachung oder Stützen passen nicht zu den Massen');if(hasRails(o)&&a.rail!=='none'&&(Math.min(o.width,o.depth)<.15||o.kind==='coveredTerrace'&&a.slab+a.railHeight>o.height-a.roofThickness))throw Error('Geländer passt nicht zu den Massen');return a}
export function partComponents(o){const a=checkPart(o),w=o.width,d=o.depth,h=o.height,out=[],put=(x,y,z,width,height,depth,color,role='solid',extra={})=>{if(width>0&&height>0&&depth>0)out.push({x,y,z,width,height,depth,color,role,...extra})};if(!a)return out;const slab=isDeck(o)?a.slab:0;
if(isDeck(o)){put(0,slab/2,0,w,slab,d,o.color,'deck',{finish:a.finish});if(o.kind==='coveredTerrace'){put(0,h-a.roofThickness/2,0,w,a.roofThickness,d,a.roofColor,'canopy');if(a.posts!=='none')for(const x of [-1,1])for(const z of (a.posts==='two'?[1]:[-1,1]))put(x*(w-a.post)/2,(slab+h-a.roofThickness)/2,z*(d-a.post)/2,a.post,h-slab-a.roofThickness,a.post,o.color,'post')}
if(a.rail!=='none'){const t=.04,edge=(side)=>{const horizontal=side==='front'||side==='back',len=horizontal?w:d,fixed=horizontal?(side==='front'?1:-1)*(d-t)/2:(side==='right'?1:-1)*(w-t)/2,xyz=(v,y)=>horizontal?[v,y,fixed]:[fixed,y,v],add=(v,y,l,hh,th,role,ex={})=>put(...xyz(v,y),horizontal?l:th,hh,horizontal?th:l,a.railColor,role,ex),rh=a.railHeight;if(a.rail==='solid'){add(0,slab+rh/2,len,rh,.1,'rail');return}if(a.rail==='glass')add(0,slab+rh/2,len,rh-.08,.018,'rail',{glass:true});add(0,slab+rh-.025,len,.05,.055,'rail');const n=Math.max(1,Math.ceil(len/(a.rail==='glass'?1.1:Math.max(.13,len/100))));for(let i=0;i<=n;i++)add((i/n-.5)*(len-.04),slab+rh/2,.035,rh,.035,'rail')};for(const side of a.edges==='all'?['front','back','left','right']:a.edges==='three'?['front','left','right']:[a.edges])edge(side)}}
else if(o.kind==='roundColumn')put(0,h/2,0,w,h,d,o.color,'post',{round:true});
else if(o.kind==='facadePanel'&&a.panel==='slats'){const n=Math.max(1,Math.min(160,Math.ceil(w/a.spacing)));for(let i=0;i<n;i++)put((i+.5)*w/n-w/2,h/2,0,Math.min(w/n*.55,.12),h,d,o.color,'panel')}
else put(0,h/2,0,w,h,d,o.color,o.kind==='beam'?'beam':o.kind==='rectColumn'?'post':'solid');
return out}
export function partTop(o){return isDeck(o)?(o.elevation||0)+partSettings(o).slab:null}
export function localPartPoint(o,q){const a=o.rotation*Math.PI/180,c=Math.cos(a),s=Math.sin(a),x=q.x-o.x,y=q.y-o.y;return {x:(x*c+y*s)*(o.mirrorX?-1:1),y:(-x*s+y*c)*(o.mirrorY?-1:1)}}
export function partContains(o,q){const a=localPartPoint(o,q);return Math.abs(a.x)<=o.width/2+1e-7&&Math.abs(a.y)<=o.depth/2+1e-7}
export function componentFootprint(o,b){const a=o.rotation*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>{const x=(b.x+i*b.width/2)*(o.mirrorX?-1:1),y=(b.z+j*b.depth/2)*(o.mirrorY?-1:1);return {x:o.x+x*c-y*s,y:o.y+x*s+y*c}})}
export function partCollision(o,q,foot){const a=localPartPoint(o,q);return partComponents(o).some(b=>{const bottom=(o.elevation||0)+b.y-b.height/2,top=bottom+b.height;if(top<=foot+.025||bottom>=foot+1.8)return false;return Math.abs(a.x-b.x)<b.width/2+.12&&Math.abs(a.y-b.z)<b.depth/2+.12})}
export function partQuantities(o){const list=partComponents(o),volume=role=>list.filter(q=>q.role===role).reduce((s,q)=>s+q.width*q.depth*q.height*(q.round?Math.PI/4:1),0);return {area:isDeck(o)?o.width*o.depth:0,slab:volume('deck'),roof:volume('canopy'),post:volume('post'),beam:volume('beam'),count:list.length}}
