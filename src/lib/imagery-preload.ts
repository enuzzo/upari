type Bounds={west:number;east:number;south:number;north:number};
/** Partial viewport warm-up, capped at eight public tiles and the source's native matrix level. */
export function preloadTiles(bounds:Bounds,requestedLevel:number,maxLevel:number){
  const z=Math.max(0,Math.min(20,maxLevel,Math.round(requestedLevel))),n=2**z;
  const span=bounds.east>=bounds.west?bounds.east-bounds.west:bounds.east+360-bounds.west;
  const longitude=((bounds.west+span/2+180)%360+360)%360-180;
  const x=Math.min(n-1,Math.floor((longitude+180)/360*n));
  const row=(latitude:number)=>{const a=Math.max(-85.05112878,Math.min(85.05112878,latitude))*Math.PI/180;return Math.max(0,Math.min(n-1,Math.floor((1-Math.asinh(Math.tan(a))/Math.PI)/2*n)));};
  const minY=row(bounds.north),maxY=row(bounds.south),y=Math.floor((minY+maxY)/2);
  const offsets=[[0,0],[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
  const seen=new Set<string>(),tiles:{z:number;x:number;y:number}[]=[];
  for(const [dx,dy] of offsets){
    const tx=(x+dx+n)%n,ty=y+dy,key=`${tx}/${ty}`;
    if(ty<minY||ty>maxY||seen.has(key))continue;
    seen.add(key);tiles.push({z,x:tx,y:ty});if(tiles.length===8)break;
  }
  return tiles;
}
