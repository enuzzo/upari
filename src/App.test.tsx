import { afterEach,it,expect,vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import App from './App';
afterEach(()=>vi.unstubAllGlobals());
it('makes Earth the primary screen without permanent ISS/AR/alert panels',()=>{
  vi.stubGlobal('location',{search:''});vi.stubGlobal('navigator',{onLine:true});
  const html=renderToString(<App/>);
  expect(html).toContain('Salvaschermo');expect(html).toContain('Fotografia satellitare');expect(html).toContain('Strumenti');
  expect(html).not.toContain('Apri cielo AR');expect(html).not.toContain('Il prossimo passaggio');expect(html).not.toContain('>Avvisi<');
});
