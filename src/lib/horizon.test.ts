import {expect,it} from 'vitest';
import {horizonAt,validateHorizon} from './horizon';
import {eligible} from './orbits';
import type {SkyPoint} from '../types';
it('interpolates across north and combines obstruction with the elevation threshold',()=>{
  const h=[20,0,0,0,0,0,0,40];expect(horizonAt(h,337.5)).toBe(30);expect(horizonAt(h,-22.5)).toBe(30);expect(horizonAt(undefined,0)).toBe(0);
  const p={azimuth:337.5,elevation:29,sunElevation:-12,sunlit:true} as SkyPoint;expect(eligible(p,10,h)).toBe(false);expect(eligible({...p,elevation:31},10,h)).toBe(true);expect(eligible({...p,elevation:31},40,h)).toBe(false);
});
it('rejects malformed/nonfinite masks instead of silently inventing an open horizon',()=>{
  for(const h of [[0],Array(8).fill(NaN),Array(8).fill(90),Array(8).fill(-1)])expect(()=>validateHorizon(h)).toThrow();expect(validateHorizon(Array(8).fill(0))).toHaveLength(8);
});
