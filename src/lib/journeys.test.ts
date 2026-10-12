import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {JourneyDirector,journeysFor,chapterComparison} from './journeys';
import {StudyController} from './study-controller';
const data=JSON.parse(readFileSync('public/statistics/world.json','utf8'));

it('settles the camera before time playback, caps stalls, and never catches up after background',()=>{
 const study=new StudyController(data),route=journeysFor(data).find(r=>r.id==='longer-lives')!;
 const director=new JourneyDirector(study,route,false);director.start();
 expect(study.snapshot().playing).toBe(false);
 director.tick(0,false);director.tick(10000,false);expect(director.snapshot().elapsed).toBeCloseTo(.12);
 for(let t=10100;t<=14100;t+=100)director.tick(t,false);
 expect(study.snapshot().playing).toBe(true);
 const elapsed=director.snapshot().elapsed;director.tick(20000,true);director.tick(90000,false);
 expect(director.snapshot().elapsed).toBe(elapsed);
 director.pause();expect(study.snapshot().playing).toBe(false);
 director.tick(90100,false);expect(director.snapshot().elapsed).toBe(elapsed);
});

it('holds reduced-motion chapters until navigation and reads missing endpoints without deriving a change',()=>{
 const study=new StudyController(data),route=journeysFor(data).find(r=>r.id==='longer-lives')!;
 const director=new JourneyDirector(study,route,true);director.start();
 for(let t=0;t<100000;t+=100)director.tick(t,false);
 expect(director.snapshot().index).toBe(0);expect(study.snapshot().playing).toBe(false);
 director.go(1);expect(director.snapshot().index).toBe(1);expect(study.snapshot().country).toBe(route.chapters[1].country);
 const fixture={...data,years:[2000,2001],values:{x:{ITA:[0,null]}}};
 expect(chapterComparison(fixture,{indicator:'x',country:'ITA',from:2000,to:2001})).toEqual({left:0,right:null,change:null});
});

it('only offers chapters backed by original endpoint data and stops after the final chapter',()=>{
 const study=new StudyController(data),route=journeysFor(data).find(r=>r.id==='longer-lives')!;
 expect(journeysFor({...data,values:{}})).toEqual([]);
 expect(journeysFor({...data,indicators:data.indicators.map((m:{code:string})=>({...m,code:'unrelated-measure'}))})).toEqual([]);
 const director=new JourneyDirector(study,route,false);director.start();director.go(route.chapters.length-1);
 for(let t=0;t<35000;t+=100){director.tick(t,false);study.advance(t,false);}
 expect(director.snapshot().playing).toBe(false);expect(director.snapshot().finished).toBe(true);
 expect(study.snapshot().time).toBe(route.chapters.at(-1)!.to);
});

it('saves a paused documentary frame without mutating live playback or normal study scenes',()=>{
 const study=new StudyController(data),director=new JourneyDirector(study,journeysFor(data)[0],false);
 study.director=director;director.start();for(let t=0;t<=5000;t+=100)study.advance(t,false);
 expect(study.snapshot().playing).toBe(true);
 expect(study.snapshotForScene()).toMatchObject({playing:false,speed:1});
 expect(study.snapshot().playing).toBe(true);
 study.director=null;expect(study.snapshotForScene()).toEqual(study.snapshot());
});
