import {altitudeBlend} from './earth-look';
export const earthStyles=[{key:'natural',name:'Naturale',description:'La Terra, con atmosfera e profondità.'}] as const;
export type EarthStyle=typeof earthStyles[number]['key'];
export function validEarthStyle(raw:unknown):EarthStyle{return earthStyles.some(s=>s.key===raw)?raw as EarthStyle:'natural';}
/** Blend by altitude, not zoom-button count. Keep all aerial detail at close range. */
export function spaceBlend(height:number){return altitudeBlend(height,1200000,8000000);}

export function earthStyleName(raw:unknown){return earthStyles.find(s=>s.key===raw)?.name??earthStyles[0].name;}

/** Protect both ends of a crossfade, including a retained frame after a load failure. */
export function naturalGradeAllowed(requested:{regional?:boolean}|null|undefined,displayed:{regional?:boolean}|null|undefined){return (!requested||requested.regional===true)&&(!displayed||displayed.regional===true);}
