import {annualPair,type Statistics} from './statistics';
import type {StudyController} from './study-controller';
import type {CameraView} from '../types';

export type Chapter={title:string;copy:string;indicator:string;country:string;from:number;to:number;camera:CameraView;duration:number};
export type Journey={id:string;title:string;subtitle:string;chapters:Chapter[]};
const camera=(longitude:number,latitude:number,height:number):CameraView=>({longitude,latitude,height,heading:0,pitch:-Math.PI/2,roll:0});
const chapter=(title:string,copy:string,indicator:string,country:string,from:number,to:number,view:CameraView,duration=24):Chapter=>({title,copy,indicator,country,from,to,camera:view,duration});
const routes:Journey[]=[
 {id:'energy-europe',title:'L’Europa cambia energia',subtitle:'Vent’anni di rinnovabili · Eurostat · 4 capitoli',chapters:[
  chapter('Un continente, molte transizioni','La quota rinnovabile riguarda tutta l’energia consumata, non solo l’elettricità. Partiamo dall’Italia e allarghiamo lo sguardo.','renewables','ITA',2004,2024,camera(13,48,11000000)),
  chapter('Il Nord, un’altra scala','La Svezia mostra una quota diversa. La geografia aiuta a orientarsi; il dato resta nazionale e non localizza impianti o fonti.','renewables','SWE',2004,2024,camera(16,61,6500000)),
  chapter('La penisola iberica','Il Portogallo è una terza prospettiva sullo stesso indicatore. La curva usa la stessa scala 0–100; la mappa quantitativa è disponibile uscendo dal percorso.','renewables','PRT',2004,2024,camera(-7,39,4800000)),
  chapter('Tornare, con una domanda','Confronta le curve, poi esplora. Dal 2021 cambia il metodo RED: una differenza di quota non misura da sola emissioni evitate.','renewables','ITA',2004,2024,camera(12,44,6500000))]},
 {id:'longer-lives',title:'Gli anni di una vita',subtitle:'Speranza di vita · WDI / fonti ONU · 3 capitoli',chapters:[
  chapter('Sessant’anni nello stesso sguardo','La speranza di vita alla nascita è una misura di periodo: non predice quanti anni vivrà una singola persona.','life','ITA',1960,2024,camera(12,36,16000000)),
  chapter('Cambiare prospettiva','Il Giappone sullo stesso asse degli anni. Leggiamo gli estremi originali: l’animazione attraversa la serie, senza inventare misure.','life','JPN',1960,2024,camera(138,36,7500000)),
  chapter('Una curva non racconta tutto','Osserva il Brasile, poi confronta liberamente. Le serie mescolano registri e stime e non spiegano da sole le cause dei cambiamenti.','life','BRA',1960,2024,camera(-51,-13,9500000))]},
 {id:'protection',title:'Geografie della protezione',subtitle:'Domande di asilo · UNHCR · 3 capitoli',chapters:[
  chapter('Relazioni, non itinerari','Siria, Ucraina e Afghanistan: tre origini documentate. Gli archi indicano paesi di origine e presentazione, non tragitti osservati.','asylum','TUR',2019,2025,camera(36,36,12500000)),
  chapter('Leggere un paese di presentazione','La Germania è un punto di lettura delle domande di questo sottoinsieme. Non è il totale mondiale, né un conteggio di persone uniche.','asylum','DEU',2007,2025,camera(14,47,10000000)),
  chapter('Aprire il dettaglio','La Francia è un’altra prospettiva sui paesi di presentazione. Le scie sono illustrative: i valori e le note annuali originali restano consultabili nelle fonti.','asylum','FRA',2007,2025,camera(18,38,14000000))]}
];
export function chapterComparison(data:Pick<Statistics,'years'|'values'>,chapter:Pick<Chapter,'indicator'|'country'|'from'|'to'>){
 const left=annualPair(data,chapter.indicator,chapter.country,chapter.from).left,right=annualPair(data,chapter.indicator,chapter.country,chapter.to).left;
 return{left,right,change:left===null||right===null?null:right-left};
}
/** A route must have its exact identifiers and both original endpoints; no name matching. */
const measureCodes:Record<string,string>={renewables:'NRG_IND_REN.REN.PC',life:'SP.DYN.LE00.IN',asylum:'AsylumApplications · N · G · IND.1.TOT'};
export function journeysFor(data:Statistics){return routes.filter(r=>(r.id!=='protection'||data.flows?.indicator==='asylum'&&data.flows.origins.join('|')==='SYR|UKR|AFG')&&r.chapters.every(c=>data.indicators.some(m=>m.id===c.indicator&&m.code===measureCodes[c.indicator]&&m.firstYear<=c.from&&m.lastYear>=c.to)&&data.countries.some(r=>r.id===c.country)&&c.from>=data.years[0]&&c.to<=data.years.at(-1)!&&chapterComparison(data,c).change!==null));}

/** Regia shares Cesium's loop. No timer, no camera writes or persistence per frame. */
export class JourneyDirector{
 private index=0;private elapsed=0;private previous?:number;private playing=false;private finished=false;private rolling=false;
 private listeners=new Set<()=>void>();
 constructor(public readonly study:StudyController,public readonly route:Journey,private reduced:boolean){}
 snapshot=()=>({index:this.index,elapsed:this.elapsed,playing:this.playing,finished:this.finished});
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
 private publish(){for(const listener of this.listeners)listener();}
 get chapter(){return this.route.chapters[this.index];}
 start(){this.go(0);}
 go(index:number){this.index=Math.max(0,Math.min(this.route.chapters.length-1,index));this.elapsed=0;this.previous=undefined;this.rolling=false;this.finished=false;this.playing=!this.reduced;const c=this.chapter;this.study.suspend();this.study.configure({indicator:c.indicator,secondary:'',country:c.country,start:c.from,end:c.to,time:this.reduced?c.to:c.from,speed:(c.to-c.from)/(c.duration-4),playing:false,loop:false});this.publish();}
 pause(){this.playing=false;this.previous=undefined;this.study.configure({playing:false});this.publish();}
 resume(){if(this.reduced||this.finished)return;this.playing=true;this.previous=undefined;this.study.configure({playing:this.rolling});this.publish();}
 setReduced(value:boolean){this.reduced=value;if(value)this.pause();}
 suspend(){this.previous=undefined;this.study.suspend();}
 tick(now:number,hidden:boolean){
  if(hidden||!this.playing){this.previous=undefined;return;}
  if(this.previous===undefined){this.previous=now;return;}
  this.elapsed+=Math.max(0,Math.min(.12,(now-this.previous)/1000));this.previous=now;
  if(!this.rolling&&this.elapsed>=4){this.rolling=true;this.study.configure({playing:true});}
  if(this.elapsed>=this.chapter.duration){if(this.index+1<this.route.chapters.length)this.go(this.index+1);else{this.finished=true;this.playing=false;this.study.seek(this.chapter.to);this.publish();}}
 }
}
