import { afterEach,expect,it,vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Screensaver from './Screensaver';
import { initialScene,saverURL } from './lib/scene';
import { initialPreferences } from './lib/storage';
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
it('keeps two digits in the seconds even at the start of a minute',()=>{
  vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-11T16:00:04Z'));
  const url=saverURL({version:1,scene:initialScene,place:initialPreferences.places[0],showClock:true,showWeather:false,rotationSpeed:.2});
  vi.stubGlobal('location',{hash:new URL(url,'https://upari.example').hash});
  vi.stubGlobal('document',{fullscreenElement:null,documentElement:{requestFullscreen:undefined}});
  expect(renderToStaticMarkup(<Screensaver/>)).toMatch(/<span>04<\/span>/);
});
