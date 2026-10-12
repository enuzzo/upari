import {expect,it} from 'vitest';
import {RequestGate} from './request-gate';
it('ignores delayed imports after close and after a newer request, including remount',()=>{
 const g=new RequestGate();g.open();const first=g.begin();expect(g.valid(first)).toBe(true);
 const second=g.begin();expect(g.valid(first)).toBe(false);g.close();expect(g.valid(second)).toBe(false);
 g.open();expect(g.valid(second)).toBe(false);expect(g.valid(g.begin())).toBe(true);
});
