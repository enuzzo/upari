import * as C from 'cesium';
import {countryIndex} from './country-index';
import type {Boundaries} from './statistics';
export type CountryHover={id:string;region:string|null;name:string;x:number;y:number};
/** Pointer hit-test limited to 20 Hz; also follows an Earth rotating below a still cursor. */
export function countryHover(viewer:C.Viewer,boundaries:Boundaries,changed:(hover:CountryHover|null)=>void){
 const index=countryIndex(boundaries),canvas=viewer.canvas;let pointer:{x:number;y:number}|null=null,down:{x:number;y:number}|null=null,previous:CountryHover|null=null,last=-Infinity,gone=false,touchSelected=false;
 const clear=()=>{pointer=null;if(previous){previous=null;changed(null);viewer.scene.requestRender();}};
 const pick=(now:number,force=false)=>{if(gone||viewer.isDestroyed()||!pointer||down||document.hidden||!force&&now-last<50)return;last=now;const position=viewer.camera.pickEllipsoid(new C.Cartesian2(pointer.x,pointer.y),C.Ellipsoid.WGS84),carto=position?C.Cartographic.fromCartesian(position):null,feature=carto?index.find(C.Math.toDegrees(carto.longitude),C.Math.toDegrees(carto.latitude)):null;
  const next=feature?{id:feature.properties.id,region:feature.properties.statCode,name:feature.properties.name,...pointer}:null;
  if(next?.id===previous?.id&&next?.x===previous?.x&&next?.y===previous?.y)return;previous=next;changed(next);viewer.scene.requestRender();
 };
 const location=(e:PointerEvent)=>{const rect=canvas.getBoundingClientRect();return{x:e.clientX-rect.left,y:e.clientY-rect.top};};
 const move=(e:PointerEvent)=>{if(e.pointerType==='touch')return;touchSelected=false;pointer=location(e);pick(performance.now());};
 const press=(e:PointerEvent)=>{touchSelected=false;down=location(e);clear();};
 const release=(e:PointerEvent)=>{const point=location(e),tap=down&&Math.hypot(point.x-down.x,point.y-down.y)<8;down=null;if(e.pointerType!=='touch'||tap){touchSelected=e.pointerType==='touch';pointer=point;pick(performance.now(),true);}};
 const dismiss=()=>{down=null;touchSelected=false;clear();};
 const leave=(e:PointerEvent)=>{if(e.pointerType==='touch'&&touchSelected&&!down)return;dismiss();};
 const hidden=()=>{if(document.hidden)dismiss();};
 canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerdown',press);canvas.addEventListener('pointerup',release);canvas.addEventListener('pointerleave',leave);canvas.addEventListener('pointercancel',dismiss);window.addEventListener('blur',dismiss);document.addEventListener('visibilitychange',hidden);
 const off=viewer.scene.preRender.addEventListener(()=>pick(performance.now()));
 return()=>{gone=true;off();canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerdown',press);canvas.removeEventListener('pointerup',release);canvas.removeEventListener('pointerleave',leave);canvas.removeEventListener('pointercancel',dismiss);window.removeEventListener('blur',dismiss);document.removeEventListener('visibilitychange',hidden);changed(null);};
}
