import {useEffect,useState} from 'react';
export default function OfflineStatus(){
  const [status,setStatus]=useState<{shell:boolean;tiles:number;bytes:number;vectors:number;waiting:boolean}|null>(null),[error,setError]=useState('');
  async function inspect(){try{
    if(!('caches' in window)){setError('Cache offline non disponibile in questo browser.');return;}
    const names=await caches.keys(),data=await caches.open('upari-data-public-v1'),keys=await data.keys();let tiles=0,bytes=0;
    for(const key of keys){const url=new URL(key.url);if(['gibs.earthdata.nasa.gov','services.arcgisonline.com','wmts.geo.admin.ch'].includes(url.hostname)){tiles++;bytes+=Number((await data.match(key))?.headers.get('Content-Length')??0);}}
    const modules=Array.from(document.querySelectorAll<HTMLScriptElement>('script[type="module"][src]')).map(s=>s.src);let cache:Cache|null=null;
    for(const name of names.filter(n=>n.startsWith('upari-shell-')).reverse()){const candidate=await caches.open(name);if(modules.length&&(await Promise.all(modules.map(url=>candidate.match(url)))).every(Boolean)){cache=candidate;break;}}
    const waiting=!!(await navigator.serviceWorker?.getRegistration())?.waiting;
    const vectors=cache?Number(!!await cache.match('/vectors/wind.json'))+Number(!!await cache.match('/vectors/currents.json')):0;
    setStatus({shell:!!cache&&!!await cache.match('/index.html')&&!!await cache.match('/screensaver.html'),tiles,bytes,vectors,waiting});setError('');
  }catch{setError('Stato della cache non disponibile.');}}
  useEffect(()=>{void inspect();},[]);
  return <div className="settings-group"><h3>Disponibilità offline</h3>{status?<><p>{status.shell?'Applicazione e salvaschermo salvati.':'Shell non ancora salvata: attendi il primo caricamento completo.'}</p>{status.waiting&&<p>Aggiornamento scaricato: per usarlo anche offline, chiudi le altre schede Upari e riapri l’app.</p>}<p className="footnote">{status.tiles} risorse pubbliche visitate · {(status.bytes/1048576).toFixed(1)} MiB · {status.vectors}/2 pacchetti vettoriali. Limite tile: 48 MiB / 120 risorse; le più vecchie possono essere rimosse.</p></>:<p>Controllo i dati salvati…</p>}{error&&<p role="status">{error}</p>}<button className="text-button" onClick={()=>void inspect()}>Aggiorna stato offline</button><p className="footnote">La shell non contiene il mondo intero: visita la zona e le date prima di togliere la rete. Tile assenti e meteo nuovo richiedono connessione. Effemeridi oltre sette giorni vengono rifiutate; avvisi esterni oltre 48 ore sospesi. Il browser può liberare lo spazio: conserva un backup dei dati personali.</p></div>;
}
