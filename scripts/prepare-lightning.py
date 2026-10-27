# Daily: the lightning of the last half hour over the Americas, the Atlantic and the eastern
# Pacific, seen by the Geostationary Lightning Mappers of GOES-East (GOES-19) and GOES-West
# (GOES-18). NOAA open data on AWS, no account: one file every 20 seconds per satellite. Writes
# public/layers/glm.json: [lon, lat, seconds from the start] for each flash (good quality only),
# thinned evenly to at most 40 000. Needs h5py and numpy.
#   python scripts/prepare-lightning.py public/layers
import io, json, os, re, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
import h5py, numpy as np

out = sys.argv[1]
MINUTES, KEEP = 30, 40_000
UA = {'User-Agent': 'Upari/1.2 (+https://upari.earth)'}
now = datetime.now(timezone.utc)
since = now - timedelta(minutes=MINUTES + 10)  # files appear a few minutes late

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()

def keys(bucket):
    found = []
    for h in sorted({(since + timedelta(hours=k)).strftime('%Y/%j/%H') for k in range(0, 2)}):
        xml = get(f'https://{bucket}.s3.amazonaws.com/?list-type=2&prefix=GLM-L2-LCFA/{h}/').decode()
        found += re.findall(r'<Key>([^<]+)</Key>', xml)
    start = lambda k: datetime.strptime(re.search(r'_s(\d{13})', k).group(1), '%Y%j%H%M%S').replace(tzinfo=timezone.utc)
    files = sorted((start(k), k) for k in found)
    if not files: return []
    newest = files[-1][0]
    return [(t, k) for t, k in files if t > newest - timedelta(minutes=MINUTES)]

rows, t0, t1, sats = [], None, None, []
for bucket, name in (('noaa-goes19', 'GOES-19'), ('noaa-goes18', 'GOES-18')):
    files = keys(bucket)
    if not files: continue
    sats.append(name)
    # Eight downloads at a time: ninety small files per satellite.
    with ThreadPoolExecutor(8) as pool:
        blobs = list(pool.map(lambda tk: get(f'https://{bucket}.s3.amazonaws.com/{tk[1]}'), files))
    for (t, k), blob in zip(files, blobs):
        with h5py.File(io.BytesIO(blob), 'r') as f:
            lat, lon = f['flash_lat'][:], f['flash_lon'][:]
            ok = f['flash_quality_flag'][:] == 0
        t0 = t if t0 is None or t < t0 else t0
        t1 = t if t1 is None or t > t1 else t1
        rows.append((t, lon[ok], lat[ok]))
if not rows: raise SystemExit('glm: no files')
lon = np.concatenate([r[1] for r in rows]); lat = np.concatenate([r[2] for r in rows])
sec = np.concatenate([np.full(len(r[1]), (r[0] - t0).total_seconds()) for r in rows])
total = len(lon)
step = max(1, int(np.ceil(total / KEEP)))
pick = np.argsort(sec, kind='stable')[::step]
data = [[round(float(lon[i]), 2), round(float(lat[i]), 2), int(sec[i])] for i in pick]
json.dump({'id': 'glm', 'fetched': now.isoformat(timespec='seconds'), 'from': t0.isoformat(timespec='seconds'), 'to': t1.isoformat(timespec='seconds'),
           'count': int(total), 'shown': len(data), 'satellites': sats, 'source': 'NOAA GOES-R GLM L2 LCFA · NOAA Open Data Dissemination (AWS)', 'list': data},
          open(os.path.join(out, 'glm.json.part'), 'w'), separators=(',', ':'))
os.replace(os.path.join(out, 'glm.json.part'), os.path.join(out, 'glm.json'))
print(f'glm: {total} flashes from {t0:%H:%M} to {t1:%H:%M} UTC ({", ".join(sats)}), {len(data)} kept')
