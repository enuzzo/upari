import {expect,it} from 'vitest';
import {advect,sampleVector,validateField,type VectorField} from './vectors';
const field:VectorField={version:1,kind:'wind',source:'Test numerical fixture',sourceURL:'https://noaa.gov/',time:'2026-10-11T00:00:00Z',period:'Test',nativeResolution:'1°',sampleResolution:1,level:'10 m',latitudes:[0,1,2],longitudes:[0,1,2],u:Array(9).fill(10),v:Array(9).fill(0)};
it('advects in m/s using local Earth radii and keeps missing cells empty',()=>{
  const p=advect(field,.5,.5,1000)!;expect(p.latitude).toBeCloseTo(.5,6);expect(p.longitude-.5).toBeCloseTo(10000/(6378137*Math.cos(.5*Math.PI/180))*180/Math.PI,5);
  expect(sampleVector({...field,u:[null,...field.u.slice(1)]},.5,.5)).toBe(null);expect(advect(field,.5,85,1000)).toBe(null);
});
it('wraps the antimeridian only for a global periodic grid, rejects oversized or secret source URLs',()=>{
  const global={...field,longitudes:[-180,-60,60],sampleResolution:120};expect(sampleVector(global,179,.5)?.u).toBe(10);expect(sampleVector(field,-100,.5)).toBe(null);
  expect(()=>validateField({...field,sourceURL:'https://noaa.gov/?token=secret'})).toThrow();expect(()=>validateField({...field,u:Array(9).fill(Infinity)})).toThrow();
});
