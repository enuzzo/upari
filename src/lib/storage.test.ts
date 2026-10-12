import { expect,it } from 'vitest';
import { initialPreferences,validatePreferences,exportBackup } from './storage';
it('whitelists preferences and place fields so imported secrets cannot enter backups',()=>{
  const raw={...initialPreferences,token:'private-token',bridgeToken:'private-bridge',places:[{...initialPreferences.places[0],token:'private-place'}]};
  const serialized=JSON.stringify(validatePreferences(raw));
  expect(serialized).not.toContain('private-');
  expect(validatePreferences(raw).places[0]).toEqual(initialPreferences.places[0]);
});

it('exports the live rotated camera instead of the last settled position and strips extras',async()=>{
 const {initialScene}=await import('./scene');
 const live={...initialScene,camera:{...initialScene.camera,longitude:52.31},rotationEnabled:true,rotationSpeed:.4,token:'private-scene'};
 const backup=JSON.parse(await exportBackup(live));
 expect(backup.scene.camera.longitude).toBe(52.31);expect(backup.scene.rotationSpeed).toBe(.4);
 expect(JSON.stringify(backup)).not.toContain('private-scene');
});
