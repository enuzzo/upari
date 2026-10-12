import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {countryIndex,tooltipPosition} from './country-index';
import type {Boundaries} from './statistics';
it('finds real countries and leaves open ocean unlabeled',()=>{const index=countryIndex(JSON.parse(readFileSync('public/statistics/countries.geojson','utf8')));expect(index.find(12,43)?.properties.statCode).toBe('ITA');expect(index.find(2,47)?.properties.statCode).toBe('FRA');expect(index.find(36,35)?.properties.statCode).toBe('SYR');expect(index.find(-30,0)).toBeNull();expect(index.find(0,-85)?.properties.name).toBeTruthy();});
it('handles holes, multipart coastlines and antimeridian without covering the world',()=>{const b:Boundaries={type:'FeatureCollection',features:[{type:'Feature',properties:{id:'seam',statCode:'TST',name:'Seam'},geometry:{type:'Polygon',coordinates:[[[170,-10],[-170,-10],[-170,10],[170,10],[170,-10]],[[175,-2],[-175,-2],[-175,2],[175,2],[175,-2]]]}}]};const index=countryIndex(b);expect(index.find(-179,5)?.properties.name).toBe('Seam');expect(index.find(179,0)).toBeNull();expect(index.find(0,5)).toBeNull();});
it('keeps the tooltip inside small viewports',()=>{const p=tooltipPosition(386,840,390,844);expect(p.x).toBeGreaterThanOrEqual(8);expect(p.x+264).toBeLessThanOrEqual(390);expect(p.y+140).toBeLessThanOrEqual(844);});
