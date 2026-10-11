import { describe,it,expect } from 'vitest';
import { parseWeather,weatherLabel } from './weather';
const now=Date.parse('2026-10-11T16:00:00Z');
const response={current:{time:now/1000,temperature_2m:16.2,apparent_temperature:15.1,wind_speed_10m:8.4,weather_code:2},current_units:{temperature_2m:'°C',wind_speed_10m:'km/h'}};
describe('current weather for an explicitly enabled screensaver',()=>{
  it('uses provider timestamps and documented Celsius/kmh units',()=>{
    const p=parseWeather(response,now);expect(p.time).toBe(now);expect(p.temperature).toBe(16.2);expect(p.wind).toBe(8.4);expect(weatherLabel(p.code)).toBe('Parzialmente nuvoloso');
  });
  it('rejects stale, future, missing and non-finite measurements',()=>{
    for(const patch of [{time:(now-4*3600000)/1000},{time:(now+2*3600000)/1000},{temperature_2m:NaN},{wind_speed_10m:-1},{temperature_2m:undefined}])expect(()=>parseWeather({...response,current:{...response.current,...patch}},now)).toThrow();
  });
  it('rejects unexpected units instead of displaying incorrect numbers',()=>{
    expect(()=>parseWeather({...response,current_units:{temperature_2m:'°F',wind_speed_10m:'mph'}},now)).toThrow();
  });
});
