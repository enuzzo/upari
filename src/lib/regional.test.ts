import {expect,it} from 'vitest';
import config from './regional-layers.json';
import {regionalLayers} from './regional';
import {dataDateLabel} from './layer-time';
it('keeps source credits, coverage and acquisition wording independently from current edition',()=>{const [l]=regionalLayers(config);expect(l.coverage).toEqual([5.140242,45.398181,11.47757,48.230651]);expect(dataDateLabel(l,'current')).toContain('anni diversi');expect(l.maxLevel).toBe(20);});
it('rejects secret-bearing URLs, duplicate keys and incompatible tile bounds',()=>{for(const patch of [{template:config[0].template+'?token=secret'},{sourceURL:'https://token:secret@example.org/'},{coverage:[0,0,1,90]},{maxLevel:23}])expect(()=>regionalLayers([{...config[0],...patch}])).toThrow();expect(()=>regionalLayers([config[0],config[0]])).toThrow();});
