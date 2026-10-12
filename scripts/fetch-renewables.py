"""Bounded Eurostat snapshot; EU27 only, exact ISO2 mapping, no runtime polling."""
import argparse
import hashlib
import json
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from pathlib import Path
from urllib.request import urlopen

URL='https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nrg_ind_ren?lang=EN&unit=PC&nrg_bal=REN&sinceTimePeriod=2004&untilTimePeriod=2024'
TERMS='https://ec.europa.eu/eurostat/help/copyright-notice'
EU27='BE BG CZ DK DE EE IE EL ES FR HR IT CY LV LT LU HU MT NL AT PL PT RO SI SK FI SE'.split()

def extract(raw, mapping, years):
    dims=raw['id'];sizes=raw['size'];index={k:raw['dimension'][k]['category']['index'] for k in dims}
    if set(dims)!={'freq','nrg_bal','unit','geo','time'} or any(index[k]!={v:0} for k,v in [('freq','A'),('nrg_bal','REN'),('unit','PC')]):
        raise ValueError('Unexpected measure or dimensions')
    if len(dims)!=len(sizes) or any(len(index[k])!=sizes[i] for i,k in enumerate(dims)):
        raise ValueError('Dimension size mismatch')
    result={}
    for code,region in mapping.items():
        if code not in index['geo']: raise ValueError('Missing exact country code: '+code)
        series=[]
        for year in years:
            if not 2004<=year<=2024 or str(year) not in index['time']:series.append(None);continue
            positions={'freq':0,'nrg_bal':0,'unit':0,'geo':index['geo'][code],'time':index['time'][str(year)]}
            offset=0
            for k,size in zip(dims,sizes):offset=offset*size+positions[k]
            if raw.get('status',{}).get(str(offset)):raise ValueError('New selected observation flag requires explicit handling')
            value=raw.get('value',{}).get(str(offset))
            if value is not None and (not isinstance(value,(int,float)) or not 0<=value<=100):raise ValueError('Invalid share')
            series.append(value)
        result[region]=series
    return result

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--input',type=Path);args=parser.parse_args()
    root=Path(__file__).resolve().parents[1];world=json.loads((root/'public/statistics/world.json').read_text())
    if args.input:content=args.input.read_bytes()
    else:
        with urlopen(URL,timeout=45) as response:content=response.read(2_000_001)
    if len(content)>2_000_000:raise ValueError('Response exceeds 2 MB')
    raw=json.loads(content);regions={r['iso2']:r['id'] for r in world['countries'] if r.get('iso2')}
    mapping={code:regions['GR' if code=='EL' else code] for code in EU27}
    values=extract(raw,mapping,world['years'])
    retrieved=datetime.now(timezone.utc).isoformat()
    access_date=datetime.fromisoformat(retrieved).astimezone(ZoneInfo('Europe/Rome')).date().isoformat()
    indicator={'id':'renewables','code':'NRG_IND_REN.REN.PC','name':'Energia da fonti rinnovabili','theme':'Energia',
      'unit':'% del consumo finale lordo','status':'observed',
      'description':'Quota complessiva di energia da fonti rinnovabili nel consumo finale lordo, dati nazionali Eurostat SHARES. Selezione dei 27 paesi UE; non solo elettricità.',
      'caveat':'Metodo RED I fino al 2020, RED II dal 2021: confronto da interpretare con questa discontinuità. Include normalizzazione idroelettrica/eolica e trasferimenti statistici; non misura emissioni, capacità installata o mix locale. Nessuna distribuzione subnazionale. Snapshot 2004–2024; eventuali dati 2025 esclusi. Valori pubblicati senza flag nelle celle selezionate. Traduzione e selezione a cura di Upari; Eurostat non è responsabile di questa elaborazione.',
      'provider':'Eurostat · statistiche energetiche nazionali / SHARES','distributor':'Eurostat',
      'sourceURL':'https://ec.europa.eu/eurostat/databrowser/view/nrg_ind_ren/default/table?lang=en',
      'metadataURL':'https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Renewable_energy_statistics',
      'downloadURL':URL,'license':'Eurostat-Reuse','licenseURL':TERMS,'termsURL':TERMS,
      'attribution':'Fonte: Eurostat, nrg_ind_ren, acquisito '+access_date+'. Selezione UE27, traduzione Upari; valori originali invariati.',
      'updatedAt':raw['updated'],'domain':[0,100],'firstYear':2004,'lastYear':2024}
    pack={'indicator':indicator,'values':values,'retrievedAt':retrieved,
      'provenance':[{'url':URL,'sha256':hashlib.sha256(content).hexdigest(),'bytes':len(content),
      'operation':'A / REN / PC, 2004–2024; EU27 whitelist; EL→GR→GRC exact; aggregates and non-EU excluded; no selected flags; no imputation.'}]}
    path=root/'public/statistics/renewables.json';path.write_text(json.dumps(pack,ensure_ascii=False,separators=(',',':'))+'\n')
    print('EU27:',len(values),'observations:',sum(v is not None for s in values.values() for v in s),'bytes:',path.stat().st_size)

if __name__=='__main__':main()
