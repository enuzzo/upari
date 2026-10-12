export const defaultRotationSpeed=.08;
/** Camera drift is much slower near the ground; orbital setting is degrees/second. */
export function rotationStep(speed:number,height:number,elapsedMs:number){
 const scale=Math.max(.0001,Math.min(1,height/3000000));
 return speed*scale*Math.max(0,Math.min(100,elapsedMs))/1000;
}
/** Tracks user gestures and elapsed time, without timers or catch-up after suspension. */
export class RotationClock{
 private previous:number|undefined;
 private pointers=new Set<number>();
 private holdUntil=0;
 reset(){this.previous=undefined;}
 suspend(){this.reset();this.pointers.clear();}
 hold(now:number,duration=1800){this.holdUntil=Math.max(this.holdUntil,now+duration);}
 down(id:number){this.pointers.add(id);}
 up(id:number,now:number){if(this.pointers.delete(id))this.hold(now);}
 tick(now:number,speed:number,height:number,hidden=false){
  const elapsed=this.previous===undefined?0:now-this.previous;this.previous=now;
  if(hidden||this.pointers.size||now<this.holdUntil)return 0;
  return rotationStep(speed,height,elapsed);
 }
}
