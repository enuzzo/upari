import { useLayoutEffect,useRef,useState } from 'react';
import { X,Camera,Compass,ArrowUpRight,SlidersHorizontal } from 'lucide-react';
import type { Pass } from '../types';
import { direction,time } from '../lib/format';
import { manualPose,projectSky,sensorPose } from '../lib/ar-math';
import { SkySession,browserSkyEnvironment,type SkyAngles } from '../lib/sky-session';
export default function SkyAR({pass,onClose}:{pass:Pass;onClose:()=>void}) {
  const video=useRef<HTMLVideoElement>(null),session=useRef<SkySession|null>(null);
  const [camera,setCamera]=useState(false),[activating,setActivating]=useState(false),[useSensors,setUseSensors]=useState(true),[error,setError]=useState('');
  const [angles,setAngles]=useState<SkyAngles>(),[heading,setHeading]=useState(pass.startAzimuth),[elevation,setElevation]=useState(25),[offset,setOffset]=useState(0),[fov,setFov]=useState(60),[index,setIndex]=useState(0),[showAdjust,setShowAdjust]=useState(false),[dimensions,setDimensions]=useState({w:390,h:844}),[screenAngle,setScreenAngle]=useState(0);
  const stage=useRef<HTMLDialogElement>(null),sensor=useSensors&&!!angles;
  const pose=angles&&sensor?sensorPose(angles.alpha,angles.beta,angles.gamma,screenAngle,angles.compass,offset):manualPose(heading+offset,elevation);
  const point=pass.points[Math.min(index,pass.points.length-1)];const target=projectSky(point.azimuth,point.elevation,pose,dimensions.w,dimensions.h,fov);const onScreen=target.front&&target.x>0&&target.x<dimensions.w&&target.y>0&&target.y<dimensions.h;
  const projected=pass.points.map(q=>projectSky(q.azimuth,q.elevation,pose,dimensions.w,dimensions.h,fov));
  const paths:string[]=[];let path='';for(const q of projected){if(!q.front||Math.abs(q.x)>dimensions.w*4||Math.abs(q.y)>dimensions.h*4){if(path)paths.push(path);path='';continue;}path+=(path?' L':'M')+q.x.toFixed(1)+','+q.y.toFixed(1);}if(path)paths.push(path);
  function stop(){session.current?.stop();setCamera(false);setActivating(false);setAngles(undefined);}
  function enable(){
    if(!video.current||activating)return;
    setAngles(undefined);setUseSensors(true);
    session.current??=new SkySession(browserSkyEnvironment());
    void session.current.start(video.current,setAngles,status=>{setCamera(status.camera);setActivating(status.activating);setError(status.error);if(!status.camera&&!status.activating)setAngles(undefined);});
  }
  useLayoutEffect(()=>{
    const previous=document.body.style.overflow,opener=document.activeElement instanceof HTMLElement?document.activeElement:null,dialog=stage.current!;document.body.style.overflow='hidden';dialog.showModal();
    const resize=()=>{const r=stage.current?.getBoundingClientRect();if(r)setDimensions({w:r.width,h:r.height});setScreenAngle(screen.orientation?.angle??(window as unknown as {orientation?:number}).orientation??0);};
    resize();const obs=new ResizeObserver(resize);if(stage.current)obs.observe(stage.current);
    const visibility=()=>{if(document.hidden)stop();};
    document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',stop);window.addEventListener('orientationchange',resize);screen.orientation?.addEventListener('change',resize);
    return()=>{session.current?.stop();dialog.close();document.body.style.overflow=previous;if(opener?.isConnected)opener.focus({preventScroll:true});document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',stop);window.removeEventListener('orientationchange',resize);screen.orientation?.removeEventListener('change',resize);obs.disconnect();};
  },[]);
  const first=projectSky(pass.startAzimuth,pass.points[0].elevation,pose,dimensions.w,dimensions.h,fov);
  return <dialog className="ar-screen" ref={stage} aria-label="Guida del cielo" onCancel={e=>{e.preventDefault();onClose();}}>
    <video ref={video} playsInline muted className="ar-video"/><div className="ar-shade"/>
    <svg className="ar-overlay" viewBox={`0 0 ${dimensions.w} ${dimensions.h}`} aria-label="Traiettoria prevista della ISS">{paths.map((d,i)=><path key={i} d={d} fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="7 6"/>)}{first.front&&<g><circle cx={first.x} cy={first.y} r="7" fill="var(--accent)"/><text x={first.x+14} y={first.y-8} fill="white" fontSize="13">Comparsa · {time(pass.start)}</text></g>}{onScreen&&<g><circle cx={target.x} cy={target.y} r="18" fill="none" stroke="white" strokeWidth="2"/><circle cx={target.x} cy={target.y} r="4" fill="var(--accent)"/><text x={target.x+25} y={target.y+5} fill="white" fontSize="14">ISS · {time(point.time)}</text></g>}</svg>
    <header className="ar-header"><div><b>Cielo AR</b><span>Anteprima · {time(point.time)}</span></div><button className="icon-button" onClick={onClose} aria-label="Chiudi guida AR"><X/></button></header>
    {!onScreen&&<div className="ar-pointer"><ArrowUpRight size={28} style={{transform:`rotate(${point.azimuth-pose.heading-45}deg)`}}/><span>Cerca verso {direction(point.azimuth)}<br/><b>{Math.round(point.elevation)}° sopra l’orizzonte</b></span></div>}
    <div className="ar-bottom"><div className="ar-reading"><Compass size={18}/> {Math.round(pose.heading)}° · {Math.round(pose.elevation)}° <span>{sensor?'Sensore attivo':'Guida manuale'}</span></div>
    {!camera&&<button className="primary" onClick={enable} disabled={activating}><Camera size={20}/> {activating?'Attendo i permessi…':'Attiva fotocamera e bussola'}</button>}{error&&<p className="inline-error">{error}</p>}
    <label className="range-label">Percorso previsto <strong>{time(point.time)}</strong><input type="range" aria-label="Istante del percorso" min="0" max={pass.points.length-1} value={index} onChange={e=>setIndex(+e.target.value)}/></label>
    <button className="text-button" onClick={()=>setShowAdjust(!showAdjust)}><SlidersHorizontal size={16}/> {showAdjust?'Chiudi regolazioni':'Calibra / orienta a mano'}</button>
    {showAdjust&&<div className="ar-adjust"><label>Nord · correzione {offset}°<input type="range" min="-180" max="180" value={offset} onChange={e=>setOffset(+e.target.value)}/></label><label>Campo visivo {fov}°<input type="range" min="35" max="100" value={fov} onChange={e=>setFov(+e.target.value)}/></label><label className="checkbox"><input type="checkbox" checked={sensor} disabled={!angles} onChange={e=>setUseSensors(e.target.checked)}/> Usa sensori</label>{!sensor&&<><label>Direzione {heading.toFixed(0)}°<input type="range" min="0" max="360" value={heading} onChange={e=>setHeading(+e.target.value)}/></label><label>Altezza {elevation}°<input type="range" min="-10" max="90" value={elevation} onChange={e=>setElevation(+e.target.value)}/></label></>}</div>}
    <p className="footnote">Guida approssimativa. Riallinea il nord prima di osservare. Immagini e sensori restano sul telefono.</p></div>
  </dialog>;
}
