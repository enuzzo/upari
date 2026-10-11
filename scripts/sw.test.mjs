import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { describe,it,expect } from 'vitest';

function worker(){
  const handlers=new Map(),entries=new Map();
  const cache={keys:async()=>[...entries.keys()].map(url=>new Request(url)),match:async r=>entries.get(typeof r==='string'?r:r.url)?.clone(),put:async(r,response)=>entries.set(r.url,response.clone()),delete:async r=>entries.delete(r.url)};
  const context={self:{location:new URL('https://upari.example'),addEventListener:(name,handler)=>handlers.set(name,handler),clients:{claim:async()=>{}}},caches:{open:async()=>cache,match:async()=>undefined,keys:async()=>[]},URL,Request,Response,Headers,fetch:async()=>new Response('real-tile',{headers:{'content-type':'image/jpeg'}})};
  return {context,entries,async fetch(url,headers,mode='cors'){const waits=[];let response;handlers.get('fetch')({request:mode==='navigate'?{url,method:'GET',mode,headers:new Headers(headers)}:new Request(url,{headers}),respondWith:r=>response=r,waitUntil:p=>waits.push(p)});if(!response)return null;const result=await response;await Promise.all(waits);return result;}};
}
describe('bounded public imagery caching',()=>{
  it('caches public Swiss tiles and local vector packages while excluding keyed variants',async()=>{
    const w=worker();vm.runInNewContext(await readFile('public/sw.js','utf8'),w.context);
    for(const url of ['https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/10/536/365.jpeg','https://upari.example/vectors/wind.json']){expect(await w.fetch(url)).not.toBeNull();expect(w.entries.has(url)).toBe(true);expect(await w.fetch(url+'?token=secret')).toBeNull();}
  });
  it('caches Esri World Imagery tiles for offline photography',async()=>{
    const w=worker();vm.runInNewContext(await readFile('public/sw.js','utf8'),w.context);
    const url='https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/3/2/4';
    const response=await w.fetch(url);expect(await response?.text()).toBe('real-tile');expect(w.entries.has(url)).toBe(true);
  });
  it('opens approved notification deep links from the offline shell',async()=>{
    const w=worker();vm.runInNewContext(await readFile('public/sw.js','utf8'),w.context);
    w.context.fetch=async()=>{throw new Error('offline');};w.context.caches.match=async path=>new Response(path);
    expect(await (await w.fetch('https://upari.example/?view=sky',undefined,'navigate'))?.text()).toBe('/index.html');
  });
  it('evicts old tiles after the entry budget and rejects oversized remote tiles',async()=>{
    const w=worker();vm.runInNewContext(await readFile('public/sw.js','utf8'),w.context);
    const prefix='https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/tile/';
    for(let i=0;i<125;i++)await w.fetch(prefix+i);
    expect(w.entries.size).toBe(120);expect(w.entries.has(prefix+0)).toBe(false);expect(w.entries.has(prefix+124)).toBe(true);
    w.context.fetch=async()=>new Response(new Uint8Array(2097153));
    await w.fetch(prefix+'large');expect(w.entries.has(prefix+'large')).toBe(false);
  });
  it('does not intercept authenticated requests, private local paths or other Esri services',async()=>{
    const w=worker();vm.runInNewContext(await readFile('public/sw.js','utf8'),w.context);
    for(const url of ['https://upari.example/private-plan','https://upari.example/bridge/plan','https://services.arcgisonline.com/ArcGIS/rest/services/Private/MapServer/tile/1/2/3','https://ntfy.example/topic'])expect(await w.fetch(url)).toBeNull();
    expect(await w.fetch('https://upari.example/assets/app.js',{Authorization:'Bearer test-token'})).toBeNull();
    expect(await w.fetch('https://upari.example/assets/app.js?token=test-token')).toBeNull();
  });
});
