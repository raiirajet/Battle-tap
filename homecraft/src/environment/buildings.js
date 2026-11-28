import * as T from 'three';
import {box,bake,material} from '../valley-realism.js';
// Hinge-local geometry: the leaf origin is the hinge, not the centre.
export function createHingedDoor(width=1.1,height=2.2){const root=new T.Group(),wood=material(0x73604e),hardware=material(0x92978c,{metalness:.7,roughness:.32});box(root,wood,width/2,height/2,0,width,height,.075);for(let i=0;i<3;i++)box(root,hardware,.025,.25+i*(height-.5)/2,.04,.045,.12,.035);box(root,hardware,width-.12,height*.48,.065,.12,.035,.045);bake(root);return root}
// Small roof courses and shaped sill edges; footprint and original building colliders unchanged.
export function roofEdgeDetails(root,h){const tiles=material(0x796050),sill=material(0xbeb8a8);for(const side of [-1,1]){for(let i=0;i<Math.ceil(h.d/.30);i++){let z=h.z-h.d/2+.15+i*.30;box(root,tiles,h.x+side*(h.w/2+.095),3.56,z,.32,.10,.27)}for(const dx of [-h.w*.29,h.w*.29])box(root,sill,h.x+dx,1.20,h.z+side*(h.d/2+.13),1.83,.07,.27)}return root}
