import { readdir } from 'node:fs/promises';
import { relative,resolve } from 'node:path';
/** Include both routes, lazy modules, fonts and the complete local Cesium runtime. */
export async function offlineFiles(root='dist'){
  const entries=await readdir(root,{recursive:true,withFileTypes:true});
  const files=entries.filter(entry=>entry.isFile()).map(entry=>'/'+relative(resolve(root),resolve(entry.parentPath,entry.name)).split('\\').join('/'));
  return ['/',...files.filter(path=>/^\/(?:assets|cesium|fonts)\//.test(path)||['/index.html','/screensaver.html','/icon.svg','/icon-192.png','/icon-512.png','/manifest.webmanifest'].includes(path)).sort()];
}
