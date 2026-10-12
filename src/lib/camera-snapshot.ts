import type {CameraView} from '../types';
/** Pull expensive native angles on demand; keep a final snapshot after teardown. */
export class CameraSnapshot{
  constructor(private last:CameraView,private source:(()=>CameraView|null)|null){}
  read=()=>{const current=this.source?.();if(current)this.last=current;return this.last;};
  release(){this.read();this.source=null;}
}
