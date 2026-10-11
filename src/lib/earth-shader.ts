/** Original single-pass screen shader. WGS84 ray intersection also works without depth textures. */
export const earthShader=`
uniform sampler2D colorTexture;
uniform float style;
uniform float strength;
uniform float spaceAmount;
uniform float photographic;
uniform float solarLighting;
uniform float pixelRatio;
in vec2 v_textureCoordinates;
float luma(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
float hash21(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
vec3 ray(vec2 uv){vec4 eye=czm_inverseProjection*vec4(uv*2.0-1.0,1.0,1.0);return normalize(czm_inverseViewRotation*normalize(eye.xyz));}
// Units are equatorial Earth radii. Oblate WGS84, not a circular viewport mask.
float globe(vec2 uv,out vec3 normal,out float tangent){
 vec3 o=czm_viewerPositionWC/6378137.0,d=ray(uv),scale=vec3(1.,1.,6378137.0/6356752.314245);
 vec3 a=o*scale,b=d*scale;float aa=dot(b,b),bb=dot(a,b),cc=dot(a,a)-1.;float disc=bb*bb-aa*cc;
 tangent=disc;float t=(-bb-sqrt(max(0.,disc)))/aa;normal=normalize((o+d*t)*scale*scale);
 return disc>0.&&t>0.?1.:0.;
}
vec3 stars(vec2 pixel){
 vec3 bg=vec3(.012,.022,.043);vec2 grid=floor(pixel/46.),local=fract(pixel/46.);
 float seed=hash21(grid),visible=step(.79,seed);vec2 center=vec2(hash21(grid+17.),hash21(grid+73.))*.8+.1;
 float radius=length((local-center)*46.);float dotStar=(1.-smoothstep(.25,.85,radius))*(.25+seed*.36)*visible;
 return bg+mix(vec3(.65,.78,1.),vec3(1.,.89,.72),hash21(grid+121.))*dotStar;
}
float glyph(float index,vec2 p){
 // Five columns, seven rows; row masks stay within exact float precision.
 vec4 a=vec4(0.);vec3 b=vec3(0.);
 if(index<1.){b=vec3(0.,4.,0.);} // .
 else if(index<2.){a=vec4(0.,4.,0.,0.);b=vec3(0.,4.,0.);} // :
 else if(index<3.){a=vec4(0.,0.,0.,31.);} // -
 else if(index<4.){a=vec4(0.,4.,4.,31.);b=vec3(4.,4.,0.);} // +
 else if(index<5.){a=vec4(0.,21.,14.,31.);b=vec3(14.,21.,0.);} // *
 else if(index<6.){a=vec4(0.,14.,17.,17.);b=vec3(17.,14.,0.);} // o
 else if(index<7.){a=vec4(10.,10.,31.,10.);b=vec3(31.,10.,10.);} // #
 else{a=vec4(14.,17.,29.,21.);b=vec3(29.,1.,14.);} // @
 vec2 q=floor(p*vec2(6.,8.));float row=0.;
 if(q.y<1.)row=b.z;else if(q.y<2.)row=b.y;else if(q.y<3.)row=b.x;else if(q.y<4.)row=a.w;else if(q.y<5.)row=a.z;else if(q.y<6.)row=a.y;else if(q.y<7.)row=a.x;
 return q.x<5.?mod(floor(row/pow(2.,q.x)),2.):0.;
}
void main(){
 vec2 uv=v_textureCoordinates,size=czm_viewport.zw,cssPixel=uv*size/pixelRatio;
 vec4 source=texture(colorTexture,uv);vec3 n;float tangent;float hit=globe(uv,n,tangent);
 vec3 background=stars(cssPixel);vec3 outColor=source.rgb;
 if(hit<.5){
  // Analytic thin atmospheric fringe supplements Cesium scattering at orbital distance.
  float halo=exp(-sqrt(max(0.,-tangent))*95.)*spaceAmount;
  vec3 facing=normalize(czm_viewerPositionWC),sun=normalize(czm_sunDirectionWC);
  float lit=mix(1.,.24+.76*max(0.,dot(n,sun)),solarLighting);
  out_FragColor=vec4(max(source.rgb,background)+vec3(.12,.39,.65)*halo*lit*.55,1.);return;
 }
 float facing=max(0.,dot(n,-ray(uv))),sunlight=dot(n,normalize(czm_sunDirectionWC));
 if(photographic>.5){
  float lum=luma(outColor);outColor=mix(vec3(lum),outColor,1.10);
  outColor=clamp(outColor*1.04,0.,1.);
  float night=(1.-smoothstep(-.18,.05,sunlight))*solarLighting*spaceAmount;
  outColor*=1.+2.*night;
  // Warm only the brighter pixels already present in the real city-light mosaic.
  // No invented lights, clouds or changing historical acquisition dates.
  outColor+=max(outColor-vec3(.12),vec3(0.))*vec3(3.,1.6,.25)*night;
  // Soft visual volume when solar shading is off. Actual solar lighting remains Cesium's.
  outColor*=mix(1.,.78+.22*pow(facing,.35),spaceAmount*(1.-solarLighting));
  float rim=pow(1.-facing,3.5)*spaceAmount;
  outColor+=vec3(.02,.11,.20)*rim*mix(1.,smoothstep(-.2,.35,sunlight),solarLighting);
  float twilight=(1.-smoothstep(.0,.12,abs(sunlight)))*solarLighting*spaceAmount;
  outColor+=vec3(.12,.035,.008)*twilight;
 }
 if(style<.5){out_FragColor=vec4(outColor,source.a);return;}
 vec3 styled=outColor;
 if(style<2.5){
  vec2 stepUV=vec2(pixelRatio*1.5)/size;
  float edge=abs(luma(texture(colorTexture,uv+vec2(stepUV.x,0.)).rgb)-luma(texture(colorTexture,uv-vec2(stepUV.x,0.)).rgb))+abs(luma(texture(colorTexture,uv+vec2(0.,stepUV.y)).rgb)-luma(texture(colorTexture,uv-vec2(0.,stepUV.y)).rgb));
  float levels=style<1.5?7.:4.;styled=floor(clamp(outColor*1.08,0.,1.)*levels+.5)/levels;
  if(style>1.5){float band=floor((.4+.6*facing)*4.)/4.;styled*=.65+.35*band;}
  styled=mix(styled,vec3(.014,.028,.05),smoothstep(.10,.32,edge)*(style<1.5?.35:.8));
 }else if(style<3.5){
  vec2 block=vec2(6.)*pixelRatio,center=(floor(uv*size/block)+.5)*block/size;
  styled=floor(texture(colorTexture,center).rgb*7.+.5)/7.;
 }else if(style<4.5){
  vec2 p=cssPixel/13.,r=vec2(1.,1.7320508),h=r*.5,a=mod(p,r)-h,b=mod(p-h,r)-h;
  vec2 local=dot(a,a)<dot(b,b)?a:b,center=(p-local)*13.*pixelRatio/size;
  vec3 color=floor(texture(colorTexture,center).rgb*6.+.5)/6.;
  float face=local.y>abs(local.x)*.57735?1.15:local.x>0.?.82:.64;
  float border=max(abs(local.x)*1.7320508+abs(local.y),2.*abs(local.y));
  styled=color*face*(1.-smoothstep(1.58,1.72,border)*.35);
 }else if(style<5.5){
  vec2 cell=vec2(10.,15.)*pixelRatio,center=(floor(uv*size/cell)+.5)*cell/size;
  vec3 sampleColor=texture(colorTexture,center).rgb;float lum=luma(sampleColor);
  float ink=glyph(min(7.,floor(pow(lum,.7)*8.)),fract(uv*size/cell));
  styled=mix(vec3(.012,.025,.035),mix(sampleColor,vec3(.32,.96,.79),.55)*(.65+lum*.6),ink);
 }else{
  float lum=luma(outColor),stroke=1.-smoothstep(.8,1.3,abs(mod(cssPixel.x+cssPixel.y,6.)-3.));
  float cross=1.-smoothstep(.7,1.2,abs(mod(cssPixel.x-cssPixel.y,7.)-3.5));
  float ink=stroke*(1.-smoothstep(.2,.8,lum))+cross*(1.-smoothstep(.05,.35,lum));
  styled=mix(vec3(.89,.91,.83),vec3(.035,.065,.08),clamp(ink+(1.-lum)*.12,0.,1.));
 }
 out_FragColor=vec4(mix(outColor,styled,strength),source.a);
}`;
