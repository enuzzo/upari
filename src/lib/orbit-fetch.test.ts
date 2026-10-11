import { afterEach,expect,it,vi } from 'vitest';
import type { OMMJsonObject } from 'satellite.js';
import snapshot from '../../public/iss-live.json';
import { fetchOrbit,validateOrbit } from './orbits';
import { readState } from './storage';
vi.mock('./storage',()=>({readState:vi.fn(async (_key:string,fallback:unknown)=>fallback),writeState:vi.fn(async()=>{})}));
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();vi.clearAllMocks();});
const now=Date.parse('2026-10-11T16:00:00Z');
it('aborts the pending source request without starting the distribution fallback',async()=>{
  vi.useFakeTimers();vi.setSystemTime(now);
  const urls:string[]=[];
  vi.stubGlobal('fetch',(url:string,{signal}:{signal:AbortSignal})=>{urls.push(url);return new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}));});
  const controller=new AbortController();
  const result=fetchOrbit(false,controller.signal);
  const rejected=expect(result).rejects.toMatchObject({name:'AbortError'});
  for(let i=0;i<10&&urls.length===0;i++)await Promise.resolve();
  expect(urls).toHaveLength(1);controller.abort();await rejected;expect(urls).toHaveLength(1);
});
it('downloads fresh ephemerides when a recently cached record has expired',async()=>{
  vi.useFakeTimers();vi.setSystemTime(now);
  const orbit=validateOrbit(snapshot[0] as OMMJsonObject,now);
  vi.mocked(readState).mockImplementation(async <T,>(key:string,fallback:T)=>key==='orbit'?{...orbit,omm:{...orbit.omm,EPOCH:'2026-10-01T00:00:00'},epoch:'2026-10-01T00:00:00Z'} as T:fallback);
  const urls:string[]=[];vi.stubGlobal('fetch',async(url:string)=>{urls.push(url);return new Response(JSON.stringify(snapshot));});
  const next=await fetchOrbit();expect(next.epoch).toBe(orbit.epoch);expect(urls).toHaveLength(1);
});
