import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
// Load the browser-native module without requiring package.json or a bundler.
const source = await readFile(new URL('../js/store.js', import.meta.url), 'utf8');
const {createStore, STORAGE_KEY, latestTest, isRetestDue, buildICS, parseBackup} = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const catalog = Object.fromEntries(await Promise.all(['concepts','scenarios'].map(async name=>[name,JSON.parse(await readFile(new URL(`../content/${name}.json`,import.meta.url),'utf8'))])));

let passed = 0;
function check(label, run) {
  try { run(); passed++; console.log(`PASS: ${label}`); }
  catch (error) { console.error(`FAIL: ${label}`); throw error; }
}
const memory = () => {
  const entries = new Map();
  return {entries, getItem:k=>entries.get(k) ?? null, setItem:(k,v)=>entries.set(k,v), removeItem:k=>entries.delete(k)};
};
const now = () => new Date(2026, 9, 26, 12);
const storage = memory();
const store = createStore({storage, now});
const getTask = id => store.getState().tasks.find(t=>t.id === id);
const add = name => {
  store.addTask({name, frequency:'Weekly', minutesPerWeek:60, difficulty:3});
  return store.getState().tasks.at(-1).id;
};
const trial = (id, overrides={}) => store.recordTest(id,{date:'2026-10-26',tool:'A locally chosen model',outcome:'excellent',note:'Independent records checked.',...overrides});
const experiment = (id, extra={}) => ({taskId:id,when:'I prepare the weekly note',do:'check one result against source records',insteadOf:'rely on fluency',successSignal:'I catch unsupported claims',checkIn:'2026-11-05',conceptIds:['plausible-output'],...extra});
let ids;

