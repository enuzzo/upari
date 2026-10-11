import { describe,it,expect,vi,afterEach } from 'vitest';
import { decodeSaver,saverURL,validateScene,initialScene } from './scene';
import { initialPreferences,validatePreferences } from './storage';
import type { SaverConfig } from '../types';
afterEach(()=>vi.restoreAllMocks());
describe('optional features and autonomous scene links',()=>{
  it('migrates older preferences with ISS off and automatic quality',()=>{
    const legacy={...initialPreferences,issEnabled:undefined,renderQuality:undefined};
    const p=validatePreferences(legacy);expect(p.issEnabled).toBe(false);expect(p.renderQuality).toBe('auto');
    expect(validatePreferences({...legacy,issEnabled:true,renderQuality:'high'}).issEnabled).toBe(true);
  });
  it('round-trips the exact scene, dates, comparison and camera with a Unicode place',()=>{
    vi.spyOn(Date,'now').mockReturnValue(Date.parse('2026-10-11T16:00:00Z'));
    const config:SaverConfig={version:1,scene:{...initialScene,layerKey:'ocean',date:'2026-10-09',compare:true,compareDate:'2026-10-08',split:.62,opacity:.71,camera:{...initialScene.camera,longitude:8.746,latitude:46.001,height:12500,pitch:-1.4,heading:.9}},place:{...initialPreferences.places[0],name:'Lago · città'},showClock:true,showWeather:true,rotationSpeed:.3};
    const decoded=decodeSaver(new URL(saverURL(config),'https://upari.example').hash);
    expect(decoded.scene).toEqual(config.scene);expect(decoded.place.name).toBe(config.place.name);expect(decoded.showWeather).toBe(true);
  });
  it('keeps refreshed scientific dates and rejects malformed dates or arbitrary provider names',()=>{
    const s=validateScene({...initialScene,layerKey:'ocean',date:new Date().toISOString().slice(0,10)});
    expect(s.date).toBe(new Date().toISOString().slice(0,10));
    expect(validateScene({...s,date:'2026-02-30'}).date).not.toBe('2026-02-30');
    expect(validateScene({...s,layerKey:'https://unknown.example/tile'}).layerKey).toBe('satellite');
  });
  it('strips credentials and extraneous properties from exported page links',()=>{
    const dirty={version:1,scene:{...initialScene,token:'secret-scene'},place:{...initialPreferences.places[0],token:'secret-place'},showClock:true,showWeather:false,rotationSpeed:.2,bridgeToken:'secret-bridge'} as SaverConfig;
    const url=saverURL(dirty);expect(url).not.toContain('secret');expect(new URL(url,'https://upari.example').search).toBe('');
  });
  it('rejects oversized or invalid links and clamps unsafe camera values',()=>{
    expect(()=>decodeSaver('#scene='+'x'.repeat(17000))).toThrow();
    expect(()=>decodeSaver('#scene='+encodeURIComponent(JSON.stringify({version:2})))).toThrow();
    const s=validateScene({...initialScene,camera:{longitude:Infinity,latitude:180,height:-100,heading:99,pitch:NaN,roll:0}});
    expect(s.camera.height).toBe(200);expect(s.camera.latitude).toBe(90);expect(s.camera.longitude).toBe(12);expect(s.camera.pitch).toBe(-Math.PI/2);
  });
});
