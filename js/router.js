export function currentRoute() { const raw=location.hash.slice(1)||'start'; return raw.split('/').map(v=>{try{return decodeURIComponent(v);}catch{return '';}}); }
export function createRouter(render) { const run=()=>render(currentRoute()); window.addEventListener('hashchange',run); return { start:run, refresh:run, go(path){if(location.hash===`#${path}`)run();else location.hash=path;} }; }
