/** Original single-pass screen shader. WGS84 ray intersection also works without depth textures. */
export const earthShader=`
uniform sampler2D colorTexture;
uniform float spaceAmount;
uniform float atmosphereAmount;
uniform float photographic;
uniform float solarLighting;
uniform float pixelRatio;
in vec2 v_textureCoordinates;
float luma(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
float hash21(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
vec3 ray(vec2 uv){vec4 eye=czm_inverseProjection*vec4(uv*2.0-1.0,1.0,1.0);return normalize(czm_inverseViewRotation*normalize(eye.xyz));}
// Units are equatorial Earth radii. Oblate WGS84, not a circular viewport mask.
float globe(vec3 d,out vec3 normal,out float limbAltitude){
 vec3 o=czm_viewerPositionWC/6378137.0,scale=vec3(1.,1.,6378137.0/6356752.314245);
 vec3 a=o*scale,b=d*scale;float aa=dot(b,b),bb=dot(a,b),cc=dot(a,a)-1.;float disc=bb*bb-aa*cc;
 // Closest ray approach expressed in metres: halo thickness no longer depends on camera distance.
 float closest=-bb/aa;
 limbAltitude=closest>0.?(sqrt(max(0.,dot(a,a)-bb*bb/aa))-1.)*6378137.0:1.e10;
 float t=(-bb-sqrt(max(0.,disc)))/aa;
 normal=normalize((o+d*(disc>0.&&t>0.?t:max(0.,closest)))*scale*scale);
 return disc>0.&&t>0.?1.:0.;
}
vec3 stars(vec2 pixel){
 vec3 bg=vec3(.012,.022,.043);vec2 grid=floor(pixel/46.),local=fract(pixel/46.);
 float seed=hash21(grid),visible=step(.79,seed);vec2 center=vec2(hash21(grid+17.),hash21(grid+73.))*.8+.1;
 float radius=length((local-center)*46.);float dotStar=(1.-smoothstep(.25,.85,radius))*(.25+seed*.36)*visible;
 return bg+mix(vec3(.65,.78,1.),vec3(1.,.89,.72),hash21(grid+121.))*dotStar;
}
void main(){
 vec2 uv=v_textureCoordinates,size=czm_viewport.zw,cssPixel=uv*size/pixelRatio;
 vec4 source=texture(colorTexture,uv);vec3 direction=ray(uv),n;float limbAltitude;float hit=globe(direction,n,limbAltitude);
 vec3 outColor=source.rgb;
 if(hit<.5){
  // A tight blue layer and a softer upper fringe; artistic supplement, not a weather model.
  float altitude=max(0.,limbAltitude),sunlight=dot(n,normalize(czm_sunDirectionWC));
  float day=mix(1.,smoothstep(-.18,.22,sunlight),solarLighting);
  float dusk=smoothstep(-.16,-.035,sunlight)*(1.-smoothstep(-.035,.09,sunlight))*solarLighting;
  float core=exp(-altitude/14000.),outer=exp(-altitude/42000.);
  vec3 glow=(vec3(.065,.30,.64)*core*.42+vec3(.04,.12,.30)*outer*.15)*day;
  glow+=vec3(.46,.17,.045)*core*dusk*.38;
  out_FragColor=vec4(max(source.rgb,stars(cssPixel))+glow*atmosphereAmount,1.);return;
 }
 float facing=max(0.,dot(n,-direction)),sunlight=dot(n,normalize(czm_sunDirectionWC));
 if(photographic>.5){
  float lum=luma(outColor);outColor=mix(vec3(lum),outColor,1.+.08*atmosphereAmount);
  outColor=clamp(outColor*(1.+.03*atmosphereAmount),0.,1.);
  float night=(1.-smoothstep(-.18,.05,sunlight))*solarLighting*spaceAmount;
  outColor*=1.+2.*night;
  // Warm only the brighter pixels already present in the real city-light mosaic.
  // No invented lights, clouds or changing historical acquisition dates.
  outColor+=max(outColor-vec3(.12),vec3(0.))*vec3(3.,1.6,.25)*night;
  // Soft visual volume when solar shading is off. Actual solar lighting remains Cesium's.
  outColor*=mix(1.,.78+.22*pow(facing,.35),spaceAmount*(1.-solarLighting));
  float rim=pow(1.-facing,4.)*atmosphereAmount;
  float day=mix(1.,smoothstep(-.18,.22,sunlight),solarLighting);
  float twilight=smoothstep(-.16,-.035,sunlight)*(1.-smoothstep(-.035,.09,sunlight))*solarLighting*atmosphereAmount;
  outColor+=vec3(.025,.10,.23)*rim*day;
  // Twilight is strongest at the long optical path near the limb, not a painted global band.
  outColor+=vec3(.14,.047,.012)*twilight*(.12+.88*pow(1.-facing,2.));
 }
 out_FragColor=vec4(outColor,source.a);
}`;
