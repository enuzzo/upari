import type {DiaryEntry,Forecast,Pass} from '../types';
export const diaryOutcomes=['seen','not-seen','cloudy'] as const;
export function observation(pass:Pass,forecast:Forecast,outcome:DiaryEntry['outcome'],notes:string,now=Date.now()):DiaryEntry{
  if(pass.start>now)throw new Error('Questo passaggio è futuro. Registra l’esito dopo l’osservazione.');
  return {id:crypto.randomUUID(),recordedAt:now,passStart:pass.start,passEnd:pass.end,satellite:forecast.satellite??'ISS',placeName:forecast.place.name,latitude:forecast.place.latitude,longitude:forecast.place.longitude,epoch:forecast.epoch,maxElevation:pass.maxElevation,outcome,notes:notes.trim().slice(0,1000)};
}
export function validateDiary(raw:unknown):DiaryEntry[]{
  if(!Array.isArray(raw)||raw.length>1000)throw new Error('Diario non valido o oltre 1.000 osservazioni.');
  const entries=raw.map(e=>{
    if(!e||typeof e.id!=='string'||e.id.length>100||!['recordedAt','passStart','passEnd','latitude','longitude','maxElevation'].every(k=>Number.isFinite(e[k]))||e.passEnd<e.passStart||Math.abs(e.latitude)>90||Math.abs(e.longitude)>180||e.maxElevation<0||e.maxElevation>90||!diaryOutcomes.includes(e.outcome)||typeof e.notes!=='string'||e.notes.length>1000||!['satellite','placeName','epoch'].every(k=>typeof e[k]==='string'&&e[k].length<=100)||(e.epoch!==""&&!Number.isFinite(Date.parse(e.epoch))))throw new Error('Osservazione non valida nel diario.');
    const {id,recordedAt,passStart,passEnd,satellite,placeName,latitude,longitude,epoch,maxElevation,outcome,notes}=e;
    return {id,recordedAt,passStart,passEnd,satellite,placeName,latitude,longitude,epoch,maxElevation,outcome,notes} as DiaryEntry;
  });
  if(new Set(entries.map(e=>e.id)).size!==entries.length)throw new Error('Osservazioni duplicate.');return entries.sort((a,b)=>b.passStart-a.passStart);
}
