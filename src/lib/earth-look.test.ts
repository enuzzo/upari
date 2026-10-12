import {expect,it} from 'vitest';
import {altitudeBlend,atmosphereBlend,ZoomBlend} from './earth-look';
import {spaceBlend} from './earth-style';

it('spreads imagery travel evenly through zoom ratios and preserves aerial detail',()=>{
  expect(spaceBlend(12000)).toBe(0);expect(spaceBlend(1200000)).toBe(0);expect(spaceBlend(8000000)).toBe(1);
  expect(spaceBlend(Math.sqrt(1200000*8000000))).toBeCloseTo(.5);
  for(let h=1200000;h<8000000;h*=1.08){expect(spaceBlend(h*1.001)).toBeGreaterThanOrEqual(spaceBlend(h));expect(spaceBlend(h*1.001)-spaceBlend(h)).toBeLessThan(.0011);}
  for(const end of [1200000,8000000])expect(Math.abs(spaceBlend(end+10)-spaceBlend(end-10))).toBeLessThan(1e-10);
  expect(altitudeBlend(-100,1200000,8000000)).toBe(0);
});

it('keeps atmosphere out of close-up imagery while retaining a regional horizon',()=>{
  expect(atmosphereBlend(12000)).toBe(0);expect(atmosphereBlend(120000)).toBe(0);
  expect(atmosphereBlend(800000)).toBeGreaterThan(.5);expect(spaceBlend(800000)).toBe(0);
  expect(atmosphereBlend(3200000)).toBe(1);
});

it('holds unloaded aerial tiles, resumes smoothly and reaches the same blend at 30/60 fps',()=>{
  const blend=new ZoomBlend(0);blend.tick(1,0,false);blend.tick(1,1000,false);expect(blend.value).toBe(0);
  expect(blend.tick(1,1016,true)).toBe(true);expect(blend.value).toBeGreaterThan(0);expect(blend.value).toBeLessThan(.2);
  const run=(fps:number)=>{const b=new ZoomBlend(0);b.tick(1,0,true);for(let i=1;i<=fps;i++)b.tick(1,i*1000/fps,true);return b.value;};
  expect(run(30)).toBe(1);expect(run(60)).toBe(1);
  expect(blend.tick(0,1032,false)).toBe(true);expect(blend.value).toBeLessThan(.15); // Zoom out never waits on aerial tiles.
  blend.suspend();const prior=blend.value;blend.tick(1,100000,true);expect(blend.value).toBe(prior);
  blend.tick(1,100016,true,true);expect(blend.value).toBe(1);
});
