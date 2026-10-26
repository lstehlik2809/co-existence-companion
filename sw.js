const CACHE = 'coexistence-atlas-v1.0.3';
const ROOT = new URL('./', self.location.href);
const FILES = ['./','index.html','favicon.svg','manifest.webmanifest','css/style.css','js/app.js','js/store.js','js/router.js','js/utils.js','js/frontier-map.js','js/views/start.js','js/views/map.js','js/views/test.js','js/views/decide.js','js/views/practices.js','js/views/library.js','js/views/judgment.js','js/views/experiment.js','js/views/check-in.js','js/views/data.js','js/views/about.js','js/views/prompts.js',...['approved-quotes','big-picture','book-links','concepts','decision-questions','practices','prompt-templates','scenarios','site-copy','task-starters'].map(n=>`content/${n}.json`)];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(path=>new URL(path,ROOT).href)))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('coexistence-atlas-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;
  if(!FILES.some(path=>new URL(path,ROOT).pathname===url.pathname))return;
  event.respondWith(caches.open(CACHE).then(async cache=>{const hit=await cache.match(event.request,{ignoreSearch:true});if(hit)return hit;const response=await fetch(event.request);if(response.ok)cache.put(event.request,response.clone());return response;}));
});
