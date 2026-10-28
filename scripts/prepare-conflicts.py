# Run once by hand: organised violence, from the UCDP Georeferenced Event Dataset (Sundberg and
# Melander 2013; Davies et al. 2026, "Organized violence 1989-2025"), version 26.1, CC BY 4.0,
# and the UCDP Candidate Events of the current year (preliminary, monthly). Writes
# public/statistics/conflicts.json:
#   years   deaths per year 1989-2025 (best estimate), split into state-based conflict,
#           non-state conflict and one-sided violence against civilians, with low and high totals
#   cells   the latest full year on the 0.5° PRIO-GRID: [lon, lat, deaths, main type, events,
#           day of the year of the first event]
#   recent  the candidate events of this year so far (total only, preliminary)
# No names of places, groups or countries: the globe shows where, the text says how it is counted.
#   python scripts/prepare-conflicts.py GEDEvent_v26_1.csv GEDEvent_v26_01_26_09.csv public/statistics
import csv, json, os, sys
from collections import defaultdict
from datetime import date

ged, candidate, out = sys.argv[1], sys.argv[2], sys.argv[3]
csv.field_size_limit(1 << 24)

years = defaultdict(lambda: {'type': [0, 0, 0], 'low': 0, 'high': 0, 'civilians': 0, 'events': 0})
for r in csv.DictReader(open(ged, newline='', encoding='utf-8')):
    y = years[int(r['year'])]
    k = int(r['type_of_violence']) - 1
    y['type'][k] += int(r['best'])
    y['low'] += int(r['low']); y['high'] += int(r['high'])
    y['civilians'] += int(r['deaths_civilians']); y['events'] += 1
last = max(years)

cells = {}
countries = set()
for r in csv.DictReader(open(ged, newline='', encoding='utf-8')):
    if int(r['year']) != last:
        continue
    lat, lon = float(r['latitude']), float(r['longitude'])
    key = (int((lat + 90) // 0.5), int((lon + 180) // 0.5))
    c = cells.setdefault(key, {'deaths': 0, 'type': [0, 0, 0], 'events': 0, 'first': 366})
    k = int(r['type_of_violence']) - 1
    c['deaths'] += int(r['best']); c['type'][k] += int(r['best']) or 1; c['events'] += 1
    c['first'] = min(c['first'], date.fromisoformat(r['date_start'][:10]).timetuple().tm_yday)
    countries.add(r['country_id'])
rows = []
for (i, j), c in cells.items():
    main = max(range(3), key=lambda k: c['type'][k]) + 1
    rows.append([round(-180 + (j + 0.5) * 0.5, 2), round(-90 + (i + 0.5) * 0.5, 2), c['deaths'], main, c['events'], c['first']])
rows.sort(key=lambda x: x[5])

recent = {'events': 0, 'best': 0, 'from': None, 'to': None}
for r in csv.DictReader(open(candidate, newline='', encoding='utf-8')):
    recent['events'] += 1; recent['best'] += int(r['best'])
    d0, d1 = r['date_start'][:10], r['date_end'][:10]
    recent['from'] = min(recent['from'] or d0, d0); recent['to'] = max(recent['to'] or d1, d1)

json.dump({
    'source': 'UCDP GED 26.1 and UCDP Candidate Events 26.01.26.09 · Uppsala Conflict Data Program · CC BY 4.0',
    'types': ['state-based', 'non-state', 'one-sided'],
    'years': {y: {'type': v['type'], 'best': sum(v['type']), 'low': v['low'], 'high': v['high'], 'civilians': v['civilians'], 'events': v['events']} for y, v in sorted(years.items())},
    'latest': last, 'countries': len(countries),
    'fields': ['lon', 'lat', 'deaths', 'type', 'events', 'firstDay'], 'cells': rows,
    'recent': recent,
}, open(os.path.join(out, 'conflicts.json'), 'w'), separators=(',', ':'))
y = years[last]
print(last, sum(y['type']), 'deaths (', y['low'], '-', y['high'], ')', len(rows), 'cells', len(countries), 'countries; this year so far', recent)
