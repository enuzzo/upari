import {expect,it} from 'vitest';
import {FlowMotion} from './flow-motion';
it('has the same forward phase at 30 and 60 fps, independent of study year',()=>{const run=(fps:number)=>{const c=new FlowMotion();for(let i=0;i<=fps*5;i++)c.tick(i*1000/fps,true,false);return c.phase;};expect(run(30)).toBeCloseTo(run(60),8);expect(run(60)).toBeCloseTo(.3,8);});
it('pauses on hidden/reduced/inactive frames without a catch-up jump',()=>{const c=new FlowMotion();c.tick(0,true,false);c.tick(100,true,false);const phase=c.phase;c.tick(10000,true,true);c.tick(20000,true,false);expect(c.phase).toBe(phase);c.tick(20100,false,false);c.tick(30000,true,false);expect(c.phase).toBe(phase);});
