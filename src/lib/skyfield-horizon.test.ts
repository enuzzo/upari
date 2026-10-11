import {expect,it} from 'vitest';
import type {OMMJsonObject} from 'satellite.js';
import snapshot from '../../public/iss-live.json';
import reference from '../../docs/skyfield-horizon.json';
import {calculateForecast,validateOrbit} from './orbits';
it('matches independent JPL horizon-obstructed windows and a second forecast start date',()=>{
  let windows=0,maxBoundary=0,maxElevation=0;
  for(const record of reference.records){const orbit=validateOrbit(snapshot[0] as OMMJsonObject,record.now),forecast=calculateForecast(orbit,record.place,record.minElevation,record.now);expect(forecast.passes.length,record.place.name).toBe(record.passes.length);
    forecast.passes.forEach((p,i)=>{const expected=record.passes[i];maxBoundary=Math.max(maxBoundary,Math.abs(p.start-expected.start)/1000,Math.abs(p.end-expected.end)/1000);maxElevation=Math.max(maxElevation,Math.abs(p.maxElevation-expected.maxElevation));expect(Math.abs(p.start-expected.start)/1000).toBeLessThan(3);expect(Math.abs(p.end-expected.end)/1000).toBeLessThan(3);expect(Math.abs(p.maxElevation-expected.maxElevation)).toBeLessThan(.5);windows++;});
  }
  console.log(JSON.stringify({horizonCases:reference.records.length,windows,maxBoundarySeconds:maxBoundary,maxElevationDegrees:maxElevation}));expect(windows).toBeGreaterThan(0);
},15000);
