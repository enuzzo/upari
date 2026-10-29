# Run once by hand: the breath of carbon, from NOAA CarbonTracker CT2026 (Jacobson et al. 2026,
# doi:10.25925/hqp0-rk68), the daily files xCO2_1330LST of one year: CO2 400 m above the ground
# at 13:30 local time, on a 3x2 degree grid. The year's rise is removed (a line fitted together
# with the yearly harmonics of the global mean, so the season does not bend it), then each place
# is set against its own yearly mean: only the season is left, the northern forests drawing CO2
# down in summer and giving it back in winter. A circular Gaussian over the days (the year loops)
# smooths the weather away, so the frames flow into each other.
# 26 frames, one every two weeks, become public/layers/carbon-*.png: red is the anomaly,
# −12..+12 ppm → 0..1, green the coverage (all of it). The 120x90 grid is enlarged to 720x360
# with bicubic smoothing across the date line. The JSON keeps, for each frame, the mean anomaly
# of the band 45–70° N, which the chapter reads.
# Files: https://gml.noaa.gov/aftp/products/carbontracker/co2/CT2026/molefractions/xCO2_1330LST/
# (CT2026.xCO2_1330_glb3x2_YYYY-MM-DD.nc, about 85 KB each, no login).
# Needs netCDF4, numpy, scipy and pillow (a venv outside Dropbox).
#   python scripts/prepare-carbon.py <folder with one year of daily files> public/layers
import datetime as dt, glob, json, os, sys
import netCDF4, numpy as np
from PIL import Image
from scipy import ndimage

src, out = sys.argv[1], sys.argv[2]
RANGE, FRAMES, SIGMA_DAYS = 12.0, 26, 9.0
files = sorted(glob.glob(os.path.join(src, 'CT2026.xCO2_1330_glb3x2_*.nc')))
dates = [dt.date.fromisoformat(f[-13:-3]) for f in files]
year = dates[0].year
assert all(d.year == year for d in dates) and len(dates) >= 360, 'one whole year of daily files'
days = np.stack([netCDF4.Dataset(f)['co2_400m'][0].filled(np.nan).astype('f8') for f in files])  # south first
t = np.array([(d - dates[0]).days for d in dates], 'f8')

lat = np.arange(-89, 90, 2.0)
w = np.cos(np.radians(lat))[:, None] * np.ones((1, 120))
glob_mean = (days * w).sum((1, 2)) / w.sum()
ph = 2 * np.pi * t / 365.25
X = np.stack([np.ones_like(ph), t, np.sin(ph), np.cos(ph), np.sin(2 * ph), np.cos(2 * ph)], 1)
icpt, slope = np.linalg.lstsq(X, glob_mean, rcond=None)[0][:2]
season = days - (icpt + slope * t)[:, None, None]
season -= season.mean(0)
# The year loops: smooth across December into January.
season = ndimage.gaussian_filter1d(season, SIGMA_DAYS, axis=0, mode='wrap')

band = (lat >= 45) & (lat <= 70)
frames = []
for k in range(FRAMES):
    i = min(len(dates) - 1, round((k + 0.5) * len(dates) / FRAMES))
    f = np.flipud(season[i])  # north up
    pad = 8
    f = np.concatenate([f[:, -pad:], f, f[:, :pad]], 1)
    big = ndimage.zoom(f, (360 / 90, 720 / 120), order=3)
    cut = round(pad * 720 / 120)
    big = ndimage.gaussian_filter(big[:, cut:cut + 720], 1.5)
    r = np.clip((big + RANGE) / (2 * RANGE), 0, 1)
    rgb = np.zeros((360, 720, 3), np.uint8)
    rgb[..., 0] = np.round(r * 255)
    rgb[..., 1] = 255
    name = f'carbon-{dates[i]}'
    Image.fromarray(rgb, 'RGB').save(os.path.join(out, f'{name}.png'), optimize=True)
    north = float((season[i][band] * w[band]).sum() / w[band].sum())
    frames.append({'file': f'{name}.png', 'time': str(dates[i]), 'north': round(north, 2)})
    print(dates[i], 'band 45–70 N', round(north, 2), flush=True)

json.dump({
    'id': 'carbon', 'width': 720, 'height': 360, 'cadence': 'day', 'unit': 'ppm', 'scale': 'linear',
    'min': -RANGE, 'max': RANGE, 'dates': [frames[-1]['time']],
    'source': 'NOAA CarbonTracker CT2026 · CO2 at 400 m, 13:30 local time · each place against its own year',
    'trend': round(float(slope * 365.25), 2),
    'frames': frames,
}, open(os.path.join(out, 'carbon.json'), 'w'), indent=1)
print('global rise removed', round(float(slope * 365.25), 2), 'ppm/yr')
