import {defaultRotationSpeed} from './earth-rotation';
import {validEarthStyle} from './earth-style';
import type { CameraView,Place,SaverConfig,SceneState } from '../types';
import { initialLayers,dateAllowed } from './layers';

export const initialCamera:CameraView={longitude:12,latitude:28,height:17000000,heading:0,pitch:-Math.PI/2,roll:0};
export const initialScene:SceneState={layerKey:'satellite',date:'',opacity:1,compare:false,compareDate:'',split:.5,sunOffset:0,lighting:true,camera:initialCamera,visualStyle:'natural',visualStrength:1,vectorKey:"none",vectorMotion:true,rotationEnabled:true,rotationSpeed:defaultRotationSpeed};
const bounded=(x:unknown,min:number,max:number,fallback:number)=>typeof x==='number'&&Number.isFinite(x)?Math.max(min,Math.min(max,x)):fallback;
const isoDate=(x:unknown)=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+'T12:00:00Z'))&&new Date(x+'T12:00:00Z').toISOString().slice(0,10)===x;
export function validateCamera(raw:unknown):CameraView {
  const c=(raw??{}) as Partial<CameraView>;
  return {longitude:bounded(c.longitude,-180,180,12),latitude:bounded(c.latitude,-90,90,28),height:bounded(c.height,200,30000000,17000000),
    heading:bounded(c.heading,-Math.PI*2,Math.PI*2,0),pitch:bounded(c.pitch,-Math.PI/2,Math.PI/2,-Math.PI/2),roll:bounded(c.roll,-Math.PI*2,Math.PI*2,0)};
}
export function validateScene(raw:unknown):SceneState {
  const s=(raw??{}) as Partial<SceneState>;
  const layer=initialLayers.find(l=>l.key===s.layerKey);
  // A refreshed catalogue can contain dates newer than the bundled metadata.
  const allowed=(date:unknown)=>layer&&isoDate(date)&&typeof date==='string'&&date>=layer.earliest&&date<=new Date(Date.now()).toISOString().slice(0,10)&&(!layer.static||dateAllowed(layer,date));
  const date=allowed(s.date)?s.date!:layer?.date??'';
  const compareDate=allowed(s.compareDate)?s.compareDate!:date;
  return {layerKey:layer?.key??'satellite',date,compareDate,opacity:bounded(s.opacity,0,1,1),compare:!!layer&&!layer.static&&s.compare===true,
    split:bounded(s.split,.05,.95,.5),sunOffset:bounded(s.sunOffset,-12,12,0),lighting:s.lighting===true,camera:validateCamera(s.camera),vectorKey:["wind","currents"].includes(s.vectorKey??"")?s.vectorKey:"none",vectorMotion:s.vectorMotion!==false,visualStyle:validEarthStyle(s.visualStyle),visualStrength:bounded(s.visualStrength,0,1,1),rotationEnabled:s.rotationEnabled!==false,rotationSpeed:bounded(s.rotationSpeed,.02,1,defaultRotationSpeed)};
}
export function validateSaver(raw:unknown):SaverConfig {
  const c=(raw??{}) as Partial<SaverConfig>;
  if(c.version!==1)throw new Error('Versione del salvaschermo non supportata.');
  const p=c.place;
  if(!p||typeof p.name!=='string'||!p.name.trim()||p.name.length>100||!Number.isFinite(p.latitude)||Math.abs(p.latitude)>90||!Number.isFinite(p.longitude)||Math.abs(p.longitude)>180)throw new Error('Luogo del salvaschermo non valido.');
  const place:Place={id:'saver',name:p.name,latitude:p.latitude,longitude:p.longitude,height:bounded(p.height,0,10,0)};
  return {version:1,scene:validateScene(c.scene),place,showClock:c.showClock!==false,showWeather:c.showWeather===true,rotationSpeed:bounded(c.rotationSpeed,.02,1,.2)};
}
export function saverURL(config:SaverConfig) {
  // A client-side fragment keeps the saved coordinates out of hosting request URLs.
  const clean=validateSaver(config);
  return '/screensaver.html#scene='+encodeURIComponent(JSON.stringify(clean));
}
export function decodeSaver(hash:string):SaverConfig {
  if(hash.length>16000)throw new Error('Configurazione troppo grande.');
  const encoded=new URLSearchParams(hash.replace(/^#/, '')).get('scene');
  if(!encoded)throw new Error('Apri il salvaschermo da una vista di Upari.');
  return validateSaver(JSON.parse(encoded));
}
