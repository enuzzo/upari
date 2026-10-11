import {expect,it} from 'vitest';
import {observation,validateDiary} from './diary';
import {initialPreferences,validateBackup} from './storage';
import type {Forecast,Pass} from '../types';
const f={place:initialPreferences.places[0],epoch:'2026-10-11T06:00:00Z'} as Forecast;
const p={start:1000,end:2000,maxElevation:42} as Pass;
it('distinguishes a user observation from future prediction and strips unknown backup fields',()=>{
  expect(()=>observation(p,f,'seen','',500)).toThrow('futuro');
  const entry=observation(p,f,'cloudy','Nubi',3000);expect(entry.outcome).toBe('cloudy');
  const clean=validateBackup({format:'upari-backup',version:2,preferences:{...initialPreferences,places:[{...f.place,horizon:[0,5,10,20,30,40,50,60]}]},diary:[{...entry,token:'secret'}],token:'secret'});
  expect(JSON.stringify(clean)).not.toContain('secret');expect(clean.preferences.places[0].horizon?.[7]).toBe(60);expect(clean.diary?.[0].notes).toBe('Nubi');
});
it('accepts legacy preferences without deleting diary and rejects malformed records before writing',()=>{
  expect(validateBackup({format:'upari-backup',version:1,preferences:initialPreferences})).not.toHaveProperty('diary');
  expect(()=>validateDiary([{...observation(p,f,'seen','',3000),outcome:'predicted'}])).toThrow();
});
