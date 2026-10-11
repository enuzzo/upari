import { memo,useEffect,useRef,useState } from 'react';
import * as C from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { Crosshair,Plus,Minus,Globe2,RefreshCw,ScanLine } from 'lucide-react';
import type { Layer,Place,OrbitData,RenderQuality,CameraView } from '../types';
import { tileURL } from '../lib/layers';
import { renderProfile } from '../lib/render-quality';
import { initialCamera } from '../lib/scene';
import { preloadTiles } from '../lib/imagery-preload';
import { removeGlobeEntities } from '../lib/globe-lifecycle';

type Props={layer:Layer|null;date:string;opacity:number;compare:boolean;compareDate:string;split:number;place:Place;orbit?:OrbitData|null;showISS?:boolean;sunOffset:number;lighting:boolean;quality:RenderQuality;initialCamera?:CameraView;onCameraChange?:(view:CameraView)=>void;autoRotate?:boolean;rotationSpeed?:number;hideTools?:boolean;preloadDate?:string;onLoadingChange?:(loading:boolean)=>void;onImageryError?:(message:string)=>void};
function provider(layer:Layer,date:string){return new C.UrlTemplateImageryProvider({url:tileURL(layer,date),tilingScheme:new C.WebMercatorTilingScheme(),tileWidth:256,tileHeight:256,maximumLevel:layer.maxLevel,credit:new C.Credit('NASA EOSDIS GIBS · '+layer.id)});}
function addImagery(viewer:C.Viewer,source:C.ImageryProvider,index?:number){
  const layer=new C.ImageryLayer(source,{maximumAnisotropy:8,minificationFilter:C.TextureMinificationFilter.LINEAR,magnificationFilter:C.TextureMagnificationFilter.LINEAR});
  viewer.imageryLayers.add(layer,index);return layer;
}
function Globe(p:Props){
  const node=useRef<HTMLDivElement>(null),viewer=useRef<C.Viewer|null>(null),primary=useRef<C.ImageryLayer|null>(null),second=useRef<C.ImageryLayer|null>(null),latest=useRef(p);latest.current=p;
  const [ready,setReady]=useState(false),[error,setError]=useState(''),[loading,setLoading]=useState(false),[tileError,setTileError]=useState(''),[baseError,setBaseError]=useState(''),[rotating,setRotating]=useState(p.autoRotate??false);
  useEffect(()=>{
    (window as unknown as {CESIUM_BASE_URL:string}).CESIUM_BASE_URL='/cesium/';
    let v:C.Viewer|null=null,gone=false;const off:(()=>void)[]=[];
    try{
      v=new C.Viewer(node.current!,{animation:false,timeline:false,baseLayerPicker:false,geocoder:false,homeButton:false,sceneModePicker:false,navigationHelpButton:false,fullscreenButton:false,selectionIndicator:false,infoBox:false,baseLayer:false,requestRenderMode:true,maximumRenderTimeChange:Infinity,useBrowserRecommendedResolution:false,skyBox:false,skyAtmosphere:new C.SkyAtmosphere(),terrainProvider:new C.EllipsoidTerrainProvider(),contextOptions:{webgl:{alpha:true,powerPreference:p.quality==='battery'?'low-power':'default'}}});
      viewer.current=v;
      v.scene.backgroundColor=C.Color.TRANSPARENT;
      v.scene.globe.baseColor=C.Color.fromCssColorString('#173249');
      v.scene.globe.dynamicAtmosphereLighting=true;v.scene.globe.dynamicAtmosphereLightingFromSun=true;v.scene.globe.showGroundAtmosphere=true;
      v.scene.globe.preloadAncestors=true;v.scene.globe.preloadSiblings=false;
      v.scene.screenSpaceCameraController.minimumZoomDistance=200;v.scene.screenSpaceCameraController.maximumZoomDistance=30000000;
      v.clock.shouldAnimate=false;
      const fallback=new C.UrlTemplateImageryProvider({url:'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg',tilingScheme:new C.WebMercatorTilingScheme(),maximumLevel:8,credit:'NASA Blue Marble · base di riserva'});
      const fallbackLayer=addImagery(v,fallback);
      const camera=p.initialCamera??initialCamera;
      v.camera.setView({destination:C.Cartesian3.fromDegrees(camera.longitude,camera.latitude,camera.height),orientation:{heading:camera.heading,pitch:camera.pitch,roll:camera.roll}});
      off.push(v.scene.globe.tileLoadProgressEvent.addEventListener((count:number)=>{setLoading(count>0);latest.current.onLoadingChange?.(count>0);}));
      off.push(v.camera.moveEnd.addEventListener(()=>{
        if(!v||v.isDestroyed())return;
        const c=v.camera.positionCartographic;
        latest.current.onCameraChange?.({longitude:C.Math.toDegrees(c.longitude),latitude:C.Math.toDegrees(c.latitude),height:c.height,heading:v.camera.heading,pitch:v.camera.pitch,roll:v.camera.roll});
      }));
      C.ArcGisMapServerImageryProvider.fromUrl('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',{enablePickFeatures:false}).then(source=>{
        if(gone||!v||v.isDestroyed())return;
        addImagery(v,source,1);
        v.imageryLayers.remove(fallbackLayer,true);
        off.push(source.errorEvent.addEventListener(()=>setBaseError('Alcune immagini fotografiche non sono disponibili.')));
        v.scene.requestRender();
      }).catch(()=>{if(!gone)setBaseError('Fotografia non disponibile · base NASA di riserva.');});
      setReady(true);
    }catch{
      if(v&&!v.isDestroyed())v.destroy();viewer.current=null;
      setError('Il globo richiede WebGL. Prova un browser aggiornato.');return;
    }
    const instance=v;
    const clock=()=>{
      if(document.hidden||instance.isDestroyed())return;
      instance.clock.currentTime=C.JulianDate.fromDate(new Date(Date.now()+latest.current.sunOffset*3600000));
      if(latest.current.lighting||latest.current.layer?.key==='night')instance.scene.requestRender();
    };
    clock();
    const timer=setInterval(clock,30000);
    const visible=()=>{if(instance.isDestroyed())return;instance.useDefaultRenderLoop=!document.hidden;if(!document.hidden){instance.resize();clock();instance.scene.requestRender();}};
    document.addEventListener('visibilitychange',visible);visible();
    return()=>{gone=true;clearInterval(timer);document.removeEventListener('visibilitychange',visible);off.forEach(f=>f());viewer.current=null;latest.current.onLoadingChange?.(false);if(!instance.isDestroyed())instance.destroy();};
  },[]);
  useEffect(()=>{
    const v=viewer.current;if(!ready||!v||!node.current)return;
    const resize=()=>{
      if(v.isDestroyed())return;
      const box=node.current!.getBoundingClientRect(),profile=renderProfile(box.width,box.height,window.devicePixelRatio,p.quality);
      v.resolutionScale=profile.resolutionScale;v.scene.globe.maximumScreenSpaceError=profile.screenSpaceError;v.scene.globe.tileCacheSize=profile.cacheSize;v.scene.msaaSamples=profile.msaaSamples;
      v.scene.postProcessStages.fxaa.enabled=profile.effectiveRatio<1.5;v.targetFrameRate=p.hideTools||p.quality==='battery'?30:60;
      v.resize();v.scene.requestRender();
    };
    const observer=new ResizeObserver(resize);observer.observe(node.current);window.addEventListener('resize',resize);resize();
    return()=>{observer.disconnect();window.removeEventListener('resize',resize);};
  },[ready,p.quality,p.hideTools]);
  useEffect(()=>{
    const v=viewer.current;if(!ready||!v)return;setTileError('');latest.current.onLoadingChange?.(!!p.layer);
    for(const r of [primary,second]){if(r.current)v.imageryLayers.remove(r.current,true);r.current=null;}
    if(!p.layer){v.scene.requestRender();return;}
    const source=provider(p.layer,p.date),a=addImagery(v,source);primary.current=a;a.alpha=p.opacity;a.splitDirection=p.compare?C.SplitDirection.LEFT:C.SplitDirection.NONE;
    if(p.layer.key==='night'){a.dayAlpha=0;a.nightAlpha=1;}
    const off=[source.errorEvent.addEventListener(()=>{setTileError('Copertura incompleta per questo layer o questa data.');latest.current.onImageryError?.('Copertura incompleta per questo layer o questa data.');})];
    if(p.compare){
      const bSource=provider(p.layer,p.compareDate),b=addImagery(v,bSource);second.current=b;b.alpha=p.opacity;b.splitDirection=C.SplitDirection.RIGHT;
      off.push(bSource.errorEvent.addEventListener(()=>setTileError('Copertura incompleta nella data di confronto.')));
    }
    v.scene.requestRender();return()=>off.forEach(f=>f());
  },[ready,p.layer,p.date,p.compare,p.compareDate]);
  useEffect(()=>{
    const v=viewer.current,layer=p.layer,date=p.preloadDate;
    if(!ready||!v||!layer||!date||layer.static)return;
    let controller:AbortController|undefined;
    const warm=()=>{
      controller?.abort();if(document.hidden||v.isDestroyed())return;
      const rectangle=v.camera.computeViewRectangle();if(!rectangle)return;
      const level=Math.log2(40075016*Math.max(node.current?.clientWidth??1,node.current?.clientHeight??1)/(Math.max(200,v.camera.positionCartographic.height)*256));
      const tiles=preloadTiles({west:C.Math.toDegrees(rectangle.west),east:C.Math.toDegrees(rectangle.east),south:C.Math.toDegrees(rectangle.south),north:C.Math.toDegrees(rectangle.north)},level,layer.maxLevel);
      controller=new AbortController();const signal=controller.signal;
      void Promise.all(tiles.map(async tile=>{
        try{const url=tileURL(layer,date).replace('{z}',String(tile.z)).replace('{x}',String(tile.x)).replace('{y}',String(tile.y));
          const response=await fetch(url,{signal,credentials:'omit',cache:'force-cache'});if(response.ok)await response.arrayBuffer();
        }catch{/* Optional warm-up; real renderer reports missing imagery. */}
      }));
    };
    warm();document.addEventListener('visibilitychange',warm);
    return()=>{controller?.abort();document.removeEventListener('visibilitychange',warm);};
  },[ready,p.layer,p.preloadDate]);
  useEffect(()=>{
    const v=viewer.current;if(!ready||!v)return;
    if(primary.current)primary.current.alpha=p.opacity;if(second.current)second.current.alpha=p.opacity;
    v.scene.splitPosition=p.split;v.scene.globe.enableLighting=p.lighting||p.layer?.key==='night';
    v.clock.currentTime=C.JulianDate.fromDate(new Date(Date.now()+p.sunOffset*3600000));v.scene.requestRender();
  },[ready,p.opacity,p.split,p.sunOffset,p.lighting,p.layer]);
  useEffect(()=>{
    const v=viewer.current;if(!ready||!v||p.hideTools)return;
    const marker=v.entities.add({position:C.Cartesian3.fromDegrees(p.place.longitude,p.place.latitude),point:{pixelSize:8,color:C.Color.fromCssColorString('#69f6dc'),outlineColor:C.Color.fromCssColorString('#0a161e'),outlineWidth:2,disableDepthTestDistance:0},label:{text:p.place.name,font:'12px system-ui',fillColor:C.Color.WHITE,pixelOffset:new C.Cartesian2(0,-22),showBackground:true,backgroundColor:C.Color.fromCssColorString('#060b13').withAlpha(.85),distanceDisplayCondition:new C.DistanceDisplayCondition(0,10000000)}});
    v.scene.requestRender();return()=>removeGlobeEntities(v,[marker]);
  },[ready,p.place,p.hideTools]);
  useEffect(()=>{
    const v=viewer.current;if(!ready||!v||!p.showISS||!p.orbit)return;
    let gone=false,timer:ReturnType<typeof setInterval>|undefined;const entities:C.Entity[]=[];
    void import('../lib/orbits').then(async api=>{
      const {json2satrec}=await import('satellite.js');
      if(gone||v.isDestroyed())return;
      const rec=json2satrec(p.orbit!.omm),points:C.Cartesian3[]=[],now=Date.now();
      for(let t=now-45*60000;t<=now+45*60000;t+=60000){const q=api.skyPoint(rec,t,p.place);if(q)points.push(C.Cartesian3.fromDegrees(q.longitude,q.latitude,q.altitude*1000));}
      const track=v.entities.add({polyline:{positions:points,width:1.5,material:C.Color.fromCssColorString('#69f6dc').withAlpha(.55),arcType:C.ArcType.NONE}});
      const station=v.entities.add({point:{pixelSize:7,color:C.Color.WHITE,outlineColor:C.Color.fromCssColorString('#69f6dc'),outlineWidth:2},label:{text:'ISS',font:'11px system-ui',pixelOffset:new C.Cartesian2(0,-18),fillColor:C.Color.WHITE}});
      entities.push(track,station);
      const update=()=>{if(document.hidden||gone)return;const q=api.skyPoint(rec,Date.now(),p.place);if(q)station.position=new C.ConstantPositionProperty(C.Cartesian3.fromDegrees(q.longitude,q.latitude,q.altitude*1000));v.scene.requestRender();};
      update();timer=setInterval(update,5000);
    }).catch(()=>{if(!gone)setTileError('Traccia ISS non disponibile.');});
    return()=>{gone=true;if(timer)clearInterval(timer);removeGlobeEntities(v,entities);};
  },[ready,p.showISS,p.orbit,p.place]);
  useEffect(()=>{setRotating(p.autoRotate??false);},[p.autoRotate]);
  useEffect(()=>{
    const v=viewer.current;if(!ready||!v||!rotating)return;
    let previous=performance.now();
    const timer=setInterval(()=>{
      const now=performance.now(),elapsed=Math.min(200,now-previous);previous=now;
      if(document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      v.camera.rotate(C.Cartesian3.UNIT_Z,C.Math.toRadians(p.rotationSpeed??.2)*elapsed/1000);v.scene.requestRender();
    },1000/30);
    return()=>clearInterval(timer);
  },[ready,rotating,p.rotationSpeed]);
  const flight=(view:CameraView)=>viewer.current?.camera.flyTo({destination:C.Cartesian3.fromDegrees(view.longitude,view.latitude,view.height),orientation:{heading:view.heading,pitch:view.pitch,roll:view.roll},duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:1.2});
  return <div className={'globe-stage '+(p.hideTools?'globe-ambient':'')}>
    <div className="globe-canvas" ref={node} aria-label="Globo interattivo: trascina per ruotare, usa due dita per lo zoom"/>
    {error&&<div className="globe-error" role="alert">{error}<button onClick={()=>location.reload()}>Riprova</button></div>}
    {!p.hideTools&&<div className="globe-tools" aria-label="Controlli del globo">
      <button aria-label="Vai al mio luogo" title="Vai al mio luogo" onClick={()=>flight({...initialCamera,longitude:p.place.longitude,latitude:p.place.latitude,height:12000})}><Crosshair size={20}/></button>
      <div className="zoom-tools"><button aria-label="Avvicina" onClick={()=>{const v=viewer.current;if(v){v.camera.zoomIn(v.camera.positionCartographic.height*.35);v.scene.requestRender();}}}><Plus size={21}/></button><button aria-label="Allontana" onClick={()=>{const v=viewer.current;if(v){v.camera.zoomOut(v.camera.positionCartographic.height*.55);v.scene.requestRender();}}}><Minus size={21}/></button></div>
      <button aria-label="Vista pianeta" title="Vista pianeta" onClick={()=>flight(initialCamera)}><Globe2 size={20}/></button>
      <button aria-label={rotating?'Ferma rotazione':'Ruota lentamente'} title={rotating?'Ferma rotazione':'Ruota lentamente'} aria-pressed={rotating} className={rotating?'selected':''} onClick={()=>setRotating(!rotating)}><RefreshCw size={19}/></button>
    </div>}
    {(loading||tileError||baseError)&&<div className="globe-status" role="status">{tileError||baseError||<><ScanLine size={14}/> Caricamento immagini</>}</div>}
  </div>;
}
export default memo(Globe);
