import { describe,expect,it } from 'vitest';
import { SkySession,type SkyEnvironment,type SkyStatus } from './sky-session';
function deferred<T>(){let resolve!:(v:T)=>void;let reject!:(e:Error)=>void;const promise=new Promise<T>((ok,no)=>{resolve=ok;reject=no;});return {promise,resolve,reject};}
function media(){let stops=0;const track=new EventTarget() as MediaStreamTrack;track.stop=()=>{stops++;};const stream={getTracks:()=>[track]} as MediaStream;return {stream,track,get stops(){return stops;}};}
function setup(requestCamera:SkyEnvironment['requestCamera'],requestOrientation:SkyEnvironment['requestOrientation']=async()=>true){
  const target=new EventTarget();let visible=true;
  const env:SkyEnvironment={target,requestCamera,requestOrientation,isVisible:()=>visible};
  const video={srcObject:null,play:async()=>{},pause:()=>{}} as unknown as HTMLVideoElement;
  const status:SkyStatus[]=[],angles:unknown[]=[];
  const session=new SkySession(env);
  const start=()=>session.start(video,a=>angles.push(a),s=>status.push(s));
  return {target,video,session,status,angles,start,hide(){visible=false;session.stop();}};
}
function orient(target:EventTarget,type='deviceorientationabsolute',absolute=true){target.dispatchEvent(Object.assign(new Event(type),{alpha:0,beta:90,gamma:0,absolute}));}
describe('gesture-started camera and compass ownership',()=>{
  it('releases a camera that resolves after the page is backgrounded',async()=>{
    const pending=deferred<MediaStream>(),m=media(),s=setup(()=>pending.promise);
    const activation=s.start();s.hide();pending.resolve(m.stream);await activation;
    expect(m.stops).toBe(1);expect(s.video.srcObject).toBeNull();expect(s.status.some(x=>x.camera)).toBe(false);
    orient(s.target);expect(s.angles).toHaveLength(0);
  });
  it('only attaches the newest stream when activation is repeated',async()=>{
    const first=deferred<MediaStream>(),a=media(),b=media();let requests=0;
    const s=setup(()=>++requests===1?first.promise:Promise.resolve(b.stream));
    const old=s.start();await s.start();first.resolve(a.stream);await old;
    expect(a.stops).toBe(1);expect(b.stops).toBe(0);expect(s.video.srcObject).toBe(b.stream);
    s.session.stop();expect(b.stops).toBe(1);expect(s.video.srcObject).toBeNull();
  });
  it('allows the camera with manual guidance when orientation is unavailable or denied',async()=>{
    for(const permission of [async()=>false,async()=>{throw new Error('denied');}]){
      const m=media(),s=setup(async()=>m.stream,permission);await s.start();
      expect(s.video.srcObject).toBe(m.stream);expect(s.status.at(-1)?.camera).toBe(true);expect(s.status.at(-1)?.error).toContain('manuale');
      orient(s.target);expect(s.angles).toHaveLength(0);s.session.stop();
    }
  });
  it('removes compass listeners when the camera fails',async()=>{
    const camera=deferred<MediaStream>(),s=setup(()=>camera.promise);const activation=s.start();
    await Promise.resolve();camera.reject(new DOMException('denied','NotAllowedError'));await activation;
    orient(s.target);expect(s.angles).toHaveLength(0);expect(s.status.at(-1)?.error).toContain('negato');expect(s.video.srcObject).toBeNull();
  });
  it('handles absolute Android and iOS compass events and ignores relative/non-finite readings',async()=>{
    const m=media(),s=setup(async()=>m.stream);await s.start();
    orient(s.target,'deviceorientation',false);expect(s.angles).toHaveLength(0);
    orient(s.target);expect(s.angles).toHaveLength(1);
    s.target.dispatchEvent(Object.assign(new Event('deviceorientation'),{alpha:10,beta:90,gamma:0,absolute:false,webkitCompassHeading:15}));
    expect(s.angles).toHaveLength(2);
    s.target.dispatchEvent(Object.assign(new Event('deviceorientationabsolute'),{alpha:NaN,beta:90,gamma:0,absolute:true}));
    expect(s.angles).toHaveLength(2);
    s.session.stop();orient(s.target);expect(s.angles).toHaveLength(2);
  });
  it('starts both permission requests in the original user gesture',async()=>{
    const m=media(),permission=deferred<boolean>();let askedCamera=false,askedCompass=false;
    const s=setup(()=>{askedCamera=true;return Promise.resolve(m.stream);},()=>{askedCompass=true;return permission.promise;});
    const activation=s.start();expect(askedCamera).toBe(true);expect(askedCompass).toBe(true);
    permission.resolve(true);await activation;s.session.stop();
  });
  it('stops and detaches the camera if the browser revokes a track',async()=>{
    const m=media(),s=setup(async()=>m.stream);await s.start();m.track.dispatchEvent(new Event('ended'));
    expect(s.video.srcObject).toBeNull();expect(m.stops).toBe(1);expect(s.status.at(-1)?.camera).toBe(false);
    orient(s.target);expect(s.angles).toHaveLength(0);
  });
});
