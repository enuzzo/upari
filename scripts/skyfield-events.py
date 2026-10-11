"""Optional complete-window reference: Skyfield/SGP4 + JPL, finite solar-disc visibility.
Run in an isolated scientific environment; no additional web-app runtime dependency.
"""
from pathlib import Path
import json,sys
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
extended='--extended' in sys.argv
cases=[('New York',40.7,-74,0,10,[25,40,20,10,5,5,10,20],0),('New York closed',40.7,-74,0,10,[85]*8,0),('Sydney',-33.87,151.2,0,10,[0,0,25,30,20,15,10,5],0),('New York next day',40.7,-74,0,10,[0]*8,86400),('Sydney next day',-33.87,151.2,0,5,[10]*8,86400),('Luino next day',46.001,8.746,.2,5,[15,25,35,15,5,10,30,25],86400)] if extended else None
for case in [('New York',40.7,-74,0,10),('Sydney',-33.87,151.2,0,10),('Luino',46.001,8.746,.2,10),('Quito',-.18,-78.47,2.85,5),('Reykjavik',64.15,-21.94,0,5),('Longyearbyen',78.22,15.65,0,5),('New York',40.7,-74,0,70)] if cases is None else cases:
 name,latitude,longitude,height,minimum=case[:5];horizon=case[5] if extended else [0]*8;start=datetime(2026,10,11,16,tzinfo=timezone.utc).timestamp()+(case[6] if extended else 0);stop=start+72*3600
 observer=wgs84.latlon(latitude,longitude,elevation_m=height*1000)
 def readings(seconds):
  t=ts.utc(2026,10,11,16,0,np.asarray(seconds)-datetime(2026,10,11,16,tzinfo=timezone.utc).timestamp())
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
  altitude,azimuth,solar,fully=readings(seconds)
  obstruction=np.interp(np.mod(azimuth,360),np.arange(9)*45,horizon+[horizon[0]])
  return (altitude>=np.maximum(minimum,obstruction))&(solar<=-6)&fully
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
 records.append(dict(place=dict(id=name,name=name,latitude=latitude,longitude=longitude,height=height,**({"horizon":horizon} if extended else {})),minElevation=minimum,now=start*1000,passes=windows))
 print(name,minimum,len(windows),'windows',flush=True)
out={'source':'Skyfield 1.55 / sgp4 2.27 / JPL DE421','method':'WGS84 geometric elevation, apparent JPL solar elevation <= -6 deg; entire solar disc above spherical Earth limb (radii 6378.137 / 695700 km); 15 s scan, 0.1 s boundary refinement; no refraction or local obstacles.','records':records}
out['method']+=(' Extended cases include circular linear user horizon masks and 12 October start dates.' if extended else '')
(root/('docs/skyfield-horizon.json' if extended else 'docs/skyfield-events.json')).write_text(json.dumps(out,indent=2)+'\n')
