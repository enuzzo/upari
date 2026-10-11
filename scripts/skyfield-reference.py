"""Optional independent validation. Requires skyfield; no runtime app dependency."""
from pathlib import Path
import json
from datetime import datetime, timezone
from skyfield.api import Loader, EarthSatellite, wgs84
from skyfield.framelib import itrs
root=Path(__file__).resolve().parents[1]
loader=Loader(str(root/'.qa-ephemerides'))
ts=loader.timescale(builtin=True)
omm=json.loads((root/'public/iss-live.json').read_text())[0]
sat=EarthSatellite.from_omm(ts,omm)
eph=loader('de421.bsp')
places=[('Luino',46.001,8.746,.2),('New York',40.7,-74,0),('Sydney',-33.87,151.2,0)]
times=['2026-10-11T16:00:00Z','2026-10-13T10:36:30Z','2026-10-12T09:07:00Z']
out=[]
for name,lat,lon,height in places:
 observer=wgs84.latlon(lat,lon,elevation_m=height*1000)
 for date in times:
  t=ts.from_datetime(datetime.fromisoformat(date.replace('Z','+00:00')))
  alt,az,_=(sat-observer).at(t).altaz()
  geo=wgs84.subpoint(sat.at(t))
  sun_alt,_,_=(eph['earth']+observer).at(t).observe(eph['sun']).apparent().altaz()
  out.append(dict(place=dict(id=name,name=name,latitude=lat,longitude=lon,height=height),date=date,azimuth=float(az.degrees),elevation=float(alt.degrees),latitude=float(geo.latitude.degrees),longitude=float(geo.longitude.degrees),altitude=float(geo.elevation.km),sunElevation=float(sun_alt.degrees),sunlit=bool(sat.at(t).is_sunlit(eph))))
(root/'docs/skyfield-reference.json').write_text(json.dumps({'source':'Skyfield 1.55 / sgp4 2.27 / JPL DE421','records':out},indent=2))
print('Independent Skyfield/JPL reference:',len(out),'points')
