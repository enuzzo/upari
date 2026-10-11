export type SkyAngles={alpha:number;beta:number;gamma:number;compass?:number};
export type SkyStatus={camera:boolean;activating:boolean;error:string};
export type SkyEnvironment={target:EventTarget;requestCamera:()=>Promise<MediaStream>;requestOrientation?:()=>Promise<boolean>;isVisible:()=>boolean};
type OrientationReading=Event&{alpha?:number|null;beta?:number|null;gamma?:number|null;absolute?:boolean;webkitCompassHeading?:number;webkitCompassAccuracy?:number};

/** Owns one gesture-started session. Late permission results never revive a stopped session. */
export class SkySession {
  private generation=0;
  private stream:MediaStream|null=null;
  private video:HTMLVideoElement|null=null;
  private off:(()=>void)[]=[];
  constructor(private env:SkyEnvironment){}
  stop(){
    ++this.generation;
    this.off.splice(0).forEach(remove=>remove());
    this.stream?.getTracks().forEach(track=>track.stop());this.stream=null;
    if(this.video){this.video.pause();this.video.srcObject=null;this.video=null;}
  }
  async start(video:HTMLVideoElement,onAngles:(angles:SkyAngles)=>void,onStatus:(status:SkyStatus)=>void){
    this.stop();const id=this.generation;
    const current=()=>id===this.generation&&this.env.isVisible();
    if(!current())return;
    this.video=video;onStatus({camera:false,activating:true,error:''});
    let warning='';
    // Both APIs are invoked before the first await, while transient activation still exists.
    let permission:Promise<boolean>;
    try{permission=Promise.resolve(this.env.requestOrientation?.()??false).catch(()=>false);}catch{permission=Promise.resolve(false);}
    const orientation=permission.then(granted=>{
      if(!current())return;
      if(!granted){warning='Bussola non disponibile o permesso negato. Usa la guida manuale.';return;}
      const listener=(event:Event)=>{
        if(!current())return;
        const e=event as OrientationReading;
        if(![e.alpha,e.beta,e.gamma].every(x=>typeof x==='number'&&Number.isFinite(x)))return;
        const compass=typeof e.webkitCompassHeading==='number'&&Number.isFinite(e.webkitCompassHeading)&&e.webkitCompassHeading>=0&&e.webkitCompassAccuracy!==-1?e.webkitCompassHeading:undefined;
        if(!e.absolute&&e.type!=='deviceorientationabsolute'&&compass===undefined)return;
        onAngles({alpha:e.alpha!,beta:e.beta!,gamma:e.gamma!,compass});
      };
      for(const name of ['deviceorientationabsolute','deviceorientation']){
        this.env.target.addEventListener(name,listener);this.off.push(()=>this.env.target.removeEventListener(name,listener));
      }
    });
    try{
      const camera=this.env.requestCamera().then(async stream=>{
        if(!current()){stream.getTracks().forEach(track=>track.stop());return;}
        this.stream=stream;video.srcObject=stream;
        for(const track of stream.getTracks()){
          const ended=()=>{if(!current())return;this.stop();onStatus({camera:false,activating:false,error:'Fotocamera interrotta. Puoi riattivarla o usare la guida manuale.'});};
          track.addEventListener('ended',ended);this.off.push(()=>track.removeEventListener('ended',ended));
        }
        await video.play();
      });
      await Promise.all([camera,orientation]);
      if(current())onStatus({camera:true,activating:false,error:warning});
    }catch(e){
      if(!current())return;
      this.stop();
      const name=e instanceof Error?e.name:'';
      const message=name==='NotAllowedError'?'Permesso fotocamera negato.':name==='NotFoundError'?'Nessuna fotocamera disponibile.':'Fotocamera non disponibile.';
      onStatus({camera:false,activating:false,error:message+' Usa la guida manuale.'});
    }
  }
}
export function browserSkyEnvironment():SkyEnvironment {
  const Orientation=(window as unknown as {DeviceOrientationEvent?:{requestPermission?:(absolute?:boolean)=>Promise<string>}}).DeviceOrientationEvent;
  return {
    target:window,isVisible:()=>!document.hidden,
    requestOrientation:Orientation?.requestPermission?()=>Orientation.requestPermission!(true).then(result=>result==='granted'):async()=>!!Orientation,
    requestCamera:()=>{
      if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera unavailable');
      return navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
    },
  };
}
