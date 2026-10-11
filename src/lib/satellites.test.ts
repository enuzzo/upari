import {expect,it} from 'vitest';
import {parseSatelliteFile,validateSatellite,parseOrbitFile} from './orbits';
const tle='VANGUARD 1\n1 00005U 58002B   00179.78495062  .00000023  00000-0  28098-4 0  4753\n2 00005  34.2682 348.7242 1859667 331.7664  19.3264 10.82419157413667';
it('imports a real Vallado reference with its own identity without weakening ISS-only imports',()=>{
  const omm=parseSatelliteFile(tle),now=Date.parse(omm.EPOCH+'');expect(omm.NORAD_CAT_ID).toBe(5);expect(omm.OBJECT_NAME).toBe('VANGUARD 1');expect(validateSatellite(omm,now).source).toContain('File');expect(()=>parseOrbitFile(tle)).toThrow('ISS');expect(()=>validateSatellite(omm,now+8*86400000)).toThrow('7 giorni');
});
it('rejects mixed TLE identities and invalid NORAD catalogue IDs',()=>{expect(()=>parseSatelliteFile(tle.replace('2 00005','2 00006'))).toThrow();const omm=parseSatelliteFile(tle);expect(()=>validateSatellite({...omm,NORAD_CAT_ID:0},Date.parse(omm.EPOCH))).toThrow();});
