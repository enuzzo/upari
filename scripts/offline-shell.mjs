import { readdir,readFile } from 'node:fs/promises';
import {createHash} from 'node:crypto';
import { relative,resolve } from 'node:path';
/** Include both routes, lazy modules, fonts and the complete local Cesium runtime. */
export async function offlineFiles(root='dist'){
  const entries=await readdir(root,{recursive:true,withFileTypes:true});
  const files=entries.filter(entry=>entry.isFile()).map(entry=>'/'+relative(resolve(root),resolve(entry.parentPath,entry.name)).split('\\').join('/'));
  return ['/',...files.filter(path=>/^\/(?:assets|cesium|fonts|vectors|statistics)\//.test(path)||['/index.html','/screensaver.html','/icon.svg','/icon-192.png','/icon-512.png','/manifest.webmanifest'].includes(path)).sort()];
}

/** Data-only revisions need a fresh generation as much as changed JS/HTML. */
export async function shellVersion(root='dist',files){
  const paths=(files??await offlineFiles(root)).filter(path=>path!='/').sort(),hash=createHash('sha256');
  for(const path of paths){const bytes=await readFile(resolve(root,path.slice(1)));hash.update(path+'\0').update(createHash('sha256').update(bytes).digest());}
  return hash.digest('hex').slice(0,12);
}
