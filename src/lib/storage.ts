import { validateHorizon } from './horizon';
import { validateDiary } from './diary';
import {cleanSavedOrbit,cleanSavedSatellites} from './orbit-backup';
import { validateScene,initialScene } from './scene';
import { initialLayers } from './layers';
import { openDB } from 'idb';
import type { Preferences, OrbitData, QueueItem,DiaryEntry } from '../types';
let db: ReturnType<typeof openDB>|null=null;
function database(){return db??(db=openDB('upari', 1, { upgrade(d) { d.createObjectStore('state'); } }));}
export async function readState<T>(key: string, fallback: T): Promise<T> { try { return (await (await database()).get('state', key)) ?? fallback; } catch { return fallback; } }
export async function writeState<T>(key: string, value: T): Promise<void> { await (await database()).put('state', value, key); }
export async function editDiary(change:(entries:DiaryEntry[])=>DiaryEntry[]){
  const tx=(await database()).transaction('state','readwrite');
  try{const entries=validateDiary(change(validateDiary(await tx.store.get('diary')??[])));await tx.store.put(entries,'diary');await tx.done;
    if(typeof window!=='undefined')window.dispatchEvent(new Event('upari-diary-changed'));return entries;
  }catch(error){try{tx.abort();}catch{/* Transaction already completed/aborted. */}throw error;}
}
export const initialPreferences: Preferences = { activePlace:'luino', places:[{id:'luino',name:'Luino',latitude:46.001,longitude:8.746,height:0.2}],theme:'night',minElevation:10,leadMinutes:10,quietFrom:23,quietUntil:7,maxDaily:2,issEnabled:false,renderQuality:'auto',satelliteId:25544 };
export function validatePreferences(raw: unknown): Preferences {
  const p = raw as Preferences;
  if (!p || !Array.isArray(p.places) || !p.places.length || p.places.length > 50) throw new Error('Il backup non contiene luoghi validi.');
  for (const l of p.places) if (typeof l.id !== 'string' || typeof l.name !== 'string' || l.name.length > 100 || !Number.isFinite(l.latitude) || Math.abs(l.latitude)>90 || !Number.isFinite(l.longitude) || Math.abs(l.longitude)>180 || !Number.isFinite(l.height) || l.height<0 || l.height>10) throw new Error('Coordinate non valide nel backup.');
  if (new Set(p.places.map(l=>l.id)).size !== p.places.length) throw new Error('Luoghi duplicati nel backup.');
  if (!p.places.some(l=>l.id===p.activePlace)) throw new Error('Luogo attivo non valido.');
  return { activePlace:p.activePlace,places:p.places.map(({id,name,latitude,longitude,height,horizon})=>({id,name,latitude,longitude,height,...(horizon===undefined?{}:{horizon:validateHorizon(horizon)})})), theme:['night','atlas','red'].includes(p.theme)?p.theme:'night', minElevation: Math.max(5,Math.min(70,+p.minElevation || 10)), leadMinutes:Math.max(1,Math.min(60,+p.leadMinutes||10)), quietFrom:Math.max(0,Math.min(23,+p.quietFrom||0)), quietUntil:Math.max(0,Math.min(23,+p.quietUntil||0)),maxDaily:Math.max(1,Math.min(6,+p.maxDaily||2)),issEnabled:p.issEnabled===true,renderQuality:['auto','high','battery'].includes(p.renderQuality)?p.renderQuality:'auto',satelliteId:Number.isInteger(p.satelliteId)&&p.satelliteId!>=1&&p.satelliteId!<=999999999?p.satelliteId:25544 };
}
export async function loadPreferences() { return validatePreferences(await readState('preferences', initialPreferences)); }
const cleanFavorites=(raw:unknown)=>Array.isArray(raw)?raw.filter((key,i)=>typeof key==='string'&&initialLayers.some(l=>l.key===key)&&raw.indexOf(key)===i):[];
export async function exportBackup() {
  const [preferences,scene,favorites,diary,satellites,orbit]=await Promise.all([loadPreferences(),readState('scene',initialScene),readState('favorites',[]),readState('diary',[]),readState('satellites',[]),readState<OrbitData|null>('orbit',null)]);
  return JSON.stringify({format:'upari-backup',version:2,exportedAt:new Date().toISOString(),preferences:validatePreferences(preferences),scene:validateScene(scene),favorites:cleanFavorites(favorites),diary:validateDiary(diary),satellites:cleanSavedSatellites(satellites),orbit:orbit?cleanSavedOrbit(orbit):null},null,2);
}
export function validateBackup(raw:unknown){
  const b=raw as Record<string,unknown>;
  if(!b||b.format!=='upari-backup'||![1,2].includes(b.version as number))throw new Error('Formato di backup non supportato.');
  const preferences=validatePreferences(b.preferences);
  if(b.version===1)return {preferences};
  const satellites=cleanSavedSatellites(b.satellites??[]),orbit=b.orbit?cleanSavedOrbit(b.orbit):null;
  if(orbit&&Number(orbit.omm.NORAD_CAT_ID)!==25544)throw new Error('Il campo orbita principale deve contenere la ISS.');
  if(preferences.satelliteId!==25544&&!satellites.some(o=>Number(o.omm.NORAD_CAT_ID)===preferences.satelliteId))preferences.satelliteId=25544;
  return {preferences,scene:validateScene(b.scene),favorites:cleanFavorites(b.favorites),diary:validateDiary(b.diary??[]),satellites,orbit};
}
export async function importBackup(text:string) {
  const clean=validateBackup(JSON.parse(text));const tx=(await database()).transaction('state','readwrite');
  for(const [key,value] of Object.entries(clean))await tx.store.put(value,key==='preferences'?'preferences':key);
  await tx.done;if(typeof window!=='undefined')window.dispatchEvent(new Event('upari-diary-changed'));return clean;
}
export type BackupState=ReturnType<typeof validateBackup>;
export type SavedState = { orbit?: OrbitData; queue?: QueueItem[] };
