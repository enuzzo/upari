/** React cleans up the viewer before its marker effects on a complete unmount. */
export function removeGlobeEntities<T>(viewer:{isDestroyed:()=>boolean;entities:{remove:(entity:T)=>unknown};scene:{requestRender:()=>void}},entities:T[]){
  if(viewer.isDestroyed())return;
  entities.forEach(entity=>viewer.entities.remove(entity));
  viewer.scene.requestRender();
}
