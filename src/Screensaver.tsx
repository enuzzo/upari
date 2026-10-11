import { lazy,Suspense,useEffect,useRef,useState } from 'react';
import { ArrowLeft,Maximize,Minimize,Pause,Play,Settings,Wind,CloudSun,X } from 'lucide-react';
import type { Place,SaverConfig } from './types';
import { decodeSaver,saverURL } from './lib/scene';
import { initialLayers } from './lib/layers';
import { fetchWeather,weatherLabel,type Weather } from './lib/weather';
import Modal from './components/Modal';
import RenderBoundary from './components/RenderBoundary';
const Globe=lazy(()=>import('./components/Globe'));

function Clock(){
  const [now,setNow]=useState(new Date());
  useEffect(()=>{
    const update=()=>{if(!document.hidden)setNow(new Date());},timer=setInterval(update,1000);
    document.addEventListener('visibilitychange',update);
    return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',update);};
  },[]);
  return <div className="ambient-clock"><time dateTime={now.toISOString()}>{now.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}<span>{now.toLocaleTimeString('it-IT',{second:'2-digit'})}</span></time><p>{now.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'})}</p></div>;
}
function WeatherReading({place}:{place:Place}){
  const [weather,setWeather]=useState<Weather|null>(null),[error,setError]=useState('');
  useEffect(()=>{
    let gone=false,busy=false,controller:AbortController|undefined;
    async function refresh(){
      if(gone||busy||document.hidden)return;
      busy=true;controller=new AbortController();const timeout=setTimeout(()=>controller?.abort(),15000);
      try{const data=await fetchWeather(place,controller.signal);if(!gone){setWeather(data);setError('');}}
      catch{if(!gone)setError('Meteo non disponibile');}
      finally{clearTimeout(timeout);busy=false;}
    }
    void refresh();const timer=setInterval(refresh,30*60000);
    const visible=()=>{if(!document.hidden)void refresh();};document.addEventListener('visibilitychange',visible);
    return()=>{gone=true;controller?.abort();clearInterval(timer);document.removeEventListener('visibilitychange',visible);};
  },[place]);
  const fresh=weather&&Date.now()-weather.time<=3600000;
  return <div className="ambient-weather"><p className="weather-place">{place.name}</p>
    {fresh?<><div className="weather-main"><CloudSun size={24}/><strong>{Math.round(weather.temperature)}°</strong><span>{weatherLabel(weather.code)}</span></div><p className="weather-extra">Percepita {Math.round(weather.apparent)}° <span>·</span> <Wind size={13}/> {Math.round(weather.wind)} km/h</p></>:<p className="weather-unavailable">{weather?'Dati meteo non aggiornati':error||'Carico il meteo…'}</p>}
    <p className="weather-source">{weather&&<span>{new Date(weather.time).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})} · </span>}<a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> · stima da modelli{error&&fresh?' · aggiornamento non riuscito':''}</p>
  </div>;
}
function readConfig(){try{return {config:decodeSaver(location.hash),error:''};}catch(e){return {config:null,error:e instanceof Error?e.message:'Configurazione non valida.'};}}
export default function Screensaver(){
  const [initial]=useState(readConfig),[config,setConfig]=useState<SaverConfig|null>(initial.config),[visible,setVisible]=useState(true),[settings,setSettings]=useState(false),[rotating,setRotating]=useState(true),[fullscreen,setFullscreen]=useState(!!document.fullscreenElement),[message,setMessage]=useState('');
  const timeout=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),focused=useRef(false);
  function wake(){setVisible(true);if(timeout.current)clearTimeout(timeout.current);timeout.current=setTimeout(()=>{if(!focused.current)setVisible(false);},6500);}
  useEffect(()=>{
    wake();const key=()=>wake(),full=()=>setFullscreen(!!document.fullscreenElement);
    window.addEventListener('keydown',key);document.addEventListener('fullscreenchange',full);
    document.documentElement.dataset.theme='night';
    return()=>{if(timeout.current)clearTimeout(timeout.current);window.removeEventListener('keydown',key);document.removeEventListener('fullscreenchange',full);};
  },[]);
  useEffect(()=>{if(config)history.replaceState(null,'',saverURL(config));},[config]);
  useEffect(()=>{if(!message)return;const timer=setTimeout(()=>setMessage(''),5000);return()=>clearTimeout(timer);},[message]);
  if(!config)return <main className="saver-invalid"><h1>Una vista da portare con te.</h1><p>{initial.error}</p><a className="primary" href="/">Apri Upari</a></main>;
  const layer=initialLayers.find(l=>l.key===config.scene.layerKey)??null,s=config.scene;
  const update=(changes:Partial<SaverConfig>)=>setConfig(c=>c?{...c,...changes}:c);
  const canFullscreen=!!document.documentElement.requestFullscreen&&document.fullscreenEnabled;
  return <main className={'screensaver-shell '+(visible?'controls-visible':'controls-hidden')} onPointerMove={wake} onPointerDown={wake}>
    <RenderBoundary><Suspense fallback={<div className="globe-loading">Preparo il pianeta…</div>}><Globe layer={layer} date={s.date} opacity={s.opacity} compare={s.compare} compareDate={s.compareDate} split={s.split} place={config.place} sunOffset={s.sunOffset} lighting={s.lighting} quality="high" initialCamera={s.camera} autoRotate={rotating} rotationSpeed={config.rotationSpeed} hideTools/></Suspense></RenderBoundary>
    <div className="saver-toolbar" onFocusCapture={()=>{focused.current=true;wake();}} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node)){focused.current=false;wake();}}}>
      <a href="/" className="saver-return" aria-label="Torna a Upari"><ArrowLeft size={17}/> upari</a>
      <div className="saver-actions">
        <button className="icon-button" aria-label={rotating?'Ferma il mondo':'Ruota il mondo'} title={rotating?'Ferma il mondo':'Ruota il mondo'} onClick={()=>setRotating(!rotating)}>{rotating?<Pause size={19}/>:<Play size={19}/>}</button>
        {canFullscreen&&<button className="icon-button" aria-label={fullscreen?'Esci da schermo intero':'Schermo intero'} title={fullscreen?'Esci da schermo intero':'Schermo intero'} onClick={async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{setMessage('Il browser non consente lo schermo intero.');}}}>{fullscreen?<Minimize size={19}/>:<Maximize size={19}/>}</button>}
        <button className="icon-button" aria-label="Opzioni del salvaschermo" title="Opzioni" onClick={()=>{setSettings(true);wake();}}><Settings size={19}/></button>
      </div>
    </div>
    {(config.showClock||config.showWeather)&&<div className="ambient-information">{config.showClock&&<Clock/>}{config.showWeather&&<WeatherReading place={config.place}/>}</div>}
    <div className="saver-view-caption">{layer?layer.name+' · NASA · '+(layer.static?'composito '+s.date.slice(0,4):s.date):'Fotografia satellitare · Esri'}{s.sunOffset?' · Sole '+(s.sunOffset>0?'+':'')+s.sunOffset+' h':''}</div>
    {settings&&<Modal title="Il tuo salvaschermo" onClose={()=>{setSettings(false);wake();}}>
      <label className="toggle-row"><span>Ora corrente</span><input type="checkbox" checked={config.showClock} onChange={e=>update({showClock:e.target.checked})}/></label>
      <label className="toggle-row"><span>Meteo di {config.place.name}<small>Stima Open-Meteo; usa le coordinate del luogo</small></span><input type="checkbox" checked={config.showWeather} onChange={e=>update({showWeather:e.target.checked})}/></label>
      <label className="range-label">Rotazione <strong>{config.rotationSpeed.toFixed(2)}°/s</strong><input type="range" aria-label="Velocità di rotazione" min=".05" max=".8" step=".05" value={config.rotationSpeed} onChange={e=>update({rotationSpeed:+e.target.value})}/></label>
      <p className="footnote">I controlli scompaiono dopo pochi secondi. Tocca la pagina o premi un tasto per ritrovarli. Il mondo rispetta la preferenza di movimento ridotto del dispositivo.</p>
      <button className="secondary" onClick={async()=>{try{await navigator.clipboard.writeText(location.href);setMessage('Link della vista copiato.');}catch{setMessage('Copia l’indirizzo dalla barra del browser.');}}}>Copia link della vista</button>
    </Modal>}
    {message&&<div className="toast" role="status">{message}<button aria-label="Chiudi messaggio" onClick={()=>setMessage('')}><X size={17}/></button></div>}
  </main>;
}
