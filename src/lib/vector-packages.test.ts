import {expect,it} from 'vitest';
import currents from '../../public/vectors/currents.json';
import wind from '../../public/vectors/wind.json';
import {validateField,sampleVector} from './vectors';
it('loads both distributed real fields with distinct dates and retained missing masks',()=>{
  for(const raw of [currents,wind]){const f=validateField(raw);expect(f.u.length).toBe(f.latitudes.length*f.longitudes.length);expect(f.u.some(n=>n===null)).toBe(true);expect(f.u.some(n=>n!==null&&n!==0)).toBe(true);}
  expect(currents.time).toBe('2014-09-26T00:00:00Z');expect(wind.time).toBe('2026-10-10T12:00:00Z');
  expect(sampleVector(validateField(currents),0,89)).toBe(null);
});
