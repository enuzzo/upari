import { useState } from 'react';
import { ExternalLink,Copy,Check,Monitor } from 'lucide-react';
import type { SceneState,Place,SaverConfig } from '../types';
import { saverURL } from '../lib/scene';
export default function SaverLauncher({scene,place,viewName,onClose}:{scene:SceneState;place:Place;viewName:string;onClose:()=>void}){
  const [showClock,setClock]=useState(true),[showWeather,setWeather]=useState(false),[rotationSpeed,setSpeed]=useState(scene.rotationSpeed??.08),[copied,setCopied]=useState(false),[error,setError]=useState('');
  const config:SaverConfig={version:1,scene,place,showClock,showWeather,rotationSpeed},url=saverURL(config);
  return <div className="saver-launcher"><div className="saved-view"><Monitor size={25}/><span><b>{viewName}</b><small>Zoom e orientamento della vista attuale</small></span></div><p>Una pagina autonoma, con il mondo in rotazione. Puoi chiudere Upari e lasciarla aperta.</p>
    <label className="toggle-row"><span>Ora corrente<small>Orologio nel fuso del dispositivo</small></span><input type="checkbox" checked={showClock} onChange={e=>setClock(e.target.checked)}/></label>
    <label className="toggle-row"><span>Meteo di {place.name}<small>Temperatura, condizioni e vento · Open-Meteo</small></span><input type="checkbox" checked={showWeather} onChange={e=>setWeather(e.target.checked)}/></label>
    {showWeather&&<p className="footnote">Le coordinate del luogo vengono inviate a Open-Meteo. I dati sono una stima da modelli meteorologici.</p>}
    <label className="range-label">Rotazione <strong>{rotationSpeed<.15?'Molto lenta':rotationSpeed<.45?'Lenta':'Più rapida'}</strong><input type="range" aria-label="Velocità di rotazione" min=".02" max="1" step=".02" value={rotationSpeed} onChange={e=>setSpeed(+e.target.value)}/></label>
    <a className="primary" href={url} target="_blank" rel="noopener noreferrer" onClick={onClose}>Apri salvaschermo <ExternalLink size={18}/></a>
    <button className="text-button" onClick={async()=>{try{await navigator.clipboard.writeText(new URL(url,location.href).href);setCopied(true);setError('');}catch{setError('Copia non disponibile. Apri la pagina e copia il suo indirizzo.');}}}>{copied?<Check size={17}/>:<Copy size={17}/>} {copied?'Link copiato':'Copia link della vista'}</button>
    {error&&<p className="footnote" role="status">{error}</p>}
    <p className="footnote">Qualità alta. Le immagini conservano il dettaglio della fonte. Il comando Schermo intero è nella pagina dedicata.</p>
  </div>;
}
