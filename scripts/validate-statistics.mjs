import {readFile} from 'node:fs/promises';
import {validateStatistics,validateBoundaries} from '../src/lib/statistics.ts';
const input=JSON.parse(await readFile(process.argv[2],'utf8'));
const data=validateStatistics(input.data),geometry=validateBoundaries(input.boundaries);
const ids=new Set(data.countries.map(r=>r.id));
for(const f of geometry.features)if(f.properties.statCode!==null&&!ids.has(f.properties.statCode))throw new Error('Unknown region in geometry: '+f.properties.statCode);
console.log(JSON.stringify({indicators:data.indicators.length,regions:data.countries.length,features:geometry.features.length,years:[data.years[0],data.years.at(-1)]}));
