export type Indicator={id:string;code:string;name:string;theme:string;unit:string;status:'mixed'|'modelled'|'derived'|'observed'|'projection';description:string;caveat:string;provider:string;distributor:string;sourceURL:string;metadataURL:string;downloadURL:string;license:string;licenseURL:string;termsURL:string;attribution:string;updatedAt:string;domain:[number,number];firstYear:number;lastYear:number;derivedFrom?:string[]};
export type Region={id:string;name:string;iso2?:string;longitude:number|null;latitude:number|null};
export type Statistics={version:1;retrievedAt:string;years:number[];countries:Region[];indicators:Indicator[];values:Record<string,Record<string,(number|null)[]>>;flows?:{indicator:string;origins:string[];relations:{origin:string;destination:string;values:(number|null)[];notes?:Record<string,unknown>}[];selectionRows:number};boundary:{source:string;sourceURL:string;license:string;licenseURL:string;caveat:string;revision?:string;unmatched?:unknown[]};provenance?:unknown[]};
export type Boundaries={type:'FeatureCollection';features:{type:'Feature';properties:{id:string;statCode:string|null;name:string;longitude?:number;latitude?:number};geometry:{type:'Polygon'|'MultiPolygon';coordinates:number[][][]|number[][][][]}}[]};
export type StudyState={enabled:boolean;dataset:string;indicator:string;secondary:string;country:string;time:number;start:number;end:number;speed:number;playing:boolean;loop:boolean;flowMotion:boolean};
export const initialStudy:StudyState={enabled:false,dataset:'world',indicator:'birth',secondary:'',country:'ITA',time:2024,start:1960,end:2024,speed:1,playing:false,loop:true,flowMotion:true};
const id=(s:unknown):s is string=>typeof s==='string'&&/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,47}$/.test(s);
const text=(s:unknown,max=6000):s is string=>typeof s==='string'&&s.trim().length>0&&s.length<=max;
export function publicURL(raw:unknown):raw is string{try{if(!text(raw,2000))return false;const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password&&![...u.searchParams.keys()].some(k=>/token|secret|password|api.?key|signature|^(?:key|access[_-]?key|authorization|auth)$/i.test(k));}catch{return false;}}
const freeLicenses=['CC-BY-4.0','CC-BY-3.0-IGO','CC0-1.0','Public-Domain','Eurostat-Reuse'];
function demand(ok:unknown,message:string):asserts ok{if(!ok)throw new Error(message);}
export function validateStatistics(raw:unknown):Statistics{
 const p=raw as Statistics;demand(p?.version===1,'Versione del pacchetto statistico non supportata.');
 demand(text(p.retrievedAt)&&Number.isFinite(Date.parse(p.retrievedAt)),'Data di acquisizione mancante.');
 demand(Array.isArray(p.years)&&p.years.length>0&&p.years.length<=201&&p.years.every((y,i)=>Number.isInteger(y)&&y>=1800&&y<=2200&&(!i||y===p.years[i-1]+1)),'Anni non contigui o fuori limite: gli anni mancanti devono restare null.');
 demand(Array.isArray(p.countries)&&p.countries.length>0&&p.countries.length<=400,'Troppi territori o nessun territorio.');
 const regions=new Set<string>();for(const r of p.countries){demand(id(r.id)&&!regions.has(r.id)&&text(r.name,160),'Identificatore territoriale duplicato o non valido.');regions.add(r.id);for(const [n,limit] of [[r.longitude,180],[r.latitude,90]] as const)demand(n===null||typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=limit,'Coordinate territoriali non valide.');}
 demand(Array.isArray(p.indicators)&&p.indicators.length>0&&p.indicators.length<=24,'Indicatori fuori limite.');
 const indicators=new Set<string>();let cells=0;
 for(const m of p.indicators){
  demand(id(m.id)&&!indicators.has(m.id),'Identificatore indicatore ambiguo.');indicators.add(m.id);
  for(const k of ['code','name','theme','unit','description','caveat','provider','distributor','attribution'] as const)demand(text(m[k]),'Metadata obbligatorio: '+k);
  for(const k of ['sourceURL','metadataURL','downloadURL','licenseURL','termsURL'] as const)demand(publicURL(m[k]),'URL pubblico non valido: '+k);
  demand(freeLicenses.includes(m.license),'Licenza non ammessa nel catalogo libero.');
  demand(['mixed','modelled','derived','observed','projection'].includes(m.status),'Natura del dato mancante.');
  demand(Array.isArray(m.domain)&&m.domain.length===2&&m.domain.every(Number.isFinite)&&m.domain[1]>m.domain[0],'Scala numerica non valida.');
  demand(Number.isInteger(m.firstYear)&&Number.isInteger(m.lastYear)&&m.firstYear>=p.years[0]&&m.lastYear<=p.years.at(-1)!&&m.firstYear<=m.lastYear,'Periodo indicatore non valido.');
  const series=p.values?.[m.id];demand(series&&typeof series==='object'&&!Array.isArray(series),'Serie mancante: '+m.id);
  for(const [region,values] of Object.entries(series)){demand(regions.has(region),'Valore per territorio sconosciuto.');demand(Array.isArray(values)&&values.length===p.years.length,'Serie annuale incompleta.');cells+=values.length;demand(cells<=300000,'Pacchetto oltre il budget di valori.');demand(values.every(v=>v===null||typeof v==='number'&&Number.isFinite(v)&&v>=m.domain[0]&&v<=m.domain[1]),'Valore non finito o fuori dalla scala.');}
 }
 demand(Object.keys(p.values).every(k=>indicators.has(k)),'Serie senza metadata.');
 for(const m of p.indicators)if(m.derivedFrom)demand(Array.isArray(m.derivedFrom)&&m.derivedFrom.every(k=>indicators.has(k)&&k!==m.id),'Derivazione non documentata.');
 if(p.flows){const f=p.flows;demand(Number.isInteger(f.selectionRows)&&f.selectionRows>=0,'Numero di righe del sottoinsieme mancante.');demand(indicators.has(f.indicator)&&Array.isArray(f.origins)&&f.origins.length>0&&new Set(f.origins).size===f.origins.length&&f.origins.every(k=>regions.has(k))&&Array.isArray(f.relations)&&f.relations.length<=1500,'Flussi non documentati o fuori budget.');const keys=new Set<string>();for(const r of f.relations){const key=r.origin+'|'+r.destination;demand(regions.has(r.origin)&&f.origins.includes(r.origin)&&regions.has(r.destination)&&!keys.has(key),'Relazione sconosciuta o duplicata.');keys.add(key);demand(Array.isArray(r.values)&&r.values.length===p.years.length&&r.values.every(v=>v===null||typeof v==='number'&&Number.isFinite(v)&&v>=0),'Valore di flusso non valido.');}}
 const b=p.boundary;demand(b&&text(b.source)&&text(b.caveat)&&publicURL(b.sourceURL)&&publicURL(b.licenseURL)&&freeLicenses.includes(b.license),'Provenienza/licenza dei confini mancante.');
 const cleanNotes=(raw:Record<string,unknown>|undefined)=>raw?Object.fromEntries(Object.entries(raw).filter(([year])=>/^\d{4}$/.test(year)&&p.years.includes(+year)).map(([year,note])=>[year,Object.fromEntries(Object.entries(note&&typeof note==='object'?note:{}).filter(([key,v])=>['time_period','date_coverage_start','date_coverage_end','nature','reporting_type','deviations','obs_footnotes_public'].includes(key)&&(typeof v==='string'&&v.length<=6000||typeof v==='number'&&Number.isFinite(v))))])):undefined;
 if(p.provenance!==undefined)demand(Array.isArray(p.provenance)&&p.provenance.length<=1000,'Registro di provenienza non valido.');
 const provenance=p.provenance?.filter(v=>v&&typeof v==='object'&&!Array.isArray(v)).slice(0,1000).map(v=>{const entry=v as Record<string,unknown>;if(entry.url!==undefined)demand(publicURL(entry.url),'URL di provenienza non pubblico.');return Object.fromEntries(Object.entries(entry).filter(([key,value])=>['url','sha256','inputSHA256','bytes','operation'].includes(key)&&(typeof value==='string'&&value.length<6000||typeof value==='number'&&Number.isFinite(value))));});
 return{version:1,retrievedAt:p.retrievedAt,years:[...p.years],countries:p.countries.map(r=>({id:r.id,name:r.name,longitude:r.longitude,latitude:r.latitude,...(typeof r.iso2==='string'&&/^[A-Z]{2}$/.test(r.iso2)?{iso2:r.iso2}:{})})),indicators:p.indicators.map(m=>({id:m.id,code:m.code,name:m.name,theme:m.theme,unit:m.unit,status:m.status,description:m.description,caveat:m.caveat,provider:m.provider,distributor:m.distributor,sourceURL:m.sourceURL,metadataURL:m.metadataURL,downloadURL:m.downloadURL,license:m.license,licenseURL:m.licenseURL,termsURL:m.termsURL,attribution:m.attribution,updatedAt:typeof m.updatedAt==='string'?m.updatedAt:'',domain:[...m.domain] as [number,number],firstYear:m.firstYear,lastYear:m.lastYear,...(m.derivedFrom?{derivedFrom:[...m.derivedFrom]}:{})})),values:p.values,boundary:{source:b.source,sourceURL:b.sourceURL,license:b.license,licenseURL:b.licenseURL,caveat:b.caveat,...(typeof b.revision==='string'?{revision:b.revision}:{})},...(provenance?{provenance}:{}),...(p.flows?{flows:{indicator:p.flows.indicator,origins:[...p.flows.origins],selectionRows:p.flows.selectionRows,relations:p.flows.relations.map(r=>({origin:r.origin,destination:r.destination,values:r.values,...(r.notes?{notes:cleanNotes(r.notes)}:{})}))}}:{})};
}
export function validateBoundaries(raw:unknown):Boundaries{
 const b=raw as Boundaries;demand(b?.type==='FeatureCollection'&&Array.isArray(b.features)&&b.features.length>0&&b.features.length<=500,'Confini fuori budget.');let vertices=0;const ids=new Set<string>();
 for(const f of b.features){demand(f.type==='Feature'&&id(f.properties?.id)&&!ids.has(f.properties.id)&&text(f.properties.name,160)&&(f.properties.statCode===null||id(f.properties.statCode)),'Confine senza identificatore univoco.');ids.add(f.properties.id);for(const [n,limit] of [[f.properties.longitude,180],[f.properties.latitude,90]] as const)demand(n===undefined||typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=limit,'Coordinate del simbolo fuori WGS84.');demand(['Polygon','MultiPolygon'].includes(f.geometry?.type),'Servono Polygon/MultiPolygon.');
  const polygons=f.geometry.type==='Polygon'?[f.geometry.coordinates as number[][][]]:f.geometry.coordinates as number[][][][];
  demand(Array.isArray(polygons)&&polygons.length>0,'Poligoni mancanti.');for(const rings of polygons){demand(Array.isArray(rings)&&rings.length>0,'Anelli mancanti.');for(const ring of rings){demand(Array.isArray(ring)&&ring.length>=4,'Anello non valido.');vertices+=ring.length;demand(vertices<=60000,'Semplificare i confini: budget 60.000 vertici.');for(const p of ring)demand(Array.isArray(p)&&p.length>=2&&p.slice(0,2).every(Number.isFinite)&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90,'Coordinate fuori WGS84.');demand(ring[0][0]===ring.at(-1)![0]&&ring[0][1]===ring.at(-1)![1],'Anello non chiuso.');}}
 }
 return{type:'FeatureCollection',features:b.features.map(f=>({type:'Feature',properties:{id:f.properties.id,statCode:f.properties.statCode,name:f.properties.name,...(typeof f.properties.longitude==='number'&&Number.isFinite(f.properties.longitude)?{longitude:f.properties.longitude}:{}),...(typeof f.properties.latitude==='number'&&Number.isFinite(f.properties.latitude)?{latitude:f.properties.latitude}:{})},geometry:{type:f.geometry.type,coordinates:f.geometry.type==='Polygon'?(f.geometry.coordinates as number[][][]).map(r=>r.map(p=>p.slice(0,2))):(f.geometry.coordinates as number[][][][]).map(poly=>poly.map(r=>r.map(p=>p.slice(0,2))))}}))};
}
export function validateStudy(raw:unknown):StudyState{
 const s=(raw??{}) as Partial<StudyState>;const finite=(n:unknown,f:number)=>typeof n==='number'&&Number.isFinite(n)?n:f;
 const start=Math.max(1800,Math.min(2199,Math.round(finite(s.start,initialStudy.start)))),end=Math.max(start,Math.min(2200,Math.round(finite(s.end,initialStudy.end))));
 return{enabled:s.enabled===true,dataset:id(s.dataset)?s.dataset:'world',indicator:id(s.indicator)?s.indicator:initialStudy.indicator,secondary:s.secondary===''?'':id(s.secondary)?s.secondary:initialStudy.secondary,country:id(s.country)?s.country:initialStudy.country,time:Math.max(start,Math.min(end,finite(s.time,initialStudy.time))),start,end,speed:Math.max(.1,Math.min(10,Math.abs(finite(s.speed,1))))*(finite(s.speed,1)<0?-1:1),playing:s.playing===true,loop:s.loop!==false,flowMotion:s.flowMotion!==false};
}
/** Only original endpoints; fractional years affect appearance, never create measurements. */
export function annualPair(p:Pick<Statistics,'years'|'values'>,indicator:string,region:string,time:number){
 const t=Math.max(p.years[0],Math.min(p.years.at(-1)!,time)),from=Math.floor(t),to=Math.ceil(t),values=p.values[indicator]?.[region];
 return{from,to,mix:t-from,left:values?.[from-p.years[0]]??null,right:values?.[to-p.years[0]]??null};
}
const palette=[[68,1,84],[59,82,139],[33,145,140],[94,201,98],[253,231,37]];
const diverging=[[61,160,232],[178,197,205],[244,163,77]];
export function statColor(value:number|null,domain:readonly[number,number]):[number,number,number,number]{
 if(value===null)return[47,57,70,255];const signed=domain[0]<0&&domain[1]>0,stops=signed?diverging:palette,fraction=signed?(value<0?.5*(1-value/domain[0]):.5+.5*value/domain[1]):(value-domain[0])/(domain[1]-domain[0]),t=Math.max(0,Math.min(1,fraction))*(stops.length-1),i=Math.min(stops.length-2,Math.floor(t)),mix=t-i;
 return[...stops[i].map((v,j)=>Math.round(v*(1-mix)+stops[i+1][j]*mix)),255] as [number,number,number,number];
}
export const formatStat=(n:number|null)=>n===null?'Non disponibile':n.toLocaleString('it-IT',{maximumFractionDigits:2});

export function validateStatisticsBundle(raw:unknown){
 const input=raw as {data:unknown;boundaries:unknown},data=validateStatistics(input?.data),boundaries=validateBoundaries(input?.boundaries),ids=new Set(data.countries.map(r=>r.id));
 for(const f of boundaries.features)if(f.properties.statCode!==null&&!ids.has(f.properties.statCode))throw new Error('Confine senza corrispondenza territoriale esatta: '+f.properties.statCode);
 return{data,boundaries};
}

/** A live reader can never reactivate a disabled/different imported scene. */
export function resolveStudy(saved:StudyState|undefined,live:StudyState|undefined){return saved?.enabled&&live?.dataset===saved.dataset?live:saved;}
