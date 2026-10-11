const R=Math.PI/180;
type V={x:number;y:number;z:number};
export type CameraPose={forward:V;right:V;up:V;heading:number;elevation:number};
export function sensorPose(alpha:number,beta:number,gamma:number,screenAngle=0,compassHeading?:number,offset=0):CameraPose {
  const a=alpha*R,b=beta*R,g=gamma*R;
  const rotate=(v:V):V=>{const x=Math.cos(g)*v.x+Math.sin(g)*v.z,z=-Math.sin(g)*v.x+Math.cos(g)*v.z;const y=Math.cos(b)*v.y-Math.sin(b)*z,zz=Math.sin(b)*v.y+Math.cos(b)*z;return {x:Math.cos(a)*x-Math.sin(a)*y,y:Math.sin(a)*x+Math.cos(a)*y,z:zz};};
  let f=rotate({x:0,y:0,z:-1}),right=rotate({x:1,y:0,z:0}),up=rotate({x:0,y:1,z:0});
  const adjust=((compassHeading===undefined?0:compassHeading-(360-alpha))+offset)*R;
  const yaw=(v:V)=>({x:v.x*Math.cos(adjust)+v.y*Math.sin(adjust),y:-v.x*Math.sin(adjust)+v.y*Math.cos(adjust),z:v.z});
  f=yaw(f);right=yaw(right);up=yaw(up);
  const s=screenAngle*R;const r={x:right.x*Math.cos(s)+up.x*Math.sin(s),y:right.y*Math.cos(s)+up.y*Math.sin(s),z:right.z*Math.cos(s)+up.z*Math.sin(s)};
  const u={x:-right.x*Math.sin(s)+up.x*Math.cos(s),y:-right.y*Math.sin(s)+up.y*Math.cos(s),z:-right.z*Math.sin(s)+up.z*Math.cos(s)};
  return {forward:f,right:r,up:u,heading:(Math.atan2(f.x,f.y)/R+360)%360,elevation:Math.asin(Math.max(-1,Math.min(1,f.z)))/R};
}
export function manualPose(heading:number,elevation:number):CameraPose {
  const a=heading*R,e=elevation*R;return {forward:{x:Math.cos(e)*Math.sin(a),y:Math.cos(e)*Math.cos(a),z:Math.sin(e)},right:{x:Math.cos(a),y:-Math.sin(a),z:0},up:{x:-Math.sin(e)*Math.sin(a),y:-Math.sin(e)*Math.cos(a),z:Math.cos(e)},heading,elevation};
}
export function projectSky(azimuth:number,elevation:number,pose:CameraPose,width:number,height:number,fov=60) {
  const a=azimuth*R,e=elevation*R,v={x:Math.cos(e)*Math.sin(a),y:Math.cos(e)*Math.cos(a),z:Math.sin(e)};
  const dot=(q:V)=>v.x*q.x+v.y*q.y+v.z*q.z;const depth=dot(pose.forward),focal=width/(2*Math.tan(fov*R/2));
  return {x:width/2+dot(pose.right)*focal/Math.max(.01,depth),y:height/2-dot(pose.up)*focal/Math.max(.01,depth),front:depth>0};
}
