import type {Layer} from '../types';
export function dataDateLabel(layer:Layer,date:string,compareDate?:string){
  if(layer.regional)return layer.dataLabel??'Mosaico · anni diversi per zona';
  if(layer.static)return 'Composito '+date.slice(0,4);
  const format=(d:string)=>new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'));
  return compareDate?'Dati: sinistra '+format(date)+' · destra '+format(compareDate):'Dati del '+format(date);
}
