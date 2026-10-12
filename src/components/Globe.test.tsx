import {afterEach,it,expect,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import Globe from './Globe';
import {initialPreferences} from '../lib/storage';
const props={layer:null,date:'',opacity:1,compare:false,compareDate:'',split:.5,place:initialPreferences.places[0],sunOffset:0,lighting:true,quality:'auto' as const};
afterEach(()=>vi.unstubAllGlobals());
it('offers play instead of an active pause button when reduced motion suppresses default rotation',()=>{
 vi.stubGlobal('matchMedia',()=>({matches:true}));
 const html=renderToStaticMarkup(<Globe {...props} autoRotate/>);
 expect(html).toContain('aria-label="Avvia rotazione"');expect(html).not.toContain('aria-label="Ferma rotazione"');
});
it('starts slow rotation by default and exposes the speed in the right toolbar',()=>{
 vi.stubGlobal('matchMedia',()=>({matches:false}));
 const html=renderToStaticMarkup(<Globe {...props}/>);
 expect(html).toContain('aria-label="Ferma rotazione"');expect(html).toContain('Velocità di rotazione: 0,08 gradi al secondo');
});

it('only shows local performance diagnostics with an explicit query opt-in',()=>{
 vi.stubGlobal('matchMedia',()=>({matches:false}));
 vi.stubGlobal('location',{search:''});
 expect(renderToStaticMarkup(<Globe {...props}/>)).not.toContain('Diagnostica locale');
 vi.stubGlobal('location',{search:'?perf=1'});
 const html=renderToStaticMarkup(<Globe {...props}/>);
 expect(html).toContain('Diagnostica locale della fluidità');
 expect(html).toContain('300 fotogrammi');
});
