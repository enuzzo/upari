# Run once by hand: the sea turning more acidic, from OceanSODA-ETHZ v2025 (Gregor and Gruber
# 2021, Earth Syst. Sci. Data 13, 777-808; NOAA NCEI accession 0220059, doi:10.25921/m5wx-ja34),
# a monthly 1° reconstruction of the surface ocean carbonate system since 1982, guided by the
# SOCAT observations. Every fourth year (and the last one) becomes a frame of the series
# public/layers/acid-*.jpg: the yearly mean of surface pH on the total scale, 7.94..8.18 → 0..1,
# with the area-weighted global mean of each year in the JSON. The 1° grid is enlarged to 0.5°
# with bilinear smoothing, and the coverage keeps land and ice out.
# Needs netCDF4, numpy and pillow (a venv outside Dropbox).
#   python scripts/prepare-acidification.py OceanSODA_ETHZ-v2025.OCADS.01-1982-2024.nc public/layers
import json, os, sys, warnings
import netCDF4, numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
LO, HI = 7.94, 8.18
d = netCDF4.Dataset(src)
years_all = np.asarray(d['year'][:]).astype(int)
lat = np.asarray(d['lat'][:])
w = np.cos(np.radians(lat))[:, None] * np.ones((1, 360))
last = int(years_all.max())
years = list(range(int(years_all.min()), last, 4)) + [last]
frames = []
for y in years:
    a = np.ma.filled(d['ph_total'][np.where(years_all == y)[0]].astype('f8'), np.nan)
    with warnings.catch_warnings():
        warnings.simplefilter('ignore', RuntimeWarning)  # land cells are empty all year
        m = np.nanmean(a, 0)
    ok = np.isfinite(m)
    mean = float((m * w)[ok].sum() / w[ok].sum())
    # North up: the file's latitudes run south to north.
    img = np.flipud(np.where(ok, np.clip((m - LO) / (HI - LO), 0, 1), 0))
    cov = np.flipud(ok.astype(np.float32))
    # Enlarge values and coverage alike and divide one by the other, so the land's zeros do not
    # darken the coasts.
    v = Image.fromarray((img * 255).astype(np.uint8), 'L').resize((720, 360), Image.BILINEAR)
    c = Image.fromarray((cov * 255).astype(np.uint8), 'L').resize((720, 360), Image.BILINEAR)
    vv, cc = np.asarray(v, np.float32), np.asarray(c, np.float32)
    vv = np.where(cc > 0, vv * 255 / np.maximum(cc, 1), 0)
    name = f'acid-{y}'
    Image.fromarray(np.clip(np.round(vv), 0, 255).astype(np.uint8), 'L').save(os.path.join(out, f'{name}.jpg'), quality=94)
    Image.fromarray(np.where(cc >= 128, 255, 0).astype(np.uint8), 'L').save(os.path.join(out, f'{name}-c.png'), optimize=True)
    frames.append({'file': f'{name}.jpg', 'conf': f'{name}-c.png', 'time': f'{y}-07-01', 'mean': round(mean, 4)})
    print(y, 'global mean pH', round(mean, 4), flush=True)

json.dump({
    'id': 'acid', 'width': 720, 'height': 360, 'cadence': 'year', 'unit': 'pH', 'scale': 'linear', 'min': LO, 'max': HI,
    'dates': [frames[-1]['time']],
    'source': 'OceanSODA-ETHZ v2025 · Gregor and Gruber 2021 · ETH Zürich · NOAA NCEI 0220059',
    'frames': frames,
}, open(os.path.join(out, 'acid.json'), 'w'), indent=1)
