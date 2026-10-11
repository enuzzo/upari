import type {Layer} from '../types';
/** Build-time public XYZ/WMTS raster providers. No keys, reprojection, or invented dates. */
export function regionalLayers(raw:unknown):Layer[]{
  if(!Array.isArray(raw)||raw.length>12)throw new Error('Configurazione delle fonti regionali non valida.');
  const keys=new Set<string>();
  return raw.map(r=>{
    if(!r||typeof r.key!=='string'||!/^region-[a-z0-9-]+$|^swissimage$/.test(r.key)||keys.has(r.key))throw new Error('Chiave regionale non valida o duplicata.');keys.add(r.key);
    for(const k of ['name','subtitle','id','date','dataLabel','period','resolution','unit','explanation','source','sourceURL','template'])if(typeof r[k]!=='string'||!r[k].length||r[k].length>1500)throw new Error('Metadati regionali mancanti: '+k);
    for(const k of ['sourceURL','template']){const u=new URL(r[k]);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash)throw new Error('Le fonti regionali devono essere URL pubblici HTTPS senza credenziali.');}
    if(!['{z}','{x}','{y}'].every(t=>r.template.includes(t))||!Number.isInteger(r.maxLevel)||r.maxLevel<0||r.maxLevel>22||!['image/jpeg','image/png'].includes(r.format))throw new Error('Tile regionali non valide (EPSG:3857, 256 px).');
    const b=r.coverage;if(!Array.isArray(b)||b.length!==4||!b.every(Number.isFinite)||b[0]<-180||b[2]>180||b[1]<-85.05112878||b[3]>85.05112878||b[0]>=b[2]||b[1]>=b[3])throw new Error('Copertura regionale non valida.');
    return {key:r.key,name:r.name,subtitle:r.subtitle,id:r.id,date:r.date,earliest:r.date,dataLabel:r.dataLabel,period:r.period,resolution:r.resolution,unit:r.unit,explanation:r.explanation,source:r.source,sourceURL:r.sourceURL,template:r.template,coverage:[...b] as Layer['coverage'],maxLevel:r.maxLevel,format:r.format,matrix:'3857',regional:true,static:true};
  });
}
