import {RotationClock,defaultRotationSpeed} from '../lib/earth-rotation';
import {earthShader} from '../lib/earth-shader';
import {earthStyles,spaceBlend,naturalGradeAllowed,type EarthStyle} from '../lib/earth-style';
import { memo,useEffect,useRef,useState,useId } from 'react';
import * as C from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { Crosshair,Plus,Minus,Globe2,Pause,Play,Gauge,X,ScanLine } from 'lucide-react';
import type { Layer,Place,OrbitData,RenderQuality,CameraView } from '../types';
import { validateField,type VectorField } from '../lib/vectors';
import { vectorRenderer } from '../lib/vector-renderer';
import { initialLayers,tileURL } from '../lib/layers';
import { renderProfile } from '../lib/render-quality';
import { initialCamera } from '../lib/scene';
import { ImageryBuffer,type FrameSpec } from '../lib/imagery-buffer';
import { removeGlobeEntities } from '../lib/globe-lifecycle';

type Props={layer:Layer|null;date:string;opacity:number;compare:boolean;compareDate:string;split:number;place:Place;orbit?:OrbitData|null;showISS?:boolean;sunOffset:number;lighting:boolean;quality:RenderQuality;initialCamera?:CameraView;onCameraChange?:(view:CameraView,persist?:boolean)=>void;onRotationChange?:(enabled:boolean)=>void;onRotationSpeedChange?:(speed:number)=>void;autoRotate?:boolean;rotationSpeed?:number;hideTools?:boolean;preloadDate?:string;onLoadingChange?:(loading:boolean)=>void;onImageryError?:(message:string)=>void;onFrameChange?:(frame:FrameSpec|undefined,transition?:FrameSpec)=>void;vectorKey?:"none"|"wind"|"currents";vectorMotion?:boolean;onVectorChange?:(field:VectorField|null)=>void;visualStyle?:EarthStyle;visualStrength?:number};
function provider(layer:Layer,date:string){return new C.UrlTemplateImageryProvider({url:tileURL(layer,date),tilingScheme:new C.WebMercatorTilingScheme(),tileWidth:256,tileHeight:256,maximumLevel:layer.maxLevel,rectangle:layer.coverage?C.Rectangle.fromDegrees(...layer.coverage):undefined,credit:new C.Credit(layer.source??('NASA EOSDIS GIBS · '+layer.id))});}
function addImagery(viewer:C.Viewer,source:C.ImageryProvider,index?:number){
  const layer=new C.ImageryLayer(source,{maximumAnisotropy:8,minificationFilter:C.TextureMinificationFilter.LINEAR,magnificationFilter:C.TextureMagnificationFilter.LINEAR});
  viewer.imageryLayers.add(layer,index);return layer;
}
function Globe(p:Props){
  const node=useRef<HTMLDivElement>(null),viewer=useRef<C.Viewer|null>(null),buffer=useRef<ImageryBuffer<C.ImageryLayer[]>|null>(null),wakeBuffer=useRef<()=>void>(()=>{}),latest=useRef(p);latest.current=p;
  const [ready,setReady]=useState(false),[error,setError]=useState(''),[loading,setLoading]=useState(false),[tileError,setTileError]=useState(''),[baseError,setBaseError]=useState(''),[styleError,setStyleError]=useState(''),[rotating,setRotating]=useState(p.autoRotate??true);
  const [rotationSpeed,setRotationSpeed]=useState(p.rotationSpeed??defaultRotationSpeed),[speedOpen,setSpeedOpen]=useState(false),[reducedMotion,setReducedMotion]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),[motionOptIn,setMotionOptIn]=useState(false);
  const rotationClock=useRef(new RotationClock()),rotationControls=useRef<HTMLDivElement>(null),previousAuto=useRef(p.autoRotate),rotationID=useId();
  const rotationRunning=rotating&&(!reducedMotion||motionOptIn);
  const speedLabel=rotationSpeed.toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2});
  useEffect(()=>{
    (window as unknown as {CESIUM_BASE_URL:string}).CESIUM_BASE_URL='/cesium/';
    let v:C.Viewer|null=null,gone=false;const off:(()=>void)[]=[];
    try{
      v=new C.Viewer(node.current!,{animation:false,timeline:false,baseLayerPicker:false,geocoder:false,homeButton:false,sceneModePicker:false,navigationHelpButton:false,fullscreenButton:false,selectionIndicator:false,infoBox:false,baseLayer:false,requestRenderMode:true,maximumRenderTimeChange:Infinity,useBrowserRecommendedResolution:false,skyBox:false,skyAtmosphere:new C.SkyAtmosphere(),terrainProvider:new C.EllipsoidTerrainProvider(),contextOptions:{webgl:{alpha:true,powerPreference:p.quality==='battery'?'low-power':'default'}}});
      viewer.current=v;
      v.scene.backgroundColor=C.Color.TRANSPARENT;
      v.scene.globe.baseColor=C.Color.fromCssColorString('#173249');
      v.scene.globe.dynamicAtmosphereLighting=true;v.scene.globe.dynamicAtmosphereLightingFromSun=true;v.scene.globe.showGroundAtmosphere=true;
      if(v.scene.skyAtmosphere){v.scene.skyAtmosphere.perFragmentAtmosphere=p.quality!=='battery';v.scene.skyAtmosphere.atmosphereLightIntensity=42;v.scene.skyAtmosphere.saturationShift=.08;}
      // Cesium measures these from Earth's centre, unlike positionCartographic.height.
      const radius=C.Ellipsoid.WGS84.maximumRadius;
      v.scene.globe.lightingFadeOutDistance=radius+150000;v.scene.globe.lightingFadeInDistance=radius+1500000;
      v.scene.globe.nightFadeOutDistance=radius+150000;v.scene.globe.nightFadeInDistance=radius+1500000;
      v.scene.globe.preloadAncestors=true;v.scene.globe.preloadSiblings=false;
      v.scene.screenSpaceCameraController.minimumZoomDistance=200;v.scene.screenSpaceCameraController.maximumZoomDistance=30000000;
      v.clock.shouldAnimate=false;
      const fallback=new C.UrlTemplateImageryProvider({url:'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg',tilingScheme:new C.WebMercatorTilingScheme(),maximumLevel:8,credit:'NASA Blue Marble · base di riserva'});
      addImagery(v,fallback);let aerial:C.ImageryLayer|undefined;
      const nightLayer=initialLayers.find(layer=>layer.key==='night')!;const night=provider(nightLayer,nightLayer.date);
      const lights=addImagery(v,night);lights.dayAlpha=0;lights.nightAlpha=1;lights.brightness=3.0;lights.gamma=2.0;lights.alpha=0;lights.show=false;
      const updateBase=()=>{if(!v||v.isDestroyed())return;const far=spaceBlend(v.camera.positionCartographic.height);if(aerial)aerial.alpha=1-far;lights.alpha=!latest.current.layer&&latest.current.lighting?far:0;lights.show=lights.alpha>0;};
      off.push(v.scene.preRender.addEventListener(updateBase));
      const camera=p.initialCamera??initialCamera;
      v.camera.setView({destination:C.Cartesian3.fromDegrees(camera.longitude,camera.latitude,camera.height),orientation:{heading:camera.heading,pitch:camera.pitch,roll:camera.roll}});
      off.push(v.scene.globe.tileLoadProgressEvent.addEventListener((count:number)=>{setLoading(count>0);}));
      off.push(v.camera.moveEnd.addEventListener(()=>{
        if(!v||v.isDestroyed())return;
        const c=v.camera.positionCartographic;
        latest.current.onCameraChange?.({longitude:C.Math.toDegrees(c.longitude),latitude:C.Math.toDegrees(c.latitude),height:c.height,heading:v.camera.heading,pitch:v.camera.pitch,roll:v.camera.roll});
      }));
      C.ArcGisMapServerImageryProvider.fromUrl('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',{enablePickFeatures:false}).then(source=>{
        if(gone||!v||v.isDestroyed())return;
        aerial=addImagery(v,source,1);updateBase();
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
    let stopped=false;
    const resize=()=>{
      const element=node.current;if(stopped||!element||v.isDestroyed())return;
      const box=element.getBoundingClientRect(),profile=renderProfile(box.width,box.height,window.devicePixelRatio,p.quality);
      if(v.scene.skyAtmosphere)v.scene.skyAtmosphere.perFragmentAtmosphere=p.quality!=='battery';
      v.resolutionScale=profile.resolutionScale;v.scene.globe.maximumScreenSpaceError=profile.screenSpaceError;v.scene.globe.tileCacheSize=profile.cacheSize;v.scene.msaaSamples=profile.msaaSamples;
      v.scene.postProcessStages.fxaa.enabled=profile.effectiveRatio<1.5;v.targetFrameRate=p.hideTools||p.quality==='battery'?30:60;
      v.resize();v.scene.requestRender();
    };
    const observer=new ResizeObserver(resize);observer.observe(node.current);window.addEventListener('resize',resize);resize();
    return()=>{stopped=true;observer.disconnect();window.removeEventListener('resize',resize);};
  },[ready,p.quality,p.hideTools]);
  useEffect(()=>{
    const v=viewer.current;if(!ready||!v)return;
    setStyleError('');let stage:C.PostProcessStage|undefined,stopped=false;
    try{
      stage=new C.PostProcessStage({name:'upari-earth-style',fragmentShader:earthShader,uniforms:{
        style:()=>Math.max(0,earthStyles.findIndex(s=>s.key===(latest.current.visualStyle??'natural'))),
        strength:()=>latest.current.visualStrength??1,spaceAmount:()=>spaceBlend(v.camera.positionCartographic.height),
        photographic:()=>{const key=buffer.current?.displaying?.key.split('|')[0];const shown=key?(initialLayers.find(l=>l.key===key)??{regional:false}):null;return naturalGradeAllowed(latest.current.layer,shown)?1:0;},
        solarLighting:()=>latest.current.lighting||latest.current.layer?.key==='night'?1:0,
        pixelRatio:()=>v.scene.drawingBufferWidth/Math.max(1,node.current?.clientWidth??v.scene.drawingBufferWidth)
      }});v.scene.postProcessStages.add(stage);
      node.current?.setAttribute('data-earth-style',p.visualStyle??'natural');v.scene.requestRender();
    }catch{setStyleError('Effetto non disponibile · vista naturale.');}
    const off=v.scene.renderError.addEventListener((_scene:C.Scene,error:unknown)=>{
      if(stopped||!stage||!/shader|fragment|compile|program/i.test(String(error)))return;
      if(!v.isDestroyed())v.scene.postProcessStages.remove(stage);stage=undefined;
      node.current?.setAttribute('data-earth-style','fallback-natural');setStyleError('Effetto non disponibile · vista naturale.');
      queueMicrotask(()=>{if(!stopped&&!v.isDestroyed()){v.useDefaultRenderLoop=!document.hidden;v.scene.requestRender();}});
    });
    return()=>{stopped=true;off();if(stage&&!v.isDestroyed())v.scene.postProcessStages.remove(stage);};
  },[ready,p.visualStyle]);
  useEffect(()=>{const v=viewer.current;if(ready&&v&&!v.isDestroyed())v.scene.requestRender();},[ready,p.visualStrength]);
  useEffect(()=>{
    const v=viewer.current;if(!ready||!v)return;
    let timer:ReturnType<typeof setTimeout>|undefined,previous=performance.now(),settles=0,transitionStart=0,transitionFrames=0,transitionGap=0;
    const listeners=new Map<C.ImageryLayer,()=>void>();
    const manager=new ImageryBuffer<C.ImageryLayer[]>({
      create:spec=>{
        const layer=latest.current.layer!;
        return [spec.date,...(spec.compareDate?[spec.compareDate]:[])].map((date,i)=>{
          const source=provider(layer,date),image=addImagery(v,source);image.alpha=0;
          image.splitDirection=spec.compareDate?(i===0?C.SplitDirection.LEFT:C.SplitDirection.RIGHT):C.SplitDirection.NONE;
          if(layer.key==='night'){image.dayAlpha=0;image.nightAlpha=1;}
          listeners.set(image,source.errorEvent.addEventListener(()=>manager.fail(spec.key)));
          return image;
        });
      },
      remove:images=>{for(const image of images){listeners.get(image)?.();listeners.delete(image);if(!v.isDestroyed())v.imageryLayers.remove(image,true);}},
      opacity:(images,alpha)=>{for(const image of images)image.alpha=alpha;},
      shown:(spec,transition)=>{if(transition){transitionStart=performance.now();transitionFrames=0;transitionGap=0;}else{node.current?.setAttribute('data-frame-date',spec.date);if(transitionStart){node.current?.setAttribute('data-transition-metrics',JSON.stringify({frames:transitionFrames,ms:Math.round(performance.now()-transitionStart),maxFrameGap:Math.round(transitionGap)}));transitionStart=0;}}latest.current.onFrameChange?.(spec,transition);latest.current.onLoadingChange?.(!!transition);if(!transition)queueMicrotask(()=>{if(buffer.current!==manager)return;const p=latest.current;manager.preload(p.layer&&p.preloadDate&&!p.compare?{key:p.layer.key+'|'+p.preloadDate,date:p.preloadDate}:undefined);wakeBuffer.current();});},
      error:()=>{const message='Copertura incompleta per questo layer o questa data.';setTileError(message);latest.current.onImageryError?.(message);}
    },matchMedia('(prefers-reduced-motion: reduce)').matches?0:320);
    buffer.current=manager;
    const draw=()=>{
      timer=undefined;if(v.isDestroyed()||document.hidden)return;
      v.scene.requestRender();
      if(manager.busy||!v.scene.globe.tilesLoaded||settles<2)timer=setTimeout(draw,v.scene.globe.tilesLoaded?16:100);
    };
    wakeBuffer.current=()=>{settles=0;previous=performance.now();if(timer)clearTimeout(timer);draw();};
    const off=v.scene.postRender.addEventListener(()=>{
      const now=performance.now();if(transitionStart){transitionFrames++;transitionGap=Math.max(transitionGap,now-previous);}manager.tick(now-previous,v.scene.globe.tilesLoaded,document.hidden);previous=now;settles++;
      latest.current.onLoadingChange?.(manager.busy);
    });
    const visible=()=>{if(document.hidden){if(timer)clearTimeout(timer);timer=undefined;}else wakeBuffer.current();};
    document.addEventListener('visibilitychange',visible);
    return()=>{if(timer)clearTimeout(timer);off();document.removeEventListener('visibilitychange',visible);manager.clear();buffer.current=null;wakeBuffer.current=()=>{};};
  },[ready]);
  useEffect(()=>{
    const manager=buffer.current;if(!ready||!manager)return;
    setTileError('');manager.setOpacity(p.opacity);
    const spec=p.layer?{key:p.layer.key+'|'+p.date+(p.compare?'|'+p.compareDate:''),date:p.date,compareDate:p.compare?p.compareDate:undefined}:undefined;
    manager.request(spec);if(!spec)latest.current.onFrameChange?.(undefined);latest.current.onLoadingChange?.(manager.busy);wakeBuffer.current();
  },[ready,p.layer,p.date,p.compare,p.compareDate]);
  useEffect(()=>{
    const manager=buffer.current;if(!ready||!manager)return;
    // A hidden but shown Cesium layer loads the actual viewport's tiles into GPU memory.
    // Exactly one upcoming frame is retained; no HTTP-only cache approximation.
    if(!manager.busy){manager.preload(p.layer&&p.preloadDate&&!p.compare?{key:p.layer.key+'|'+p.preloadDate,date:p.preloadDate}:undefined);wakeBuffer.current();}
  },[ready,p.layer,p.preloadDate,p.compare,loading]);
  useEffect(()=>{
    const v=viewer.current;if(!ready||!v)return;
    buffer.current?.setOpacity(p.opacity);
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
      const station=v.entities.add({point:{pixelSize:7,color:C.Color.WHITE,outlineColor:C.Color.fromCssColorString('#69f6dc'),outlineWidth:2},label:{text:+p.orbit!.omm.NORAD_CAT_ID===25544?'ISS':String(p.orbit!.omm.OBJECT_NAME).slice(0,50),font:'11px system-ui',pixelOffset:new C.Cartesian2(0,-18),fillColor:C.Color.WHITE}});
      entities.push(track,station);
      const update=()=>{if(document.hidden||gone)return;const q=api.skyPoint(rec,Date.now(),p.place);if(q)station.position=new C.ConstantPositionProperty(C.Cartesian3.fromDegrees(q.longitude,q.latitude,q.altitude*1000));v.scene.requestRender();};
      update();timer=setInterval(update,5000);
    }).catch(()=>{if(!gone)setTileError('Traccia ISS non disponibile.');});
    return()=>{gone=true;if(timer)clearInterval(timer);removeGlobeEntities(v,entities);};
  },[ready,p.showISS,p.orbit,p.place]);
  useEffect(()=>{
    latest.current.onVectorChange?.(null);const v=viewer.current;if(!ready||!v||!p.vectorKey||p.vectorKey==='none')return;
    const controller=new AbortController();let cleanup:(()=>void)|undefined;
    fetch('/vectors/'+p.vectorKey+'.json',{signal:controller.signal}).then(r=>{if(!r.ok)throw new Error('missing');return r.json();}).then(validateField).then(field=>{if(!controller.signal.aborted&&!v.isDestroyed()){cleanup=vectorRenderer(v,field,p.quality,p.vectorMotion!==false);latest.current.onVectorChange?.(field);}}).catch(()=>{if(!controller.signal.aborted)setTileError('Campo vettoriale non disponibile. Nessuna scia simulata.');});
    return()=>{controller.abort();cleanup?.();};
  },[ready,p.vectorKey,p.vectorMotion,p.quality]);
  useEffect(()=>{
    if(previousAuto.current===false&&p.autoRotate===true)setMotionOptIn(true);previousAuto.current=p.autoRotate;
    setRotating(p.autoRotate??true);
  },[p.autoRotate]);
  useEffect(()=>{setRotationSpeed(p.rotationSpeed??defaultRotationSpeed);},[p.rotationSpeed]);
  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    const changed=()=>{setReducedMotion(media.matches);setMotionOptIn(false);};
    media.addEventListener('change',changed);return()=>media.removeEventListener('change',changed);
  },[]);
  useEffect(()=>{
    if(!speedOpen)return;
    const outside=(e:PointerEvent)=>{if(!rotationControls.current?.contains(e.target as Node))setSpeedOpen(false);};
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setSpeedOpen(false);};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',key);
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',key);};
  },[speedOpen]);
  useEffect(()=>{
    const canvas=node.current;if(!ready||!canvas)return;const clock=rotationClock.current;
    const down=(e:PointerEvent)=>clock.down(e.pointerId),up=(e:PointerEvent)=>clock.up(e.pointerId,performance.now()),wheel=()=>clock.hold(performance.now()),visibility=()=>clock.suspend();
    canvas.addEventListener('pointerdown',down);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);canvas.addEventListener('wheel',wheel,{passive:true});document.addEventListener('visibilitychange',visibility);window.addEventListener('blur',visibility);
    return()=>{canvas.removeEventListener('pointerdown',down);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);canvas.removeEventListener('wheel',wheel);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('blur',visibility);};
  },[ready]);
  function publishCamera(persist=false){
    const v=viewer.current;if(!v||v.isDestroyed())return;const c=v.camera.positionCartographic;
    latest.current.onCameraChange?.({longitude:C.Math.toDegrees(c.longitude),latitude:C.Math.toDegrees(c.latitude),height:c.height,heading:v.camera.heading,pitch:v.camera.pitch,roll:v.camera.roll},persist);
  }
  useEffect(()=>{
    const v=viewer.current;if(!ready||!v||!rotationRunning)return;
    const clock=rotationClock.current;clock.reset();
    // Use Cesium's existing frame loop, honoring its adaptive 30/60 fps profile.
    return v.scene.preUpdate.addEventListener(()=>{
      if(v.isDestroyed())return;
      const degrees=clock.tick(performance.now(),rotationSpeed,v.camera.positionCartographic.height,document.hidden);
      if(!degrees)return;
      v.camera.rotate(C.Cartesian3.UNIT_Z,C.Math.toRadians(degrees));publishCamera();v.scene.requestRender();
    });
  },[ready,rotationRunning,rotationSpeed]);
  function toggleRotation(){const next=!rotationRunning;publishCamera();setMotionOptIn(next);setRotating(next);latest.current.onRotationChange?.(next);}
  function changeRotationSpeed(speed:number){setRotationSpeed(speed);latest.current.onRotationSpeedChange?.(speed);}
  const flight=(view:CameraView)=>{rotationClock.current.hold(performance.now(),1800);viewer.current?.camera.flyTo({destination:C.Cartesian3.fromDegrees(view.longitude,view.latitude,view.height),orientation:{heading:view.heading,pitch:view.pitch,roll:view.roll},duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:1.2});};
  return <div className={'globe-stage '+(p.hideTools?'globe-ambient':'')}>
    <div className="globe-canvas" ref={node} aria-label="Globo interattivo: trascina per ruotare, usa due dita per lo zoom"/>
    {error&&<div className="globe-error" role="alert">{error}<button onClick={()=>location.reload()}>Riprova</button></div>}
    {!p.hideTools&&<div className="globe-tools" aria-label="Controlli del globo">
      <button aria-label="Vai al mio luogo" title="Vai al mio luogo" onClick={()=>flight({...initialCamera,longitude:p.place.longitude,latitude:p.place.latitude,height:12000})}><Crosshair size={20}/></button>
      <div className="zoom-tools"><button aria-label="Avvicina" onClick={()=>{rotationClock.current.hold(performance.now());const v=viewer.current;if(v){v.camera.zoomIn(v.camera.positionCartographic.height*.35);v.scene.requestRender();}}}><Plus size={21}/></button><button aria-label="Allontana" onClick={()=>{rotationClock.current.hold(performance.now());const v=viewer.current;if(v){v.camera.zoomOut(v.camera.positionCartographic.height*.55);v.scene.requestRender();}}}><Minus size={21}/></button></div>
      <button aria-label="Vista pianeta" title="Vista pianeta" onClick={()=>flight(initialCamera)}><Globe2 size={20}/></button>
      <div className="rotation-tools" ref={rotationControls}>
        <button aria-label={rotationRunning?'Ferma rotazione':'Avvia rotazione'} title={rotationRunning?'Pausa rotazione':'Avvia rotazione'} aria-pressed={rotationRunning} className={rotationRunning?'selected':''} onClick={toggleRotation}>{rotationRunning?<Pause size={19}/>:<Play size={19}/>}</button>
        <button className="rotation-speed-button" aria-label={'Velocità di rotazione: '+speedLabel+' gradi al secondo'} title="Velocità di rotazione" aria-expanded={speedOpen} aria-controls={rotationID} onClick={()=>setSpeedOpen(!speedOpen)}><Gauge size={16}/><span>{speedLabel}</span></button>
        {speedOpen&&<div className="rotation-popover" id={rotationID} role="group" aria-label="Velocità della Terra">
          <h3>Rotazione</h3><button className="rotation-close" aria-label="Chiudi velocità di rotazione" onClick={()=>setSpeedOpen(false)}><X size={16}/></button>
          <label className="range-label">Velocità <strong>{speedLabel}°/s</strong><input type="range" aria-label="Velocità della Terra" min=".02" max="1" step=".02" value={rotationSpeed} onChange={e=>changeRotationSpeed(+e.target.value)}/></label>
          <div className="rotation-presets">{[{speed:.04,label:'Lenta'},{speed:.08,label:'Base'},{speed:.2,label:'Rapida'}].map(preset=><button key={preset.speed} className={rotationSpeed===preset.speed?'selected':''} aria-pressed={rotationSpeed===preset.speed} onClick={()=>changeRotationSpeed(preset.speed)}>{preset.label}</button>)}</div>
          <p>Rallenta vicino al terreno. Si sospende mentre esplori.{reducedMotion&&!motionOptIn?' Movimento ridotto: avvia manualmente.':''}</p>
        </div>}
      </div>
    </div>}
    {(loading||tileError||baseError||styleError)&&<div className="globe-status" role="status">{styleError||tileError||baseError||<><ScanLine size={14}/> Caricamento immagini</>}</div>}
  </div>;
}
export default memo(Globe);
