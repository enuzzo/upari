import {expect,it} from 'vitest';
import {parseSatelliteFile,validateSatellite} from './orbits';
import {cleanSavedOrbit,cleanSavedSatellites} from './orbit-backup';
import {validateBackup,initialPreferences} from './storage';
import {initialScene} from './scene';
const tle='VANGUARD 1\n1 00005U 58002B   00179.78495062  .00000023  00000-0  28098-4 0  4753\n2 00005  34.2682 348.7242 1859667 331.7664  19.3264 10.82419157413667';
it('preserves an old orbit and its identity without credentials or refreshing the epoch',()=>{
  const omm=parseSatelliteFile(tle),raw=validateSatellite(omm,Date.parse(omm.EPOCH)),clean=cleanSavedOrbit({...raw,token:'secret-one',source:'secret-two',omm:{...omm,token:'secret-three'}});
  expect(JSON.stringify(clean)).not.toContain('secret-');expect(clean.epoch).toBe(raw.epoch);expect(()=>validateSatellite(clean.omm)).toThrow('7 giorni');
  const b=validateBackup({format:'upari-backup',version:2,preferences:{...initialPreferences,satelliteId:5},scene:initialScene,diary:[],satellites:[clean]});expect(b.preferences.satelliteId).toBe(5);
  expect(validateBackup({format:'upari-backup',version:2,preferences:{...initialPreferences,satelliteId:5},scene:initialScene,diary:[]}).preferences.satelliteId).toBe(25544);
});
it('rejects duplicate saved orbits and malformed ephemerides before an import transaction',()=>{
  const omm=parseSatelliteFile(tle),raw=validateSatellite(omm,Date.parse(omm.EPOCH));expect(()=>cleanSavedSatellites([raw,raw])).toThrow('duplicati');expect(()=>cleanSavedOrbit({omm:{...omm,EPOCH:'invalid'}})).toThrow();
  expect(()=>cleanSavedOrbit({omm:{OBJECT_NAME:'ISS',EPOCH:omm.EPOCH,NORAD_CAT_ID:25544,MEAN_MOTION:15.5}})).toThrow('obbligatorio');
  expect(()=>cleanSavedOrbit({omm:{...omm,BSTAR:null}})).toThrow('obbligatorio');
});
