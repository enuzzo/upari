import {expect,it} from 'vitest';
import {ImageryBuffer,transitionOpacity} from './imagery-buffer';
it('keeps the previous frame until ready, uses at most three frames and releases cancelled ones',()=>{
  const alive=new Set<string>(),shown:string[]=[];const b=new ImageryBuffer<string>({create:s=>{alive.add(s.key);return s.key;},remove:s=>{alive.delete(s);},opacity:()=>{},shown:s=>shown.push(s.key),error:()=>{}});
  b.request({key:'a',date:'a'});b.tick(16,true);expect(shown).toEqual([]);b.tick(16,true);expect(b.displaying?.key).toBe('a');
  b.preload({key:'b',date:'b'});b.tick(16,true);b.tick(16,true);b.request({key:'b',date:'b'});b.tick(16,false);expect(b.displaying?.key).toBe('a');
  for(let i=0;i<25;i++)b.tick(16,true);expect(b.displaying?.key).toBe('b');expect(alive).toEqual(new Set(['b']));
  b.request({key:'c',date:'c'});b.request({key:'d',date:'d'});expect(alive.has('c')).toBe(false);expect(b.size).toBeLessThanOrEqual(3);b.clear();expect(alive.size).toBe(0);
});
it('failed replacement preserves actual date; background does not advance a transition',()=>{
  let errors=0;const b=new ImageryBuffer<string>({create:s=>s.key,remove:()=>{},opacity:()=>{},shown:()=>{},error:()=>errors++});b.request({key:'a',date:'a'});b.tick(16,true);b.tick(16,true);b.request({key:'b',date:'b'});b.tick(1000,true,true);expect(b.displaying?.key).toBe('a');b.fail('b');expect(b.busy).toBe(false);expect(b.displaying?.date).toBe('a');expect(errors).toBe(1);
});
it('source-over transition preserves total opacity instead of flashing the photographic base',()=>{
  for(const opacity of [.3,.7,1])for(const t of [0,.25,.5,.75,1]){const {top,bottom}=transitionOpacity(opacity,t);expect(top+bottom*(1-top)).toBeCloseTo(opacity,6);}
});
it('returning to photography releases the displayed frame and the preloaded one',()=>{
  const alive=new Set<string>();const b=new ImageryBuffer<string>({create:s=>{alive.add(s.key);return s.key;},remove:s=>{alive.delete(s);},opacity:()=>{},shown:()=>{},error:()=>{}});
  b.request({key:'layer',date:'date'});b.tick(16,true);b.tick(16,true);b.preload({key:'next',date:'next'});b.request(undefined);expect(alive.size).toBe(0);expect(b.displaying).toBeUndefined();
});
