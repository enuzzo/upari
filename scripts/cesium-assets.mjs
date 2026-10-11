import { cp,mkdir } from 'node:fs/promises';
await mkdir('public/cesium',{recursive:true});
for(const dir of ['Assets','Widgets','Workers','ThirdParty'])await cp(`node_modules/cesium/Build/Cesium/${dir}`,`public/cesium/${dir}`,{recursive:true});
console.log('Development Cesium assets ready.');
