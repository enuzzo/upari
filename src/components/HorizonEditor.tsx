import type {Place} from '../types';
import {horizonDirections} from '../lib/horizon';
export default function HorizonEditor({place,onChange}:{place:Place;onChange:(place:Place)=>void}){
  const values=place.horizon??Array(8).fill(0);
  return <details className="horizon-editor"><summary>Orizzonte di {place.name}</summary><p>Altezza degli ostacoli sopra l'orizzonte, in gradi. 0° = libero. Tra le direzioni il profilo viene interpolato; non è un rilievo automatico del terreno.</p><div className="horizon-grid">{horizonDirections.map((direction,i)=><label key={direction}>{direction}<input aria-label={'Ostacoli verso '+direction} type="number" min="0" max="85" step="1" value={values[i]} onChange={e=>{const v=Number(e.target.value);if(e.target.value!==''&&Number.isFinite(v)&&v>=0&&v<=85){const horizon=[...values];horizon[i]=v;onChange({...place,horizon});}}}/></label>)}</div><button className="text-button" onClick={()=>onChange({...place,horizon:undefined})}>Ripristina orizzonte libero</button><p className="footnote">La maschera modifica le nuove previsioni. Per aggiornare avvisi esterni già programmati, sostituisci il piano nel pannello Avvisi.</p></details>;
}
