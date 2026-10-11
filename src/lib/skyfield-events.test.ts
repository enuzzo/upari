import { it,expect } from 'vitest';
import type { OMMJsonObject } from 'satellite.js';
import snapshot from '../../public/iss-live.json';
import reference from '../../docs/skyfield-events.json';
import { calculateForecast,validateOrbit } from './orbits';
it('matches complete Skyfield/JPL windows across seven latitude/threshold cases',()=>{
  let windows=0,worstBoundary=0,worstPeak=0,worstElevation=0;
  for(const record of reference.records){
    const forecast=calculateForecast(validateOrbit(snapshot[0] as OMMJsonObject,record.now),record.place,record.minElevation,record.now);
    expect(forecast.passes.length,record.place.name+' / '+record.minElevation).toBe(record.passes.length);
    for(let i=0;i<record.passes.length;i++){
      const actual=forecast.passes[i],expected=record.passes[i];windows++;
      const boundary=Math.max(Math.abs(actual.start-expected.start),Math.abs(actual.end-expected.end))/1000;
      const peak=Math.abs(actual.peak-expected.peak)/1000,elevation=Math.abs(actual.maxElevation-expected.maxElevation);
      worstBoundary=Math.max(worstBoundary,boundary);worstPeak=Math.max(worstPeak,peak);worstElevation=Math.max(worstElevation,elevation);
      // A solar threshold shifted by ~2 s can change a rising segment's maximum by ~0.4°.
      // This window tolerance differs from the fixed-instant look-angle reference test.
      expect.soft(boundary).toBeLessThan(3);expect.soft(peak).toBeLessThan(6);expect.soft(elevation).toBeLessThan(.5);
    }
  }
  expect(windows).toBeGreaterThan(0);
  console.log(JSON.stringify({independentCases:reference.records.length,windows,worstBoundarySeconds:worstBoundary,worstPeakSeconds:worstPeak,worstElevationDegrees:worstElevation}));
},15000);
