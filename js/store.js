export const STORAGE_KEY = 'coexistence.practice.v1';
export const OUTCOMES = ['excellent', 'usable with fixes', 'failed', 'not tried'];
export const CHOICES = ['use-ai', 'delegate-agent', 'keep-deliberately', 'undecided'];
export const emptyState = () => ({ version: 1, tasks: [], experiments: [], scenarioAnswers: {}, conceptProgress: {}, settings: { theme: 'auto' } });
const clone = value => JSON.parse(JSON.stringify(value));
const uid = () => globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const plain = v => v !== null && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
const str = (v, label, required = false) => { if (typeof v !== 'string' || v.length > 100000 || (required && !v.trim())) throw new Error(`${label} must be ${required ? 'nonempty ' : ''}text.`); };
export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(+d) && d.toISOString().slice(0, 10) === value;
}
function date(v, label) { if (!validDate(v)) throw new Error(`${label} must be a valid calendar date.`); }
export function localDate(value = new Date()) { const d = value instanceof Date ? value : new Date(value); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
export function addDays(value, n) { date(value, 'Date'); const d = new Date(`${value}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
export function daysBetween(a, b) { date(a, 'Date'); date(b, 'Date'); return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000); }
export function latestTest(task, cutoff = '9999-12-31') { return (task.tests || []).filter(t => t.outcome !== 'not tried' && t.date <= cutoff).reduce((last, t) => !last || t.date >= last.date ? t : last, null); }
export function isRetestDue(task, today = localDate()) { const t = latestTest(task); return Boolean(t && daysBetween(t.date, today) >= 90); }
function safeTree(value, depth = 0) {
  if (depth > 25) throw new Error('Imported data is nested too deeply.');
  if (value === null || typeof value === 'boolean' || typeof value === 'number') { if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Invalid number.'); return; }
  if (typeof value === 'string') { str(value, 'Value'); return; }
  if (Array.isArray(value)) { if (value.length > 20000) throw new Error('Too many records.'); value.forEach(v => safeTree(v, depth + 1)); return; }
  if (!plain(value)) throw new Error('Invalid data object.');
  for (const [k, v] of Object.entries(value)) { if (['__proto__', 'constructor', 'prototype'].includes(k)) throw new Error('Unsafe property name.'); safeTree(v, depth + 1); }
}
const optionalStrings = (o, keys) => keys.forEach(k => { if (k in o) str(o[k], k); });
const decisionFields = ['keepReason', 'verifyHabit', 'delegationSpec', 'qualityNote', 'repairNote', 'errorConsequence', 'detectabilityNote', 'alternativeNote', 'verificationMethod', 'reviewerNote', 'capabilityToRetain', 'practicePlan', 'personalContribution', 'workingMode', 'humanPart', 'completionChecks', 'authorityLimits', 'checkpoints', 'reviewPlan', 'effortComparison', 'downstreamEffect', 'workloadBoundary', 'reconsiderationTrigger', 'permissionNote'];
function validateDecision(d, task) {
  if (!plain(d) || !CHOICES.includes(d.choice)) throw new Error('Invalid decision choice.');
  date(d.date, 'Decision date'); optionalStrings(d, decisionFields);
  if (d.workingMode && !['centaur', 'cyborg', 'conjurer', 'unsure'].includes(d.workingMode)) throw new Error('Invalid working mode.');
  if (d.testId !== null && d.testId !== undefined && !task.tests.some(t => t.id === d.testId && t.outcome !== 'not tried')) throw new Error('Decision has a missing supporting test.');
  if (['use-ai', 'delegate-agent'].includes(d.choice) && !d.testId) throw new Error('Using AI or an agent needs a recorded test.');
  if (d.choice === 'use-ai' && !d.verifyHabit?.trim()) throw new Error('Record a verification habit.');
  if (d.choice === 'delegate-agent' && (!d.delegationSpec?.trim() || !d.checkpoints?.trim())) throw new Error('Record an agent assignment and checkpoints.');
  if (d.choice === 'keep-deliberately' && !d.keepReason?.trim()) throw new Error('Record why you want to keep this work.');
  if (d.answers !== undefined) { if (!plain(d.answers)) throw new Error('Invalid decision answers.'); for (const v of Object.values(d.answers)) { if (!plain(v)) throw new Error('Invalid question answer.'); Object.values(v).forEach(a => str(a, 'Answer')); } }
}
function reflection(r) { if (!plain(r)) throw new Error('Invalid reflection.'); for (const k of ['tried', 'happened', 'surprised']) str(r[k], k, true); date(r.date, 'Reflection date'); if (!['keep', 'adjust', 'drop'].includes(r.choice)) throw new Error('Invalid reflection choice.'); }
export function migrate(data) { if (data?.version !== 1) throw new Error(`Unsupported data version: ${data?.version ?? 'missing'}. Version 1 is required.`); return data; }
export function validateState(input, catalog) {
  safeTree(input); const data = migrate(clone(input));
  if (!Array.isArray(data.tasks) || !Array.isArray(data.experiments) || !plain(data.scenarioAnswers)) throw new Error('Expected tasks, experiments and scenarioAnswers.');
  const ids = new Set(); const unique = (id, label) => { str(id, label, true); if (ids.has(id)) throw new Error(`Duplicate ID: ${id}`); ids.add(id); };
  data.tasks.forEach(t => {
    if (!plain(t)) throw new Error('Invalid task.'); unique(t.id, 'Task ID'); str(t.name, 'Task name', true); str(t.frequency, 'Frequency', true);
    if (!Number.isFinite(t.minutesPerWeek) || t.minutesPerWeek <= 0) throw new Error('Minutes per week must be positive.');
    if (!Number.isInteger(t.difficulty) || t.difficulty < 1 || t.difficulty > 5) throw new Error('Difficulty must be from 1 to 5.');
    if (!Array.isArray(t.tests)) throw new Error('Task tests must be an array.');
    t.tests.forEach(test => { if (!plain(test)) throw new Error('Invalid test.'); unique(test.id, 'Test ID'); date(test.date, 'Test date'); str(test.tool, 'Test tool', test.outcome !== 'not tried'); str(test.note, 'Test note'); if (!OUTCOMES.includes(test.outcome)) throw new Error('Invalid test outcome.'); });
    if (t.latestStatus !== undefined) { if (!plain(t.latestStatus) || !OUTCOMES.includes(t.latestStatus.outcome)) throw new Error('Invalid task status.'); date(t.latestStatus.date, 'Status date'); optionalStrings(t.latestStatus, ['tool', 'note']); }
    if (t.promptInputs !== undefined) { if (!plain(t.promptInputs)) throw new Error('Invalid prompt inputs.'); Object.values(t.promptInputs).forEach(v => str(v, 'Prompt input')); }
    optionalStrings(t, ['permission', 'permissionNote']);
    if (t.permission && !['yes', 'adapt', 'unknown'].includes(t.permission)) throw new Error('Invalid permission choice.');
    if (t.decision) validateDecision(t.decision, t);
    if (t.decisionHistory !== undefined) { if (!Array.isArray(t.decisionHistory)) throw new Error('Invalid decision history.'); t.decisionHistory.forEach(d => validateDecision(d, t)); }
  });
  let active = 0;
  data.experiments.forEach(e => {
    if (!plain(e)) throw new Error('Invalid experiment.'); unique(e.id, 'Experiment ID'); if (!data.tasks.some(t => t.id === e.taskId)) throw new Error('Experiment refers to a missing task.');
    for (const k of ['when', 'do', 'insteadOf', 'successSignal']) str(e[k], k, true);
    date(e.start, 'Experiment start'); date(e.checkIn, 'Check-in'); if (!['active', 'kept', 'adjusted', 'dropped'].includes(e.status)) throw new Error('Invalid experiment status.'); if (e.status === 'active') active++;
    if (e.conceptIds !== undefined && (!Array.isArray(e.conceptIds) || e.conceptIds.some(id => typeof id !== 'string'))) throw new Error('Invalid concept references.');
    if (e.reflection !== undefined && typeof e.reflection !== 'string') reflection(e.reflection);
    if (e.history !== undefined) { if (!Array.isArray(e.history)) throw new Error('Invalid experiment history.'); e.history.forEach(h => { if (!plain(h) || !plain(h.commitment)) throw new Error('Invalid previous commitment.'); for (const k of ['when', 'do', 'insteadOf', 'successSignal']) str(h.commitment[k], k, true); date(h.commitment.checkIn, 'Previous check-in'); reflection(h.reflection); }); }
  });
  if (active > 1) throw new Error('Only one experiment may be active.');
  for (const answer of Object.values(data.scenarioAnswers)) { if (!plain(answer)) throw new Error('Invalid scenario answer.'); str(answer.optionId, 'Option', true); date(answer.date, 'Scenario date'); if (answer.conceptIds !== undefined && (!Array.isArray(answer.conceptIds) || answer.conceptIds.some(id => typeof id !== 'string'))) throw new Error('Invalid concept references.'); }
  data.conceptProgress ??= {}; if (!plain(data.conceptProgress)) throw new Error('Invalid reading progress.');
  for (const p of Object.values(data.conceptProgress)) { if (!plain(p)) throw new Error('Invalid reading marker.'); for (const k of ['read', 'acted']) if (p[k] !== undefined) date(p[k], 'Progress date'); }
  data.settings ??= { theme: 'auto' }; if (!plain(data.settings) || !['auto', 'light', 'dark'].includes(data.settings.theme)) throw new Error('Invalid theme.');
  if (catalog) {
    const conceptIds = new Set(catalog.concepts.map(c => c.id));
    const checkConcepts = ids => { if ((ids || []).some(id => !conceptIds.has(id))) throw new Error('A record refers to an unknown concept.'); };
    Object.keys(data.conceptProgress).forEach(id => { if (!conceptIds.has(id)) throw new Error('Reading progress refers to an unknown concept.'); });
    data.experiments.forEach(e => checkConcepts(e.conceptIds));
    Object.entries(data.scenarioAnswers).forEach(([id, answer]) => { const scenario = catalog.scenarios.find(s => s.id === id); if (!scenario || !scenario.options.some(o => o.id === answer.optionId)) throw new Error('A scenario or its chosen option no longer exists.'); checkConcepts(answer.conceptIds); });
  }
  return data;
}
export function createStore({ storage, now = () => new Date(), catalog } = {}) {
  let state = emptyState(); let status = { warning: '', corruptRaw: null, sessionOnly: false }; const listeners = new Set();
  if (storage === undefined) { try { storage = globalThis.localStorage; } catch { status = { ...status, warning: 'Browser storage is unavailable. Changes last for this session only.', sessionOnly: true }; } }
  if (storage) { let raw; try { raw = storage.getItem(STORAGE_KEY); } catch { status = { ...status, warning: 'Browser storage could not be read. Changes last for this session only.', sessionOnly: true }; }
    if (raw) { try { state = validateState(JSON.parse(raw), catalog); } catch (e) { status = { ...status, corruptRaw: raw, warning: `Saved data needs recovery: ${e.message}` }; } }
  } else if (!status.warning) status = { ...status, warning: 'Browser storage is unavailable. Changes last for this session only.', sessionOnly: true };
  const today = () => localDate(now());
  const emit = () => listeners.forEach(fn => fn(clone(state), { ...status }));
  function commit(next) {
    if (status.corruptRaw !== null) throw new Error('Recover or explicitly discard the unreadable saved data on My data before making changes.');
    next = validateState(next, catalog); state = next;
    if (storage && !status.sessionOnly) { try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { status = { ...status, sessionOnly: true, warning: 'Changes are in memory only: browser storage could not be written. Export your data before leaving.' }; } }
    emit(); return clone(state);
  }
  const task = id => { const t = state.tasks.find(t => t.id === id); if (!t) throw new Error('Task not found.'); return t; };
  const update = fn => { const next = clone(state); fn(next); return commit(next); };
  const markActed = (s, conceptIds = []) => conceptIds.forEach(id => { s.conceptProgress[id] = { ...s.conceptProgress[id], acted: today() }; });
  return {
    getState: () => clone(state), getStatus: () => ({ ...status }), subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    addTask(fields) { const id = uid(); update(s => s.tasks.push({ ...fields, id, tests: [], decision: null })); return id; },
    updateTask(id, fields) { task(id); return update(s => { const t = s.tasks.find(t => t.id === id); const allowed = ['name', 'frequency', 'minutesPerWeek', 'difficulty', 'promptInputs', 'permission', 'permissionNote']; allowed.forEach(k => { if (k in fields) t[k] = clone(fields[k]); }); }); },
    deleteTask(id) { task(id); if (state.experiments.some(e => e.taskId === id && e.status === 'active')) throw new Error('Check in on the active experiment before deleting its task.'); if (state.experiments.some(e => e.taskId === id)) throw new Error('This task has experiment history. Keep it so those records remain understandable.'); return update(s => { s.tasks = s.tasks.filter(t => t.id !== id); }); },
    recordTest(id, fields) { task(id); const test = { id: uid(), date: fields.date || today(), tool: fields.tool || '', outcome: fields.outcome, note: fields.note || '' }; update(s => { const t = s.tasks.find(t => t.id === id); if (test.outcome !== 'not tried') t.tests.push(test); t.latestStatus = { ...test }; }); return test.id; },
    saveDecision(id, fields) { const t = task(id); const current = latestTest(t); if (['use-ai', 'delegate-agent'].includes(fields.choice) && (!current || t.latestStatus?.outcome === 'not tried')) throw new Error('Record an actual current test before choosing AI or an agent.'); const d = { ...fields, date: fields.date || today(), testId: current?.id || null }; return update(s => { const target = s.tasks.find(t => t.id === id); target.decisionHistory ??= []; if (target.decision) target.decisionHistory.push(target.decision); target.decision = d; }); },
    startExperiment(fields) { task(fields.taskId); if (state.experiments.some(e => e.status === 'active')) throw new Error('Check in on your active experiment before starting another.'); const id = uid(); update(s => { s.experiments.push({ ...fields, id, start: today(), checkIn: fields.checkIn || addDays(today(), 10), status: 'active', history: [] }); markActed(s, fields.conceptIds); }); return id; },
    checkInExperiment(id, fields) { const e = state.experiments.find(e => e.id === id); if (!e || e.status !== 'active') throw new Error('No active experiment to check in.'); const r = { tried: fields.tried, happened: fields.happened, surprised: fields.surprised, date: today(), choice: fields.choice }; reflection(r); return update(s => { const target = s.experiments.find(e => e.id === id); target.history ??= []; target.history.push({ commitment: { when: target.when, do: target.do, insteadOf: target.insteadOf, successSignal: target.successSignal, checkIn: target.checkIn }, reflection: r }); target.reflection = r; if (fields.choice === 'adjust') { for (const k of ['when', 'do', 'insteadOf', 'successSignal']) { str(fields[k], k, true); target[k] = fields[k]; } date(fields.checkIn, 'New check-in'); target.checkIn = fields.checkIn; target.status = 'active'; } else { target.status = fields.choice === 'keep' ? 'kept' : 'dropped'; target.closed = today(); } }); },
    answerScenario(id, optionId, conceptIds = []) { return update(s => { s.scenarioAnswers[id] = { optionId, conceptIds, date: today() }; markActed(s, conceptIds); }); },
    markConceptRead(id) { return update(s => { s.conceptProgress[id] = { ...s.conceptProgress[id], read: today() }; }); },
    setTheme(theme) { return update(s => { s.settings.theme = theme; }); },
    importJSON(text) { let next; try { next = validateState(JSON.parse(text), catalog); } catch (e) { throw new Error(`Import rejected. ${e.message}`); } return commit(next); },
    exportJSON: () => JSON.stringify(state, null, 2),
    exportMarkdown(credit = 'An unofficial practice companion to Co-Existence by Ethan Mollick. Get the book: https://co-existence.ai/') { const lines = ['# My practice atlas', '', `Exported ${today()}`, '']; for (const t of state.tasks) { lines.push(`## ${t.name}`, `${t.frequency}; ${t.minutesPerWeek} minutes/week; difficulty ${t.difficulty}/5`, '', '### Tests', ...t.tests.map(x => `- ${x.date} · ${x.outcome} · ${x.tool}\n  ${x.note}`)); if (t.latestStatus?.outcome === 'not tried') lines.push(`Latest status: not tried (${t.latestStatus.date}); earlier evidence retained.`); if (t.decision) lines.push('', '### Decision', '```json', JSON.stringify(t.decision, null, 2), '```'); if (t.decisionHistory?.length) lines.push('### Earlier decisions', '```json', JSON.stringify(t.decisionHistory, null, 2), '```'); } lines.push('', '## Experiments', ...state.experiments.map(e => `\n### ${state.tasks.find(t => t.id === e.taskId)?.name || e.taskId}\nWhen ${e.when}, I will ${e.do} rather than ${e.insteadOf}.\nSuccess: ${e.successSignal}\nCheck-in: ${e.checkIn}; ${e.status}\n\nHistory and reflections:\n\x60\x60\x60json\n${JSON.stringify(e.history || [], null, 2)}\n\x60\x60\x60`), '', '## Complete portable record', 'The JSON below preserves all fields for import on My data.', '```json', JSON.stringify(state, null, 2), '```', '', credit); return lines.join('\n'); },
    anonymousSummary() { const counts = Object.fromEntries(CHOICES.map(c => [c, 0])); state.tasks.forEach(t => { if (t.decision) counts[t.decision.choice]++; }); return { version: 1, taskCount: state.tasks.length, actualTestCount: state.tasks.reduce((n, t) => n + t.tests.filter(x => x.outcome !== 'not tried').length, 0), decisions: counts, experimentCounts: Object.fromEntries(['active', 'kept', 'dropped'].map(k => [k, state.experiments.filter(e => e.status === k).length])) }; },
    discardCorrupt() { if (status.corruptRaw === null) return; try { storage?.removeItem(STORAGE_KEY); } catch { status.sessionOnly = true; } status.corruptRaw = null; status.warning = status.sessionOnly ? 'Changes last for this session only.' : ''; state = emptyState(); emit(); },
    reset() { return commit(emptyState()); }
  };
}
export function parseBackup(text) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('Choose a backup or paste JSON first.');
  const input = text.trim();
  if (!input.startsWith('#')) return input;
  // User-authored notes may contain this heading. The exporter appends the real
  // record last; JSON.stringify escapes embedded newlines inside its strings.
  const headings = [...input.matchAll(/^## Complete portable record\r?$/gm)];
  const heading = headings.at(-1);
  if (!heading) throw new Error('This Markdown does not contain a complete portable record. Import the JSON backup instead.');
  const tail = input.slice(heading.index + heading[0].length);
  const record = tail.match(/^```json[\t ]*\r?\n([\s\S]*?)\r?\n```[\t ]*\r?$/m);
  if (!record) throw new Error('This Markdown does not contain a complete portable record. Import the JSON backup instead.');
  return record[1];
}
export function buildICS(experiment, taskName = 'My experiment') {
  date(experiment.checkIn, 'Check-in'); const esc = v => String(v).replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Coexistence Companion//Practice Atlas//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:${esc(experiment.id)}@coexistence-companion.local`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${experiment.checkIn.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${addDays(experiment.checkIn, 1).replace(/-/g, '')}`, `SUMMARY:${esc(`Check in: ${taskName}`)}`, `DESCRIPTION:${esc(`When ${experiment.when}, I will ${experiment.do} rather than ${experiment.insteadOf}.\nSuccess: ${experiment.successSignal}\nWhat did I try? What happened? What surprised me?`)}`, 'END:VEVENT', 'END:VCALENDAR'];
  // RFC 5545 folds at 75 octets, without splitting a UTF-8 character.
  return lines.map(line => { const out = []; let part = ''; let bytes = 0; for (const ch of line) { const n = new TextEncoder().encode(ch).length; if (bytes + n > 75) { out.push(part); part = ' '; bytes = 1; } part += ch; bytes += n; } out.push(part); return out.join('\r\n'); }).join('\r\n') + '\r\n';
}
