import type { Forecast, Pass, Preferences, QueueItem, NotificationSettings } from '../types';
import { direction, duration, time } from './format';
import { readState, writeState } from './storage';
export function inQuietHours(hour:number,from:number,until:number) { if(from===until)return false;return from<until?hour>=from&&hour<until:hour>=from||hour<until; }
export function notificationPlan(forecast:Forecast,prefs:Preferences,now=Date.now()): QueueItem[] {
  const out:QueueItem[]=[];const count=new Map<string,number>();
  for(const pass of forecast.passes){const at=pass.start-prefs.leadMinutes*60000;
    if(at<now+30000||at>now+48*3600000||at>forecast.expires||now-Date.parse(forecast.epoch)>2*86400000)continue;
    const d=new Date(at);if(inQuietHours(d.getHours(),prefs.quietFrom,prefs.quietUntil))continue;
    const key=d.toLocaleDateString('en-CA');if((count.get(key)??0)>=prefs.maxDaily)continue;count.set(key,(count.get(key)??0)+1);
    out.push({id:`upari-${pass.id}`,at,passId:pass.id,expires:pass.end,message:`ISS alle ${time(pass.start)}. Cerca verso ${direction(pass.startAzimuth)}; sarà visibile per ${duration(pass.start,pass.end)}. Culmine ${Math.round(pass.maxElevation)}°.`,channel:''});
  }return out;
}
export function serverURL(s:string) {const u=new URL(s);if(u.protocol!=='https:' && !(u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname)))throw new Error('Usa un indirizzo HTTPS per il servizio.');if(u.username||u.password||u.search||u.hash)throw new Error('Inserisci un URL senza credenziali o parametri.');return u.href.replace(/\/$/,'');}
export async function ntfyCapabilities(s:NotificationSettings) {
  const server=serverURL(s.server);if(!/^[a-zA-Z0-9_-]{12,128}$/.test(s.topic))throw new Error('Usa un topic di almeno 12 caratteri, con lettere, numeri, trattini o underscore.');
  const r=await fetch(server+'/v1/health',{signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error('Il server ntfy non risponde.');const info=await r.json();if(info.healthy!==true)throw new Error('Il server ntfy non è pronto.');
  // /v1/health does not disclose server versions. Verify sequence IDs on the actual accepted response.
  return server;
}
async function ntfyDelete(s:NotificationSettings,item:QueueItem) {if(!item.supportsUpdates)throw new Error('Questo server non ha confermato gli ID di sequenza. Annulla l’avviso nell’app ntfy prima di cambiare la coda.');const r=await fetch(item.channel+'/'+encodeURIComponent(item.id),{method:'DELETE',headers:s.token?{Authorization:'Bearer '+s.token}:{},signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error('Annullamento ntfy non confermato. La coda precedente resta visibile.');}
export async function cancelQueue(s:NotificationSettings) {const old=await readState<QueueItem[]>('queue',[]);let remaining=[...old];for(const q of old){if(q.at>Date.now()){await ntfyDelete(s,q);}remaining=remaining.filter(x=>x.id!==q.id);await writeState('queue',remaining);}return remaining;}
export async function scheduleNtfy(s:NotificationSettings,plan:QueueItem[],url:string) {
  const base=(await ntfyCapabilities(s))+'/'+encodeURIComponent(s.topic);const old=await readState<QueueItem[]>('queue',[]);
  if(old.some(q=>q.channel!==base&&q.at>Date.now()))throw new Error('Annulla prima la coda del topic precedente.');
  if(old.some(q=>q.at>Date.now()&&!q.supportsUpdates))throw new Error('La coda precedente richiede un annullamento manuale su ntfy. Non invio nuovi avvisi che potrebbero duplicarla.');
  const wanted=new Set(plan.map(x=>x.id));let saved=old.filter(q=>q.at>Date.now());
  for(const q of saved.filter(q=>!wanted.has(q.id))){await ntfyDelete(s,q);saved=saved.filter(x=>x.id!==q.id);await writeState('queue',saved);}
  for(const item of plan){if(item.at<Date.now()+30000)continue;
    if(saved.some(q=>q.id===item.id&&q.at===item.at&&q.message===item.message))continue;
    const r=await fetch(base+'/'+encodeURIComponent(item.id),{method:'POST',headers:{'Content-Type':'text/plain; charset=utf-8','Title':'Upari · ISS','At':String(Math.floor(item.at/1000)),'Click':url+'?view=sky','Priority':'default',...(s.token?{Authorization:'Bearer '+s.token}:{})},body:item.message,signal:AbortSignal.timeout(15000)});
    if(!r.ok)throw new Error(`ntfy ha rifiutato la programmazione (${r.status}). Gli invii già accettati restano nella coda.`);
    const result=await r.json();const confirmed=result.sequence_id===item.id;const scheduled=Math.abs(+result.time*1000-item.at)<1500;
    saved=[...saved.filter(x=>x.id!==item.id),{...item,channel:base,supportsUpdates:confirmed,serverId:result.id}];await writeState('queue',saved);
    if(!confirmed||!scheduled)throw new Error('Il server ha accettato un messaggio ma non ha confermato sequenza e orario. Controllalo nell’app ntfy; la coda si ferma qui per evitare duplicati.');
  }return saved;
}
export async function sendBridge(s:NotificationSettings,forecast:Forecast,plan:QueueItem[]) {
  const u=serverURL(s.bridge);const r=await fetch(u+'/plan',{method:'PUT',headers:{'Content-Type':'application/json',...(s.bridgeToken?{Authorization:'Bearer '+s.bridgeToken}:{})},body:JSON.stringify({version:1,generatedAt:new Date().toISOString(),expires:new Date(Math.min(forecast.expires,Date.now()+48*3600000)).toISOString(),placeId:forecast.place.id,epoch:forecast.epoch,events:plan}),signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error(`Il bridge ha rifiutato il piano (${r.status}).`);return r.json();
}
export function calendar(pass:Pass) {const stamp=(t:number)=>new Date(t).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z/,'Z');return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Upari//ISS//IT','BEGIN:VEVENT',`UID:${pass.id}@upari`,`DTSTAMP:${stamp(Date.now())}`,`DTSTART:${stamp(pass.start)}`,`DTEND:${stamp(pass.end)}`,'SUMMARY:Osserva la ISS',`DESCRIPTION:Cerca verso ${direction(pass.startAzimuth)}. Culmine ${Math.round(pass.maxElevation)} gradi. Previsione SGP4. Nessun meteo collegato.`,'END:VEVENT','END:VCALENDAR'].join('\r\n');}
