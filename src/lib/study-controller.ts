import {initialStudy,validateStudy,type Statistics,type StudyState} from './statistics';
/** Shared by Cesium and the UI: no animation timer, fetch or React render per map frame. */
export class StudyController{
 private state:StudyState;private previous?:number;private published=0;private listeners=new Set<()=>void>();
 constructor(public readonly data:Statistics,initial:Partial<StudyState>={}){this.state=this.normalise({...initialStudy,...initial,enabled:true});}
 private normalise(raw:Partial<StudyState>){
  const s=validateStudy(raw),min=this.data.years[0],max=this.data.years.at(-1)!;
  s.indicator=this.data.indicators.some(m=>m.id===s.indicator)?s.indicator:this.data.indicators[0].id;
  s.secondary=this.data.indicators.some(m=>m.id===s.secondary)?s.secondary:'';
  s.country=this.data.countries.some(r=>r.id===s.country)?s.country:this.data.countries[0].id;
  s.start=Math.max(min,Math.min(max,s.start));s.end=Math.max(s.start,Math.min(max,s.end));s.time=Math.max(s.start,Math.min(s.end,s.time));if(s.start===s.end)s.playing=false;return s;
 }
 snapshot=()=>({...this.state});
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
 private publish(){for(const listener of this.listeners)listener();}
 configure(patch:Partial<StudyState>){this.state=this.normalise({...this.state,...patch});this.publish();}
 seek(time:number){this.previous=undefined;this.configure({time,playing:false});}
 suspend(){this.previous=undefined;}
 advance(now:number,hidden:boolean){
  if(hidden||!this.state.playing){this.previous=undefined;return false;}
  if(this.previous===undefined){this.previous=now;return false;}
  const dt=Math.max(0,Math.min(.12,(now-this.previous)/1000));this.previous=now;if(!dt)return false;
  const s=this.state,span=s.end-s.start;let time=s.time+dt*s.speed;
  if(time>s.end||time<s.start){if(s.loop&&span>0)time=s.start+((time-s.start)%span+span)%span;else{time=Math.max(s.start,Math.min(s.end,time));s.playing=false;}}
  s.time=time;if(now-this.published>=80||!s.playing){this.published=now;this.publish();}return true;
 }
}
