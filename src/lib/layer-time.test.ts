import {expect,it} from 'vitest';
import {initialLayers,regionalLayer} from './layers';
import {dataDateLabel} from './layer-time';
it('always names effective dates, distinguishes annual mosaics and does not fabricate a regional year',()=>{
  const ocean=initialLayers.find(l=>l.key==='ocean')!;
  expect(dataDateLabel(ocean,'2026-10-09')).toBe('Dati del 09/10/2026');expect(dataDateLabel(ocean,'2026-10-09','2026-10-08')).toContain('destra 08/10/2026');
  expect(dataDateLabel(initialLayers[0],'2016-01-01')).toBe('Composito 2016');expect(dataDateLabel(regionalLayer,'current')).toContain('anni diversi');
});
