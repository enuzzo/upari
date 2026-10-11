import { expect,it } from 'vitest';
import { initialPreferences,validatePreferences } from './storage';
it('whitelists preferences and place fields so imported secrets cannot enter backups',()=>{
  const raw={...initialPreferences,token:'private-token',bridgeToken:'private-bridge',places:[{...initialPreferences.places[0],token:'private-place'}]};
  const serialized=JSON.stringify(validatePreferences(raw));
  expect(serialized).not.toContain('private-');
  expect(validatePreferences(raw).places[0]).toEqual(initialPreferences.places[0]);
});
