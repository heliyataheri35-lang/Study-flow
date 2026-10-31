/* Planner service worker — bump V on every release */
const V='planner-v4',
  STATIC=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./Kalameh-Medium.woff'];

self.addEventListener('install',e=>e.waitUntil(
  caches.open(V)
    .then(c=>c.addAll(STATIC.map(u=>new Request(u,{cache:'reload'}))))
    .then(()=>self.skipWaiting())
));

self.addEventListener('activate',e=>e.waitUntil(
  caches.keys()
    .then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x))))
    .then(()=>self.clients.claim())
));

const net=(req,ms)=>new Promise((ok,no)=>{
  const id=setTimeout(no,ms);
  fetch(req).then(r=>{clearTimeout(id);ok(r)},e=>{clearTimeout(id);no(e)});
});
const put=(req,res)=>{ if(res.ok||res.type==='opaque'){const c=res.clone();caches.open(V).then(x=>x.put(req,c))} return res; };

self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);

  // Pages: network first (so updates show up immediately), cache as offline fallback.
  if(r.mode==='navigate'){
    e.respondWith(net(r,4000).then(n=>put('./index.html',n)).catch(()=>caches.match('./index.html')));
    return;
  }
  // Own files: serve from cache instantly, refresh in the background.
  if(u.origin===location.origin){
    e.respondWith(caches.match(r).then(c=>{
      const f=fetch(r).then(n=>put(r,n)).catch(()=>c||Response.error());
      return c||f;
    }));
  }
});
