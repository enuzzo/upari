import {afterEach,expect,it,vi} from 'vitest';
vi.mock('cesium',()=>({Cartesian2:class{constructor(public x:number,public y:number){}},Ellipsoid:{WGS84:{}},Cartographic:{fromCartesian:(p:unknown)=>p},Math:{toDegrees:(v:number)=>v}}));
import {countryHover,type CountryHover} from './country-hover';
import type {Boundaries} from './statistics';
import type {Viewer} from 'cesium';
const boundaries={features:[{properties:{id:'test',statCode:'ITA',name:'Italia'},geometry:{type:'Polygon',coordinates:[[[0,0],[10,0],[10,10],[0,10],[0,0]]]}}]} as Boundaries;
afterEach(()=>vi.unstubAllGlobals());
function fixture(){
 const canvas=Object.assign(new EventTarget(),{getBoundingClientRect:()=>({left:0,top:0})}),doc=Object.assign(new EventTarget(),{hidden:false}),win=new EventTarget(),seen:(CountryHover|null)[]=[];
 vi.stubGlobal('document',doc);vi.stubGlobal('window',win);
 const viewer={canvas,isDestroyed:()=>false,camera:{pickEllipsoid:()=>({longitude:5,latitude:5})},scene:{requestRender:vi.fn(),preRender:{addEventListener:()=>vi.fn()}}} as unknown as Viewer;
 const stop=countryHover(viewer,boundaries,v=>seen.push(v));
 const send=(type:string,pointerType='touch',x=5)=>canvas.dispatchEvent(Object.assign(new Event(type),{pointerType,clientX:x,clientY:5}));
 return{seen,send,doc,win,stop};
}
it('keeps a touch tap through synthetic leave, but dismisses on new drag/cancel/background',()=>{
 const f=fixture();f.send('pointerdown');f.send('pointerup');f.send('pointerleave');expect(f.seen.at(-1)?.name).toBe('Italia');
 f.send('pointerdown');f.send('pointerup','touch',30);f.send('pointerleave');expect(f.seen.at(-1)).toBeNull();
 f.send('pointerdown');f.send('pointerup');f.send('pointercancel');expect(f.seen.at(-1)).toBeNull();
 f.send('pointerdown');f.send('pointerup');f.doc.hidden=true;f.doc.dispatchEvent(new Event('visibilitychange'));expect(f.seen.at(-1)).toBeNull();f.stop();
});
it('clears mouse leave and blur and removes listeners on teardown',()=>{
 const f=fixture();f.send('pointermove','mouse');expect(f.seen.at(-1)?.name).toBe('Italia');f.send('pointerleave','mouse');expect(f.seen.at(-1)).toBeNull();
 f.send('pointerdown');f.send('pointerup');f.win.dispatchEvent(new Event('blur'));expect(f.seen.at(-1)).toBeNull();f.stop();const count=f.seen.length;f.send('pointerdown');f.send('pointerup');expect(f.seen).toHaveLength(count);
});
