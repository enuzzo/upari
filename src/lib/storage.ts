import { openDB } from 'idb';
import type { Preferences, OrbitData, QueueItem } from '../types';
let db: ReturnType<typeof openDB>|null=null;
function database(){return db??(db=openDB('upari', 1, { upgrade(d) { d.createObjectStore('state'); } }));}
export async function readState<T>(key: string, fallback: T): Promise<T> { try { return (await (await database()).get('state', key)) ?? fallback; } catch { return fallback; } }
export async function writeState<T>(key: string, value: T): Promise<void> { await (await database()).put('state', value, key); }
export const initialPreferences: Preferences = { activePlace:'luino', places:[{id:'luino',name:'Luino',latitude:46.001,longitude:8.746,height:0.2}],theme:'night',minElevation:10,leadMinutes:10,quietFrom:23,quietUntil:7,maxDaily:2,issEnabled:false,renderQuality:'auto' };
export function validatePreferences(raw: unknown): Preferences {
  const p = raw as Preferences;
  if (!p || !Array.isArray(p.places) || !p.places.length || p.places.length > 50) throw new Error('Il backup non contiene luoghi validi.');
  for (const l of p.places) if (typeof l.id !== 'string' || typeof l.name !== 'string' || l.name.length > 100 || !Number.isFinite(l.latitude) || Math.abs(l.latitude)>90 || !Number.isFinite(l.longitude) || Math.abs(l.longitude)>180 || !Number.isFinite(l.height) || l.height<0 || l.height>10) throw new Error('Coordinate non valide nel backup.');
  if (new Set(p.places.map(l=>l.id)).size !== p.places.length) throw new Error('Luoghi duplicati nel backup.');
  if (!p.places.some(l=>l.id===p.activePlace)) throw new Error('Luogo attivo non valido.');
  return { activePlace:p.activePlace,places:p.places.map(({id,name,latitude,longitude,height})=>({id,name,latitude,longitude,height})), theme:['night','atlas','red'].includes(p.theme)?p.theme:'night', minElevation: Math.max(5,Math.min(70,+p.minElevation || 10)), leadMinutes:Math.max(1,Math.min(60,+p.leadMinutes||10)), quietFrom:Math.max(0,Math.min(23,+p.quietFrom||0)), quietUntil:Math.max(0,Math.min(23,+p.quietUntil||0)),maxDaily:Math.max(1,Math.min(6,+p.maxDaily||2)),issEnabled:p.issEnabled===true,renderQuality:['auto','high','battery'].includes(p.renderQuality)?p.renderQuality:'auto' };
}
export async function loadPreferences() { return validatePreferences(await readState('preferences', initialPreferences)); }
export async function exportBackup() { return JSON.stringify({format:'upari-backup',version:1,exportedAt:new Date().toISOString(),preferences:await loadPreferences()},null,2); }
export async function importBackup(text: string) { const b = JSON.parse(text);if(b.format!=='upari-backup'||b.version!==1)throw new Error('Formato di backup non supportato.');const p=validatePreferences(b.preferences);await writeState('preferences',p);return p; }
export type SavedState = { orbit?: OrbitData; queue?: QueueItem[] };
