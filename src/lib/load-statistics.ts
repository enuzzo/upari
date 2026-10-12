import {validateBoundaries,validateStatisticsBundle,type Statistics,type Boundaries,type Indicator} from './statistics';
async function localJSON(path:string,signal:AbortSignal){const response=await fetch(path,{signal});if(!response.ok)throw new Error('Pacchetto locale non disponibile: '+path);const text=await response.text();if(text.length>8*1024*1024)throw new Error('Pacchetto oltre 8 MiB.');return JSON.parse(text);}
export async function loadIncludedStatistics(signal:AbortSignal):Promise<{data:Statistics;boundaries:Boundaries}>{
 const [world,geometry,asylum,renewables]=await Promise.all([localJSON('/statistics/world.json',signal),localJSON('/statistics/countries.geojson',signal),localJSON('/statistics/asylum.json',signal),localJSON('/statistics/renewables.json',signal)]);
 const extra=asylum as {indicator:Indicator;values:Statistics['values'][string];relations:NonNullable<Statistics['flows']>['relations'];origins:string[];selectionRows:number;provenance:unknown[]};
 const data={...world,retrievedAt:renewables.retrievedAt,indicators:[...world.indicators,extra.indicator,renewables.indicator],values:{...world.values,[extra.indicator.id]:extra.values,[renewables.indicator.id]:renewables.values},flows:{indicator:extra.indicator.id,relations:extra.relations,origins:extra.origins,selectionRows:extra.selectionRows},provenance:[...world.provenance,...extra.provenance,...renewables.provenance]};
 return validateStatisticsBundle({data,boundaries:geometry});
}

export async function loadIncludedBoundaries(signal:AbortSignal){return validateBoundaries(await localJSON('/statistics/countries.geojson',signal));}
