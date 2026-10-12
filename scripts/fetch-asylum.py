"""Explicit bounded UNHCR selection. Serial requests, no runtime API dependency.
New individual applications to Government authorities, SYR/UKR/AFG, 2000–2025.
Missing relations remain missing, and December period codes denote annual coverage.
"""
import datetime,hashlib,json,time,urllib.parse,urllib.request
from pathlib import Path
base='https://api-data.unhcr.org/api/v0/data/AsylumApplications'
params={'c[area_ori_adm0]':'SYR,UKR,AFG','c[rsd_appl_type]':'N','c[rsd_authority]':'G','time_period':'ge:2000+le:2025','unit':'IND.1.TOT','dimensions':'ref_area_adm0,area_ori_adm0,rsd_appl_type,rsd_authority','page_size':100,'footnotes':'true'}
rows=[];ledger=[];expected=None
for page in range(1,52):
 if page>1:time.sleep(1.1)
 url=base+'?'+urllib.parse.urlencode({**params,'page':page})
 with urllib.request.urlopen(url,timeout=90) as response:body=response.read(3000001)
 if len(body)>3000000:raise ValueError('Page exceeds budget')
 result=json.loads(body);p=result['pagination']
 if expected is None:expected=p['total_rows']
 if p['total_rows']!=expected or expected>5000 or p.get('total_rows_estimated'):raise ValueError('Selection changed or exceeds bounded acquisition')
 ledger.append({'url':url,'sha256':hashlib.sha256(body).hexdigest(),'bytes':len(body)})
 rows.extend(result['data']);print('page',page,'rows',len(rows),'/',expected,flush=True)
 if not p['has_next']:break
else:raise ValueError('Pagination exceeded budget')
if len(rows)!=expected:raise ValueError('Incomplete selection')
world=json.loads(Path('public/statistics/world.json').read_text());known={c['id'] for c in world['countries']};years=world['years'];relations={};seen=set();unmatched=[]
for r in rows:
 origin,dest=r['area_ori_adm0'],r['ref_area_adm0'];period=r['time_period'];year=int(period[:4]);value=r['obs_value']
 if r['rsd_appl_type']!='N' or r['rsd_authority']!='G' or r['unit_measure']!='IND' or float(r['unit_mult'])!=1 or r['unit_comp']!='TOT' or not period.endswith('-12'):raise ValueError('Unexpected observation dimensions')
 key=(origin,dest,year)
 if key in seen:raise ValueError('Ambiguous duplicate relation/year')
 seen.add(key)
 if year<2000 or year>2025 or not isinstance(value,(int,float)) or value<0:raise ValueError('Invalid annual observation')
 if origin not in known or dest not in known:unmatched.append({'origin':origin,'destination':dest,'period':period,'reason':'No exact geographic identifier; no imputation'});continue
 route=relations.setdefault((origin,dest),{'origin':origin,'destination':dest,'values':[None]*len(years),'notes':{}})
 route['values'][year-years[0]]=value
 note={k:r[k] for k in ['time_period','date_coverage_start','date_coverage_end','nature','reporting_type','deviations','obs_footnotes_public'] if k in r and r[k] not in [None,'']}
 if note:route['notes'][str(year)]=note
meta=dict(id='asylum',code='AsylumApplications · N · G · IND.1.TOT',name='Domande di asilo · tre origini',theme='Mobilità e protezione',unit='domande individuali pubblicate',status='observed',description='Domande individuali nuove presentate alle autorità governative, da Siria, Ucraina e Afghanistan. Somma delle sole relazioni pubblicate per paese di presentazione; non rappresenta tutte le origini o le migrazioni.',caveat='Archi schematici origine → paese di presentazione, non viaggi osservati o persone uniche. Selezione SYR/UKR/AFG, N/G. Dati mancanti non sono zero. Il codice YYYY-12 copre l’intero anno.',provider='UNHCR · Refugee Data Portal',distributor='UNHCR',sourceURL='https://refugeedata.unhcr.org/en/data-finder/detail/AsylumApplications/',metadataURL='https://refugeedata.unhcr.org/en/data-finder/detail/AsylumApplications/metadata/',downloadURL=base+'?'+urllib.parse.urlencode(params),license='CC-BY-4.0',licenseURL='https://creativecommons.org/licenses/by/4.0/',termsURL='https://refugeedata.unhcr.org/en/terms-and-conditions-of-use/',attribution='UNHCR Refugee Population Statistics Database. Upari: filtered to three origins, new Government applications; annual destination sums and schematic arcs.',updatedAt='',domain=[0,1],firstYear=2000,lastYear=2025)
values={}
for route in relations.values():
 out=values.setdefault(route['destination'],[None]*len(years))
 for i,v in enumerate(route['values']):
  if v is not None:out[i]=(out[i] or 0)+v
meta['domain'][1]=max(v for a in values.values() for v in a if v is not None)
package={'version':1,'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'indicator':meta,'values':values,'relations':list(relations.values()),'origins':['SYR','UKR','AFG'],'selectionRows':expected,'unmatched':unmatched,'provenance':ledger}
Path('public/statistics/asylum.json').write_text(json.dumps(package,ensure_ascii=False,separators=(',',':'),allow_nan=False)+'\n')
print('relations',len(relations),'unmatched',len(unmatched),'bytes',Path('public/statistics/asylum.json').stat().st_size,flush=True)
