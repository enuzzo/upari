import { it,expect } from 'vitest';
import { json2satrec,type OMMJsonObject } from 'satellite.js';
import snapshot from '../../public/iss-live.json';
import reference from '../../docs/skyfield-reference.json';
import { skyPoint } from './orbits';
it('matches nine independent Skyfield/JPL samples across hemispheres',()=>{
  const rec=json2satrec(snapshot[0] as OMMJsonObject);let worstLook=0,worstSun=0,worstGeo=0;
  const angleDifference=(a:number,b:number)=>Math.abs(((a-b+540)%360)-180);
  for(const q of reference.records){const p=skyPoint(rec,Date.parse(q.date),q.place)!;expect(p).not.toBeNull();
    worstLook=Math.max(worstLook,angleDifference(p.azimuth,q.azimuth),Math.abs(p.elevation-q.elevation));worstSun=Math.max(worstSun,Math.abs(p.sunElevation-q.sunElevation));worstGeo=Math.max(worstGeo,Math.abs(p.latitude-q.latitude),angleDifference(p.longitude,q.longitude));
    expect(angleDifference(p.azimuth,q.azimuth)).toBeLessThan(.1);expect(Math.abs(p.elevation-q.elevation)).toBeLessThan(.1);expect(Math.abs(p.sunElevation-q.sunElevation)).toBeLessThan(.15);expect(Math.abs(p.latitude-q.latitude)).toBeLessThan(.05);expect(angleDifference(p.longitude,q.longitude)).toBeLessThan(.05);expect(Math.abs(p.altitude-q.altitude)).toBeLessThan(.3);expect(p.sunlit).toBe(q.sunlit);
  }
  console.log(JSON.stringify({independentSamples:reference.records.length,worstLookDegrees:worstLook,worstSunDegrees:worstSun,worstGeographicDegrees:worstGeo}));
});
