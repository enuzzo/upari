# Run once by hand: the dams of the world and the year each was built, from Global Dam Watch
# v1.0 (Lehner et al. 2024, Scientific Data 11:1069; Figshare 10.6084/m9.figshare.25988293,
# CC BY 4.0). Writes public/statistics/dams.json: [lon, lat, year, capacity in million m³,
# height in m] for every barrier with a known year (others keep year 0).
#   python scripts/prepare-dams.py GDW_v1_0_shp/GDW_barriers_v1_0.shp public/statistics
import json, os, sys
import shapefile

src, out = sys.argv[1], sys.argv[2]
r = shapefile.Reader(src)
names = [f[0] for f in r.fields[1:]]
ix = {n: i for i, n in enumerate(names)}
rows = []
for sr in r.iterShapeRecords():
    rec, pts = sr.record, sr.shape.points
    if not pts:
        continue
    lon, lat = pts[0]
    year = rec[ix['YEAR_DAM']] if rec[ix['YEAR_DAM']] and rec[ix['YEAR_DAM']] > 0 else 0
    cap = rec[ix['CAP_MCM']] if rec[ix['CAP_MCM']] and rec[ix['CAP_MCM']] > 0 else 0
    hgt = rec[ix['DAM_HGT_M']] if rec[ix['DAM_HGT_M']] and rec[ix['DAM_HGT_M']] > 0 else 0
    rows.append([round(lon, 3), round(lat, 3), int(year), round(float(cap), 1), round(float(hgt))])
rows.sort(key=lambda x: (x[2] or 9999))
json.dump({'count': len(rows), 'fields': ['lon', 'lat', 'year', 'capacityMcm', 'heightM'], 'list': rows,
           'source': 'Global Dam Watch v1.0, Lehner et al. 2024 · CC BY 4.0'}, open(os.path.join(out, 'dams.json'), 'w'), separators=(',', ':'))
known = [x for x in rows if x[2]]
print(len(rows), 'dams,', len(known), 'with a year,', min(x[2] for x in known), '-', max(x[2] for x in known))
