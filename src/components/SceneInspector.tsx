import VectorControls from './VectorControls';
import { ChevronLeft } from 'lucide-react';
import type { Layer,SceneState } from '../types';
import { LayerDetails,LayerPicker } from './LayerControls';
type Props={onStatistics?:()=>void;scientificVisible?:boolean;layers:Layer[];layer:Layer|null;scene:SceneState;onScene:(changes:Partial<SceneState>)=>void;pane:'choose'|'details';onPane:(p:'choose'|'details')=>void;onChoose:(layer:Layer|null)=>void;favorites:string[];onFavorite:(key:string)=>void;playing:boolean;onPlay:()=>void};
export default function SceneInspector(p:Props){
  if(p.pane==='choose')return <LayerPicker onStatistics={p.onStatistics} layers={p.layers} active={p.scene.layerKey} onSelect={p.onChoose} onBase={()=>p.onChoose(null)} favorites={p.favorites} onFavorite={p.onFavorite}/>;
  const s=p.scene;
  return <>
    <button className="text-button inspector-back" onClick={()=>p.onPane('choose')}><ChevronLeft size={17}/> Tutte le viste</button>
    <h3 className="inspector-title">{p.layer?.name??'Fotografia satellitare'}</h3>
    <p className="inspector-description">{p.layer?.explanation??'NASA Blue Marble dallo spazio, Sentinel-2 EOX 2016 sul territorio. Avvicinati per esplorare il territorio. Date e risoluzione variano da zona a zona.'}</p>
    {p.layer?<LayerDetails layer={p.layer} date={s.date} opacity={s.opacity} onOpacity={opacity=>p.onScene({opacity})} compare={s.compare} onCompare={()=>p.onScene({compare:!s.compare})} compareDate={s.compareDate} onCompareDate={compareDate=>p.onScene({compareDate})} playing={p.playing} onPlay={p.onPlay} onDate={date=>p.onScene({date})}/>:<div className="source-detail"><b>NASA Blue Marble / Sentinel-2 EOX 2016</b><p>Base NASA statica dallo spazio, Sentinel-2 EOX 2016 progressivamente sul territorio. Mosaico EOX 2016 (acquisizioni 2016–2017), circa 10 m; CC BY4.0. Luci notturne: composito NASA 2016.</p></div>}
    {(!p.layer||p.layer.key==='night')&&<div className="scene-lighting">
      {!p.layer&&<label className="toggle-row"><span>Giorno e notte<small>Illuminazione calcolata per l'ora attuale</small></span><input type="checkbox" checked={s.lighting} onChange={e=>p.onScene({lighting:e.target.checked})}/></label>}
      {(s.lighting||p.layer?.key==='night')&&<label className="range-label">Ora del Sole <strong>{s.sunOffset===0?'Adesso':(s.sunOffset>0?'+':'')+s.sunOffset+' h'}</strong><input type="range" aria-label="Anteprima dell'illuminazione solare" min="-12" max="12" value={s.sunOffset} onChange={e=>p.onScene({sunOffset:+e.target.value})}/></label>}
    </div>}
    <VectorControls scene={s} onScene={p.onScene}/>
    {p.layer&&<p className="footnote resolution-note">Dati a {p.layer.resolution}. Lo zoom avvicina la vista; la risoluzione scientifica resta quella del prodotto.</p>}
  </>;
}
