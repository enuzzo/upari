export const horizonDirections=['N','NE','E','SE','S','SO','O','NO'] as const;
export function validateHorizon(raw:unknown):number[]|undefined{
  if(raw===undefined)return undefined;
  if(!Array.isArray(raw)||raw.length!==8||raw.some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0||v>85))throw new Error('Orizzonte non valido: otto altezze fra 0° e 85°.');
  return [...raw];
}
/** Linear circular interpolation of user-measured obstruction, degrees above geometric horizon. */
export function horizonAt(horizon:readonly number[]|undefined,azimuth:number){
  if(!horizon)return 0;
  const sector=((azimuth%360+360)%360)/45,index=Math.floor(sector),fraction=sector-index;
  return horizon[index]*(1-fraction)+horizon[(index+1)%8]*fraction;
}
