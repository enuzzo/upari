/** Bounded diagnostic of actual postRender intervals and CPU submission, not GPU time. */
export class FrameSample{
  private intervals:number[]=[];
  private costs:number[]=[];
  private previous?:number;
  private started?:number;
  constructor(private limit=300){}
  reset(){this.intervals=[];this.costs=[];this.previous=this.started=undefined;}
  begin(now:number){this.started=now;}
  frame(now:number){
    if(this.started===undefined||this.intervals.length>=this.limit)return;
    if(this.previous!==undefined){this.intervals.push(now-this.previous);this.costs.push(Math.max(0,now-this.started));}
    this.previous=now;
    if(this.intervals.length!==this.limit)return;
    const summary=(values:number[])=>{const sorted=[...values].sort((a,b)=>a-b);return{mean:values.reduce((a,b)=>a+b,0)/values.length,p95:sorted[Math.ceil(.95*sorted.length)-1],max:sorted[sorted.length-1]};};
    const interval=summary(this.intervals),cpu=summary(this.costs);
    return{frames:this.intervals.length,fps:1000/interval.mean,intervalMs:interval,cpuMs:cpu};
  }
}
