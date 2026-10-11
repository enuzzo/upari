import { describe,it,expect } from 'vitest';
import { preloadTiles } from './imagery-preload';
describe('bounded NASA playback preloading',()=>{
  it('never exceeds eight requests or native source zoom',()=>{
    const tiles=preloadTiles({west:-30,east:60,south:-40,north:70},20,4);
    expect(tiles.length).toBeGreaterThan(0);expect(tiles.length).toBeLessThanOrEqual(8);expect(tiles.every(t=>t.z===4)).toBe(true);
  });
  it('wraps across the date line without repeating tiles',()=>{
    const tiles=preloadTiles({west:170,east:-170,south:-30,north:30},4,8);
    expect(tiles.some(t=>t.x===0)).toBe(true);expect(tiles.some(t=>t.x===15)).toBe(true);
    expect(new Set(tiles.map(t=>`${t.z}/${t.y}/${t.x}`)).size).toBe(tiles.length);
  });
  it('keeps the single level-zero tile unique and clamps polar rows',()=>{
    expect(preloadTiles({west:-180,east:180,south:-90,north:90},0,8)).toEqual([{z:0,x:0,y:0}]);
    const tiles=preloadTiles({west:-40,east:40,south:80,north:90},4,8);
    expect(tiles.every(t=>t.y>=0&&t.y<16&&t.x>=0&&t.x<16)).toBe(true);
  });
});
