const clamp=(x:number)=>Math.max(0,Math.min(1,x));
/** Equal travel in log-altitude gets equal visual progress; C2 at both endpoints. */
export function altitudeBlend(height:number,near:number,far:number){
  const x=clamp(Math.log(Math.max(near,height)/near)/Math.log(far/near));
  return x*x*x*(x*(x*6-15)+10);
}
/** Atmosphere fades separately from imagery: close-up photographs remain untouched. */
export const atmosphereBlend=(height:number)=>altitudeBlend(height,120000,3200000);

/** One bounded blend within the existing render loop, holding imagery until ready. */
export class ZoomBlend{
  value:number;
  private previous?:number;
  constructor(initial:number){this.value=clamp(initial);}
  tick(target:number,now:number,ready:boolean,reducedMotion=false){
    target=clamp(target);
    const dt=this.previous===undefined?0:Math.max(0,Math.min(100,now-this.previous));this.previous=now;
    // Do not expose additional aerial imagery before the viewport's tiles settle.
    if(!ready&&target>this.value)return false;
    if(reducedMotion){this.value=target;return false;}
    this.value+=(target-this.value)*(1-Math.exp(-dt/100));
    if(Math.abs(target-this.value)<.001){this.value=target;return false;}
    return true;
  }
  suspend(){this.previous=undefined;}
}
