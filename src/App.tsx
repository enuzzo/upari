import { lazy,Suspense,useCallback,useEffect,useRef,useState } from 'react';
import { Globe2,Orbit,Bell,Settings,MapPin,ChevronDown,Layers,Monitor,X,WifiOff } from 'lucide-react';
import type { Preferences,Pass,Layer,SceneState,CameraView } from './types';
import { loadPreferences,initialPreferences,writeState,readState } from './lib/storage';
import { initialLayers,layerDate,refreshLayers,frameDates } from './lib/layers';
import { initialScene,validateScene } from './lib/scene';
import { useISS } from './hooks/useISS';
import Modal from './components/Modal';
import PlaceEditor from './components/PlaceEditor';
import SceneInspector from './components/SceneInspector';
import SettingsPanel,{type InstallEvent} from './components/SettingsPanel';
import SaverLauncher from './components/SaverLauncher';
import RenderBoundary from './components/RenderBoundary';
const Globe=lazy(()=>import('./components/Globe'));
const SkyAR=lazy(()=>import('./components/SkyAR'));
const SkyPanel=lazy(()=>import('./components/SkyPanel'));
const NotificationPanel=lazy(()=>import('./components/NotificationPanel'));
type Tab='earth'|'sky'|'alerts';
type Dialog='places'|'settings'|'layers'|'saver'|null;
const loading=<div className="globe-loading" role="status"><Orbit className="spinning"/><span>Preparo la vista…</span></div>;

