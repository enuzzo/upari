import {expect,it} from 'vitest';
import {CameraSnapshot} from './camera-snapshot';
import {initialCamera} from './scene';
it('reads the live camera on demand and releases the native viewer after unmount',()=>{
 let calls=0,live={...initialCamera};const cache=new CameraSnapshot(initialCamera,()=>{calls++;return live;});
 expect(calls).toBe(0);live={...live,longitude:42};expect(cache.read().longitude).toBe(42);expect(calls).toBe(1);
 live={...live,height:12000};cache.release();expect(calls).toBe(2);
 live={...live,height:17000000};expect(cache.read().height).toBe(12000);expect(calls).toBe(2);
});
it('retains a valid snapshot if the renderer becomes unavailable and isolates old readers from imports',()=>{
 let available=true;const old=new CameraSnapshot(initialCamera,()=>available?{...initialCamera,longitude:7}:null);
 expect(old.read().longitude).toBe(7);available=false;old.release();
 const imported={...initialCamera,longitude:88};const next=new CameraSnapshot(imported,()=>null);
 expect(old.read().longitude).toBe(7);expect(next.read()).toEqual(imported);
});
