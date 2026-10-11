import { it,expect,vi } from 'vitest';
import { removeGlobeEntities } from './globe-lifecycle';
it('does not access destroyed Cesium collections during later React cleanups',()=>{
  const disposed={isDestroyed:()=>true,get entities():never{throw new Error('Viewer collection already destroyed');},get scene():never{throw new Error('Scene already destroyed');}};
  expect(()=>removeGlobeEntities(disposed,[{id:'place'},{id:'iss'}])).not.toThrow();
});
it('removes live place and ISS entities and requests a redraw',()=>{
  const remove=vi.fn(),requestRender=vi.fn(),viewer={isDestroyed:()=>false,entities:{remove},scene:{requestRender}};
  const markers=[{id:'place'},{id:'track'},{id:'iss'}];
  removeGlobeEntities(viewer,markers);
  expect(remove.mock.calls.map(([entity])=>entity)).toEqual(markers);expect(requestRender).toHaveBeenCalledOnce();
});
