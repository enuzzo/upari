import {expect,it} from 'vitest';
import {annualPair,statColor,publicURL,validateStatistics,validateBoundaries,validateStatisticsBundle,resolveStudy,initialStudy} from './statistics';
import {StudyController} from './study-controller';
import {readFileSync} from 'node:fs';
const pack=JSON.parse(readFileSync('public/statistics/world.json','utf8'));

it('keeps original annual endpoints, null and zero distinct; never bridges a gap',()=>{
 expect(publicURL('https://example.org/data?key=private')).toBe(false);expect(publicURL('https://example.org/data?access_key=private')).toBe(false);expect(publicURL('https://example.org/data?c[rsd_authority]=G')).toBe(true);
 const p={years:[2000,2001,2002],values:{a:{ITA:[0,null,8]}}} as typeof pack;
 expect(annualPair(p,'a','ITA',2000)).toEqual({from:2000,to:2000,mix:0,left:0,right:0});
 expect(annualPair(p,'a','ITA',2000.5)).toEqual({from:2000,to:2001,mix:.5,left:0,right:null});
 expect(annualPair(p,'a','XXX',2001).left).toBeNull();
 expect(statColor(null,[0,10])).not.toEqual(statColor(0,[0,10]));
});
it('validates actual source metadata and refuses ambiguous countries, years, values and licenses',()=>{
 expect(validateStatistics(pack).countries.length).toBe(217);
 expect(()=>validateStatistics({...pack,years:[2000,2002]})).toThrow();
 expect(()=>validateStatistics({...pack,countries:[pack.countries[0],pack.countries[0]]})).toThrow();
 expect(()=>validateStatistics({...pack,indicators:[{...pack.indicators[0],license:'All rights reserved'}]})).toThrow();
 expect(()=>validateStatistics({...pack,indicators:[{...pack.indicators[0],sourceURL:'https://example.org/?token=secret'}]})).toThrow();
});
it('checks geometry bounds/closure and preserves holes and dateline coordinates',()=>{
 const geo=JSON.parse(readFileSync('public/statistics/countries.geojson','utf8'));
 expect(validateBoundaries(geo).features.length).toBe(177);
 const f={type:'Feature',properties:{id:'A',statCode:'ITA',name:'A'},geometry:{type:'Polygon',coordinates:[[[0,0],[1,0],[1,1],[0,0]]]}};
 expect(()=>validateBoundaries({type:'FeatureCollection',features:[{...f,geometry:{...f.geometry,coordinates:[[[999,0],[1,0],[1,1],[999,0]]]}}]})).toThrow();
});
it('advances independently of refresh rate, seeks immediately, pauses in background and wraps within range',()=>{
 const a=new StudyController(pack,{time:2000,start:2000,end:2002,speed:1,playing:true});
 a.advance(0,false);a.advance(1000,false);expect(a.snapshot().time).toBeCloseTo(2000.12); // bounded stall
 a.seek(2001.25);expect(a.snapshot().time).toBe(2001.25);expect(a.snapshot().playing).toBe(false);
 a.configure({playing:true});a.advance(10000,true);a.advance(90000,false);expect(a.snapshot().time).toBe(2001.25);
 a.configure({time:2001.99});a.advance(90100,false);expect(a.snapshot().time).toBeCloseTo(2000.09);
 a.configure({loop:false,time:2001.99,playing:true});a.advance(90200,false);expect(a.snapshot().time).toBe(2002);expect(a.snapshot().playing).toBe(false);
});

it('checks UNHCR relation origins and strips fields outside the published schema',()=>{
 const asylum=JSON.parse(readFileSync('public/statistics/asylum.json','utf8'));
 const combined={...pack,token:'must-not-export',indicators:[...pack.indicators,asylum.indicator],values:{...pack.values,asylum:asylum.values},flows:{indicator:'asylum',origins:asylum.origins,relations:asylum.relations,selectionRows:asylum.selectionRows}};
 const clean=validateStatistics(combined);expect(JSON.stringify(clean)).not.toContain('must-not-export');
 expect(clean.flows!.relations.length).toBe(263);
 expect(()=>validateStatistics({...combined,flows:{...combined.flows,origins:['AFG']}})).toThrow();
});
it('round-trips study playhead in scenes, backups and public links without extra fields',async()=>{
 const {validateScene,saverURL,decodeSaver}=await import('./scene');const {initialPreferences,validateBackup}=await import('./storage');
 const study={enabled:true,dataset:'world',indicator:'employment',secondary:'birth',country:'ITA',time:2010.45,start:1991,end:2025,speed:1,playing:true,loop:true,token:'secret'};
 const scene=validateScene({layerKey:'satellite',lighting:true,study});
 expect(scene.study?.time).toBe(2010.45);expect(validateBackup({format:'upari-backup',version:2,preferences:initialPreferences,scene}).scene?.study).toEqual(scene.study);
 const url=saverURL({version:1,scene,place:initialPreferences.places[0],showClock:true,showWeather:false,rotationSpeed:.08});expect(url).not.toContain('secret');expect(decodeSaver(new URL(url,'https://test.example').hash).scene.study).toEqual(scene.study);
});

it('cannot reactivate an exited or imported dataset with the previous live reader',()=>{
 const saved={...initialStudy,enabled:false,time:2020},live={...saved,enabled:true,time:2021};
 expect(resolveStudy(saved,live)).toBe(saved);
 const imported={...saved,enabled:true,dataset:'local-new',time:2010};expect(resolveStudy(imported,live)).toBe(imported);
 expect(resolveStudy({...saved,enabled:true},live)?.time).toBe(2021);
});
it('strips foreign geometry dimensions instead of re-exporting attributes outside schema',()=>{
 const geo=JSON.parse(readFileSync('public/statistics/countries.geojson','utf8'));
 const first=geo.features.find((f:{geometry:{type:string}})=>f.geometry.type==='Polygon');first.geometry.coordinates[0][0].push({token:'sentinel-not-for-export'});
 expect(JSON.stringify(validateBoundaries(geo))).not.toContain('sentinel-not-for-export');
});

it('keeps zero neutral in asymmetric signed scales',()=>{expect(statColor(0,[-12,40])).toEqual([178,197,205,255]);expect(statColor(-12,[-12,40])).toEqual([61,160,232,255]);expect(statColor(40,[-12,40])).toEqual([244,163,77,255]);});

it('keeps the validated bundle identity stable across export and reimport',()=>{const input={data:pack,boundaries:JSON.parse(readFileSync('public/statistics/countries.geojson','utf8'))};const validated=validateStatisticsBundle(input),exported=JSON.stringify(validated);expect(JSON.stringify(validateStatisticsBundle(JSON.parse(exported)))).toBe(exported);});