export default function App(){
  const requestedView=new URLSearchParams(location.search).get('view');
  const deepSky=requestedView==='sky'||requestedView==='alerts';
  const [prefs,setPrefs]=useState<Preferences>(initialPreferences),[hydrated,setHydrated]=useState(false),[tab,setTab]=useState<Tab>(deepSky?requestedView as Tab:'earth');
  const [scene,setScene]=useState<SceneState>(initialScene),[layers,setLayers]=useState(initialLayers),[favorites,setFavorites]=useState<string[]>([]);
  const [modal,setModal]=useState<Dialog>(null),[pane,setPane]=useState<'choose'|'details'>('choose'),[playing,setPlaying]=useState(false);
  const [ar,setAR]=useState<Pass|null>(null),[toast,setToast]=useState(''),[online,setOnline]=useState(navigator.onLine),[install,setInstall]=useState<InstallEvent|null>(null);
  const camera=useRef<CameraView>(initialScene.camera),latestScene=useRef(scene),mounted=useRef(false),catalogLoaded=useRef(false),tilesLoading=useRef(false),playFrames=useRef<string[]>([]);latestScene.current=scene;
  const layer=layers.find(l=>l.key===scene.layerKey)??null,place=prefs.places.find(p=>p.id===prefs.activePlace)??prefs.places[0];
  const iss=useISS(prefs.issEnabled,hydrated,place,prefs.minElevation);
  useEffect(()=>{
    let live=true;mounted.current=true;
    Promise.all([loadPreferences(),readState<unknown>('scene',initialScene),readState<string[]>('favorites',[])]).then(([p,s,f])=>{
      if(!live)return;
      const clean=validateScene(s);camera.current=clean.camera;setScene(clean);setPrefs(deepSky?{...p,issEnabled:true}:p);setFavorites(Array.isArray(f)?f.filter(x=>typeof x==='string'):[]);setHydrated(true);
    }).catch(()=>{if(live){setHydrated(true);setToast('Le preferenze locali non sono disponibili.');}});
    const network=()=>setOnline(navigator.onLine),installer=(e:Event)=>{e.preventDefault();setInstall(e as InstallEvent);};
    window.addEventListener('online',network);window.addEventListener('offline',network);window.addEventListener('beforeinstallprompt',installer);
    return()=>{live=false;mounted.current=false;window.removeEventListener('online',network);window.removeEventListener('offline',network);window.removeEventListener('beforeinstallprompt',installer);};
  },[]);
  useEffect(()=>{document.documentElement.dataset.theme=prefs.theme;},[prefs.theme]);
  useEffect(()=>{if(hydrated)writeState('scene',{...scene,camera:camera.current}).catch(()=>{});},[scene,hydrated]);
  useEffect(()=>{
    if(modal!=='layers'||catalogLoaded.current)return;
    catalogLoaded.current=true;
    refreshLayers().then(data=>{if(mounted.current)setLayers(data);});
  },[modal]);
  useEffect(()=>{
    if(!playing)return;
    const timer=setInterval(()=>{if(document.hidden||tilesLoading.current)return;setScene(s=>{const frames=playFrames.current;return {...s,date:frames[(frames.indexOf(s.date)+1)%frames.length]??s.date};});},2500);
    return()=>clearInterval(timer);
  },[playing]);
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),6000);return()=>clearTimeout(timer);},[toast]);
  function changePrefs(p:Preferences){
    setPrefs(p);
    if(!p.issEnabled){setTab('earth');setAR(null);}
    writeState('preferences',p).catch(()=>setToast('Salvataggio non riuscito. Esporta un backup.'));
  }
  function changeScene(changes:Partial<SceneState>){setPlaying(false);setScene(s=>({...s,...changes}));}
  function choose(l:Layer|null){
    const date=l?layerDate(l):'',frames=l?frameDates(l,date):[];
    setPlaying(false);setScene(s=>({...s,layerKey:l?.key??'satellite',date,compareDate:frames[0]??date,compare:false,sunOffset:0,lighting:l?.key==='night'}));setPane('details');
  }
  function favorite(key:string){const f=favorites.includes(key)?favorites.filter(x=>x!==key):[...favorites,key];setFavorites(f);writeState('favorites',f).catch(()=>setToast('Preferiti non salvati.'));}
  const onLoadingChange=useCallback((busy:boolean)=>{tilesLoading.current=busy;},[]);
  const onImageryError=useCallback((message:string)=>{setPlaying(false);setToast(message+' Riproduzione fermata.');},[]);
  const onCameraChange=useCallback((view:CameraView)=>{camera.current=view;writeState('scene',{...latestScene.current,camera:view}).catch(()=>{});},[]);
  function openLayers(mode:'choose'|'details'='choose'){setTab('earth');setPane(mode);setModal('layers');}
  function play(){
    if(playing){setPlaying(false);return;}
    if(!layer)return;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){setToast('Movimento ridotto attivo. Puoi cambiare le date manualmente.');return;}
    playFrames.current=frameDates(layer,scene.date);setScene(s=>({...s,compare:false,date:playFrames.current[0]??s.date}));setPlaying(true);
  }
  const viewName=layer?.name??'Fotografia satellitare';
  const viewCaption=layer?'NASA · '+(layer.static?'composito '+scene.date.slice(0,4):scene.date)+' · '+layer.resolution:'Esri · mosaico fotografico';
  const go=(view:Tab)=>{setPlaying(false);setTab(view);setModal(null);};
  const preloadDate=playing?playFrames.current[(playFrames.current.indexOf(scene.date)+1)%playFrames.current.length]:undefined;
  return <div className={'app-shell '+(ar?'ar-open':'')} data-view={tab}>
    <header className="app-header">
      <button className="wordmark" aria-label="Upari, torna alla Terra" onClick={()=>go('earth')}>upari <svg viewBox="0 0 60 60" width="29" height="29" aria-hidden="true"><circle cx="30" cy="30" r="16"/><ellipse cx="30" cy="30" rx="28" ry="8" transform="rotate(-35 30 30)"/><circle cx="46" cy="19" r="3" fill="currentColor" stroke="none"/></svg></button>
      <nav className="desktop-nav" aria-label="Navigazione principale">
        <button className={tab==='earth'?'active':''} aria-current={tab==='earth'?'page':undefined} onClick={()=>go('earth')}>Terra</button>
        <button className={modal==='layers'?'active':''} onClick={()=>openLayers()}>Layer</button>
        {prefs.issEnabled&&<><button className={tab==='sky'?'active':''} aria-current={tab==='sky'?'page':undefined} onClick={()=>go('sky')}>ISS</button><button className={tab==='alerts'?'active':''} aria-current={tab==='alerts'?'page':undefined} onClick={()=>go('alerts')}>Avvisi</button></>}
      </nav>
      <div className="header-actions"><button className="place-selector" aria-label={'Cambia luogo: '+place.name} onClick={()=>setModal('places')}><MapPin size={16}/><span>{place.name}</span><ChevronDown size={15}/></button><button className="icon-button" aria-label="Impostazioni e strumenti opzionali" onClick={()=>setModal('settings')}><Settings size={20}/></button></div>
    </header>
    {!online&&<div className="offline-banner"><WifiOff size={14}/> Offline · immagini già visitate e dati salvati</div>}
    <main className="shell-main">
      {tab==='earth'?<div className="earth-layout"><div className="earth-surface">
        {!ar&&(hydrated?<RenderBoundary><Suspense fallback={loading}><Globe layer={layer} date={scene.date} opacity={scene.opacity} compare={scene.compare} compareDate={scene.compareDate} split={scene.split} place={place} orbit={iss.orbit} showISS={prefs.issEnabled} sunOffset={scene.sunOffset} lighting={scene.lighting} quality={prefs.renderQuality} initialCamera={camera.current} onCameraChange={onCameraChange} onLoadingChange={onLoadingChange} onImageryError={playing?onImageryError:undefined} preloadDate={preloadDate}/></Suspense></RenderBoundary>:loading)}
        <button className="floating-layer" aria-label={'Modifica la vista: '+viewName} onClick={()=>openLayers('details')}><Layers size={19}/><span><b>{viewName}</b><small>{playing?'Animazione · ':''}{viewCaption}</small></span><ChevronDown size={16}/></button>
        <button className="saver-button" onClick={()=>setModal('saver')}><Monitor size={18}/><span>Salvaschermo</span></button>
        {scene.compare&&layer&&<div className="compare-control"><span>{scene.date}</span><input type="range" min="5" max="95" value={scene.split*100} onChange={e=>setScene(s=>({...s,split:+e.target.value/100}))} aria-label="Posizione del confronto tra le date"/><span>{scene.compareDate}</span></div>}
        <div className="canvas-hint desktop-only">Trascina per ruotare · scorri per lo zoom</div>
      </div></div>:<Suspense fallback={loading}>{tab==='sky'?<SkyPanel forecast={iss.forecast} orbit={iss.orbit} busy={iss.busy} error={iss.error} onRefresh={()=>iss.refresh(true)} onImport={iss.importOrbit} onAR={setAR}/>:<NotificationPanel forecast={iss.forecast} prefs={prefs} onPrefs={changePrefs}/>}</Suspense>}
    </main>
    <nav className="mobile-nav" aria-label="Navigazione principale">
      <button className={tab==='earth'?'active':''} aria-current={tab==='earth'?'page':undefined} onClick={()=>go('earth')}><Globe2 size={21}/><span>Terra</span></button>
      <button className={modal==='layers'?'active':''} onClick={()=>openLayers()}><Layers size={21}/><span>Layer</span></button>
      {prefs.issEnabled?<><button className={tab==='sky'?'active':''} aria-current={tab==='sky'?'page':undefined} onClick={()=>go('sky')}><Orbit size={21}/><span>ISS</span></button><button className={tab==='alerts'?'active':''} aria-current={tab==='alerts'?'page':undefined} onClick={()=>go('alerts')}><Bell size={21}/><span>Avvisi</span></button></>:<button className={modal==='settings'?'active':''} onClick={()=>setModal('settings')}><Settings size={21}/><span>Strumenti</span></button>}
    </nav>
    {modal&&<Modal className={modal==='layers'?'scene-modal':''} title={modal==='places'?'I tuoi luoghi':modal==='layers'?'La tua vista':modal==='saver'?'Salvaschermo':'Il tuo Upari'} onClose={()=>setModal(null)}>
      {modal==='places'?<PlaceEditor prefs={prefs} onChange={p=>{changePrefs(p);if(p.activePlace!==prefs.activePlace)setModal(null);}}/>:
       modal==='layers'?<SceneInspector layers={layers} layer={layer} scene={scene} onScene={changeScene} pane={pane} onPane={setPane} onChoose={choose} favorites={favorites} onFavorite={favorite} playing={playing} onPlay={play}/>:
       modal==='saver'?<SaverLauncher scene={{...scene,camera:camera.current}} place={place} viewName={viewName} onClose={()=>setModal(null)}/>:
       <SettingsPanel prefs={prefs} onPrefs={changePrefs} onMessage={setToast} install={install} onInstall={async()=>{if(install){await install.prompt();await install.userChoice;setInstall(null);}}}/>}
    </Modal>}
    {ar&&prefs.issEnabled&&<Suspense fallback={<div className="ar-screen globe-loading">Preparo il cielo…</div>}><SkyAR pass={ar} onClose={()=>setAR(null)}/></Suspense>}
    {toast&&<div className="toast" role="status">{toast}<button aria-label="Chiudi messaggio" onClick={()=>setToast('')}><X size={17}/></button></div>}
  </div>;
}
