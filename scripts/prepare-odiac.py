# Run once by hand: where the CO2 of fossil fuels is emitted, in 2024, from ODIAC2025 (Oda and
# Maksyutov 2011; Oda et al. 2018; CGER/NIES, doi:10.17595/20170411.001, CC BY 4.0). The source
# is twelve monthly 1 km GeoTIFFs (tonnes of carbon per cell, land only, without international
# aviation and shipping), about 1.5 GB: they are read here in strips, summed over the year into
# 0.05° cells and turned into tonnes of CO2 per km², written as a one-frame series
# public/layers/odiac-2024.jpg on a logarithmic scale, with the world total in the JSON.
# Needs rasterio, numpy and pillow (a venv outside Dropbox).
#   python scripts/prepare-odiac.py <folder with odiac_24MM.tif.gz> public/layers
import glob, gzip, json, os, shutil, sys, tempfile
import numpy as np
import rasterio
from rasterio.windows import Window
from PIL import Image

src_dir, out = sys.argv[1], sys.argv[2]
YEAR, K = 2024, 6                      # 6 × 30" = 0.05°
total = None
for path in sorted(glob.glob(os.path.join(src_dir, 'odiac_24??.tif.gz'))):
    tmp = tempfile.NamedTemporaryFile(suffix='.tif', delete=False, dir=os.environ.get('UPARI_TMP'))
    with gzip.open(path, 'rb') as fin: shutil.copyfileobj(fin, tmp, 1 << 24)
    tmp.close()
    with rasterio.open(tmp.name) as s:
        W, H = s.width // K, s.height // K
        if total is None: total = np.zeros((H, W), np.float64)
        for r in range(0, s.height, 1080):
            a = s.read(1, window=Window(0, r, s.width, 1080)).astype(np.float64)
            a[~np.isfinite(a) | (a < 0)] = 0
            total[r // K:(r + 1080) // K] += a.reshape(1080 // K, K, W, K).sum(axis=(1, 3))
    os.remove(tmp.name)
    print(os.path.basename(path), flush=True)

co2 = total * 44 / 12                  # tonnes of CO2 per 0.05° cell in the year
H, W = co2.shape
lat = 90 - (np.arange(H) + 0.5) * 0.05
km2 = (111.32 * 0.05) ** 2 * np.cos(np.radians(lat))[:, None]
dens = co2 / km2                       # tonnes of CO2 per km² per year
top = float(np.percentile(dens[dens > 0], 99.99))
v = np.log10(1 + dens) / np.log10(1 + top)
Image.fromarray(np.round(np.clip(v, 0, 1) * 255).astype(np.uint8), 'L').save(os.path.join(out, f'odiac-{YEAR}.jpg'), quality=92)
Image.new('L', (W // 8, H // 8), 255).save(os.path.join(out, f'odiac-{YEAR}-c.png'), optimize=True)
gt = float(co2.sum() / 1e9)
json.dump({
    'id': 'odiac', 'width': W, 'height': H, 'cadence': 'year', 'unit': 't CO2/km²/yr', 'scale': 'log', 'min': 0, 'max': round(top),
    'dates': [f'{YEAR}-07-01'], 'totalGt': round(gt, 2),
    'source': 'ODIAC2025 · Oda and Maksyutov, CGER/NIES · CC BY 4.0',
    'frames': [{'file': f'odiac-{YEAR}.jpg', 'conf': f'odiac-{YEAR}-c.png', 'time': f'{YEAR}-07-01'}],
}, open(os.path.join(out, 'odiac.json'), 'w'), indent=1)
print('total', round(gt, 2), 'Gt CO2; top density', round(top), 't/km²', flush=True)
