export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
export function source(item, { reading = false } = {}) { const chapters = [...new Set([item.source, ...(item.additionalSources || [])].filter(Boolean).map(s => s.chapter))]; return `<div class="source">${item.origin === 'site' ? '<span class="badge addition">Companion addition</span>' : ''}${chapters.length ? `${reading ? 'Read more in the book: ' : 'Source: '}${chapters.map(c => c === 'Introduction' ? 'Introduction' : `chapter ${escapeHTML(c)}`).join(' · ')}` : ''}</div>`; }
export function whyLinks(ids, content) { return `<div class="concept-links">${(ids || []).map(id => { const c = content.concepts.find(c => c.id === id); return c ? `<a href="#library/${escapeHTML(c.theme)}/${escapeHTML(id)}">Why? ${escapeHTML(c.title)}</a>` : ''; }).join('')}</div>`; }
export function field(name, label, value = '', options = {}) { const { type = 'text', required = false, help = '', ...attrs } = options; const attr = Object.entries(attrs).map(([k,v]) => `${k}="${escapeHTML(v)}"`).join(' '); return `<label for="${name}">${escapeHTML(label)}${type === 'textarea' ? `<textarea id="${name}" name="${name}" ${required ? 'required' : ''} ${attr}>${escapeHTML(value)}</textarea>` : `<input id="${name}" name="${name}" type="${type}" value="${escapeHTML(value)}" ${required ? 'required' : ''} ${attr}>`}${help ? `<span class="field-help">${escapeHTML(help)}</span>` : ''}</label>`; }
export const formData = form => Object.fromEntries(new FormData(form));
export function notify(message, error = false, target = '#view-message') { const el = $(target); if (el) { el.innerHTML = `<div class="message${error ? ' error' : ''}" role="${error ? 'alert' : 'status'}">${escapeHTML(message)}</div>`; if (error) el.scrollIntoView({ block: 'nearest' }); } const a = $('#announcement'); if (a) a.textContent = message; }
export function download(name, text, type = 'text/plain') { const url = URL.createObjectURL(new Blob([text], {type})); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
let confirmationId = 0;
export function confirmAction({ title, message, confirmLabel, danger = false }) {
  const previousFocus = document.activeElement;
  const id = `confirmation-${++confirmationId}`;
  const dialog = document.createElement('dialog');
  dialog.className = 'confirmation-dialog';
  dialog.setAttribute('aria-labelledby', `${id}-title`);
  dialog.setAttribute('aria-describedby', `${id}-message`);
  dialog.setAttribute('aria-modal', 'true');
  dialog.innerHTML = `<h2 id="${id}-title">${escapeHTML(title)}</h2><p id="${id}-message">${escapeHTML(message)}</p><div class="actions"><button type="button" class="secondary" data-cancel autofocus>Cancel</button><button type="button" ${danger ? 'class="danger"' : ''} data-confirm>${escapeHTML(confirmLabel)}</button></div>`;
  document.body.append(dialog);
  return new Promise(resolve => {
    let finished = false;
    function finish(confirmed) {
      if (finished) return;
      finished = true;
      if (dialog.open) dialog.close();
      dialog.remove();
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
      else $('#main')?.focus({ preventScroll: true });
      resolve(confirmed);
    }
    $('[data-cancel]', dialog).addEventListener('click', () => finish(false));
    $('[data-confirm]', dialog).addEventListener('click', () => finish(true));
    dialog.addEventListener('cancel', event => { event.preventDefault(); finish(false); });
    dialog.addEventListener('close', () => finish(false));
    dialog.showModal();
  });
}
export function heading(step, title, text = '') { return `<div class="page-intro"><div class="section-number">${escapeHTML(step)}</div><h1>${escapeHTML(title)}</h1>${text ? `<p class="lead">${escapeHTML(text)}</p>` : ''}</div><div id="view-message"></div>`; }
export function taskSelector(tasks, selected, route) { return tasks.length ? `<div class="task-select"><label for="selected-task">Choose a task<select id="selected-task">${tasks.map(t => `<option value="${escapeHTML(t.id)}" ${t.id === selected ? 'selected' : ''}>${escapeHTML(t.name)}</option>`).join('')}</select></label><a href="#map">Edit your map</a></div>` : `<div class="empty"><h3>Start with a task from your work.</h3><p>You can add a task manually or choose an optional role example.</p><a class="button" href="#map">Add your first task</a></div>`; }
export const labels = {goal:'Purpose or goal',audience:'Audience',approvedInputs:'Permitted inputs',constraints:'Constraints',successCriteria:'Success criteria',deliverable:'Deliverable',qualityNote:'What was usable?',repairNote:'What needed repair?',errorConsequence:'Consequence of an error',detectabilityNote:'How would you notice?',alternativeNote:'Realistic alternative',verificationMethod:'Evaluation method',reviewerNote:'Who can judge the result?',capabilityToRetain:'Capability to keep developing',practicePlan:'How will you practice it?',personalContribution:'Your personal contribution',keepReason:'Reason to keep this work',workingMode:'Working mode',humanPart:'Your part in the work',delegationSpec:'Agent assignment',completionChecks:'Completion checks',authorityLimits:'Authority limits',checkpoints:'Review checkpoints',reviewPlan:'Review plan',effortComparison:'Full effort comparison',downstreamEffect:'Effect on the next step',workloadBoundary:'Workload boundary',reconsiderationTrigger:'Reason to revisit',permissionNote:'Permission note'};
