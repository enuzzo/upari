# Run once by hand: the Biodiversity Intactness Index of the land, 2017 and 2020, from Impact
# Observatory and Vizzuality on the Microsoft Planetary Computer (io-biodiversity, 100 m,
# CC BY 4.0). Each year's tiles are read from their coarsest overview, averaged into 0.05°
# cells and written as a frame of the series public/layers/bii-*.jpg (0 = nothing of the
# original wildlife left, 1 = intact). The Planetary Computer gives an anonymous read token
# for its public data: no account. Needs rasterio, numpy and pillow (a venv outside Dropbox).
#   python scripts/prepare-bii.py public/layers
import json, os, sys, urllib.request
import numpy as np
import rasterio
from rasterio.enums import Resampling
from PIL import Image


def spread(v, empty, steps=40):
    """Fill empty cells next to land with the mean of their neighbours, up to 40 cells deep, so the
    texture filtering on the globe does not draw a rim of zero around lakes and coasts (the
    coverage mask still hides them)."""
    v, empty = v.copy(), empty.copy()
    for _ in range(steps):
        s = np.zeros_like(v); n = np.zeros_like(v)
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            ok = np.roll(~empty, (dy, dx), (0, 1))
            s += np.roll(v, (dy, dx), (0, 1)) * ok; n += ok
        fill = empty & (n > 0)
        v[fill] = s[fill] / n[fill]
        empty &= ~fill
    return v

out = sys.argv[1]
YEARS = [2017, 2020]
W, H = 7200, 3600          # 0.05° cells
STAC = 'https://planetarycomputer.microsoft.com/api/stac/v1'
get = lambda url, body=None: json.load(urllib.request.urlopen(urllib.request.Request(
    url, data=json.dumps(body).encode() if body else None, headers={'Content-Type': 'application/json', 'User-Agent': 'Upari/1.2 (+https://upari.earth)'})))
token = get(f'{STAC.replace("/stac/v1", "/sas/v1")}/token/io-biodiversity')['token']

frames = []
for year in YEARS:
    items, body = [], {'collections': ['io-biodiversity'], 'datetime': f'{year}-01-01T00:00:00Z/{year}-12-31T23:59:59Z', 'limit': 250}
    page = get(f'{STAC}/search', body)
    while True:
        items += page['features']
        nxt = [l for l in page['links'] if l['rel'] == 'next']
        if not nxt:
            break
        page = get(nxt[0]['href'], nxt[0].get('body')) if nxt[0].get('method') == 'POST' else get(nxt[0]['href'])
    total = np.zeros((H, W), np.float64)
    count = np.zeros((H, W), np.float64)
    for k, it in enumerate(items):
        with rasterio.open(f"/vsicurl/{it['assets']['data']['href']}?{token}") as s:
            b = s.bounds
            h = max(1, round((b.top - b.bottom) / 0.05 * 3))   # three samples per cell
            w = max(1, round((b.right - b.left) / 0.05 * 3))
            a = s.read(1, out_shape=(h, w), resampling=Resampling.average).astype(np.float64)
        lat = b.top - (np.arange(h) + 0.5) * (b.top - b.bottom) / h
        lon = b.left + (np.arange(w) + 0.5) * (b.right - b.left) / w
        rows = np.clip(((90 - lat) / 0.05).astype(int), 0, H - 1)
        cols = np.clip(((lon + 180) / 0.05).astype(int), 0, W - 1)
        rr, cc = np.meshgrid(rows, cols, indexing='ij')
        # Inland water carries tiny values (under 0.07) in the source: left out, like the sea.
        ok = np.isfinite(a) & (a >= 0.07) & (a <= 1)
        np.add.at(total, (rr[ok], cc[ok]), a[ok])
        np.add.at(count, (rr[ok], cc[ok]), 1)
        if k % 50 == 0:
            print(year, k, '/', len(items), flush=True)
    bii = np.where(count > 0, total / np.maximum(count, 1), 0)
    covered = count > 0
    name = f'bii-{year}'
    Image.fromarray(np.round(np.clip(spread(bii, ~covered), 0, 1) * 255).astype(np.uint8), 'L').save(os.path.join(out, f'{name}.jpg'), quality=92)
    conf = Image.fromarray((covered * 255).astype(np.uint8), 'L').resize((W // 8, H // 8), Image.BILINEAR)
    conf.save(os.path.join(out, f'{name}-c.png'), optimize=True)
    # Land-area weighted mean of the cells with a value.
    wts = np.cos(np.radians(90 - (np.arange(H) + 0.5) * 0.05))[:, None] * covered
    mean = float((bii * wts).sum() / wts.sum())
    frames.append({'file': f'{name}.jpg', 'conf': f'{name}-c.png', 'time': f'{year}-07-01', 'mean': round(mean, 4)})
    print(year, len(items), 'tiles, mean', round(mean, 4), flush=True)

json.dump({
    'id': 'bii', 'width': W, 'height': H, 'cadence': 'year', 'unit': '', 'min': 0, 'max': 1,
    'dates': [frames[-1]['time']],
    'source': 'Impact Observatory, Vizzuality · Biodiversity Intactness (io-biodiversity) · Microsoft Planetary Computer · CC BY 4.0',
    'frames': frames,
}, open(os.path.join(out, 'bii.json'), 'w'), indent=1)
