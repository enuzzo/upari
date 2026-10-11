import type { Place } from '../types';
export type Weather={time:number;temperature:number;apparent:number;wind:number;code:number};
const weatherNames:Record<number,string>={0:'Cielo sereno',1:'Quasi sereno',2:'Parzialmente nuvoloso',3:'Coperto',45:'Nebbia',48:'Nebbia',51:'Pioviggine',53:'Pioviggine',55:'Pioviggine intensa',56:'Pioviggine gelata',57:'Pioviggine gelata',61:'Pioggia debole',63:'Pioggia',65:'Pioggia intensa',66:'Pioggia gelata',67:'Pioggia gelata',71:'Neve debole',73:'Neve',75:'Neve intensa',77:'Nevischio',80:'Rovesci deboli',81:'Rovesci',82:'Rovesci intensi',85:'Rovesci di neve',86:'Rovesci di neve',95:'Temporale',96:'Temporale con grandine',99:'Temporale con grandine'};
export const weatherLabel=(code:number)=>weatherNames[code]??'Condizioni non classificate';
export function parseWeather(raw:unknown,now=Date.now()):Weather {
  const r=raw as {current?:{time?:number;temperature_2m?:number;apparent_temperature?:number;wind_speed_10m?:number;weather_code?:number};current_units?:Record<string,string>};
  const c=r?.current;
  if(!c||![c.time,c.temperature_2m,c.apparent_temperature,c.wind_speed_10m,c.weather_code].every(v=>typeof v==='number'&&Number.isFinite(v)))throw new Error('Dati meteo non validi.');
  if(r.current_units?.time!=='unixtime'||r.current_units?.temperature_2m!=='°C'||r.current_units?.apparent_temperature!=='°C'||r.current_units?.wind_speed_10m!=='km/h')throw new Error('Unità meteo non supportate.');
  const t=c.time!*1000;
  if(t>now+3600000||now-t>3*3600000||c.temperature_2m!< -100||c.temperature_2m!>80||c.wind_speed_10m!<0||c.wind_speed_10m!>500||c.apparent_temperature!< -100||c.apparent_temperature!>100||!Number.isInteger(c.weather_code)||!weatherNames[c.weather_code!])throw new Error('Dati meteo fuori intervallo o troppo vecchi.');
  return {time:t,temperature:c.temperature_2m!,apparent:c.apparent_temperature!,wind:c.wind_speed_10m!,code:c.weather_code!};
}
export async function fetchWeather(place:Place,signal:AbortSignal):Promise<Weather> {
  const params=new URLSearchParams({latitude:String(place.latitude),longitude:String(place.longitude),current:'temperature_2m,apparent_temperature,weather_code,wind_speed_10m',temperature_unit:'celsius',wind_speed_unit:'kmh',timezone:'UTC',timeformat:'unixtime'});
  const r=await fetch('https://api.open-meteo.com/v1/forecast?'+params,{signal,credentials:'omit'});
  if(!r.ok)throw new Error('Meteo momentaneamente non disponibile.');
  return parseWeather(await r.json());
}
