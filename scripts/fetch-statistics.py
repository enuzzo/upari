"""Occasional, explicit acquisition of openly licensed WDI annual country series.
No API at playback time. Preserve nulls, exclude aggregates, record hashes/metadata.
Run: python3 scripts/fetch-statistics.py --output public/statistics
"""
import argparse,datetime,hashlib,json,math,re,time,urllib.request
from pathlib import Path

SPECS=[
 ('birth','SP.DYN.CBRT.IN','Natalità','Demografia','nascite / 1.000 abitanti','Registri, censimenti e stime ONU; tasso grezzo, influenzato dalla struttura per età.'),
 ('death','SP.DYN.CDRT.IN','Mortalità','Demografia','decessi / 1.000 abitanti','Tasso grezzo: non confronta direttamente la salute di popolazioni con età diverse. Registri e stime ONU.'),
 ('population','SP.POP.TOTL','Popolazione','Demografia','persone','Stime di popolazione a metà anno; definizioni e metodi variano. Non è un censimento simultaneo.'),
 ('life','SP.DYN.LE00.IN','Speranza di vita','Demografia','anni','Indicatore di periodo da tavole di mortalità; non predice la vita di una singola persona.'),
 ('employment','SL.EMP.TOTL.SP.ZS','Occupazione 15+','Lavoro','% popolazione 15+','Stime modellate ILO, anche imputazioni: non usarle per classifiche fra paesi. Occupazione non equivale a lavoro dignitoso.'),
 ('unemployment','SL.UEM.TOTL.ZS','Disoccupazione','Lavoro','% forza lavoro','Stime modellate ILO: denominatore diverso dall’occupazione 15+. Non misura povertà; imputazioni non adatte a classifiche fra paesi.'),
]
BASE='https://api.worldbank.org/v2/'
GLOSSARY='https://databank.worldbank.org/metadataglossary/world-development-indicators/series/'
TERMS='https://data.worldbank.org/summary-terms-of-use'
LICENSE='https://datacatalog.worldbank.org/public-licenses#cc-by'

def acquire(url,ledger,limit=32000000):
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Upari-open-data-research/0.5'}),timeout=90) as response:
  body=response.read(limit+1)
 if len(body)>limit:raise ValueError('Response exceeds budget')
 ledger.append({'url':url,'sha256':hashlib.sha256(body).hexdigest(),'bytes':len(body)})
 return json.loads(body)

