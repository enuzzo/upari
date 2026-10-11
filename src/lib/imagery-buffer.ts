/** The renderer owns tile readiness; this buffer owns bounded lifetime and transitions. */
export type FrameSpec={key:string;date:string;compareDate?:string};
type Frame<T>={spec:FrameSpec;value:T;settled:number;failed:boolean};
export interface FrameAdapter<T>{create:(spec:FrameSpec)=>T;remove:(value:T)=>void;opacity:(value:T,alpha:number)=>void;shown:(spec:FrameSpec,transition?:FrameSpec)=>void;error:()=>void}
export function transitionOpacity(opacity:number,t:number){
  const top=opacity*t,denominator=1-top;
  return {top,bottom:denominator>1e-6?opacity*(1-t)/denominator:0};
}
export class ImageryBuffer<T>{
  private current?:Frame<T>;private pending?:Frame<T>;private warm?:Frame<T>;private elapsed=0;private started=false;private opacity=1;
  constructor(private adapter:FrameAdapter<T>,private duration=320){}
  get busy(){return !!this.pending;}
  get size(){return +!!this.current+ +!!this.pending+ +!!this.warm;}
  get displaying(){return this.current?.spec;}
  private make(spec:FrameSpec):Frame<T>{const f={spec,value:this.adapter.create(spec),settled:0,failed:false};this.adapter.opacity(f.value,0);return f;}
  private remove(f?:Frame<T>){if(f)this.adapter.remove(f.value);}
  request(spec?:FrameSpec){
    if(!spec){this.clear();return;}
    if(spec?.key===this.pending?.spec.key||(!this.pending&&spec?.key===this.current?.spec.key))return;
    this.remove(this.pending);this.pending=undefined;this.elapsed=0;this.started=false;
    if(this.current)this.adapter.opacity(this.current.value,this.opacity);
    if(this.current?.spec.key===spec.key)return;
    if(this.warm?.spec.key===spec.key){this.pending=this.warm;this.warm=undefined;}
    else{this.remove(this.warm);this.warm=undefined;this.pending=this.make(spec);}
  }
  preload(spec?:FrameSpec){
    if(this.pending)return;
    if(spec?.key===this.warm?.spec.key)return;
    this.remove(this.warm);this.warm=undefined;
    if(spec&&spec.key!==this.current?.spec.key)this.warm=this.make(spec);
  }
  setOpacity(alpha:number){this.opacity=alpha;if(this.current&&!this.started)this.adapter.opacity(this.current.value,alpha);}
  fail(key:string){
    const f=[this.pending,this.warm,this.current].find(f=>f?.spec.key===key);if(!f||f.failed)return;f.failed=true;
    if(f===this.warm){this.remove(this.warm);this.warm=undefined;return;}
    if(f===this.pending&&this.current){this.remove(this.pending);this.pending=undefined;this.elapsed=0;this.started=false;this.adapter.opacity(this.current.value,this.opacity);this.adapter.shown(this.current.spec);}
    // An initial frame can still contain useful pixels: retain it with a coverage warning.
    this.adapter.error();
  }
  tick(dt:number,ready:boolean,hidden=false){
    if(hidden)return;
    for(const f of [this.pending,this.warm])if(f)f.settled=ready?f.settled+1:0;
    const next=this.pending;if(!next||next.settled<2)return;
    if(!this.started){this.started=true;this.adapter.shown(this.current?.spec??next.spec,next.spec);}
    this.elapsed+=Math.max(0,Math.min(50,dt));
    const t=this.current&&this.duration>0?Math.min(1,this.elapsed/this.duration):1;
    const blend=transitionOpacity(this.opacity,t);
    if(this.current)this.adapter.opacity(this.current.value,blend.bottom);
    this.adapter.opacity(next.value,blend.top);
    if(t===1){this.remove(this.current);this.current=next;this.pending=undefined;this.started=false;this.elapsed=0;this.adapter.opacity(next.value,this.opacity);this.adapter.shown(next.spec);}
  }
  clear(){this.remove(this.pending);this.remove(this.warm);this.remove(this.current);this.pending=this.warm=this.current=undefined;this.started=false;}
}
