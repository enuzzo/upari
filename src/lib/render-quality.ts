import type { RenderQuality } from '../types';

/** CSS viewport budget; Cesium's native DPR is enabled explicitly by the renderer. */
export function renderProfile(width:number,height:number,dpr:number,quality:RenderQuality) {
  const ratio=Number.isFinite(dpr)&&dpr>0?dpr:1;
  const area=Math.max(1,width)*Math.max(1,height);
  const budget=quality==='high'?8000000:quality==='battery'?1250000:3000000;
  const cap=quality==='high'?3:quality==='battery'?1:2;
  const effectiveRatio=Math.max(Math.min(1,ratio),Math.min(ratio,cap,Math.sqrt(budget/area)));
  return {
    effectiveRatio,resolutionScale:effectiveRatio/ratio,
    screenSpaceError:quality==='high'?1:quality==='battery'?2.5:1.5,
    cacheSize:quality==='battery'?64:quality==='high'?160:112,
    msaaSamples:quality==='battery'?1:4,
  };
}
