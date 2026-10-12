"""Normalise long CSV region,year,indicator,value into a documented import bundle.
No network, no geocoding, no missing-value imputation. Shared TS validation via Node22+.
Example: python3 scripts/package-statistics.py table.csv bundle.json --metadata metadata.json --boundaries countries.geojson
"""
import argparse,datetime,hashlib,json,math,subprocess,tempfile
from pathlib import Path
import csv

def package(input_file,metadata_file,boundaries_file,region_property=None):
 raw=input_file.read_bytes()
 if len(raw)>8000000:raise ValueError('Input CSV exceeds8MB')
 meta=json.loads(metadata_file.read_text());meta=meta.get('data',meta)
 indicators={m['id']:m for m in meta['indicators']};regions={r['id']:r for r in meta['countries']};records={};dates=set()
 with input_file.open(encoding='utf-8-sig',newline='') as f:
  reader=csv.DictReader(f)
  if not {'region','year','indicator','value'}<=set(reader.fieldnames or []):raise ValueError('Required CSV columns: region,year,indicator,value')
  for row in reader:
   region,indicator=row['region'].strip(),row['indicator'].strip();year=int(row['year']);value=row['value'].strip()
   if region not in regions or indicator not in indicators:raise ValueError('Unknown region or indicator; metadata must declare all IDs')
   if not 1800<=year<=2200:raise ValueError('Year out of range')
   key=(indicator,region,year)
   if key in records:raise ValueError('Duplicate indicator/region/year')
   number=float(value) if value else None
   if number is not None and not math.isfinite(number):raise ValueError('Non-finite value; use empty cell for missing')
   records[key]=number;dates.add(year)
 if not dates or max(dates)-min(dates)>200:raise ValueError('Select at most201consecutiveyears')
 years=list(range(min(dates),max(dates)+1));values={id:{} for id in indicators}
 for (indicator,region,year),value in records.items():values[indicator].setdefault(region,[None]*len(years))[year-years[0]]=value
 for key,m in indicators.items():
  observed=[(years[i],v) for a in values[key].values() for i,v in enumerate(a) if v is not None]
  if not observed:raise ValueError('Indicator has no values: '+key)
  if not m.get('domain'):
   lo=min(0,min(v for _,v in observed));hi=max(v for _,v in observed);m['domain']=[lo,hi if hi>lo else lo+1]
  m['firstYear']=min(y for y,_ in observed);m['lastYear']=max(y for y,_ in observed)
 geometry=json.loads(boundaries_file.read_text())
 for i,f in enumerate(geometry.get('features',[])):
  p=f['properties']
  if region_property:
   code=p.get(region_property)
   if code not in regions:raise ValueError('Boundary has no exact matching region ID: '+str(code))
   f['properties']={'id':'feature-'+str(i),'statCode':code,'name':regions[code]['name']}
 data={**meta,'version':1,'retrievedAt':meta.get('retrievedAt') or datetime.datetime.now(datetime.timezone.utc).isoformat(),'years':years,'indicators':list(indicators.values()),'countries':list(regions.values()),'values':values,'provenance':[*meta.get('provenance',[]),{'inputSHA256':hashlib.sha256(raw).hexdigest(),'operation':'CSV exact region/year join; empty cells and absent years remain null'}]}
 data.pop('flows',None)
 return {'data':data,'boundaries':geometry}

def main():
 parser=argparse.ArgumentParser();parser.add_argument('input',type=Path);parser.add_argument('output',type=Path);parser.add_argument('--metadata',type=Path,required=True);parser.add_argument('--boundaries',type=Path,required=True);parser.add_argument('--region-property');a=parser.parse_args()
 result=package(a.input,a.metadata,a.boundaries,a.region_property);body=json.dumps(result,ensure_ascii=False,separators=(',',':'),allow_nan=False)+'\n'
 if len(body.encode())>8*1024*1024:raise ValueError('Import bundle exceeds8MiB')
 with tempfile.TemporaryDirectory() as directory:
  check=Path(directory)/'bundle.json';check.write_text(body);subprocess.run(['node',str(Path(__file__).with_name('validate-statistics.mjs')),str(check)],check=True)
 a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(body);print('outputSHA256',hashlib.sha256(body.encode()).hexdigest())
if __name__=='__main__':main()
