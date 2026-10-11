"""Optional complete-window reference: Skyfield/SGP4 + JPL, finite solar-disc visibility.
Run in an isolated scientific environment; no additional web-app runtime dependency.
"""
from pathlib import Path
import json
from datetime import datetime, timezone
import numpy as np
from skyfield.api import Loader, EarthSatellite, wgs84
root=Path(__file__).resolve().parents[1]
loader=Loader(str(root/'.qa-ephemerides'))
ts=loader.timescale(builtin=True)
omm=json.loads((root/'public/iss-live.json').read_text())[0]
sat=EarthSatellite.from_omm(ts,omm)
eph=loader('de421.bsp')
start=datetime(2026,10,11,16,tzinfo=timezone.utc).timestamp()
stop=start+72*3600
records=[]
for name,latitude,longitude,height,minimum in [('New York',40.7,-74,0,10),('Sydney',-33.87,151.2,0,10),('Luino',46.001,8.746,.2,10),('Quito',-.18,-78.47,2.85,5),('Reykjavik',64.15,-21.94,0,5),('Longyearbyen',78.22,15.65,0,5),('New York',40.7,-74,0,70)]:
 observer=wgs84.latlon(latitude,longitude,elevation_m=height*1000)
 def readings(seconds):
  t=ts.utc(2026,10,11,16,0,np.asarray(seconds)-start)
  orbit=sat.at(t)
  alt,az,_=(sat-observer).at(t).altaz()
  sun_alt,_,_=(eph['earth']+observer).at(t).observe(eph['sun']).apparent().altaz()
  earth=-orbit.position.km
  sun=(eph['sun']-eph['earth']).at(t).position.km-orbit.position.km
  er=np.linalg.norm(earth,axis=0);sr=np.linalg.norm(sun,axis=0)
  separation=np.arccos(np.clip(np.sum(earth*sun,axis=0)/(er*sr),-1,1))
  fully=separation>np.arcsin(6378.137/er)+np.arcsin(695700/sr)
  return alt.degrees,az.degrees,sun_alt.degrees,fully
 def visible(seconds):
  altitude,_,solar,fully=readings(seconds)
  return (altitude>=minimum)&(solar<=-6)&fully
 grid=np.arange(start,stop+1,15,dtype=float)
 yes=visible(grid)
 changes=np.flatnonzero(yes[1:]!=yes[:-1])+1
 boundaries=[]
 for i in changes:
  a,b=grid[i-1],grid[i];left=bool(yes[i-1])
  while b-a>.1:
   mid=(a+b)/2
   if bool(visible(mid))==left:a=mid
   else:b=mid
  boundaries.append((float((a+b)/2),bool(yes[i])))
 opened=start if yes[0] else None;windows=[]
 for instant,entering in boundaries+([(stop,False)] if yes[-1] else []):
  if entering:opened=instant
  elif opened is not None:
   if instant-opened>=15:
    samples=np.append(np.arange(opened,instant,5),instant);altitude,azimuth,_,_=readings(samples);peak=int(np.argmax(altitude))
    windows.append(dict(start=opened*1000,end=instant*1000,peak=float(samples[peak]*1000),maxElevation=float(altitude[peak]),startAzimuth=float(azimuth[0]),endAzimuth=float(azimuth[-1])))
   opened=None
 records.append(dict(place=dict(id=name,name=name,latitude=latitude,longitude=longitude,height=height),minElevation=minimum,now=start*1000,passes=windows))
 print(name,minimum,len(windows),'windows',flush=True)
out={'source':'Skyfield 1.55 / sgp4 2.27 / JPL DE421','method':'WGS84 geometric elevation, apparent JPL solar elevation <= -6 deg; entire solar disc above spherical Earth limb (radii 6378.137 / 695700 km); 15 s scan, 0.1 s boundary refinement; no refraction or local obstacles.','records':records}
(root/'docs/skyfield-events.json').write_text(json.dumps(out,indent=2)+'\n')
