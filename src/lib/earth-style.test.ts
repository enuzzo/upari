import {expect,it} from 'vitest';
import {spaceBlend,naturalGradeAllowed} from './earth-style';
import type {SceneState} from '../types';
import {validateScene,initialScene,saverURL,decodeSaver} from './scene';
import {initialPreferences,validateBackup} from './storage';
it('migrates all artistic legacy scenes, links and backups to Natural without changing lighting',()=>{
 const legacy=validateScene({layerKey:'satellite',lighting:false});expect(legacy.visualStyle).toBe('natural');expect(legacy.lighting).toBe(false);
 expect(validateScene({...initialScene,visualStyle:'remote-shader',visualStrength:3}).visualStyle).toBe('natural');
 expect(validateScene({...initialScene,visualStyle:'ascii',visualStrength:3}).visualStrength).toBe(1);
 const scene={...initialScene,visualStyle:'voxel' as const,visualStrength:.72} as unknown as SceneState;
 const expected={...scene,visualStyle:'natural',visualStrength:1};
 const clean=validateBackup({format:'upari-backup',version:2,preferences:initialPreferences,scene});expect(clean.scene).toEqual(expected);
 expect(decodeSaver(new URL(saverURL({version:1,scene,place:initialPreferences.places[0],showClock:true,showWeather:false,rotationSpeed:.2}),'https://example.test').hash).scene).toEqual(expected);
});
it('blends orbital imagery continuously and keeps native aerial photography close up',()=>{
 expect(spaceBlend(200)).toBe(0);expect(spaceBlend(1200000)).toBe(0);expect(spaceBlend(8000000)).toBe(1);
 for(let h=1200000;h<8000000;h+=500000){expect(spaceBlend(h+1)).toBeGreaterThanOrEqual(spaceBlend(h));expect(spaceBlend(h+1)-spaceBlend(h)).toBeLessThan(.000001);}
});

it('preserves scientific palettes while photographs load, crossfade or fail',()=>{
 const science={regional:false},photo={regional:true};
 expect(naturalGradeAllowed(photo,science)).toBe(false); // Retained old raster during loading/failure.
 expect(naturalGradeAllowed(science,photo)).toBe(false); // Incoming raster during crossfade.
 expect(naturalGradeAllowed(photo,photo)).toBe(true);
 expect(naturalGradeAllowed(null,null)).toBe(true);
 expect(naturalGradeAllowed(science,null)).toBe(false);
});
