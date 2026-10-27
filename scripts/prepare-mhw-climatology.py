# Run once by hand: the climatology that marine heatwaves are measured against (Hobday et al.
# 2016), from NOAA OISST v2.1 daily, 1991-2020, read at 1° from NOAA PSL's OPeNDAP server.
# For every 1° cell and day of the year: the mean and the 90th percentile of the sea surface
# temperature within an 11-day window over the thirty years, each then smoothed with a 31-day
# running mean, as in the paper. Both seasonal curves are stored as three harmonics (seven
# coefficients) per cell. They follow the smoothed curves closely in open water; where the sea
# freezes part of the year (the curve flattens at -1.8 °C) the fit is poor, up to about 2 °C,
# so the daily job leaves out every cell whose mean drops below -1 °C:
#   public/layers/mhw-clim.bin  float32, [variable 2][coefficient 7][lat 180][lon 360]
#   public/layers/mhw-clim.json grid and coefficient order
# The daily job (prepare-layers.mjs mhw) fetches only the last days of OISST and compares.
# Needs netCDF4 and numpy (a venv outside Dropbox). About an hour of downloads.
#   python scripts/prepare-mhw-climatology.py public/layers
import json, os, sys
from concurrent.futures import ThreadPoolExecutor
import netCDF4, numpy as np

out = sys.argv[1]
URL = 'https://psl.noaa.gov/thredds/dodsC/Datasets/noaa.oisst.v2.highres/sst.day.mean.{}.nc'
YEARS = range(1991, 2021)
NY, NX = 180, 360

def month(year, m):
    # Days of the month in that year, at every fourth 0.25° cell (1°, centres at x.625).
    first = (np.datetime64(f'{year}-{m:02d}-01') - np.datetime64(f'{year}-01-01')).astype(int)
    last = (np.datetime64(f'{year}-{m + 1:02d}-01' if m < 12 else f'{year + 1}-01-01') - np.datetime64(f'{year}-01-01')).astype(int)
    for attempt in range(4):
        try:
            with netCDF4.Dataset(URL.format(year)) as d:
                a = d['sst'][first:last, 2::4, 2::4]
            return year, first, np.ma.filled(a.astype(np.float32), np.nan)
        except Exception as e:
            if attempt == 3: raise
            print('retry', year, m, e, flush=True)

# Day of the year on a 365-day calendar (29 February joins 28 February).
data = np.full((len(YEARS), 365, NY, NX), np.nan, np.float32)
jobs = [(y, m) for y in YEARS for m in range(1, 13)]
with ThreadPoolExecutor(4) as pool:
    for k, (year, first, a) in enumerate(pool.map(lambda j: month(*j), jobs)):
        leap = year % 4 == 0
        for i in range(a.shape[0]):
            doy = first + i
            if leap and doy >= 59: doy = doy - 1 if doy > 59 else 58
            data[year - YEARS[0], doy] = a[i]
        if k % 12 == 11: print(year, flush=True)

mean = np.empty((365, NY, NX), np.float32); p90 = np.empty((365, NY, NX), np.float32)
for d in range(365):
    win = data[:, [(d + k) % 365 for k in range(-5, 6)]].reshape(-1, NY, NX)
    mean[d] = np.nanmean(win, axis=0)
    p90[d] = np.nanpercentile(win, 90, axis=0)
def smooth(x):
    k = np.ones(31, np.float32) / 31
    pad = np.concatenate([x[-15:], x, x[:15]])
    return np.apply_along_axis(lambda s: np.convolve(s, k, 'valid'), 0, pad)
mean, p90 = smooth(mean), smooth(p90)

# Three harmonics: c0 + Σ a_k cos(2πk t) + b_k sin(2πk t), t = (day + 0.5) / 365.
t = (np.arange(365) + 0.5) / 365
B = np.stack([np.ones_like(t)] + [f(2 * np.pi * k * t) for k in (1, 2, 3) for f in (np.cos, np.sin)], 1)  # 365 x 7
def fit(x):
    flat = x.reshape(365, -1)
    ok = np.isfinite(flat).all(0)
    coef = np.full((7, flat.shape[1]), np.nan, np.float32)
    coef[:, ok] = np.linalg.lstsq(B, flat[:, ok], rcond=None)[0]
    err = np.nanmax(np.abs(B @ np.nan_to_num(coef) - np.nan_to_num(flat))[:, ok])
    return coef.reshape(7, NY, NX), float(err)
cm, em = fit(mean); cp, ep = fit(p90)
print('largest harmonic misfit °C: mean', round(em, 3), 'p90', round(ep, 3), flush=True)
np.stack([cm, cp]).astype('<f4').tofile(os.path.join(out, 'mhw-clim.bin'))
json.dump({'grid': {'lat0': -89.375, 'lon0': 0.625, 'step': 1, 'ny': NY, 'nx': NX}, 'variables': ['mean', 'p90'],
           'coefficients': ['c0', 'cos1', 'sin1', 'cos2', 'sin2', 'cos3', 'sin3'], 'time': 't = (day of year from 0 + 0.5) / 365, 29 Feb as 28 Feb',
           'baseline': '1991-2020', 'misfit': {'mean': round(em, 3), 'p90': round(ep, 3)},
           'source': 'NOAA OISST v2.1 (NOAA PSL), Hobday et al. 2016 method'}, open(os.path.join(out, 'mhw-clim.json'), 'w'), indent=1)
