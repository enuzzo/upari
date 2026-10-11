"""Convert public ERDDAP JSON subsets into bounded Upari static vector packages.

No credentials, network or scientific interpolation. Native values (m/s) are rounded
to 0.001; missing cells stay null. Input timestamps/units are mandatory. Longitude
duplicates in OSCAR's overlap are removed by sorting unique -180..180 coordinates.
See docs/VECTORS.md for source requests and OSCAR v2 distributor adapter.
"""
from pathlib import Path
import argparse,json,hashlib
from urllib.parse import urlsplit
parser=argparse.ArgumentParser()
parser.add_argument('input',type=Path);parser.add_argument('output',type=Path)
parser.add_argument('--kind',choices=['wind','currents'],required=True)
parser.add_argument('--source',required=True);parser.add_argument('--url',required=True)
parser.add_argument('--period',required=True);parser.add_argument('--native-resolution',required=True)
parser.add_argument('--level',required=True);parser.add_argument('--u',default='u');parser.add_argument('--v',default='v')
a=parser.parse_args();blob=a.input.read_bytes();table=json.loads(blob)['table']
url=urlsplit(a.url)
if url.scheme!='https' or not url.netloc or url.username or url.password or url.query or url.fragment:raise ValueError('Use a public HTTPS source URL without credentials')
names=table['columnNames'];units=table['columnUnits'];index={k:names.index(k) for k in ['time','latitude','longitude',a.u,a.v]}
assert units[index['time']]=='UTC'
assert all(units[index[k]] in ['meter/sec','m s-1','m/s'] for k in [a.u,a.v]),'Input must be in m/s'
times={r[index['time']] for r in table['rows']};assert len(times)==1,'Select exactly one time'
for key in ['depth','altitude']:
 if key in names:assert len({r[names.index(key)] for r in table['rows']})==1,'Select exactly one '+key
latitude=sorted({r[index['latitude']] for r in table['rows']})
normalize=lambda x: round((x+180)%360-180,8)
longitude=sorted({normalize(r[index['longitude']]) for r in table['rows']})
cells={(r[index['latitude']],normalize(r[index['longitude']])):(r[index[a.u]],r[index[a.v]]) for r in table['rows']}
assert 4<=len(latitude)*len(longitude)<=260000
def values(component):
 out=[]
 for lat in latitude:
  for lon in longitude:
   n=cells.get((lat,lon),(None,None))[component]
   out.append(round(n,3) if isinstance(n,(int,float)) and abs(n)<=150 else None)
 return out
spacing=min(longitude[i+1]-longitude[i] for i in range(len(longitude)-1))
f=dict(version=1,kind=a.kind,source=a.source,sourceURL=a.url,time=next(iter(times)),period=a.period,nativeResolution=a.native_resolution,sampleResolution=spacing,level=a.level,latitudes=latitude,longitudes=longitude,u=values(0),v=values(1))
a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(f,separators=(',',':'),allow_nan=False)+'\n')
print(json.dumps(dict(output=str(a.output),time=f['time'],cells=len(f['u']),valid=sum(u is not None and v is not None for u,v in zip(f['u'],f['v'])),inputSHA256=hashlib.sha256(blob).hexdigest(),outputSHA256=hashlib.sha256(a.output.read_bytes()).hexdigest())))
