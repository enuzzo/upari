import catalog from './gibs-catalog.json';
import type { Layer } from '../types';
import { readState, writeState } from './storage';
import { utcDate } from './format';
export const GIBS='https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';
const specs = [
  ['night','Terra di notte','Le città accendono il pianeta','VIIRS_Black_Marble','500 m','Radiosità · composito','Le luci urbane sono un composito storico NASA del 2016. Il terminatore giorno/notte è calcolato per l’ora attuale.'],
  ['clouds','Il respiro del pianeta','Nuvole e superficie a colori naturali','VIIRS_NOAA20_CorrectedReflectance_TrueColor','circa 375 m','Riflettanza','Immagini VIIRS giornaliere: il passaggio del satellite lascia copertura discontinua, non un globo fotografato tutto nello stesso istante.'],
  ['plankton','Oceani vivi','Il ritmo del fitoplancton','OCI_PACE_Chlorophyll_a','circa 1 km','Clorofilla a · mg/m³','La clorofilla è un indicatore della distribuzione del fitoplancton. I falsi colori mostrano concentrazione, non luce emessa dal mare. Nuvole e zone non osservate lasciano buchi.'],
  ['thermal','Terra termica','Il calore della superficie','MODIS_Terra_Land_Surface_Temp_Day_TES','circa 1 km','Temperatura superficiale · K','Temperatura radiometrica della superficie terrestre nelle osservazioni diurne. Non è la temperatura dell’aria a due metri.'],
  ['infrared','Un altro sguardo','Infrarosso notturno','VIIRS_NOAA20_Brightness_Temp_BandI5_Night','circa 375 m','Temperatura di brillanza · K','Il canale infrarosso VIIRS I5 misura una temperatura di brillanza. Nubi e superficie contribuiscono al segnale; non è una mappa delle temperature dell’aria.'],
  ['ocean','Oceani termici','Fronti e temperature marine','GHRSST_L4_MUR_Sea_Surface_Temperature','circa 1 km','Temperatura marina · °C','Analisi giornaliera MUR della temperatura superficiale del mare: prodotto interpolato che combina più osservazioni.'],
  ['anomaly','Oceani in cambiamento','Anomalie della temperatura marina','GHRSST_L4_MUR_Sea_Surface_Temperature_Anomalies','circa 1 km','Anomalia · °C','Differenza rispetto al riferimento climatologico del prodotto MUR. Colori caldi e freddi rappresentano anomalie, non temperature assolute.'],
  ['snow','Le stagioni','Neve e ghiacci','MODIS_Terra_NDSI_Snow_Cover','circa 500 m','Copertura nevosa · NDSI','Indice satellitare per la copertura della neve. Le nuvole possono impedire l’osservazione; consultare la legenda del produttore.'],
  ['aerosol','L’atmosfera visibile','Aerosol sopra il pianeta','MODIS_Aqua_Aerosol_Optical_Depth_3km','circa 3 km','Spessore ottico · adimensionale','Spessore ottico degli aerosol: non equivale alla qualità dell’aria al suolo o alla concentrazione di PM2.5.'],
  ['chlorophyll','Oceani vivi · archivio','Clorofilla MODIS Aqua','MODIS_Aqua_L2_Chlorophyll_A','circa 1 km','Clorofilla a · mg/m³','Osservazioni MODIS Aqua di clorofilla. Confrontare date effettive e copertura prima di interpretare variazioni.'],
] as const;
export const initialLayers:Layer[]=specs.map(([key,name,subtitle,id,resolution,unit,explanation])=>{
  const c=catalog[id as keyof typeof catalog];const earliest=c.ranges[0]?.split('/')[0]??'2012-01-01';
  return {...c,legend:c.legend??undefined,key,name,subtitle,resolution,unit,explanation,earliest,period:key==='night'?'Composito storico':'Giornaliero',static:key==='night'};
});
export function dateAllowed(layer:Layer, date:string) {return (layer.ranges??[]).some(v=>{const [a,b]=v.split('/');return date>=a&&date<=(b??a);});}
export function layerDate(layer:Layer, target=utcDate(Date.now()-86400000)) {
  if(layer.static)return layer.date;
  let d=target<layer.date?target:layer.date;
  for(let i=0;i<120;i++){if(dateAllowed(layer,d))return d;d=utcDate(Date.parse(d+'T12:00:00Z')-86400000);}
  return layer.date;
}
export function frameDates(layer:Layer,end:string) { const ds:string[]=[];if(layer.static)return [layer.date];for(let i=6;i>=0;i--){const d=utcDate(Date.parse(end+'T12:00:00Z')-i*86400000);if(dateAllowed(layer,d))ds.push(d);}return ds; }
export async function refreshLayers():Promise<Layer[]> {
  const old=await readState<{at:number;layers:Layer[]}|null>('catalog',null);if(old&&Date.now()-old.at<86400000)return old.layers;
  try{
    const r=await fetch(GIBS+'/1.0.0/WMTSCapabilities.xml',{signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error('catalog');const doc=new DOMParser().parseFromString(await r.text(),'application/xml');
    const updated=initialLayers.map(l=>{const n=Array.from(doc.getElementsByTagNameNS('*','Layer')).find(n=>n.getElementsByTagNameNS('*','Identifier')[0]?.textContent===l.id);if(!n)return l;
      const d=n.getElementsByTagNameNS('*','Dimension')[0];const ranges=Array.from(d?.getElementsByTagNameNS('*','Value')??[]).map(v=>v.textContent??'').filter(Boolean);const date=d?.getElementsByTagNameNS('*','Default')[0]?.textContent??l.date;
      return {...l,date,ranges:ranges.length?ranges:l.ranges,earliest:ranges[0]?.split('/')[0]??l.earliest};});
    await writeState('catalog',{at:Date.now(),layers:updated});return updated;
  }catch{return old?.layers??initialLayers;}
}
export function tileURL(layer:Layer,date:string) {return `${GIBS}/${layer.id}/default/${date}/${layer.matrix}/{z}/{y}/{x}.${layer.format==='image/jpeg'?'jpeg':'png'}`;}
