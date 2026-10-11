import { describe,it,expect,vi,beforeEach } from 'vitest';
const mem=new Map<string,unknown>();
vi.mock('./storage',()=>({readState:async(k:string,f:unknown)=>mem.get(k)??f,writeState:async(k:string,v:unknown)=>{mem.set(k,structuredClone(v));}}));
import { inQuietHours,notificationPlan,scheduleNtfy } from './notifications';
import type { Forecast,Preferences,QueueItem } from '../types';
const now=Date.parse('2026-10-11T16:00:00Z');
beforeEach(()=>{mem.clear();vi.restoreAllMocks();});
describe('Notification planning',()=>{
  it('handles silence across midnight and an explicitly disabled silence window',()=>{expect(inQuietHours(1,23,7)).toBe(true);expect(inQuietHours(12,23,7)).toBe(false);expect(inQuietHours(10,8,11)).toBe(true);expect(inQuietHours(0,0,0)).toBe(false);});
  it('caps the queue at 48 hours and the daily limit',()=>{vi.spyOn(Date,'now').mockReturnValue(now);const p={leadMinutes:10,quietFrom:0,quietUntil:0,maxDaily:1} as Preferences;const f={epoch:new Date(now-3600000).toISOString(),expires:now+72*3600000,passes:[1,2,49].map((h,i)=>({id:'x'+i,start:now+h*3600000,end:now+h*3600000+300000,startAzimuth:270,maxElevation:50}))} as Forecast;const plan=notificationPlan(f,p,now);expect(plan.length).toBe(1);expect(plan[0].at).toBe(now+50*60000);});
  it('keeps already accepted entries when a later publish fails',async()=>{
    vi.spyOn(Date,'now').mockReturnValue(now);
    let publishes=0;vi.stubGlobal('fetch',vi.fn(async(u:string,init?:RequestInit)=>{if(u.endsWith('/v1/health'))return new Response(JSON.stringify({healthy:true}));if(u.includes('capability'))return new Response(JSON.stringify({code:40403,error:'message not found'}),{status:404});if(init?.method==='POST'){publishes++;if(publishes===2)return new Response('',{status:500});return new Response(JSON.stringify({id:'remote',event:'message',sequence_id:'upari-first',time:Math.floor((now+3600000)/1000)}));}return new Response('{}');}));
    const plan=[1,2].map((h,i)=>({id:i?'upari-second':'upari-first',at:now+h*3600000,expires:now+h*3600000+300000,message:'ISS',passId:'p'+i,channel:''}));await expect(scheduleNtfy({server:'https://ntfy.example',topic:'private-upari-topic',token:'',bridge:'',bridgeToken:''},plan,'https://upari.example')).rejects.toThrow();expect((mem.get('queue') as QueueItem[]).length).toBe(1);vi.unstubAllGlobals();
  });
});
