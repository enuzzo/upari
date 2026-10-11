const SHELL = 'upari-shell-__VERSION__';
const DATA = 'upari-data-public-v1';
const FILES = /*__SHELL__*/ [];
self.addEventListener('install', e => e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES))));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => (k.startsWith('upari-shell-') && k !== SHELL) || (k.startsWith('upari-data-') && k !== DATA)).map(k => caches.delete(k)))).then(() => self.clients.claim())));
let writes = Promise.resolve();
let cacheBytes = null;
function store(request, response) {
  writes = writes.catch(() => {}).then(async () => {
    const c = await caches.open(DATA);
    const bytes=await response.arrayBuffer();
    const local=new URL(request.url).origin===self.location.origin;
    if(bytes.byteLength>(local?8388608:2097152))return;
    if(cacheBytes===null){cacheBytes=0;for(const k of await c.keys()){const old=await c.match(k);cacheBytes+=+(old?.headers.get('Content-Length')||0);}}
    const previous=await c.match(request);cacheBytes-=+(previous?.headers.get('Content-Length')||0);
    const headers=new Headers(response.headers);headers.delete('Content-Encoding');headers.set('Content-Length',String(bytes.byteLength));
    await c.put(request, new Response(bytes,{status:response.status,statusText:response.statusText,headers}));cacheBytes+=bytes.byteLength;
    const keys = await c.keys();let count=keys.length;
    for (const key of keys){if(count<=120&&cacheBytes<=50331648)break;const old=await c.match(key);cacheBytes-=+(old?.headers.get('Content-Length')||0);await c.delete(key);count--;}
  });
  return writes;
}
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Notification and private gateway traffic must never enter a shared cache.
  if (e.request.headers.has('Authorization')) return;
  const local = u.origin === self.location.origin;
  const localStatic = local && (/^\/(assets|cesium|fonts|vectors)\//.test(u.pathname) || ['/', '/index.html', '/screensaver.html', '/icon.svg', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest'].includes(u.pathname));
  const nasa = u.origin === 'https://gibs.earthdata.nasa.gov' && u.pathname.startsWith('/wmts/') && !u.pathname.endsWith('WMTSCapabilities.xml');
  const swiss = u.origin === 'https://wmts.geo.admin.ch' && /^\/1.0.0\/ch\.swisstopo\.swissimage\/default\/current\/3857\/\d+\/\d+\/\d+\.jpeg$/.test(u.pathname);
  const esriRoot = '/ArcGIS/rest/services/World_Imagery/MapServer';
  const esri = u.origin === 'https://services.arcgisonline.com';
  const esriTile = esri && new RegExp('^' + esriRoot + '/tile/\\d+/\\d+/\\d+$').test(u.pathname);
  const esriMetadata = esri && u.pathname.replace(/\/$/, '') === esriRoot && u.searchParams.get('f') === 'json';
  const navigation = e.request.mode === 'navigate' && local && ['/', '/index.html', '/screensaver.html'].includes(u.pathname);
  const navigationQuery = navigation && [...u.searchParams].every(([key,value]) => key === 'view' && ['earth','sky','alerts'].includes(value));
  const publicQuery = !u.search || navigationQuery || (esriMetadata && [...u.searchParams].every(([key,value]) => key === 'f' && value === 'json'));
  if (!(localStatic || nasa || swiss || esriTile || esriMetadata) || !publicQuery) return;
  e.respondWith((async () => {
    if (e.request.mode === 'navigate') {
      try { return await fetch(e.request); } catch { return (await caches.match(u.pathname === '/screensaver.html' ? '/screensaver.html' : '/index.html')) || Response.error(); }
    }
    const hit = await caches.match(e.request);
    if (hit) return hit;
    try {
      const r = await fetch(e.request);
      // Bounded cache: tiles up to 2 MiB, local modules up to 8 MiB, total 48 MiB / 120 entries.
      if (r.ok && r.type !== 'opaque') e.waitUntil(store(e.request, r.clone()));
      return r;
    } catch { return Response.error(); }
  })());
});
