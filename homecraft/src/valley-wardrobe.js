import * as T from 'three';
import {mesh,ell,box,material,bake} from './valley-realism.js';
import {curveDetail,silhouette} from './valley-character-model.js';
// Separate bone-attached accessories, not external assets.
export function wardrobeLayers(body,head,p,detail){
 const pieces=new T.Group();pieces.name='WardrobeLayers';body.add(pieces);
 const leather=material(0x654b39,{roughness:.78}),metal=material(0xa9a49a,{metalness:.62,roughness:.40}),fabric=material(new T.Color(p.shirt).multiplyScalar(.72),{roughness:.93});
 const bag=['sport','jacket','hoodie'].includes(p.outfit),belt=['chinos','jeans'].includes(p.bottom);
 if(belt){mesh(pieces,silhouette([[.852,.151,.108],[.875,.153,.109]],20),leather);box(pieces,metal,0,.864,.116,.043,.022,.008);box(pieces,leather,0,.864,.121,.027,.011,.004)}
 if(bag){ell(pieces,fabric,0,1.075,-.156,.135,.181,.073);ell(pieces,fabric,0,1.009,-.218,.105,.078,.024);for(const s of [-1,1]){curveDetail(pieces,leather,[[s*.086,1.23,-.143],[s*.118,1.285,-.015],[s*.118,1.235,.087],[s*.124,1.10,.108],[s*.122,1.025,.091]],.011,detail?16:8);if(detail)box(pieces,metal,s*.122,1.10,.118,.025,.035,.007)}if(detail)curveDetail(pieces,metal,[[-.075,1.10,-.211],[0,1.14,-.230],[.075,1.10,-.211]],.002,14)}
 if(p.outfit==='cardigan'||p.outfit==='blouse'){for(const s of [-1,1]){const e=mesh(head,new T.TorusGeometry(.007,.0017,6,12),metal,s*.119,-.048,.006);e.rotation.y=s*.2}}
 if(p.outfit==='coat'){curveDetail(pieces,fabric,[[-.065,1.326,.075],[0,1.285,.103],[.060,1.327,.075]],.012,12)}
 if(!belt&&!bag)leather.dispose();if(!bag&&p.outfit!=='coat')fabric.dispose();if(!belt&&!bag&&!['cardigan','blouse'].includes(p.outfit))metal.dispose();
 bake(pieces);return pieces;
}
