import { createStore, localDate } from './store.js';
import { createRouter } from './router.js';
import { $, $$, escapeHTML as e } from './utils.js';
$('.skip').addEventListener('click', event => {
  event.preventDefault();
  const main = $('#main');
  main.focus();
  main.scrollIntoView({ block: 'start' });
});
const names=['big-picture','book-links','concepts','decision-questions','practices','prompt-templates','scenarios','site-copy','task-starters','approved-quotes'];
const content={};
try {
  await Promise.all(names.map(async name=>{const response=await fetch(new URL(`../content/${name}.json`,import.meta.url));if(!response.ok)throw new Error(`Could not load ${name}.`);content[name]=await response.json();}));
  const store=createStore({catalog:content});
  const main=$('#main'); let initial=true, routeSequence=0; const media=matchMedia('(prefers-color-scheme: dark)');
  function appearance(){const theme=store.getState().settings.theme;document.documentElement.dataset.theme=theme==='auto'?(media.matches?'dark':'light'):theme;$('#theme').value=theme;}
  function warning(){const s=store.getStatus(),el=$('#storage-warning');el.hidden=!s.warning;el.innerHTML=s.warning?`${e(s.warning)} <a href="#data">${s.corruptRaw!==null?'Recover saved data':'Export your entries'}</a>`:'';}
  const router=createRouter(async route=>{
    if(initial){initial=false;const due=store.getState().experiments.find(x=>x.status==='active'&&x.checkIn<=localDate());if(due&&route[0]!=='check-in'){router.go('check-in');return;}}
    const sequence=++routeSequence;
    const known=['start','map','test','decide','judgment','experiment','check-in','library','practices','prompts','about','data'];const view=known.includes(route[0])?route[0]:'start';
    try{const module=await import(`./views/${view}.js`);if(sequence!==routeSequence)return;module.render({main,store,content,route,go:router.go,refresh:router.refresh});document.title=`${({start:'Start',map:'Your frontier',test:'Run a test',decide:'Make a choice',judgment:'Practice judgment',experiment:'Try one change','check-in':'Check in',library:'Ideas library',practices:'Practices',prompts:'Prompt workshop',about:'About',data:'My data'})[view]} · Co-Existence unofficial companion`;$$('nav a').forEach(a=>{const target=a.hash.slice(1);if(target===view||(view==='check-in'&&target==='experiment')||(['practices','prompts'].includes(view)&&target==='library'))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});appearance();warning();main.focus({preventScroll:true});if(route[2]&&view==='library'){document.getElementById(`concept-${route[2]}`)?.scrollIntoView({block:'start'});}else window.scrollTo({top:0,behavior:'instant'});}catch(err){if(sequence===routeSequence)main.innerHTML=`<h1>This page could not open.</h1><p>${e(err.message)}</p><a href="#start">Return to the start</a>`;}
  });
  appearance();warning();media.addEventListener('change',appearance);$('#theme').addEventListener('change',ev=>{try{store.setTheme(ev.target.value);appearance();}catch(err){warning();$('#announcement').textContent=err.message;}});store.subscribe(()=>{appearance();warning();});router.start();
  function enableOffline(){if(!('serviceWorker' in navigator))return;let reloadRequested=false;navigator.serviceWorker.register(new URL('../sw.js',import.meta.url),{scope:new URL('../',import.meta.url).href}).then(reg=>{function ready(){if(!navigator.serviceWorker.controller)return;$('#update-notice').hidden=false;$('#apply-update').onclick=()=>{reloadRequested=true;reg.waiting?.postMessage({type:'SKIP_WAITING'});};}if(reg.waiting)ready();reg.addEventListener('updatefound',()=>reg.installing?.addEventListener('statechange',()=>{if(reg.waiting)ready();}));navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloadRequested)location.reload();});}).catch(()=>{$('#announcement').textContent='Offline caching is unavailable in this browser. The companion still works while online.';});}
  // Cache after the initial interface has painted. Initial activation never reloads the notebook.
  if('requestIdleCallback' in window)requestIdleCallback(enableOffline,{timeout:2500});else setTimeout(enableOffline,500);
}catch(err){$('#main').innerHTML=`<h1>The atlas could not load.</h1><p>${e(err.message)} Please reconnect and reload.</p>`;}
