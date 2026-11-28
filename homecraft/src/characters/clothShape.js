import * as T from 'three';
import {smoothRingSeam} from '../valley-anatomy.js';
// Geometric folds follow the waist and underarm, not random surface noise.
export function clothRelief(y,a,style){const coat=['coat','cardigan','jacket','hoodie'].includes(style),amp=coat?.005:.003,waist=Math.exp(-(((y-.94)/.105)**2)),shoulder=Math.exp(-(((y-1.22)/.07)**2));return amp*(waist*Math.sin(a*7+(y-.9)*30)+shoulder*.65*Math.cos(a*5-y*22))}
export function shapeCloth(g,style,segments){const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(x,z),d=clothRelief(y,a,style);p.setXYZ(i,x+Math.sin(a)*d,y,z+Math.cos(a)*d)}p.needsUpdate=true;g.computeVertexNormals();return smoothRingSeam(g,p.count/(segments+1),segments)}
