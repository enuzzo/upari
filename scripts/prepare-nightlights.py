# Run once by hand: the lights of the night every four years, 1992-2024, from the harmonized
# DMSP and VIIRS series of Li, Zhou et al. (Scientific Data 7:168, 2020; figshare 9828827,
# version 10, CC BY 4.0): 30 arc-second rasters of digital numbers 0-63, DMSP calibrated to
# 2013, VIIRS converted to DMSP-like values from 2014. Each year becomes a frame of the series
# public/layers/nightlights-*.jpg at 0.05°: the mean brightness of each cell (0..63 → 0..1),
# plus the share of the Earth's surface that is brightly lit. Needs rasterio, numpy and pillow (a venv outside
# Dropbox).
#   python scripts/prepare-nightlights.py <folder with ntl_{year}.tif> public/layers
import glob, json, os, re, sys
import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.transform import from_bounds
from rasterio.warp import reproject
from PIL import Image

src_dir, out = sys.argv[1], sys.argv[2]
W, H = 7200, 3600
frames = []
for path in sorted(glob.glob(os.path.join(src_dir, 'ntl_*.tif'))):
    year = int(re.search(r'ntl_(\d{4})', path).group(1))
    dst = np.zeros((H, W), np.float32)
    with rasterio.open(path) as src:
        reproject(source=rasterio.band(src, 1), destination=dst, src_transform=src.transform, src_crs=src.crs,
                  src_nodata=src.nodata, dst_transform=from_bounds(-180, -90, 180, 90, W, H), dst_crs='EPSG:4326',
                  dst_nodata=0, resampling=Resampling.average)
    v = np.clip(dst / 63.0, 0, 1)
    # Brightly lit: cells above DN 30, the cores of towns and cities, as a share of the Earth's
    # whole surface (cells weighted by their area). The dim edge (DN 7 and up) is not used: it
    # jumps where one sensor hands over to the next, while the bright share grows steadily.
    area = np.cos(np.radians(90 - (np.arange(H) + 0.5) * 0.05))[:, None]
    lit = float(((dst > 30) * area).sum() / (area.sum() * W))
    name = f'nightlights-{year}'
    Image.fromarray(np.round(np.sqrt(v) * 255).astype(np.uint8), 'L').save(os.path.join(out, f'{name}.jpg'), quality=92)
    Image.new('L', (W // 8, H // 8), 255).save(os.path.join(out, f'{name}-c.png'), optimize=True)
    frames.append({'file': f'{name}.jpg', 'conf': f'{name}-c.png', 'time': f'{year}-07-01', 'lit': round(lit, 5),
                   'sensor': 'DMSP' if year <= 2013 else 'VIIRS'})
    print(year, 'lit cells', round(lit * 100, 2), '%', flush=True)

json.dump({
    'id': 'nightlights', 'width': W, 'height': H, 'cadence': 'year', 'unit': 'DN', 'scale': 'sqrt', 'min': 0, 'max': 63,
    'dates': [frames[-1]['time']],
    'source': 'Li, Zhou et al. 2020 · harmonized DMSP and VIIRS night lights, 1992–2024 · figshare 9828827 v10 · CC BY 4.0',
    'frames': frames,
}, open(os.path.join(out, 'nightlights.json'), 'w'), indent=1)
