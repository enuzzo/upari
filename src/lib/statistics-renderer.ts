import {FrameSample} from './frame-sample';
import * as C from 'cesium';
import {annualPair,statColor,type Boundaries} from './statistics';
import type {StudyController} from './study-controller';
export type StudySession={controller:StudyController;boundaries:Boundaries};
/** Single engine, static batched geometry. Only color attributes/point sizes change with time. */
export function statisticsRenderer(viewer:C.Viewer,{controller,boundaries}:StudySession){
 const data=controller.data,instances:C.GeometryInstance[]=[],outlines:C.GeometryInstance[]=[],bindings:{id:{upariRegion:string|null;boundary:string};region:string|null;attributes?:{color:Uint8Array}}[]=[];
 const hierarchy=(rings:number[][][])=>new C.PolygonHierarchy(C.Cartesian3.fromDegreesArray(rings[0].flatMap(p=>p.slice(0,2))),rings.slice(1).map(r=>new C.PolygonHierarchy(C.Cartesian3.fromDegreesArray(r.flatMap(p=>p.slice(0,2))))));
 for(const f of boundaries.features){const polygons=f.geometry.type==='Polygon'?[f.geometry.coordinates as number[][][]]:f.geometry.coordinates as number[][][][];
  polygons.forEach((rings,i)=>{const id=f.properties.id+':'+i,h=hierarchy(rings),region=f.properties.statCode;const instanceID={upariRegion:region,boundary:id};bindings.push({id:instanceID,region});
   instances.push(new C.GeometryInstance({id:instanceID,geometry:new C.PolygonGeometry({polygonHierarchy:h,height:60,vertexFormat:C.PerInstanceColorAppearance.VERTEX_FORMAT,granularity:C.Math.toRadians(3)}),attributes:{color:new C.ColorGeometryInstanceAttribute(.18,.22,.27,1)}}));
   outlines.push(new C.GeometryInstance({geometry:new C.PolygonOutlineGeometry({polygonHierarchy:h,height:100,granularity:C.Math.toRadians(3)}),attributes:{color:new C.ColorGeometryInstanceAttribute(.7,.84,.9,.45)}}));
  });
 }
 const fill=viewer.scene.primitives.add(new C.Primitive({geometryInstances:instances,appearance:new C.PerInstanceColorAppearance({flat:true,translucent:false}),asynchronous:true,releaseGeometryInstances:true})) as C.Primitive;
 const edge=viewer.scene.primitives.add(new C.Primitive({geometryInstances:outlines,appearance:new C.PerInstanceColorAppearance({flat:true,translucent:true}),asynchronous:true})) as C.Primitive;
 const points=viewer.scene.primitives.add(new C.PointPrimitiveCollection()) as C.PointPrimitiveCollection;
 const symbols=new Map<string,C.PointPrimitive>();
 const regionByID=new Map(data.countries.map(r=>[r.id,r]));
 for(const f of boundaries.features){const code=f.properties.statCode;if(!code||symbols.has(code))continue;const r=regionByID.get(code);let lon=f.properties.longitude??r?.longitude,lat=f.properties.latitude??r?.latitude;if(lon==null||lat==null)continue;
  symbols.set(code,points.add({id:{upariRegion:code},position:C.Cartesian3.fromDegrees(lon,lat,6000),pixelSize:4,color:C.Color.fromCssColorString('#fd9bd4'),outlineColor:C.Color.fromCssColorString('#fff5fc'),outlineWidth:1,disableDepthTestDistance:Number.POSITIVE_INFINITY,show:false}));
 }
 const links=viewer.scene.primitives.add(new C.PolylineCollection()) as C.PolylineCollection;
 const originColors=['#69f6dc','#fd9bd4','#ffc779'];
 const routes=(data.flows?.relations??[]).filter(r=>r.origin!==r.destination).map(r=>({r,max:Math.max(0,...r.values.filter((v):v is number=>v!==null))})).sort((a,b)=>b.max-a.max).slice(0,64);
 const maximum=Math.max(1,...routes.map(r=>r.max));
 const arcs=routes.flatMap(({r})=>{const from=regionByID.get(r.origin),to=regionByID.get(r.destination);if(from?.longitude==null||from.latitude==null||to?.longitude==null||to.latitude==null)return[];
  const geodesic=new C.EllipsoidGeodesic(C.Cartographic.fromDegrees(from.longitude,from.latitude),C.Cartographic.fromDegrees(to.longitude,to.latitude)),positions=C.Cartesian3.fromDegreesArrayHeights(Array.from({length:33},(_,i)=>{const t=i/32,p=geodesic.interpolateUsingFraction(t);return[C.Math.toDegrees(p.longitude),C.Math.toDegrees(p.latitude),8000+Math.sin(Math.PI*t)*Math.min(900000,geodesic.surfaceDistance*.12)];}).flat());
  const color=C.Color.fromCssColorString(originColors[Math.max(0,data.flows?.origins.indexOf(r.origin)??0)%originColors.length]);
  return[{r,color,line:links.add({id:{upariRegion:r.destination},positions,width:2,material:C.Material.fromType('PolylineArrow',{color}),show:false})}];
 });
 const sample=import.meta.env.DEV?new FrameSample(120):undefined;let warmup=0;
 let previous='',bound=false,gone=false;const showSymbol=new Map<string,boolean>(),normal=new C.Cartesian3(),direction=new C.Cartesian3();
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 const draw=()=>{
  if(gone||viewer.isDestroyed()||!fill.ready)return;
  const visibility=(point:C.PointPrimitive)=>{C.Ellipsoid.WGS84.geodeticSurfaceNormal(point.position,normal);C.Cartesian3.subtract(viewer.camera.positionWC,point.position,direction);return C.Cartesian3.dot(normal,direction)>0;};
  for(const [code,point] of symbols)point.show=showSymbol.get(code)===true&&visibility(point);
  if(!bound){for(const b of bindings)b.attributes=fill.getGeometryInstanceAttributes(b.id) as {color:Uint8Array};bound=true;instances.length=0;}
  const s=controller.snapshot(),time=media.matches?Math.floor(s.time):s.time,key=[Math.floor(time*1000),s.indicator,s.secondary,s.country].join('|');if(key===previous)return;previous=key;
  const primary=data.indicators.find(m=>m.id===s.indicator)!,secondary=data.indicators.find(m=>m.id===s.secondary);
  for(const b of bindings){const pair=b.region?annualPair(data,s.indicator,b.region,time):null,left=statColor(pair?.left??null,primary.domain),right=statColor(pair?.right??null,primary.domain),color=b.attributes?.color;if(color){for(let i=0;i<4;i++)color[i]=Math.round(left[i]*(1-(pair?.mix??0))+right[i]*(pair?.mix??0));b.attributes!.color=color;}}
  for(const [code,p] of symbols){
   const pair=secondary?annualPair(data,s.secondary,code,time):null,value=pair?(pair.left!==null&&pair.right!==null?(pair.left*(1-pair.mix)+pair.right*pair.mix):null):null,selected=code===s.country;
   showSymbol.set(code,selected||value!==null);p.show=(selected||value!==null)&&visibility(p);p.color=selected?C.Color.fromCssColorString('#ffffff'):C.Color.fromCssColorString('#fd9bd4').withAlpha(.75);
   // Circle area represents the second indicator on its fixed full-period scale; tween is visual only.
   p.pixelSize=value!==null&&secondary?Math.max(3,32*Math.sqrt(Math.max(0,(value-secondary.domain[0])/(secondary.domain[1]-secondary.domain[0])))):selected?8:0;
   p.outlineWidth=selected?2:1;
  }
  let visibleLinks=0;
  for(const {r,color,line} of arcs){const from=Math.floor(time)-data.years[0],to=Math.ceil(time)-data.years[0],mix=time-Math.floor(time),a=r.values[from]??null,b=r.values[to]??null;
   const value=a!==null&&b!==null?a*(1-mix)+b*mix:a??b,opacity=a!==null&&b!==null?1:a!==null?1-mix:mix;
   line.show=s.indicator===data.flows?.indicator&&value!==null&&value>0&&opacity>0;
   if(line.show){visibleLinks++;line.width=1+7*Math.sqrt(value!/maximum);line.material.uniforms.color=color.withAlpha(opacity*.9);}
  }
  if(import.meta.env.DEV)viewer.container.setAttribute('data-flow-count',String(visibleLinks));
  if(import.meta.env.DEV)viewer.container.setAttribute('data-study-frame' ,JSON.stringify({time,from:Math.floor(time),to:Math.ceil(time),indicator:s.indicator,features:boundaries.features.length,instances:bindings.length}));
 };
 const wake=()=>{if(!gone&&!viewer.isDestroyed())viewer.scene.requestRender();};
 const offControl=controller.subscribe(wake),offUpdate=viewer.scene.preUpdate.addEventListener(()=>{if(gone||viewer.isDestroyed())return;const now=performance.now();controller.advance(now,document.hidden);const playing=controller.snapshot().playing;if(sample){if(!playing||!fill.ready){sample.reset();warmup=0;}else if(++warmup>=30)sample.begin(now);}if(playing||!fill.ready)wake();}),offDraw=viewer.scene.preRender.addEventListener(draw);
 const offSample=sample?viewer.scene.postRender.addEventListener(()=>{if(warmup<30)return;const result=sample.frame(performance.now());if(result)viewer.container.setAttribute('data-study-sample',JSON.stringify(result));}):()=>{};
 const visible=()=>{controller.suspend();sample?.reset();warmup=0;wake();};document.addEventListener('visibilitychange',visible);
 const handler=new C.ScreenSpaceEventHandler(viewer.canvas);handler.setInputAction((click:{position:C.Cartesian2})=>{const picked=viewer.scene.pick(click.position);const code=picked?.id?.upariRegion;if(typeof code==='string'&&regionByID.has(code))controller.configure({country:code});},C.ScreenSpaceEventType.LEFT_CLICK);
 wake();
 return()=>{gone=true;offControl();offUpdate();offDraw();offSample();document.removeEventListener('visibilitychange',visible);handler.destroy();controller.suspend();if(!viewer.isDestroyed()){for(const name of ['data-study-frame','data-study-sample','data-flow-count'])viewer.container.removeAttribute(name);viewer.scene.primitives.remove(fill);viewer.scene.primitives.remove(edge);viewer.scene.primitives.remove(points);viewer.scene.primitives.remove(links);}};
}
