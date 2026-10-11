import { useEffect, useRef, useState } from 'react';
import * as C from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { Crosshair, Plus, Minus, Orbit, ScanLine, RefreshCw } from 'lucide-react';
import type { Layer, Place, OrbitData } from '../types';
import { tileURL } from '../lib/layers';
import { json2satrec } from 'satellite.js';
import { skyPoint } from '../lib/orbits';
type Props={layer:Layer;date:string;opacity:number;compare:boolean;compareDate:string;split:number;place:Place;orbit:OrbitData|null;detail:boolean;sunOffset:number};
function imagery(l:Layer,d:string) {return new C.UrlTemplateImageryProvider({url:tileURL(l,d),tilingScheme:new C.WebMercatorTilingScheme(),tileWidth:256,tileHeight:256,maximumLevel:l.maxLevel,credit:new C.Credit('NASA EOSDIS GIBS · '+l.id)});}
export default function Globe(p:Props) {
  const node=useRef<HTMLDivElement>(null);const viewer=useRef<C.Viewer|null>(null);const primary=useRef<C.ImageryLayer|null>(null);const second=useRef<C.ImageryLayer|null>(null);const detailLayer=useRef<C.ImageryLayer|null>(null);const sceneProps=useRef(p);sceneProps.current=p;
  const [ready,setReady]=useState(false);const [error,setError]=useState('');const [loading,setLoading]=useState(0);const [tileError,setTileError]=useState('');const [rotating,setRotating]=useState(false);
  useEffect(()=>{
    (window as unknown as {CESIUM_BASE_URL:string}).CESIUM_BASE_URL='/cesium/';
    let v:C.Viewer;
    try{
      v=new C.Viewer(node.current!,{animation:false,timeline:false,baseLayerPicker:false,geocoder:false,homeButton:false,sceneModePicker:false,navigationHelpButton:false,fullscreenButton:false,selectionIndicator:false,infoBox:false,baseLayer:false,requestRenderMode:true,maximumRenderTimeChange:Infinity,skyBox:false,skyAtmosphere:new C.SkyAtmosphere(),terrainProvider:new C.EllipsoidTerrainProvider(),contextOptions:{webgl:{alpha:true}}});
      viewer.current=v;v.scene.backgroundColor=C.Color.fromCssColorString('#060b13');v.scene.globe.baseColor=C.Color.fromCssColorString('#122437');v.scene.globe.enableLighting=true;v.scene.globe.dynamicAtmosphereLighting=true;v.scene.globe.dynamicAtmosphereLightingFromSun=true;v.scene.globe.showGroundAtmosphere=true;v.scene.globe.tileCacheSize=70;v.resolutionScale=Math.min(window.devicePixelRatio,1.5)/window.devicePixelRatio;v.clock.shouldAnimate=false;v.scene.screenSpaceCameraController.minimumZoomDistance=200;v.scene.screenSpaceCameraController.maximumZoomDistance=30000000;
      const base=new C.UrlTemplateImageryProvider({url:'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg',tilingScheme:new C.WebMercatorTilingScheme(),maximumLevel:8,credit:'NASA Blue Marble'});v.imageryLayers.addImageryProvider(base);
      v.camera.setView({destination:C.Cartesian3.fromDegrees(12,28,17000000)});setReady(true);
    }catch(e){setError('Il globo 3D richiede WebGL. Prova un browser aggiornato; passaggi e guida del cielo restano disponibili.');return;}
    const cancel=v.scene.globe.tileLoadProgressEvent.addEventListener((count:number)=>setLoading(count));
    const interval=setInterval(()=>{if(document.hidden)return;const q=sceneProps.current;v.clock.currentTime=C.JulianDate.fromDate(new Date(Date.now()+q.sunOffset*3600000));if(q.layer.key==='night')v.scene.requestRender();},30000);
    return()=>{clearInterval(interval);cancel();viewer.current=null;if(!v.isDestroyed())v.destroy();};
  },[]);
  useEffect(()=>{
    const v=viewer.current;if(!ready||!v)return;setTileError('');
    for(const r of [primary,second]){if(r.current)v.imageryLayers.remove(r.current,true);r.current=null;}
    const provider=imagery(p.layer,p.date);const a=v.imageryLayers.addImageryProvider(provider);primary.current=a;a.alpha=p.opacity;a.splitDirection=p.compare?C.SplitDirection.LEFT:C.SplitDirection.NONE;
    if(p.layer.key==='night'){a.dayAlpha=0;a.nightAlpha=1;}
    const off=provider.errorEvent.addEventListener(()=>setTileError('Immagini non disponibili in alcune zone o per questa data.'));
    if(p.compare){const b=v.imageryLayers.addImageryProvider(imagery(p.layer,p.compareDate));second.current=b;b.alpha=p.opacity;b.splitDirection=C.SplitDirection.RIGHT;if(p.layer.key==='night'){b.dayAlpha=0;b.nightAlpha=1;}}
    v.scene.globe.enableLighting=p.layer.key==='night';v.scene.requestRender();return()=>off();
  },[ready,p.layer,p.date,p.compare,p.compareDate]);
  useEffect(()=>{const v=viewer.current;if(!v)return;if(primary.current)primary.current.alpha=p.opacity;if(second.current)second.current.alpha=p.opacity;v.scene.splitPosition=p.split;v.clock.currentTime=C.JulianDate.fromDate(new Date(Date.now()+p.sunOffset*3600000));v.scene.requestRender();},[p.opacity,p.split,p.sunOffset]);
  useEffect(()=>{const v=viewer.current;if(!ready||!v)return;const marker=v.entities.add({position:C.Cartesian3.fromDegrees(p.place.longitude,p.place.latitude),point:{pixelSize:9,color:C.Color.fromCssColorString('#69f6dc'),outlineColor:C.Color.fromCssColorString('#0a161e'),outlineWidth:3,disableDepthTestDistance:0},label:{text:p.place.name,font:'13px system-ui',fillColor:C.Color.WHITE,pixelOffset:new C.Cartesian2(0,-23),showBackground:true,backgroundColor:C.Color.fromCssColorString('#060b13').withAlpha(.85),distanceDisplayCondition:new C.DistanceDisplayCondition(0,10000000)}});v.scene.requestRender();return()=>{v.entities.remove(marker);};},[ready,p.place]);
  useEffect(()=>{const v=viewer.current;if(!ready||!v||!p.orbit)return;const rec=json2satrec(p.orbit.omm);const points:C.Cartesian3[]=[];const now=Date.now();for(let t=now-45*60000;t<=now+45*60000;t+=60000){const q=skyPoint(rec,t,p.place);if(q)points.push(C.Cartesian3.fromDegrees(q.longitude,q.latitude,q.altitude*1000));}
    const track=v.entities.add({polyline:{positions:points,width:1.5,material:C.Color.fromCssColorString('#69f6dc').withAlpha(.55),arcType:C.ArcType.NONE}});
    const station=v.entities.add({point:{pixelSize:7,color:C.Color.WHITE,outlineColor:C.Color.fromCssColorString('#69f6dc'),outlineWidth:2},label:{text:'ISS',font:'11px system-ui',pixelOffset:new C.Cartesian2(0,-18),fillColor:C.Color.WHITE}});
    const update=()=>{if(document.hidden)return;const q=skyPoint(rec,Date.now(),p.place);if(q)station.position=new C.ConstantPositionProperty(C.Cartesian3.fromDegrees(q.longitude,q.latitude,q.altitude*1000));v.scene.requestRender();};update();const t=setInterval(update,5000);return()=>{clearInterval(t);v.entities.remove(track);v.entities.remove(station);};},[ready,p.orbit,p.place]);
  useEffect(()=>{const v=viewer.current;if(!ready||!v)return;let gone=false;
    if(!p.detail){if(detailLayer.current)v.imageryLayers.remove(detailLayer.current,true);detailLayer.current=null;v.scene.requestRender();return;}
    C.ArcGisMapServerImageryProvider.fromUrl('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer').then(provider=>{if(gone||v.isDestroyed())return;const a=v.imageryLayers.addImageryProvider(provider,1);detailLayer.current=a;v.scene.requestRender();}).catch(()=>setTileError('La base fotografica non è disponibile.'));
    return()=>{gone=true;if(detailLayer.current&&!v.isDestroyed())v.imageryLayers.remove(detailLayer.current,true);detailLayer.current=null;};
  },[p.detail,ready]);
  useEffect(()=>{const v=viewer.current;if(!v||!rotating)return;let prev=performance.now();const t=setInterval(()=>{const now=performance.now();if(!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches){v.camera.rotate(C.Cartesian3.UNIT_Z,(now-prev)*.000025);v.scene.requestRender();}prev=now;},40);return()=>clearInterval(t);},[rotating]);
  return <div className="globe-stage"><div className="globe-canvas" ref={node} aria-label="Globo interattivo della Terra: trascina per ruotare, usa due dita o i pulsanti per lo zoom"/>{error&&<div className="globe-error">{error}<button onClick={()=>location.reload()}>Riprova</button></div>}
    <div className="globe-tools"><button aria-label="Vai al mio luogo" title="Vai al mio luogo" onClick={()=>viewer.current?.camera.flyTo({destination:C.Cartesian3.fromDegrees(p.place.longitude,p.place.latitude,p.detail?3000:5000000),duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:1.4})}><Crosshair/></button><div className="zoom-tools"><button aria-label="Avvicina" onClick={()=>{const v=viewer.current;if(v){v.camera.zoomIn(v.camera.positionCartographic.height*.4);v.scene.requestRender();}}}><Plus/></button><button aria-label="Allontana" onClick={()=>{const v=viewer.current;if(v){v.camera.zoomOut(v.camera.positionCartographic.height*.65);v.scene.requestRender();}}}><Minus/></button></div><button aria-label="Vista pianeta" title="Vista pianeta" onClick={()=>viewer.current?.camera.flyTo({destination:C.Cartesian3.fromDegrees(12,28,17000000),duration:1})}><Orbit/></button><button aria-label={rotating?'Ferma rotazione':'Ruota lentamente'} aria-pressed={rotating} onClick={()=>setRotating(!rotating)}><RefreshCw/></button></div>
    <div className="globe-status" aria-live="polite">{loading>0?<><ScanLine size={14}/> Caricamento immagini</>:tileError?<span>{tileError}</span>:<><span className="status-dot"/> {p.layer.key==='night'?'Sole · '+(p.sunOffset?'anteprima temporale':'ora attuale'):'Immagini satellitari'}</>}</div>
  </div>;
}
