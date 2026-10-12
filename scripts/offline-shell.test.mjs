import {it,expect} from 'vitest';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {offlineFiles,shellVersion} from './offline-shell.mjs';

it('changes the offline generation when only dataset bytes change and keeps unchanged snapshots stable',async()=>{
 const root=await mkdtemp(join(tmpdir(),'upari-shell-'));
 try{
  await mkdir(join(root,'statistics'));
  await writeFile(join(root,'index.html'),'unchanged-app');await writeFile(join(root,'screensaver.html'),'unchanged-saver');
  await writeFile(join(root,'statistics','energy.json'),'{"value":1}');
  const files=await offlineFiles(root),before=await shellVersion(root,files);
  expect(await shellVersion(root,files)).toBe(before);
  await writeFile(join(root,'statistics','energy.json'),'{"value":2}');
  expect(await shellVersion(root,files)).not.toBe(before);
 }finally{await rm(root,{recursive:true,force:true});}
});
