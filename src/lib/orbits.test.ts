import { describe,it,expect } from 'vitest';
import { sgp4,twoline2satrec,json2satrec, type OMMJsonObject } from 'satellite.js';
import { calculateForecast,eligible,fullySunlit,solarECI,validateOrbit,skyPoint } from './orbits';
import snapshot from '../../public/iss-live.json';
const now=Date.parse('2026-10-11T16:00:00Z');
const input=snapshot[0] as OMMJsonObject;
const orbit=validateOrbit(input,now),place={id:'new-york',name:'New York',latitude:40.7,longitude:-74,height:0};
describe('SGP4 and observable intervals',()=>{
  it('matches the published Vallado Vanguard reference at epoch',()=>{
    const r=twoline2satrec('1 00005U 58002B   00179.78495062  .00000023  00000-0  28098-4 0  4753','2 00005  34.2682 348.7242 1859667 331.7664  19.3264 10.82419157413667');
    const p=sgp4(r,0)!;expect(p.position.x).toBeCloseTo(7022.46529266,5);expect(p.position.y).toBeCloseTo(-1400.08296755,5);expect(p.position.z).toBeCloseTo(.03995155,5);expect(p.velocity.x).toBeCloseTo(1.893841015,7);
  });
  it('rejects stale, wrong-satellite and future records',()=>{expect(()=>validateOrbit(input,now+8*86400000)).toThrow(/7 giorni/);expect(()=>validateOrbit({...input,NORAD_CAT_ID:1},now)).toThrow();expect(()=>validateOrbit({...input,EPOCH:'2030-01-01T00:00:00'},now)).toThrow();});
  it('distinguishes shadow, solar side and limb',()=>{const sun={x:149597870,y:0,z:0};expect(fullySunlit({x:-6800,y:0,z:0},sun)).toBe(false);expect(fullySunlit({x:6800,y:0,z:0},sun)).toBe(true);expect(fullySunlit({x:-1000,y:6800,z:0},sun)).toBe(true);});
  it('gets the correct equinox/solstice solar declination',()=>{const a=solarECI(Date.parse('2026-06-21T12:00:00Z'));expect(Math.asin(a.z/Math.hypot(a.x,a.y,a.z))*180/Math.PI).toBeCloseTo(23.44,1);const b=solarECI(Date.parse('2026-03-20T12:00:00Z'));expect(Math.abs(Math.asin(b.z/Math.hypot(b.x,b.y,b.z))*180/Math.PI)).toBeLessThan(.3);});
  it('only returns fully illuminated, dark-sky, above-threshold windows',()=>{const f=calculateForecast(orbit,place,10,now);expect(f.passes.length).toBeGreaterThan(0);const r=json2satrec(orbit.omm);for(const p of f.passes){expect(p.end).toBeGreaterThan(p.start);expect(p.peak).toBeGreaterThanOrEqual(p.start);expect(p.peak).toBeLessThanOrEqual(p.end);for(const q of p.points.slice(1,-1)){expect(q.sunlit).toBe(true);expect(q.sunElevation).toBeLessThanOrEqual(-6+.01);expect(q.elevation).toBeGreaterThanOrEqual(10-.01);}expect(eligible(skyPoint(r,p.start+1000,place),10)).toBe(true);expect(eligible(skyPoint(r,p.end-1000,place),10)).toBe(true);if(p.start>now)expect(eligible(skyPoint(r,p.start-1000,place),10)).toBe(false);expect(eligible(skyPoint(r,p.end+1000,place),10)).toBe(false);}});
});
