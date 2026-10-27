// Asylum applications from every origin to every country, 2000 to the latest year (UNHCR
// Refugee Data Finder, CC BY 4.0): new individual applications, all procedures. For the globe
// only the largest routes are kept, the 30 largest of each year (their union over the years),
// each with its values for every year. Each origin carries its World Bank region, for colour.
// Run by hand once a year: node scripts/prepare-asylum.mjs
import { readFileSync, writeFileSync, renameSync } from 'node:fs';

const DIR = new URL('../public/statistics/', import.meta.url).pathname;
const world = JSON.parse(readFileSync(DIR + 'world.json', 'utf8'));
const years = world.years;
const codes = new Set(world.countries.map((c) => c.id));
const UA = { 'User-Agent': 'Upari/1.2 (+https://upari.earth)' };
const json = async (url) => { const r = await fetch(url, { headers: UA }); if (!r.ok) throw new Error(`${r.status} ${url}`); return r.json(); };

const per = new Map(); // "ORG>DST" → values per year
for (let y = 2000; y <= years.at(-1); y++) {
  const d = await json(`https://api.unhcr.org/population/v1/asylum-applications/?limit=20000&yearFrom=${y}&yearTo=${y}&coo_all=true&coa_all=true&cf_type=ISO`);
  let n = 0;
  for (const r of d.items ?? []) {
    if (r.app_type !== 'N' || !codes.has(r.coo_iso) || !codes.has(r.coa_iso) || r.coo_iso === r.coa_iso) continue;
    const v = Number(r.applied) || 0;
    if (!v) continue;
    const key = `${r.coo_iso}>${r.coa_iso}`;
    const row = per.get(key) ?? years.map(() => null);
    row[years.indexOf(y)] = (row[years.indexOf(y)] ?? 0) + v;
    per.set(key, row);
    n++;
  }
  console.log(`${y}: ${n} rows`);
}

// The 30 largest routes of each year.
const keep = new Set();
years.forEach((_, k) => {
  [...per.entries()].filter(([, v]) => v[k]).sort((a, b) => b[1][k] - a[1][k]).slice(0, 30).forEach(([key]) => keep.add(key));
});
const relations = [...keep].map((key) => { const [origin, destination] = key.split('>'); return { origin, destination, values: per.get(key) }; });

// World Bank regions of the origins.
const [, meta] = await json('https://api.worldbank.org/v2/country?format=json&per_page=400');
const REGIONS = ['SSF', 'MEA', 'ECS', 'LCN', 'EAS', 'SAS', 'NAC'];
const region = {};
for (const c of meta) if (codes.has(c.id) && REGIONS.includes(c.region?.id)) region[c.id] = REGIONS.indexOf(c.region.id);

const out = { version: 1, retrievedAt: new Date().toISOString(), years, regions: REGIONS, region, relations,
  provenance: { source: 'UNHCR Refugee Data Finder, asylum applications (new, all procedures); World Bank country regions', licence: 'CC BY 4.0', kept: '30 largest routes of each year' } };
writeFileSync(DIR + 'asylum-all.json.part', JSON.stringify(out));
renameSync(DIR + 'asylum-all.json.part', DIR + 'asylum-all.json');
console.log(`asylum-all: ${relations.length} routes`);
