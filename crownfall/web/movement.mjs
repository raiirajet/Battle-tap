// Fixed-step spatial simulation. Animation never changes position or game outcomes.
export const naval=new Set(['fishing','merchant','patrol']);
export const directions=[[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[-1,-1],[1,-1]];
export function findPath(size,start,goal,blocked){
 if(![start,goal].every(p=>Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<size&&p.y<size)||blocked(goal.x,goal.y))return null;
 const a=start.y*size+start.x,b=goal.y*size+goal.x;
 if(a===b)return [];
 const prev=new Int32Array(size*size);prev.fill(-1);prev[a]=a;const q=[a];
 for(let i=0;i<q.length;i++){const k=q[i],x=k%size,y=Math.floor(k/size);for(const[dx,dy]of directions){const nx=x+dx,ny=y+dy,n=ny*size+nx;if(nx<0||ny<0||nx>=size||ny>=size||prev[n]!==-1||blocked(nx,ny)||dx&&dy&&(blocked(x+dx,y)||blocked(x,y+dy)))continue;prev[n]=k;if(n===b){const out=[];for(let j=b;j!==a;j=prev[j])out.push({x:j%size,y:Math.floor(j/size)});return out.reverse()}q.push(n)}}return null;
}
export function nearestCell(size,x,y,blocked,used=()=>false){let best=null,dist=Infinity;for(let a=0;a<size;a++)for(let b=0;b<size;b++){const d=(a-x)**2+(b-y)**2;if(d<dist&&!blocked(a,b)&&!used(a,b)){best={x:a,y:b};dist=d}}return best}
export function advanceActor(u,dt,speed,blocked){
 if(!u.path.length||u.hp<=0){u.moving=false;return 0}
 let remaining=dt*speed,travel=0;u.moving=true;
 while(remaining>1e-8&&u.path.length){const t=u.path[0],tx=t.x+.5,ty=t.y+.5,dx=tx-u.x,dy=ty-u.y,d=Math.hypot(dx,dy);
 if(blocked(t.x,t.y)){u.path=[];break;}
 if(d<1e-8){u.path.shift();continue;}
 const used=Math.min(d,remaining);u.facing=Math.atan2(dy,dx);u.x+=dx/d*used;u.y+=dy/d*used;travel+=used;remaining-=used;if(used>=d-1e-8){u.x=tx;u.y=ty;u.path.shift()}
 }
 u.stride=(u.stride||0)+travel;u.moving=travel>0;return travel;
}
