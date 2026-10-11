import { afterEach,it,expect } from 'vitest';
import { time,utcDate } from './format';
import { calendar,notificationPlan } from './notifications';
import type { Forecast,Pass } from '../types';
import { initialPreferences } from './storage';
const previousZone=process.env.TZ;
afterEach(()=>{if(previousZone===undefined)delete process.env.TZ;else process.env.TZ=previousZone;});
it('keeps UTC instants distinct when Rome repeats 02:30 in autumn',()=>{
  process.env.TZ='Europe/Rome';
  const first=Date.parse('2026-10-25T00:30:00Z'),second=Date.parse('2026-10-25T01:30:00Z');
  expect(time(first)).toBe('02:30');expect(time(second)).toBe('02:30');
  const passes=[first,second].map((start,i)=>({id:'dst-'+i,start,end:start+60000,startAzimuth:90,maxElevation:20}) as Pass);
  const forecast={satelliteId:25544,epoch:new Date(first-3600000).toISOString(),expires:second+3600000,passes} as Forecast;
  const plan=notificationPlan(forecast,{...initialPreferences,quietFrom:0,quietUntil:0,maxDaily:2},first-3600000);
  expect(plan.map(p=>p.at)).toEqual([first-600000,second-600000]);
  expect(calendar(passes[0])).toContain('DTSTART:20261025T003000Z');
  expect(calendar(passes[1])).toContain('DTSTART:20261025T013000Z');
});
it('skips the nonexistent spring hour without shifting imagery dates',()=>{
  process.env.TZ='Europe/Rome';
  expect(time(Date.parse('2026-03-29T00:59:00Z'))).toBe('01:59');
  expect(time(Date.parse('2026-03-29T01:00:00Z'))).toBe('03:00');
  expect(utcDate(Date.parse('2026-03-28T23:30:00Z'))).toBe('2026-03-28');
});