check('Empty browser starts with no personal tasks or experiments',()=>{
  assert.equal(store.getState().version,1);
  assert.deepEqual(store.getState().tasks,[]);
  assert.deepEqual(store.getState().experiments,[]);
});
check('Three reader-owned tasks persist with validated edits',()=>{
  ids=['Private Sentinel Alpha','Weekly review','A note with my own voice'].map(add);
  store.updateTask(ids[0],{difficulty:5,minutesPerWeek:125});
  assert.equal(getTask(ids[0]).difficulty,5);
  assert.equal(getTask(ids[0]).minutesPerWeek,125);
  assert.equal(createStore({storage,now}).getState().tasks.length,3);
  assert.deepEqual([...storage.entries.keys()],[STORAGE_KEY]);
  assert.throws(()=>store.updateTask(ids[0],{difficulty:6}));
  assert.throws(()=>store.updateTask(ids[0],{minutesPerWeek:-2}));
});
check('Untested AI decisions are blocked; deliberate personal contribution is available',()=>{
  assert.throws(()=>store.saveDecision(ids[0],{choice:'use-ai',verifyHabit:'Check records'}));
  assert.throws(()=>store.saveDecision(ids[0],{choice:'delegate-agent',delegationSpec:'Produce note',checkpoints:'Before delivery'}));
  store.saveDecision(ids[2],{choice:'keep-deliberately',keepReason:'voice'});
  assert.equal(getTask(ids[2]).decision.keepReason,'voice');
  assert.equal(latestTest(getTask(ids[2])),null);
});
check('Not tried never becomes evidence and preserves real trial history',()=>{
  store.recordTest(ids[0],{outcome:'not tried'});
  assert.equal(latestTest(getTask(ids[0])),null);
  trial(ids[0],{date:'2026-07-28',outcome:'failed',note:'Older failure'});
  trial(ids[0],{date:'2026-10-26',outcome:'usable with fixes',note:'A different outcome after repair'});
  assert.equal(latestTest(getTask(ids[0])).outcome,'usable with fixes');
  const before = getTask(ids[0]).tests.filter(t=>t.outcome!=='not tried').length;
  store.recordTest(ids[0],{outcome:'not tried'});
  assert.equal(getTask(ids[0]).tests.filter(t=>t.outcome!=='not tried').length,before);
  assert.equal(latestTest(getTask(ids[0])).date,'2026-10-26');
  assert.throws(()=>store.saveDecision(ids[0],{choice:'use-ai',verifyHabit:'Check source records'}));
});
check('Retest boundary and historical evidence use calendar dates',()=>{
  const old={tests:[{id:'old',date:'2026-07-28',outcome:'failed'},{id:'new',date:'2026-10-26',outcome:'excellent'}]};
  assert.equal(latestTest(old,'2026-07-27'),null);
  assert.equal(latestTest(old,'2026-07-28').outcome,'failed');
  assert.equal(isRetestDue({tests:[old.tests[0]]},'2026-10-25'),false);
  assert.equal(isRetestDue({tests:[old.tests[0]]},'2026-10-26'),true);
});
check('Decision answers and supporting trial survive newer evidence',()=>{
  trial(ids[1]);
  const testId=latestTest(getTask(ids[1])).id;
  store.saveDecision(ids[1],{choice:'use-ai',verifyHabit:'Check source totals',answers:{'working-mode':{workingMode:'cyborg',humanPart:'Interpret the result'},'agent-checkpoints':{authorityLimits:'Draft only'}},workingMode:'cyborg'});
  assert.equal(getTask(ids[1]).decision.testId,testId);
  trial(ids[1],{note:'A newer attempt',outcome:'failed'});
  assert.equal(getTask(ids[1]).decision.testId,testId);
  assert.equal(getTask(ids[1]).decision.answers['agent-checkpoints'].authorityLimits,'Draft only');
});
check('Scenario choices, reading state and untrusted text survive serialization',()=>{
  store.answerScenario('analyst-unchecked-rate','b',['plausible-output']);
  store.answerScenario('planner-old-failure','a',['jagged-frontier']);
  store.markConceptRead('plausible-output');
  store.updateTask(ids[0],{name:'<img src=x onerror=alert(1)> Private Sentinel Alpha'});
  assert.ok(store.exportJSON().includes('Private Sentinel Alpha'));
  assert.ok(store.getState().scenarioAnswers['analyst-unchecked-rate']);
});
check('One experiment at a time and referenced-task deletion are enforced',()=>{
  store.startExperiment(experiment(ids[0]));
  assert.throws(()=>store.startExperiment(experiment(ids[1])));
  assert.throws(()=>store.deleteTask(ids[0]));
  assert.equal(store.getState().experiments.filter(e=>e.status==='active').length,1);
});
check('Adjustment retains original observation and continues the single experiment',()=>{
  const id=store.getState().experiments[0].id;
  store.checkInExperiment(id,{choice:'adjust',tried:'I checked one total',happened:'It caught an error',surprised:'Review was quick',...experiment(ids[0],{do:'check two totals',checkIn:'2026-11-15'})});
  const state=store.getState();
  const active=state.experiments.filter(e=>e.status==='active');
  assert.equal(active.length,1);
  assert.equal(active[0].do,'check two totals');
  const serialized=JSON.stringify(state.experiments);
  assert.ok(serialized.includes('It caught an error'));
  assert.ok(serialized.includes('check one result against source records'));
  assert.equal(active[0].checkIn,'2026-11-15');
});
check('Calendar output retains intended all-day date and valid event boundaries',()=>{
  const text=buildICS(store.getState().experiments.find(e=>e.status==='active'),'Test, semicolon; backslash\\ and Žluťoučký');
  assert.match(text,/BEGIN:VCALENDAR\r?\n/);
  assert.match(text,/BEGIN:VEVENT\r?\n/);
  assert.match(text,/DTSTART;VALUE=DATE:20261115/);
  assert.match(text,/UID:/);
  assert.match(text,/END:VEVENT\r?\n/);
  assert.match(text,/END:VCALENDAR/);
  for(const line of text.trimEnd().split('\r\n')) assert.ok(Buffer.byteLength(line,'utf8')<=75,'Calendar lines fold at 75 octets');
  const unfolded=text.replace(/\r\n /g,'');
  assert.match(unfolded,/SUMMARY:Check in: Test\\, semicolon\\; backslash\\\\ and Žluťoučký/);
});
check('Anonymous summary excludes task names, notes, prompts and identifiers',()=>{
  const summary=JSON.stringify(store.anonymousSummary());
  for(const sentinel of ['Private Sentinel','onerror','Independent records','I prepare','plausible-output',...ids]) assert.ok(!summary.includes(sentinel));
  assert.ok(summary.includes('3'));
});
check('Invalid imports fail atomically across structural and relationship errors',()=>{
  const snapshot=store.exportJSON();
  const bads=[
    x=>x.version=42,
    x=>x.tasks[0].difficulty=0,
    x=>x.tasks[0].tests[0].outcome='amazing',
    x=>x.tasks[1].tests[0].date='2026-02-30',
    x=>x.tasks[1].id=x.tasks[0].id,
    x=>x.experiments[0].taskId='nonexistent',
    x=>x.experiments.push({...x.experiments.find(e=>e.status==='active'),id:'another-active'})
  ];
  assert.throws(()=>store.importJSON('{broken'));
  for(const change of bads){const bad=JSON.parse(snapshot);change(bad);assert.throws(()=>store.importJSON(JSON.stringify(bad)));assert.equal(store.exportJSON(),snapshot);}
});
check('JSON reset/import is lossless and Markdown includes history and book credit',()=>{
  const before=JSON.parse(store.exportJSON());
  const markdown=store.exportMarkdown('Unofficial companion. Get the book: https://co-existence.ai/');
  for(const text of ['Private Sentinel','Older failure','It caught an error','https://co-existence.ai/']) assert.ok(markdown.includes(text),text);
  store.reset();
  assert.equal(store.getState().tasks.length,0);
  store.importJSON(JSON.stringify(before));
  assert.deepEqual(JSON.parse(store.exportJSON()),before);
  assert.deepEqual(createStore({storage,now}).getState(),before);
});
check('Keep and drop close experiments and permit the next one',()=>{
  let active=store.getState().experiments.find(e=>e.status==='active');
  store.checkInExperiment(active.id,{choice:'keep',tried:'Again',happened:'Useful',surprised:'Nothing'});
  assert.equal(store.getState().experiments.filter(e=>e.status==='active').length,0);
  store.startExperiment(experiment(ids[1]));
  active=store.getState().experiments.find(e=>e.status==='active');
  store.checkInExperiment(active.id,{choice:'drop',tried:'Tested',happened:'Too costly',surprised:'Review load'});
  assert.equal(store.getState().experiments.filter(e=>e.status==='active').length,0);
});
check('Corrupt storage is recoverable and not silently overwritten',()=>{
  const corrupt=memory();corrupt.setItem(STORAGE_KEY,'{invalid');
  const recovering=createStore({storage:corrupt,now});
  assert.equal(corrupt.getItem(STORAGE_KEY),'{invalid');
  assert.ok(recovering.getStatus());
  assert.throws(()=>recovering.setTheme('dark'));
  assert.equal(corrupt.getItem(STORAGE_KEY),'{invalid');
  recovering.discardCorrupt();
  recovering.addTask({name:'Recovered',frequency:'Weekly',minutesPerWeek:30,difficulty:2});
  assert.ok(corrupt.getItem(STORAGE_KEY).includes('Recovered'));
});
check('Denied storage leaves usable session state without throwing',()=>{
  const denied={getItem(){throw new Error('denied');},setItem(){throw new Error('quota');},removeItem(){throw new Error('denied');}};
  const transient=createStore({storage:denied,now});
  assert.doesNotThrow(()=>transient.addTask({name:'Session only',frequency:'Weekly',minutesPerWeek:30,difficulty:2}));
  assert.equal(transient.getState().tasks.length,1);
  assert.ok(transient.getStatus());
});
check('Markdown backup is lossless when reader text resembles its own delimiters',()=>{
  const tricky=createStore({storage:memory(),now});
  const id=tricky.addTask({name:'Complete portable record',frequency:'Weekly',minutesPerWeek:15,difficulty:2});
  tricky.recordTest(id,{date:'2026-10-26',tool:'QA',outcome:'excellent',note:'## Complete portable record\n```json\n{"version":99}\n```'});
  tricky.saveDecision(id,{choice:'use-ai',verifyHabit:'Check my notes\n## Complete portable record\n```json\n{}\n```'});
  const expected=JSON.parse(tricky.exportJSON());
  for(const markdown of [tricky.exportMarkdown(),tricky.exportMarkdown().replace(/\n/g,'\r\n')]) {
    const restored=createStore({storage:memory(),now});
    restored.importJSON(parseBackup(markdown));
    assert.deepEqual(restored.getState(),expected);
  }
  assert.throws(()=>parseBackup('# Notebook without a portable record'));
});
check('Catalog-backed imports reject unknown concepts, scenarios and options atomically',()=>{
  const checked=createStore({storage:memory(),now,catalog});
  checked.importJSON(store.exportJSON());
  const before=checked.exportJSON();
  for(const change of [
    d=>d.conceptProgress['not-a-concept']={read:'2026-10-26'},
    d=>d.experiments[0].conceptIds=['not-a-concept'],
    d=>d.scenarioAnswers['not-a-scenario']={optionId:'a',conceptIds:[],date:'2026-10-26'},
    d=>d.scenarioAnswers['analyst-unchecked-rate'].optionId='not-an-option'
  ]){const invalid=JSON.parse(before);change(invalid);assert.throws(()=>checked.importJSON(JSON.stringify(invalid)));assert.equal(checked.exportJSON(),before);}
});
console.log(`\n${passed} behavioral storage checks passed.`);
