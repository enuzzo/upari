import {expect,it} from 'vitest';
import {FrameSample} from './frame-sample';
it('measures actual rendered frames separately from submission cost, and stops at its bound',()=>{
 const p=new FrameSample(3);p.begin(0);expect(p.frame(4)).toBeUndefined();
 p.begin(16);p.frame(20);p.begin(32);p.frame(36);p.begin(64);const s=p.frame(68)!;
 expect(s.frames).toBe(3);expect(s.intervalMs).toEqual({mean:64/3,p95:32,max:32});expect(s.cpuMs.mean).toBe(4);
 p.begin(1000);expect(p.frame(1200)).toBeUndefined();
});
it('discards background or warmup time after reset and requires a frame start',()=>{
 const p=new FrameSample(1);expect(p.frame(1000)).toBeUndefined();p.begin(1000);p.frame(1004);p.reset();
 p.begin(100000);p.frame(100004);p.begin(100016);expect(p.frame(100020)!.fps).toBe(62.5);
});
