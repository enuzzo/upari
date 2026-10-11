import { horizonAt } from './horizon';
import { json2satrec, twoline2satrec, propagate, gstime, eciToEcf, eciToGeodetic, ecfToLookAngles, radiansToDegrees } from 'satellite.js';
import type { OMMJsonObject, SatRec } from 'satellite.js';
import type { Place, OrbitData, SkyPoint, Forecast, Pass } from '../types';
import { readState, writeState } from './storage';
export const MAX_ORBIT_AGE = 7*86400000;
export const FORECAST_WINDOW = 3*86400000;
const DEG=Math.PI/180, AU=149597870.7;
/** Meeus/NOAA solar terms, equatorial coordinates of date (not J2000).
 * Mean-equinox longitude pairs with satellite.js GMST; apparent obliquity includes
 * the principal nutation term. The fixed-instant JPL fixture bounds this approximation.
 */
export function solarECI(ms:number){
  const t=(ms/86400000+2440587.5-2451545)/36525;
  const meanLongitude=280.46646+t*(36000.76983+.0003032*t),m=(357.52911+t*(35999.05029-.0001537*t))*DEG;
  const center=Math.sin(m)*(1.914602-t*(.004817+.000014*t))+Math.sin(2*m)*(.019993-.000101*t)+Math.sin(3*m)*.000289;
  const eccentricity=.016708634-t*(.000042037+.0000001267*t),trueAnomaly=m+center*DEG;
  // Aberration -20.49 arcsec; omit longitude nutation because GMST uses mean equinox.
  const longitude=(meanLongitude+center-.00569)*DEG;
  const omega=(125.04-1934.136*t)*DEG;
  const obliquity=(23+(26+(21.448-t*(46.815+t*(.00059-t*.001813)))/60)/60+.00256*Math.cos(omega))*DEG;
  const r=AU*1.000001018*(1-eccentricity*eccentricity)/(1+eccentricity*Math.cos(trueAnomaly));
  return {x:r*Math.cos(longitude),y:r*Math.cos(obliquity)*Math.sin(longitude),z:r*Math.sin(obliquity)*Math.sin(longitude)};
}
export function fullySunlit(p: {x:number;y:number;z:number}, sun: {x:number;y:number;z:number}) {
  const d=Math.hypot(sun.x,sun.y,sun.z);const x=(p.x*sun.x+p.y*sun.y+p.z*sun.z)/d;
  if(x>=0)return true;
  const h=Math.sqrt(Math.max(0,p.x*p.x+p.y*p.y+p.z*p.z-x*x));
  return h>6378.137+(-x)*(695700+6378.137)/d;
}
export function skyPoint(satrec: SatRec, ms: number, place: Place): SkyPoint|null {
  const pv=propagate(satrec,new Date(ms));if(!pv || !pv.position || typeof pv.position==='boolean')return null;
  const gmst=gstime(new Date(ms));const ecf=eciToEcf(pv.position,gmst);
  const obs={latitude:place.latitude*DEG,longitude:place.longitude*DEG,height:place.height};
  const look=ecfToLookAngles(obs,ecf);const geo=eciToGeodetic(pv.position,gmst);const sun=solarECI(ms);
  const sl=ecfToLookAngles(obs,eciToEcf(sun,gmst));
  return {time:ms,azimuth:radiansToDegrees(look.azimuth),elevation:radiansToDegrees(look.elevation),latitude:radiansToDegrees(geo.latitude),longitude:radiansToDegrees(geo.longitude),altitude:geo.height,sunElevation:radiansToDegrees(sl.elevation),sunlit:fullySunlit(pv.position,sun)};
}
export function eligible(p: SkyPoint|null, minElevation: number,horizon?:number[]) { return !!p && p.elevation>=Math.max(minElevation,horizonAt(horizon,p.azimuth)) && p.sunElevation<=-6 && p.sunlit; }
export function validateOrbit(omm: OMMJsonObject, now=Date.now(),expectedId=25544): OrbitData {
  if(!omm || !['MEAN_MOTION','ECCENTRICITY','INCLINATION','RA_OF_ASC_NODE','ARG_OF_PERICENTER','MEAN_ANOMALY','BSTAR'].every(key=>Number.isFinite(Number((omm as unknown as Record<string,unknown>)[key]))) || +omm.NORAD_CAT_ID!==expectedId||!Number.isInteger(expectedId)||expectedId<1||expectedId>999999999 || !Number.isFinite(+omm.MEAN_MOTION) || +omm.MEAN_MOTION<(expectedId===25544?14:.1) || +omm.MEAN_MOTION>(expectedId===25544?17:18) || !Number.isFinite(+omm.ECCENTRICITY) || +omm.ECCENTRICITY<0 || +omm.ECCENTRICITY>=1 || Math.abs(+omm.INCLINATION)>180)throw new Error('Effemeridi '+(expectedId===25544?'ISS':'satellitari')+' non valide.');
  const epoch=String(omm.EPOCH).endsWith('Z')?String(omm.EPOCH):String(omm.EPOCH)+'Z';const ms=Date.parse(epoch);
  if(!Number.isFinite(ms)||ms>now+86400000)throw new Error('Epoca orbitale non valida.');
  if(now-ms>MAX_ORBIT_AGE)throw new Error('Le effemeridi hanno più di 7 giorni. Aggiornale prima di calcolare i passaggi.');
  const sat=json2satrec(omm);if(sat.error)throw new Error('Il propagatore ha rifiutato le effemeridi.');
  return {omm,epoch,fetched:new Date(now).toISOString(),source:'CelesTrak'};
}
export async function fetchOrbit(force=false,signal?:AbortSignal): Promise<OrbitData> {
  signal?.throwIfAborted();
  const old=await readState<OrbitData|null>('orbit',null);signal?.throwIfAborted();
  const now=Date.now();
  if(old&&now-Date.parse(old.fetched)<(force?2:4)*3600000){try{validateOrbit(old.omm,now);return old;}catch{/* Expired cached ephemerides do not block an online refresh. */}}
  const retryAt=await readState<number>('orbit-retry',0);
  const urls=now<retryAt?['/iss-live.json']:['https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=json','/iss-live.json'];
  for(const url of urls){signal?.throwIfAborted();try{
    const r=await fetch(url,{signal:signal?AbortSignal.any([signal,AbortSignal.timeout(12000)]):AbortSignal.timeout(12000),cache:'no-store'});if(!r.ok){if(!url.startsWith('/'))await writeState('orbit-retry',now+2*3600000);continue;}
    const a=await r.json();signal?.throwIfAborted();const next=validateOrbit(a[0],now);
    if(old&&Date.parse(next.epoch)<Date.parse(old.epoch)){validateOrbit(old.omm,now);return old;}
    next.source=url.startsWith('/')?'CelesTrak · copia di distribuzione':'CelesTrak';await writeState('orbit',next);return next;
  }catch { signal?.throwIfAborted();if(!url.startsWith('/'))await writeState('orbit-retry',now+2*3600000); }}
  if(old){validateOrbit(old.omm,now);return old;}
  throw new Error('Effemeridi ISS non disponibili. Riprova con una connessione attiva oppure importa un file OMM/TLE.');
}
export function parseSatelliteFile(text:string): OMMJsonObject {
  const t=text.trim();if(t.startsWith('[')||t.startsWith('{')){const a=JSON.parse(t);return Array.isArray(a)?a[0]:a;}
  const lines=t.split(/\r?\n/);const l1=lines.find(l=>l.startsWith('1 '));const l2=lines.find(l=>l.startsWith('2 '));if(!l1||!l2)throw new Error('Sono necessarie due righe TLE o un file OMM JSON.');
  const id=Number(l1.slice(2,7).trim());if(!Number.isInteger(id)||id<1||id!==Number(l2.slice(2,7).trim()))throw new Error('Le due righe TLE devono identificare lo stesso satellite.');
  const sat=twoline2satrec(l1,l2);const epoch=new Date((sat.jdsatepoch-2440587.5)*86400000).toISOString();
  return {OBJECT_NAME:lines.find(l=>!l.startsWith('1 ')&&!l.startsWith('2 ')&&l.trim())?.replace(/^0 /,'').trim().slice(0,50)||(id===25544?'ISS':'NORAD '+id),OBJECT_ID:'',EPOCH:epoch,MEAN_MOTION:sat.no*1440/(Math.PI*2),ECCENTRICITY:sat.ecco,INCLINATION:sat.inclo/DEG,RA_OF_ASC_NODE:sat.nodeo/DEG,ARG_OF_PERICENTER:sat.argpo/DEG,MEAN_ANOMALY:sat.mo/DEG,EPHEMERIS_TYPE:0,CLASSIFICATION_TYPE:'U',NORAD_CAT_ID:id,ELEMENT_SET_NO:1,REV_AT_EPOCH:0,BSTAR:sat.bstar,MEAN_MOTION_DOT:0,MEAN_MOTION_DDOT:0};
}
export function parseOrbitFile(text:string):OMMJsonObject{const omm=parseSatelliteFile(text);if(+omm.NORAD_CAT_ID!==25544)throw new Error('Importa soltanto effemeridi della ISS (NORAD 25544).');return omm;}
export function validateSatellite(omm:OMMJsonObject,now=Date.now()){const data=validateOrbit(omm,now,+omm.NORAD_CAT_ID);return {...data,source:'File importato sul dispositivo',omm:{...omm,OBJECT_NAME:String(omm.OBJECT_NAME??('NORAD '+omm.NORAD_CAT_ID)).slice(0,50)}};}
export function calculateForecast(orbit: OrbitData, place:Place, minElevation=10, now=Date.now()): Forecast {
  validateOrbit(orbit.omm,now,+orbit.omm.NORAD_CAT_ID);const satellite=+orbit.omm.NORAD_CAT_ID===25544?"ISS":String(orbit.omm.OBJECT_NAME).slice(0,50)+' (NORAD '+orbit.omm.NORAD_CAT_ID+')';const rec=json2satrec(orbit.omm);const stop=Math.min(now+FORECAST_WINDOW,Date.parse(orbit.epoch)+MAX_ORBIT_AGE);
  const passes:Pass[]=[];let start:number|null=null;const step=15000;
  const check=(ms:number)=>eligible(skyPoint(rec,ms,place),minElevation,place.horizon);
  function boundary(a:number,b:number,left:boolean){while(b-a>500){const m=(a+b)/2;if(check(m)===left)a=m;else b=m;}return (a+b)/2;}
  function close(end:number){if(start===null)return;const points:SkyPoint[]=[];let peak=start,max=-90;
    for(let t=start;t<=end;t+=5000){const p=skyPoint(rec,t,place);if(p){points.push(p);if(p.elevation>max){max=p.elevation;peak=t;}}}
    const last=skyPoint(rec,end,place);if(last){points.push(last);if(last.elevation>max){max=last.elevation;peak=end;}}
    if(points.length&&end-start>=15000)passes.push({satellite,id:`${orbit.omm.NORAD_CAT_ID}-${Math.round(start/1000)}-${place.id}-${minElevation}`,start,end,peak,maxElevation:max,startAzimuth:points[0].azimuth,endAzimuth:points.at(-1)!.azimuth,points});start=null;
  }
  let prev=check(now);if(prev)start=now;
  for(let t=now+step;t<=stop;t+=step){const yes=check(t);if(yes&&!prev)start=boundary(t-step,t,false);if(!yes&&prev)close(boundary(t-step,t,true));prev=yes;}
  if(start!==null)close(stop);
  return {satelliteId:+orbit.omm.NORAD_CAT_ID,satellite,passes,calculatedAt:now,expires:stop,epoch:orbit.epoch,minElevation,place,current:skyPoint(rec,now,place)};
}
