import { useCallback,useEffect,useRef,useState } from 'react';
import type { Forecast,OrbitData,Place } from '../types';
import { writeState } from '../lib/storage';

/** No ephemeris request, forecast worker or refresh timer while ISS is disabled. */
export function useISS(enabled:boolean,hydrated:boolean,place:Place,minElevation:number) {
  const [orbit,setOrbit]=useState<OrbitData|null>(null),[forecast,setForecast]=useState<Forecast|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const fetchController=useRef<AbortController|null>(null);
  const generation=useRef(0),latestForecast=useRef(forecast);latestForecast.current=forecast;
  const refresh=useCallback(async(force=false)=>{
    if(!enabled||!hydrated)return;
    fetchController.current?.abort();const controller=new AbortController();fetchController.current=controller;
    const id=++generation.current;setBusy(true);setError('');
    try{const api=await import('../lib/orbits');controller.signal.throwIfAborted();const data=await api.fetchOrbit(force,controller.signal);if(id===generation.current)setOrbit(data);}
    catch(e){if(id===generation.current){setError(e instanceof Error?e.message:'Dati non disponibili.');setBusy(false);}}
  },[enabled,hydrated]);
  useEffect(()=>{
    if(!enabled||!hydrated){fetchController.current?.abort();generation.current++;setBusy(false);setForecast(null);setOrbit(null);return;}
    void refresh();
    const timer=setInterval(()=>{if(!document.hidden)void refresh();},4*3600000);
    const visible=()=>{if(!document.hidden&&latestForecast.current&&Date.now()-latestForecast.current.calculatedAt>1800000)void refresh();};
    document.addEventListener('visibilitychange',visible);
    return()=>{fetchController.current?.abort();generation.current++;clearInterval(timer);document.removeEventListener('visibilitychange',visible);};
  },[enabled,hydrated,refresh]);
  useEffect(()=>{
    if(!enabled||!hydrated||!orbit)return;
    setBusy(true);setForecast(null);
    const worker=new Worker(new URL('../workers/forecast.worker.ts',import.meta.url),{type:'module'});
    worker.onmessage=e=>{setBusy(false);if(e.data.error)setError(e.data.error);else{setForecast(e.data.forecast);setError('');}};
    worker.onerror=()=>{setBusy(false);setError('Il calcolo dei passaggi non è riuscito. Riprova.');};
    worker.postMessage({orbit,place,minElevation});
    return()=>{worker.onmessage=null;worker.onerror=null;worker.terminate();};
  },[enabled,hydrated,orbit,place,minElevation]);
  async function importOrbit(file:File){
    if(!enabled)return;
    fetchController.current?.abort();const id=++generation.current;
    try{if(file.size>1000000)throw new Error('File troppo grande.');const api=await import('../lib/orbits');const data=api.validateOrbit(api.parseOrbitFile(await file.text()));data.source='File importato sul dispositivo';await writeState('orbit',data);if(id===generation.current){setOrbit(data);setError('');}}
    catch(e){if(id===generation.current)setError(e instanceof Error?e.message:'File non valido.');}
  }
  return {orbit,forecast,busy,error,refresh,importOrbit};
}
