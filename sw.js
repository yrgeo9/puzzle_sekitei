// 石庭 service worker: lets the game open offline after the first visit.
const CACHE='sekitei-v2.2.0';
const CORE=['./','index.html','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','apple-touch-icon.png','audio/sounds.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
// only this game's older caches are removed (others on the same origin are left alone)
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('sekitei-v')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  const font=url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com';
  if(url.origin!==location.origin&&!font)return;
  // page and app files: network first so updates arrive, cache as fallback; fonts: cache first.
  // A page is kept under its path alone, so links with ?g=… (shared gardens) do not pile up in the cache.
  if(font){e.respondWith(caches.open(CACHE).then(c=>c.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok||r.type==='opaque')c.put(req,r.clone());return r;}))));return;}
  const key=req.mode==='navigate'?url.origin+url.pathname:req;
  // offline: read from this game's cache only; index.html stands in only when a page is being opened
  e.respondWith(fetch(req).then(r=>{if(r.ok&&r.type==='basic'){const cp=r.clone();caches.open(CACHE).then(c=>c.put(key,cp));}return r;})
    .catch(()=>caches.open(CACHE).then(c=>c.match(key).then(hit=>hit||(req.mode==='navigate'?c.match('index.html'):Response.error())))));
});
