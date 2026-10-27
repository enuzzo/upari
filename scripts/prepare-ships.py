# Run once by hand (the source has not changed since 2021): the World Bank/IMF Global Shipping
# Traffic Density (CC BY 4.0, AIS 2015-2021) as an Upari layer, public/layers/ships.{png,json}.
# Needs rasterio, numpy and pillow (a venv outside Dropbox). Usage:
#   python scripts/prepare-ships.py shipdensity_global.tif public/layers
# Source: https://datacatalog.worldbank.org/search/dataset/0037580/Global-Shipping-Traffic-Density
import sys, json, numpy as np, rasterio
from rasterio.enums import Resampling
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
W, H = 4096, 2048
with rasterio.open(src) as d:
    # Read the 1/8 overview (built by the World Bank), then keep the busiest cell of each output pixel.
    ow, oh = d.width // 8, d.height // 8
    a = d.read(1, out_shape=(oh, ow), resampling=Resampling.nearest).astype(np.float64)
    a[a >= 2147483647] = 0
    b = d.bounds
v = np.log10(1 + np.clip(a, 0, None))
top = np.percentile(v[v > 0], 99.8)
v = np.clip(v / top, 0, 1)
# Place on the global grid (the source spans 85° S – 85° N).
out_img = np.zeros((H, W), np.float64)
lat = 90 - (np.arange(H) + 0.5) * 180 / H
lon = -180 + (np.arange(W) + 0.5) * 360 / W
ys = ((b.top - lat) / (b.top - b.bottom) * oh).astype(int)
xs = ((lon - b.left) / (b.right - b.left) * ow).astype(int)
ok_y = (ys >= 0) & (ys < oh)
xs = np.clip(xs, 0, ow - 1)
# max over the source block of each output pixel
fy, fx = oh / (H * (b.top - b.bottom) / 180), ow / W
for j in np.nonzero(ok_y)[0]:
    y0 = ys[j]; y1 = min(oh, max(y0 + 1, int(round(y0 + fy))))
    row = v[y0:y1].max(axis=0)
    # x blocks
    edges = np.clip(((np.arange(W + 1) * 360 / W - 180 - b.left) / (b.right - b.left) * ow).astype(int), 0, ow)
    out_img[j] = np.maximum.reduceat(np.append(row, 0), edges[:-1])[:W]
rgb = np.zeros((H, W, 3), np.uint8)
rgb[..., 0] = np.round(out_img * 255)
rgb[..., 1] = 255
Image.fromarray(rgb).save(out + '/ships.png', optimize=True)
json.dump({'id': 'ships', 'width': W, 'height': H, 'unit': 'log10(1+AIS)', 'scale': 'log', 'min': 0, 'max': float(top), 'coverage': 1,
           'dates': ['2015-01-01', '2021-02-28'], 'source': 'World Bank / IMF · Global Shipping Traffic Density · CC BY 4.0'}, open(out + '/ships.json', 'w'), indent=1)
print('top', top, 'nonzero', float((out_img > 0).mean()))
