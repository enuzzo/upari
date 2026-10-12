import {it,expect} from 'vitest';
import {RotationClock,rotationStep,defaultRotationSpeed} from './earth-rotation';
import {initialScene,validateScene,saverURL,decodeSaver} from './scene';
import {initialPreferences,validateBackup} from './storage';
it('starts old scenes slowly and retains an explicit pause/speed through backup and links',()=>{
 expect(validateScene({}).rotationEnabled).toBe(true);expect(validateScene({}).rotationSpeed).toBe(defaultRotationSpeed);
 const scene={...initialScene,rotationEnabled:false,rotationSpeed:.4};
 expect(validateBackup({format:'upari-backup',version:2,preferences:initialPreferences,scene}).scene).toEqual(scene);
 const link=saverURL({version:1,scene,place:initialPreferences.places[0],showClock:true,showWeather:false,rotationSpeed:.4});
 expect(decodeSaver(new URL(link,'https://example.test').hash).scene).toEqual(scene);
 expect(validateScene({...scene,rotationSpeed:Infinity}).rotationSpeed).toBe(defaultRotationSpeed);
 expect(validateScene({...scene,rotationSpeed:99}).rotationSpeed).toBe(1);
});
it('integrates the same angular motion at 30/60 fps, reduces ground drift and bounds stalls',()=>{
 const integrate=(fps:number)=>Array.from({length:fps},()=>rotationStep(.08,17000000,1000/fps)).reduce((a,b)=>a+b,0);
 expect(integrate(30)).toBeCloseTo(.08,10);expect(integrate(60)).toBeCloseTo(.08,10);
 expect(rotationStep(.08,12000,100)).toBeLessThan(rotationStep(.08,17000000,100)/100);
 expect(rotationStep(.08,17000000,60000)).toBeCloseTo(.008);
});
it('holds multi-touch and inertia, and never catches up hidden or paused time',()=>{
 const clock=new RotationClock();expect(clock.tick(0,.08,17000000)).toBe(0);
 clock.down(1);clock.down(2);expect(clock.tick(20,.08,17000000)).toBe(0);
 clock.up(1,30);expect(clock.tick(2000,.08,17000000)).toBe(0);
 clock.up(2,2010);expect(clock.tick(3500,.08,17000000)).toBe(0);
 expect(clock.tick(3900,.08,17000000)).toBeGreaterThan(0);
 expect(clock.tick(60000,.08,17000000,true)).toBe(0);
 clock.down(3);clock.suspend();expect(clock.tick(120000,.08,17000000)).toBe(0);
 expect(clock.tick(120020,.08,17000000)).toBeCloseTo(.0016);
});
