import * as C from 'cesium';
import {advect,sampleVector,type VectorField} from './vectors';
import type {RenderQuality} from '../types';
/** One Cesium primitive collection; bounded CPU advection, GPU-rendered geographic trails. */
export function vectorRenderer(viewer:C.Viewer,field:VectorField,quality:RenderQuality,motion:boolean){
  const count=quality==='battery'?80:quality==='high'?320:180,collection=viewer.scene.primitives.add(new C.PolylineCollection());
  const color=C.Color.fromCssColorString(field.kind==='wind'?'#eaf6ff':'#69f6dc'),acceleration=field.kind==='wind'?3600:86400;
  const particles:{lon:number;lat:number;age:number;sampleAge:number;line:C.Polyline;trail:{longitude:number;latitude:number}[]}[]=[];
  let gone=false,timer:ReturnType<typeof setTimeout>|undefined,previous=performance.now();
  function seed(){
    const box=viewer.camera.computeViewRectangle();
    for(let i=0;i<60;i++){
      let lon=Math.random()*360-180,lat=Math.random()*150-75;
      if(box){const width=(box.east-box.west+2*Math.PI)%(2*Math.PI)||2*Math.PI;lon=C.Math.toDegrees(box.west+Math.random()*width);lat=C.Math.toDegrees(box.south+Math.random()*(box.north-box.south));}
      if(sampleVector(field,lon,lat))return {lon:((lon+180)%360+360)%360-180,lat};
    }return null;
  }
  const positions=(trail:{longitude:number;latitude:number}[])=>trail.map(p=>C.Cartesian3.fromDegrees(p.longitude,p.latitude,field.kind==='wind'?10000:1500));
  // Seven history samples span 2.4 display seconds, independently of render cadence.
  // At planet scale, recording every 50 ms made real velocities almost invisible.
  const make=()=>{const p=seed();if(!p)return;const trail=[{longitude:p.lon,latitude:p.lat}];let q=trail[0];for(let i=0;i<6;i++){const next=advect(field,q.longitude,q.latitude,acceleration*.4);if(!next||Math.abs(next.longitude-q.longitude)>180)break;trail.push(next);q=next;}if(trail.length<2)return;particles.push({lon:q.longitude,lat:q.latitude,age:0,sampleAge:0,line:collection.add({positions:positions(trail),width:1.8,material:C.Material.fromType('Color',{color:color.withAlpha(.8)})}),trail});};
  const report=()=>viewer.container.setAttribute('data-vector-count',String(particles.length));
  for(let i=0;i<count;i++)make();report();viewer.scene.requestRender();
  function draw(){
    timer=undefined;if(gone||viewer.isDestroyed()||document.hidden)return;
    const now=performance.now(),dt=Math.min(.12,(now-previous)/1000);previous=now;
    for(const p of particles){
      let q=advect(field,p.lon,p.lat,dt*acceleration);p.age+=dt;
      if(!q||p.age>8){const next=seed();if(!next){p.line.show=false;continue;}p.lon=next.lon;p.lat=next.lat;p.trail=[];p.age=0;p.sampleAge=0;q=advect(field,p.lon,p.lat,dt*acceleration);}
      if(!q){p.line.show=false;continue;}
      p.lon=q.longitude;p.lat=q.latitude;p.sampleAge+=dt;
      // A wrap is a path break, never a straight line through the globe.
      if(p.trail.length&&Math.abs(p.trail.at(-1)!.longitude-q.longitude)>180)p.trail=[];
      if(p.sampleAge>=.4||!p.trail.length){p.trail.push(q);p.sampleAge=0;if(p.trail.length>7)p.trail.shift();}
      p.line.show=p.trail.length>0;p.line.positions=positions([...p.trail,q]);
    }
    viewer.scene.requestRender();timer=setTimeout(draw,quality==='battery'?100:50);
  }
  const enabled=motion&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  const visible=()=>{if(timer)clearTimeout(timer);timer=undefined;previous=performance.now();if(enabled&&!document.hidden)draw();};
  if(enabled)visible();document.addEventListener('visibilitychange',visible);
  const moved=()=>{collection.removeAll();particles.length=0;for(let i=0;i<count;i++)make();report();viewer.scene.requestRender();};
  const off=viewer.camera.moveEnd.addEventListener(moved);
  return ()=>{gone=true;if(timer)clearTimeout(timer);off();document.removeEventListener('visibilitychange',visible);if(!viewer.isDestroyed()){viewer.container.removeAttribute('data-vector-count');viewer.scene.primitives.remove(collection);}};
}
