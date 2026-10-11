import type {OMMJsonObject} from 'satellite.js';
import type {OrbitData} from '../types';
import {validateSatellite} from './orbits';

/** Keep scientific fields only. A backup may preserve expired orbits, never make them fresh. */
export function cleanSavedOrbit(raw:unknown):OrbitData {
  const r=raw as OrbitData;if(!r||!r.omm)throw new Error('Orbita assente nel backup.');
  const o=r.omm,epoch=String(o.EPOCH).endsWith('Z')?String(o.EPOCH):String(o.EPOCH)+'Z';
  for(const key of ['MEAN_MOTION','ECCENTRICITY','INCLINATION','RA_OF_ASC_NODE','ARG_OF_PERICENTER','MEAN_ANOMALY','BSTAR','NORAD_CAT_ID']){
    const value=(o as unknown as Record<string,unknown>)[key];if(value===null||value===undefined||value===''||!Number.isFinite(Number(value)))throw new Error('Campo orbitale obbligatorio assente: '+key);
  }
  const omm={OBJECT_NAME:String(o.OBJECT_NAME??'Satellite').slice(0,50),OBJECT_ID:String(o.OBJECT_ID??'').slice(0,30),EPOCH:epoch,CLASSIFICATION_TYPE:'U',
    ...Object.fromEntries(['MEAN_MOTION','ECCENTRICITY','INCLINATION','RA_OF_ASC_NODE','ARG_OF_PERICENTER','MEAN_ANOMALY','EPHEMERIS_TYPE','NORAD_CAT_ID','ELEMENT_SET_NO','REV_AT_EPOCH','BSTAR','MEAN_MOTION_DOT','MEAN_MOTION_DDOT'].map(k=>[k,Number((o as unknown as Record<string,unknown>)[k]??0)]))} as OMMJsonObject;
  const clean=validateSatellite(omm,Date.parse(epoch));
  return {...clean,source:'Backup locale · epoca originale',fetched:epoch};
}
export function cleanSavedSatellites(raw:unknown):OrbitData[]{
  if(!Array.isArray(raw)||raw.length>8)throw new Error('Il backup può contenere al massimo 8 satelliti importati.');
  const clean=raw.map(cleanSavedOrbit),ids=new Set(clean.map(o=>o.omm.NORAD_CAT_ID));
  if(ids.size!==clean.length||ids.has(25544))throw new Error('Satelliti duplicati o ISS nella lista importata.');return clean;
}
