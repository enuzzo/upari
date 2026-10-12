/** Illustrative forward phase, independent of annual measurements or travel speeds. */
export class FlowMotion{
 phase=0;private previous?:number;
 tick(now:number,active:boolean,hidden:boolean){if(!active||hidden){this.previous=undefined;return this.phase;}if(this.previous!==undefined)this.phase=(this.phase+Math.max(0,Math.min(.12,(now-this.previous)/1000))*.26)%1;this.previous=now;return this.phase;}
 suspend(){this.previous=undefined;}
}
