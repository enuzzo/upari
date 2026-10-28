# Run once by hand: the Earth in miniature for the charts, drawn like the marker on the globe
# (src/engine/ring.ts): the day texture on an orthographic globe, lit from the upper left, with
# a thin light stroke and a soft shadow. Writes public/sky/earth-mini.png (128 px, shown at 32).
# Needs numpy and pillow.
#   python scripts/prepare-earth-icon.py public/earth/day-2k.jpg public/sky/earth-mini.png
import sys
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
day = np.asarray(Image.open(src).convert('RGB'), np.float32) / 255
H, W = day.shape[:2]
N, R = 128, 0.56
y, x = np.mgrid[0:N, 0:N]
px, py = (x + 0.5) / N * 2 - 1, -((y + 0.5) / N * 2 - 1)
r = np.hypot(px, py)
qx, qy = px / R, py / R
inside = qx ** 2 + qy ** 2 < 1
qz = np.sqrt(np.clip(1 - qx ** 2 - qy ** 2, 0, 1))
# Turned to show Africa and Europe, tilted a little towards the north.
lon0, tilt = np.radians(15), np.radians(18)
ny = qy * np.cos(tilt) + qz * np.sin(tilt)
nz = -qy * np.sin(tilt) + qz * np.cos(tilt)
lon = lon0 + np.arctan2(qx, nz)
lat = np.arcsin(np.clip(ny, -1, 1))
u = ((lon / (2 * np.pi) + 0.5) % 1) * (W - 1)
v = (0.5 - lat / np.pi) * (H - 1)
albedo = day[v.astype(int), u.astype(int)]
sun = np.array([-0.55, 0.45, 0.7]); sun /= np.linalg.norm(sun)
lit = np.clip((qx * sun[0] + qy * sun[1] + qz * sun[2]) * 1.2 + 0.1, 0, 1)[..., None]
col = albedo * (0.14 + 1.15 * lit) + np.array([0.3, 0.55, 1.0]) * ((1 - qz) ** 3 * 0.55)[..., None] * (0.3 + lit)
globe = np.clip((R - r) / 0.04, 0, 1)
stroke = np.exp(-((r - (R + 0.07)) / 0.028) ** 2) * 0.9
shadow = np.clip(1 - (r - R) / (1 - R), 0, 1) * 0.6 * (r > R)
a = np.maximum(np.maximum(globe, stroke), shadow)
c = (np.where(inside[..., None], col, 0) * globe[..., None] + np.array([0.88, 0.94, 1.0]) * stroke[..., None]) / np.maximum(a, 1e-3)[..., None]
rgba = np.dstack([np.clip(c, 0, 1), a]) * 255
Image.fromarray(rgba.round().astype(np.uint8), 'RGBA').save(out, optimize=True)
print(out)
