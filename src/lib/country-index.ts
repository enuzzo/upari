import type {Boundaries} from './statistics';
type Feature=Boundaries['features'][number];
/** Coarse WGS84 polygons, indexed once; no reverse-geocoder or GPU readback. */
export function countryIndex(boundaries:Boundaries){
 const parts=boundaries.features.flatMap(feature=>(feature.geometry.type==='Polygon'?[feature.geometry.coordinates as number[][][]]:feature.geometry.coordinates as number[][][][]).map(raw=>{
  const xs=raw[0].map(p=>p[0]),ys=raw[0].map(p=>p[1]),reference=xs[0],wrapped=Math.max(...xs)-Math.min(...xs)>180&&Math.max(...ys.map(Math.abs))<89;
  const longitude=(x:number)=>wrapped?reference+((x-reference+540)%360)-180:x;
  const rings=raw.map(r=>r.map(p=>[longitude(p[0]),p[1]])),outer=rings[0];
  return{feature,longitude,rings,minX:Math.min(...outer.map(p=>p[0])),maxX:Math.max(...outer.map(p=>p[0])),minY:Math.min(...ys),maxY:Math.max(...ys)};
 }));
 const inside=(ring:number[][],x:number,y:number)=>{let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
 return{find(lon:number,lat:number):Feature|null{if(!Number.isFinite(lon)||!Number.isFinite(lat))return null;for(const p of parts){const x=p.longitude(lon);if(x<p.minX||x>p.maxX||lat<p.minY||lat>p.maxY)continue;if(inside(p.rings[0],x,lat)&&!p.rings.slice(1).some(r=>inside(r,x,lat)))return p.feature;}return null;}};
}
export function tooltipPosition(x:number,y:number,width:number,height:number){return{x:Math.max(8,Math.min(x+18,width-272)),y:Math.max(8,Math.min(y+18,height-148))};}
