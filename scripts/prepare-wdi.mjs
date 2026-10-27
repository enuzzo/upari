// Three more indicators for Le persone, by country and year, in the shape of the atlas
// snapshots (statistics/<id>.json: values[ISO3] = one value per year of world.json, or null):
//   migrants  — international migrant stock, % of population (World Bank WDI SM.POP.TOTL.ZS,
//               from UN DESA; measured every five years, then 2024), CC BY 4.0
//   co2       — CO2 emissions per person, t (WDI EN.GHG.CO2.PC.CE.AR5, from EDGAR), CC BY 4.0
//   refugees  — refugees and others in need of international protection originating from each
//               country, per 1,000 of its inhabitants (UNHCR Refugee Data Finder, CC BY 4.0,
//               divided by the WDI population already in world.json)
// Run by hand when the sources publish a new year: node scripts/prepare-wdi.mjs
import { readFileSync, writeFileSync, renameSync } from 'node:fs';

const DIR = new URL('../public/statistics/', import.meta.url).pathname;
const world = JSON.parse(readFileSync(DIR + 'world.json', 'utf8'));
const years = world.years;
const codes = new Set(world.countries.map((c) => c.id));
const UA = { 'User-Agent': 'Upari/1.2 (+https://upari.earth)' };
const json = async (url) => { const r = await fetch(url, { headers: UA }); if (!r.ok) throw new Error(`${r.status} ${url}`); return r.json(); };
const write = (id, obj) => { writeFileSync(`${DIR}${id}.json.part`, JSON.stringify(obj)); renameSync(`${DIR}${id}.json.part`, `${DIR}${id}.json`); };
const empty = () => Object.fromEntries([...codes].map((c) => [c, years.map(() => null)]));
const r3 = (x) => Math.round(x * 1000) / 1000;

async function wdi(indicator) {
  const [meta, rows] = await json(`https://api.worldbank.org/v2/country/all/indicator/${indicator}?format=json&per_page=30000&date=${years[0]}:${years.at(-1)}`);
  if (!rows?.length) throw new Error(`${indicator}: no rows`);
  const values = empty();
  let n = 0;
  for (const r of rows) {
    const k = years.indexOf(Number(r.date));
    if (r.value == null || k < 0 || !codes.has(r.countryiso3code)) continue;
    values[r.countryiso3code][k] = r3(r.value); n++;
  }
  console.log(`${indicator}: ${n} values, updated ${meta.lastupdated}`);
  return { values, updated: meta.lastupdated };
}

for (const [id, indicator, note] of [
  ['migrants', 'SM.POP.TOTL.ZS', 'International migrant stock (% of population), UN DESA via World Bank WDI'],
  ['co2', 'EN.GHG.CO2.PC.CE.AR5', 'CO2 emissions excluding LULUCF per capita (t CO2e), EDGAR via World Bank WDI'],
]) {
  const { values, updated } = await wdi(indicator);
  write(id, { indicator, values, retrievedAt: new Date().toISOString(), provenance: { source: note, updated, licence: 'CC BY 4.0' } });
}

// UNHCR: one row per country of origin and year.
const d = await json(`https://api.unhcr.org/population/v1/population/?limit=20000&yearFrom=1990&yearTo=${years.at(-1)}&coo_all=true&cf_type=ISO`);
const pop = world.values.population;
const values = empty();
let n = 0;
for (const row of d.items ?? []) {
  const k = years.indexOf(row.year), c = row.coo_iso;
  const people = (Number(row.refugees) || 0) + (Number(row.oip) || 0);
  const p = pop[c]?.[k];
  if (k < 0 || !codes.has(c) || !p) continue;
  values[c][k] = r3((people / p) * 1000); n++;
}
console.log(`refugees: ${n} values`);
write('refugees', {
  indicator: 'UNHCR refugees + other people in need of international protection, by origin, per 1,000 inhabitants',
  values, retrievedAt: new Date().toISOString(),
  provenance: { source: 'UNHCR Refugee Data Finder (population API), divided by World Bank WDI population', licence: 'CC BY 4.0' },
});
