import { describe,it,expect } from 'vitest';
import { renderProfile,frameRateLimit } from './render-quality';
describe('render budget with native Cesium DPR enabled',()=>{
  it('renders a triple-density phone at two pixels per CSS pixel in automatic mode',()=>{
    const p=renderProfile(390,720,3,'auto');
    expect(p.effectiveRatio).toBe(2);expect(p.resolutionScale*3).toBe(2);expect(p.resolutionScale).toBeGreaterThan(.5);
  });
  it('limits a retina desktop framebuffer without lowering it below CSS resolution',()=>{
    const p=renderProfile(1920,1080,2,'auto');expect(p.effectiveRatio).toBeGreaterThan(1);expect(1920*1080*p.effectiveRatio**2).toBeCloseTo(3000000);
    expect(renderProfile(3840,2160,2,'auto').effectiveRatio).toBe(1);
  });
  it('keeps the two explicit quality modes distinct',()=>{
    const high=renderProfile(390,720,3,'high'),battery=renderProfile(390,720,3,'battery');
    expect(high.effectiveRatio).toBe(3);expect(battery.effectiveRatio).toBe(1);expect(high.msaaSamples).toBe(4);expect(battery.msaaSamples).toBe(1);expect(high.screenSpaceError).toBeLessThan(battery.screenSpaceError);
  });
  it('handles browser zoom, very high DPR and invalid DPR without exceeding the intended ratio',()=>{
    expect(renderProfile(500,500,.8,'auto').resolutionScale).toBe(1);
    const p=renderProfile(500,500,6,'high');expect(p.resolutionScale*6).toBe(3);
    expect(renderProfile(500,500,NaN,'auto').resolutionScale).toBe(1);
  });
  it('gives 60 Hz scheduling a small margin while retaining sharpness and low-power caps',()=>{
    expect(frameRateLimit('auto',false)).toBeGreaterThan(60);expect(frameRateLimit('auto',false)).toBeLessThan(62);expect(frameRateLimit('high',false)).toBe(61);
    expect(frameRateLimit('battery',false)).toBe(30);expect(frameRateLimit('auto',true)).toBe(30);
    const p=renderProfile(1701,1191,2,'auto');
    expect(1701*1191*p.effectiveRatio**2).toBeCloseTo(3000000);expect(p.msaaSamples).toBe(4);expect(p.screenSpaceError).toBe(1.5);
  });
});
