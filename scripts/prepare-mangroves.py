# Run once by hand: the mangroves of the world in 1996, 2010, 2015 and 2020, from Global
# Mangrove Watch v3.0 (Bunting et al. 2022, Remote Sensing 14:3657; Zenodo
# 10.5281/zenodo.6894273, CC BY 4.0): 1° tiles of 25 m pixels, 1 where there is mangrove.
# Each year becomes a frame of the series public/layers/mangroves-*.jpg at 0.05°: the square
# root of the mangrove share of each cell (thin coastal fringes stay visible), plus the total
# km² of the year summed at full resolution. Needs rasterio, numpy and pillow (a venv outside
# Dropbox).
#   python scripts/prepare-mangroves.py <folder with gmw_v3_{year}/ tile folders> public/layers
import glob, json, math, os, sys
import numpy as np
import rasterio
from PIL import Image

src_dir, out = sys.argv[1], sys.argv[2]
YEARS = [1996, 2010, 2015, 2020]
W, H = 7200, 3600          # 0.05° cells
PER = W // 360             # cells per 1° tile
frames = []
for year in YEARS:
    share = np.zeros((H, W), np.float32)
    km2 = 0.0
    tiles = sorted(glob.glob(os.path.join(src_dir, f'gmw_v3_{year}', f'GMW_*_{year}_v3.tif')))
    for path in tiles:
        with rasterio.open(path) as s:
            a = s.read(1)
            west, north = round(s.bounds.left), round(s.bounds.top)
        a = (a == 1)
        n = a.shape[0]
        # Area of the mangrove pixels, row by row (pixels shrink towards the poles).
        lat = north - (np.arange(n) + 0.5) / n
        px = (111.32 / n) ** 2 * np.cos(np.radians(lat))
        km2 += float((a.sum(axis=1) * px).sum())
        b = n // PER
        cells = a[: b * PER, : b * PER].reshape(PER, b, PER, b).mean(axis=(1, 3))
        row, col = int((90 - north) * PER), int((west + 180) * PER)
        share[row:row + PER, col:col + PER] = cells
    name = f'mangroves-{year}'
    Image.fromarray(np.round(np.sqrt(np.clip(share, 0, 1)) * 255).astype(np.uint8), 'L').save(os.path.join(out, f'{name}.jpg'), quality=92)
    Image.new('L', (W // 8, H // 8), 255).save(os.path.join(out, f'{name}-c.png'), optimize=True)
    frames.append({'file': f'{name}.jpg', 'conf': f'{name}-c.png', 'time': f'{year}-07-01', 'km2': round(km2)})
    print(year, len(tiles), 'tiles', round(km2), 'km2', flush=True)

json.dump({
    'id': 'mangroves', 'width': W, 'height': H, 'cadence': 'year', 'unit': '%', 'scale': 'sqrt', 'min': 0, 'max': 1,
    'dates': [frames[-1]['time']],
    'source': 'Global Mangrove Watch v3.0 · Bunting et al. 2022 · CC BY 4.0',
    'frames': frames,
}, open(os.path.join(out, 'mangroves.json'), 'w'), indent=1)
