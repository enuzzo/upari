# Run once by hand: built-up land of the whole planet every five years, 1975-2030, from the
# Global Human Settlement Layer (GHS-BUILT-S R2023A, 1 km, Mollweide; JRC, European Commission,
# reuse with acknowledgement / CC BY 4.0). 2025 and 2030 are projections by the JRC.
# Each epoch becomes a frame of the series public/layers/built-*.jpg: the square root of the
# built share of each cell (villages stay visible next to cities), plus the total km² of the
# epoch summed at full resolution. Needs rasterio, numpy and pillow (a venv outside Dropbox).
#   python scripts/prepare-built.py <folder with GHS_BUILT_S_E{year}_..._V1_0.tif> public/layers
import glob, json, os, re, sys
import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.transform import from_bounds
from rasterio.warp import reproject
from PIL import Image

src_dir, out = sys.argv[1], sys.argv[2]
W, H = 4096, 2048
frames = []
for path in sorted(glob.glob(os.path.join(src_dir, 'GHS_BUILT_S_E*_GLOBE_R2023A_54009_1000_V1_0.tif'))):
    year = int(re.search(r'_E(\d{4})_', path).group(1))
    with rasterio.open(path) as src:
        nodata = src.nodata
        # Exact total: every 1 km cell holds the built square metres inside it.
        total = 0.0
        for _, win in src.block_windows(1):
            a = src.read(1, window=win).astype(np.float64)
            if nodata is not None:
                a[a == nodata] = 0
            total += a.sum()
        dst = np.zeros((H, W), np.float32)
        reproject(source=rasterio.band(src, 1), destination=dst, src_transform=src.transform, src_crs=src.crs,
                  src_nodata=nodata, dst_transform=from_bounds(-180, -90, 180, 90, W, H), dst_crs='EPSG:4326',
                  dst_nodata=0, resampling=Resampling.average)
    share = np.clip(dst / 1e6, 0, 1)
    name = f'built-{year}'
    Image.fromarray(np.round(np.sqrt(share) * 255).astype(np.uint8), 'L').save(os.path.join(out, f'{name}.jpg'), quality=92)
    Image.new('L', (W // 8, H // 8), 255).save(os.path.join(out, f'{name}-c.png'), optimize=True)
    frames.append({'file': f'{name}.jpg', 'conf': f'{name}-c.png', 'time': f'{year}-07-01', 'km2': round(total / 1e6)})
    print(year, round(total / 1e6), 'km2', flush=True)

json.dump({
    'id': 'built', 'width': W, 'height': H, 'cadence': 'year', 'unit': '%', 'scale': 'sqrt', 'min': 0, 'max': 1,
    'dates': [frames[-1]['time']], 'projected': [2025, 2030],
    'source': 'European Commission, JRC · GHS-BUILT-S R2023A · Pesaresi & Politis 2023',
    'frames': frames,
}, open(os.path.join(out, 'built.json'), 'w'), indent=1)
