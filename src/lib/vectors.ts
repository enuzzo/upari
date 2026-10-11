export type VectorField={version:1;kind:'wind'|'currents';source:string;sourceURL:string;time:string;period:string;nativeResolution:string;sampleResolution:number;level:string;latitudes:number[];longitudes:number[];u:(number|null)[];v:(number|null)[]};
export function validateField(raw:unknown):VectorField{
  const f=raw as VectorField;
  const axis=(a:number[],limit:number)=>Array.isArray(a)&&a.length>=2&&a.length<=1441&&a.every((n,i)=>Number.isFinite(n)&&Math.abs(n)<=limit&&(i===0||n>a[i-1]));
  if(!f||f.version!==1||!['wind','currents'].includes(f.kind)||!axis(f.latitudes,90)||!axis(f.longitudes,180)||!['source','sourceURL','period','nativeResolution','level'].every(k=>typeof f[k as keyof VectorField]==='string'&&String(f[k as keyof VectorField]).length<=500)||!Number.isFinite(Date.parse(f.time))||!Number.isFinite(f.sampleResolution)||f.sampleResolution<=0)throw new Error('Pacchetto vettoriale non valido.');
  const url=new URL(f.sourceURL);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw new Error('Fonte vettoriale non valida.');
  const size=f.latitudes.length*f.longitudes.length;if(size>260000||!Array.isArray(f.u)||!Array.isArray(f.v)||f.u.length!==size||f.v.length!==size||[...f.u,...f.v].some(n=>n!==null&&(!Number.isFinite(n)||Math.abs(n)>150)))throw new Error('Griglia o velocità non valide (m/s).');
  return {version:1,kind:f.kind,source:f.source,sourceURL:f.sourceURL,time:f.time,period:f.period,nativeResolution:f.nativeResolution,sampleResolution:f.sampleResolution,level:f.level,latitudes:f.latitudes,longitudes:f.longitudes,u:f.u,v:f.v};
}
function interval(axis:number[],value:number){let low=0,high=axis.length-1;if(value<axis[0]||value>axis[high])return -1;while(high-low>1){const mid=(low+high)>>1;if(axis[mid]<=value)low=mid;else high=mid;}return low;}
/** Missing corners invalidate the sample: do not interpolate across masked land. */
export function sampleVector(f:VectorField,longitude:number,latitude:number):{u:number;v:number}|null{
  const lon=((longitude+180)%360+360)%360-180,y=interval(f.latitudes,latitude);if(y<0)return null;
  let x=interval(f.longitudes,lon),right:number,span:number,offset:number;
  if(x<0){const gap=f.longitudes[0]+360-f.longitudes.at(-1)!;if(gap>f.sampleResolution*1.1)return null;x=f.longitudes.length-1;right=0;span=gap;offset=(lon-f.longitudes[x]+360)%360;}else{right=x+1;span=f.longitudes[right]-f.longitudes[x];offset=lon-f.longitudes[x];}
  const tx=offset/span,ty=(latitude-f.latitudes[y])/(f.latitudes[y+1]-f.latitudes[y]),width=f.longitudes.length;
  const indices=[y*width+x,y*width+right,(y+1)*width+x,(y+1)*width+right],weights=[(1-tx)*(1-ty),tx*(1-ty),(1-tx)*ty,tx*ty];
  if(indices.some(i=>f.u[i]===null||f.v[i]===null))return null;
  return {u:indices.reduce((n,i,k)=>n+f.u[i]!*weights[k],0),v:indices.reduce((n,i,k)=>n+f.v[i]!*weights[k],0)};
}
/** Midpoint advection, WGS84 local radii, real m/s and explicitly accelerated display time. */
export function advect(f:VectorField,longitude:number,latitude:number,seconds:number){
  const step=(lon:number,lat:number,dt:number)=>{const q=sampleVector(f,lon,lat);if(!q||Math.abs(lat)>85)return null;const phi=lat*Math.PI/180,e2=.00669437999014,den=1-e2*Math.sin(phi)**2,N=6378137/Math.sqrt(den),M=6378137*(1-e2)/den**1.5;return {longitude:lon+q.u*dt/(N*Math.cos(phi))*180/Math.PI,latitude:lat+q.v*dt/M*180/Math.PI,speed:Math.hypot(q.u,q.v)};};
  const mid=step(longitude,latitude,seconds/2);if(!mid)return null;const velocity=sampleVector(f,mid.longitude,mid.latitude);if(!velocity)return null;
  const q=step(mid.longitude,mid.latitude,seconds);if(!q)return null;
  const next={longitude:((longitude+(q.longitude-mid.longitude)+180)%360+360)%360-180,latitude:latitude+(q.latitude-mid.latitude),speed:q.speed};
  return sampleVector(f,next.longitude,next.latitude)?next:null;
}
