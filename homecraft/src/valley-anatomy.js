// Shared anatomical surface for the procedural head and the generated skinned GLB.
// Coordinates are metres relative to the head bone.
const g=(x,s)=>Math.exp(-((x/s)**2));
export function faceRelief(x,y){
 const ax=Math.abs(x);
 const bridge=g(x,.014)*g(y+.008,.046)*.018;
 const tip=g(x,.016)*g(y+.040,.015)*.025;
 const wings=g(ax-.016,.009)*g(y+.043,.011)*.005;
 const cheek=g(ax-.062,.026)*g(y+.035,.029)*.012;
 const socket=g(ax-.044,.024)*g(y-.018,.017)*.013;
 const brow=g(ax-.045,.030)*g(y-.048,.017)*.004;
 const lips=g(x,.034)*g(y+.078,.014)*.004;
 const philtrum=g(x,.006)*g(y+.062,.009)*.0018;
 const chin=g(x,.042)*g(y+.112,.020)*.006;
 return bridge+tip+wings+cheek-socket+brow+lips-philtrum+chin;
}
export function faceTint(x,y,front){
 const cheek=front*g(Math.abs(x)-.064,.029)*g(y+.039,.022);
 const nose=front*g(x,.021)*g(y+.041,.021);
 const shade=front*g(y+.106,.024)*.045;
 return [1-shade*.35,1-cheek*.075-nose*.035-shade,1-cheek*.11-nose*.045-shade];
}
// Match normals across the duplicated UV seam, without welding UVs.
export function smoothRingSeam(geometry,rows,segments){
 const n=geometry.attributes.normal;
 for(let i=0;i<rows;i++){const a=i*(segments+1),b=a+segments;
 const x=n.getX(a)+n.getX(b),y=n.getY(a)+n.getY(b),z=n.getZ(a)+n.getZ(b),l=Math.hypot(x,y,z)||1;
 n.setXYZ(a,x/l,y/l,z/l);n.setXYZ(b,x/l,y/l,z/l)}
 n.needsUpdate=true;return geometry;
}
