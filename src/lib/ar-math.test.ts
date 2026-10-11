import { describe,it,expect } from 'vitest';
import { manualPose,projectSky,sensorPose } from './ar-math';
describe('Sky projection',()=>{
  it('centers the target for all cardinal headings and elevations',()=>{for(const a of [0,90,180,270])for(const e of [0,30,80]){const p=projectSky(a,e,manualPose(a,e),390,844);expect(p.x).toBeCloseTo(195,5);expect(p.y).toBeCloseTo(422,5);expect(p.front).toBe(true);}});
  it('places east to the right and high elevation above',()=>{const pose=manualPose(0,0);expect(projectSky(15,0,pose,390,844).x).toBeGreaterThan(195);expect(projectSky(0,15,pose,390,844).y).toBeLessThan(422);expect(projectSky(180,0,pose,390,844).front).toBe(false);});
  it('handles upright portrait, compass yaw and landscape roll',()=>{const p=sensorPose(0,90,0);expect(p.heading).toBeCloseTo(0,5);expect(p.elevation).toBeCloseTo(0,5);const c=sensorPose(0,90,0,0,90);expect(c.heading).toBeCloseTo(90,5);const landscape=sensorPose(0,90,0,90);expect(projectSky(0,0,landscape,844,390).x).toBeCloseTo(422,5);});
});
