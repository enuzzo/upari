import {Color,Material} from 'cesium';
/** Original Fabric material: soft ribbon and moving directional chevrons, no geometry churn. */
export function flowMaterial(color:Color,offset:number){return new Material({fabric:{type:'UpariStudyFlow',uniforms:{color,phase:0,offset},source:`
czm_material czm_getMaterial(czm_materialInput materialInput){
 czm_material material=czm_getDefaultMaterial(materialInput);
 vec2 uv=materialInput.st;float center=abs(uv.y-.5)*2.;
 float lane=1.-smoothstep(.12,1.,center);
 float cell=fract(uv.x*5.-phase-offset);
 float head=smoothstep(.48,.53,cell)*(1.-smoothstep(.88,.93,cell));
 float halfWidth=max(0.,(.93-cell)/.43)*.9;
 head*=1.-smoothstep(halfWidth-.12,halfWidth,center);
 float trail=exp(-6.*fract(phase+offset-uv.x*5.))*(1.-smoothstep(.12,.38,center));
 float light=max(head,trail);
 material.diffuse=color.rgb*.25;
 material.emission=color.rgb*(.3+light*.4);
 material.alpha=color.a*(lane*.15+light*.85)*(1.-smoothstep(.94,1.,center));
 return material;
}`},translucent:true});}