def pages(url,ledger):
 first=acquire(url+'&page=1',ledger)
 if not isinstance(first,list) or len(first)!=2 or not isinstance(first[1],list):raise ValueError('Unexpected API response')
 rows=first[1];head=first[0]
 if not 1<=int(head['pages'])<=30:raise ValueError('Pagination outside budget')
 for page in range(2,int(head['pages'])+1):
  time.sleep(.3);part=acquire(url+'&page='+str(page),ledger);rows.extend(part[1])
 if len(rows)!=int(head['total']):raise ValueError('Incomplete API pagination')
 return head,rows

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,default=Path('public/statistics'));args=parser.parse_args()
 ledger=[];retrieved=datetime.datetime.now(datetime.timezone.utc).isoformat()
 _,countries=pages(BASE+'country?format=json&per_page=400',ledger)
 countries={c['id']:{'id':c['id'],'name':c['name'],'iso2':c['iso2Code'],'longitude':float(c['longitude']) if c['longitude'] else None,'latitude':float(c['latitude']) if c['latitude'] else None} for c in countries if c['region']['id']!='NA' and re.fullmatch('[A-Z]{3}',c['id'])}
 years=list(range(1960,2026));indicators=[];values={}
 for key,code,name,theme,unit,caveat in SPECS:
  head,metadata=pages(BASE+'indicator/'+code+'?source=2&format=json&per_page=50',ledger)
  meta=next(x for x in metadata if x['id']==code)
  request=BASE+'country/all/indicator/'+code+'?source=2&date=1960:2025&format=json&per_page=20000'
  head,rows=pages(request,ledger);series={};seen=set()
  for row in rows:
   iso=row['countryiso3code'];year=int(row['date']);value=row['value']
   if iso not in countries:continue
   if year not in years:raise ValueError('Year outside request')
   if (iso,year) in seen:raise ValueError('Duplicate country/year')
   seen.add((iso,year))
   if value is not None and (isinstance(value,bool) or not isinstance(value,(int,float)) or not math.isfinite(value) or value<0):raise ValueError('Invalid numeric value')
   series.setdefault(iso,[None]*len(years))[year-years[0]]=value
  values[key]=series
  available=[(years[i],v) for a in series.values() for i,v in enumerate(a) if v is not None]
  maximum=max(v for _,v in available)
  indicators.append(dict(id=key,code=code,name=name,theme=theme,unit=unit,status='modelled' if theme=='Lavoro' else 'mixed',caveat=caveat,description=meta['sourceNote'],provider=meta['sourceOrganization'],distributor='World Bank · World Development Indicators',sourceURL='https://data.worldbank.org/indicator/'+code,metadataURL=GLOSSARY+code,downloadURL=request,license='CC-BY-4.0',licenseURL=LICENSE,termsURL=TERMS,attribution='World Bank: World Development Indicators: '+meta['sourceOrganization'],updatedAt=head.get('lastupdated',''),domain=[0,maximum],firstYear=min(y for y,_ in available),lastYear=max(y for y,_ in available)))
  print(key,'values',len(available),'latest',max(y for y,_ in available),flush=True)
 # Derived rate, only where both same-year/source terms exist; never migration.
 values['balance']={iso:[b-d if b is not None and d is not None else None for b,d in zip(values['birth'].get(iso,[None]*len(years)),values['death'].get(iso,[None]*len(years)))] for iso in countries}
 existing=[v for a in values['balance'].values() for v in a if v is not None];extent=max(abs(v) for v in existing)
 base=indicators[0];indicators.append({**base,'id':'balance','code':'SP.DYN.CBRT.IN - SP.DYN.CDRT.IN','name':'Saldo naturale','unit':'saldo / 1.000 abitanti','status':'derived','domain':[-extent,extent],'description':'Natalità meno mortalità nello stesso paese e anno. Non include migrazione.','caveat':'Calcolo Upari sui due tassi originali, senza colmare anni mancanti. Non è crescita totale della popolazione.','derivedFrom':['birth','death'],'metadataURL':GLOSSARY+'SP.DYN.CDRT.IN'})
 revision=acquire('https://api.github.com/repos/nvkelso/natural-earth-vector/commits?path=geojson/ne_110m_admin_0_countries.geojson&per_page=1',ledger,2000000)[0]['sha']
 boundaryURL='https://raw.githubusercontent.com/nvkelso/natural-earth-vector/'+revision+'/geojson/ne_110m_admin_0_countries.geojson'
 geo=acquire(boundaryURL,ledger,2000000);features=[];unmatched=[]
 for f in geo['features']:
  p=f['properties'];candidates=[p.get('WB_A3'),p.get('ISO_A3_EH'),p.get('ADM0_A3')]
  code=next((c for c in candidates if c in countries),None)
  if code is None and p.get('ADM0_A3')=='KOS' and 'XKX' in countries:code='XKX'
  if code is None:unmatched.append({'boundary':p.get('ADM0_A3'),'name':p.get('NAME'),'reason':'No exact country identifier in WDI; not imputed'})
  features.append({'type':'Feature','properties':{'id':p['ADM0_A3'],'statCode':code,'name':p.get('NAME_IT') or p.get('NAME'),'longitude':p.get('LABEL_X'),'latitude':p.get('LABEL_Y')},'geometry':f['geometry']})
 args.output.mkdir(parents=True,exist_ok=True)
 package={'version':1,'retrievedAt':retrieved,'years':years,'countries':list(countries.values()),'indicators':indicators,'values':values,'provenance':ledger,'boundary':{'source':'Natural Earth · 1:110m','sourceURL':boundaryURL,'revision':revision,'license':'Public-Domain','licenseURL':'https://www.naturalearthdata.com/about/terms-of-use/','caveat':'Confini contemporanei generalizzati, non confini storici dell’anno selezionato; la rappresentazione non esprime una posizione politica.','unmatched':unmatched}}
 for file,data in [('world.json',package),('countries.geojson',{'type':'FeatureCollection','features':features})]:
  (args.output/file).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'),allow_nan=False)+'\n')
 print('countries',len(countries),'boundaries',len(features),'unmatched',len(unmatched),flush=True)
if __name__=='__main__':main()
