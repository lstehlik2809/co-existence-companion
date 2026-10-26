import { latestTest } from './store.js';
import { escapeHTML as e } from './utils.js';
export const outcomeLabels = { excellent: 'Excellent', 'usable with fixes': 'Usable with fixes', failed: 'Failed', 'not tried': 'Untested' };
const success = outcome => outcome === 'excellent' || outcome === 'usable with fixes';
export function marker(outcome, x, y, keep = false, size = 7) {
  const color = outcome === 'excellent' ? 'var(--tide)' : outcome === 'usable with fixes' ? 'var(--iris)' : outcome === 'failed' ? 'var(--ochre)' : 'var(--muted)';
  let shape = outcome === 'excellent' ? `<circle cx="${x}" cy="${y}" r="${size}" fill="${color}" stroke="${color}"/>` : outcome === 'usable with fixes' ? `<rect x="${x-size}" y="${y-size}" width="${size*2}" height="${size*2}" fill="${color}" stroke="${color}"/>` : outcome === 'failed' ? `<path class="cross" d="M${x-size} ${y-size}l${size*2} ${size*2}m0 -${size*2}l-${size*2} ${size*2}" stroke="${color}" fill="none"/>` : `<circle cx="${x}" cy="${y}" r="${size}" fill="var(--sheet)" stroke="${color}"/>`;
  if (keep) shape += `<path class="keep" d="M${x} ${y-size*2}l${size*2} ${size*2}-${size*2} ${size*2}-${size*2}-${size*2}Z"/>`;
  return `<g class="marker">${shape}</g>`;
}
// Small inline key glyphs, reused by the legend and the task table.
export function glyph(outcome) { return `<svg class="glyph" viewBox="0 0 20 20" aria-hidden="true">${marker(outcome, 10, 10, false, 5)}</svg>`; }
const keepGlyph = '<svg class="glyph" viewBox="0 0 20 20" aria-hidden="true"><path class="keep" d="M10 1l9 9-9 9-9-9Z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
export function legend({ compare = false } = {}) {
  const items = Object.entries(outcomeLabels).map(([o, l]) => `<span>${glyph(o)}${l}</span>`);
  items.push(`<span>${keepGlyph}Kept deliberately</span>`, '<span><svg class="glyph wide" viewBox="0 0 26 10" aria-hidden="true"><line class="polygon" x1="1" y1="5" x2="25" y2="5"/></svg>Neighboring successes</span>');
  if (compare) items.push('<span><svg class="glyph wide" viewBox="0 0 26 10" aria-hidden="true"><line class="ghost" x1="1" y1="5" x2="25" y2="5"/></svg>Successes 90 days ago</span>', '<span><svg class="glyph" viewBox="0 0 20 20" aria-hidden="true"><circle class="changed" cx="10" cy="10" r="7"/></svg>Result changed since then</span>');
  return `<div class="legend" aria-label="Map key">${items.join('')}</div>`;
}
function place(tasks, cutoff, cx, cy, radius) {
  return tasks.map((t, i) => {
    const angle = -Math.PI / 2 + i * Math.PI * 2 / Math.max(tasks.length, 1), r = 31 + (t.difficulty - 1) * 31;
    const outcome = !cutoff && t.latestStatus?.outcome === 'not tried' ? 'not tried' : latestTest(t, cutoff)?.outcome || 'not tried';
    return { t, i, outcome, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, lx: cx + Math.cos(angle) * (radius + 31), ly: cy + Math.sin(angle) * (radius + 31) };
  });
}
// Join only tasks that sit next to each other and both succeeded. A failed or untested task breaks the line,
// so the outline never encloses or passes over a result it does not represent.
function outline(points, cls) {
  if (points.length < 2) return '';
  if (points.length >= 3 && points.every(p => success(p.outcome))) return `<polygon class="${cls}" points="${points.map(p => `${p.x},${p.y}`).join(' ')}"/>`;
  const pairs = points.length === 2 ? [[points[0], points[1]]] : points.map((p, i) => [p, points[(i + 1) % points.length]]);
  const d = pairs.filter(([a, b]) => success(a.outcome) && success(b.outcome)).map(([a, b]) => `M${a.x} ${a.y}L${b.x} ${b.y}`).join('');
  return d ? `<path class="${cls}" d="${d}"/>` : '';
}
export function frontierMap(tasks, { cutoff, compareCutoff, demo = false } = {}) {
  const cx = 240, cy = 217, radius = 155;
  const points = place(tasks, cutoff, cx, cy, radius), past = compareCutoff ? place(tasks, compareCutoff, cx, cy, radius) : null;
  const latestDecision = t => [...(t.decisionHistory || []), t.decision].filter(d => d && (!cutoff || d.date <= cutoff)).sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  // Ring labels sit on the bisector between the first and last task, away from every task's spoke.
  const labelAngle = tasks.length > 1 ? -Math.PI / 2 - Math.PI / tasks.length : -Math.PI / 4;
  const rings = [1, 2, 3, 4, 5].map(n => `<circle class="ring" cx="${cx}" cy="${cy}" r="${n*31}"/><text class="ring-label" x="${(cx + Math.cos(labelAngle) * n * 31).toFixed(1)}" y="${(cy + Math.sin(labelAngle) * n * 31).toFixed(1)}" text-anchor="middle" dy="4">${n}</text>`).join('');
  const axes = points.map(p => `<line class="axis" x1="${cx}" y1="${cy}" x2="${p.lx}" y2="${p.ly}"/>`).join('');
  const marks = points.map(p => {
    const keep = latestDecision(p.t)?.choice === 'keep-deliberately', changed = past && past[p.i].outcome !== p.outcome;
    return `<g><title>${e(p.t.name)}: difficulty ${p.t.difficulty}, ${e(outcomeLabels[p.outcome].toLowerCase())}${keep ? ', kept deliberately' : ''}${changed ? `, was ${e(outcomeLabels[past[p.i].outcome].toLowerCase())} on ${e(compareCutoff)}` : ''}</title>${changed ? `<circle class="changed" cx="${p.x}" cy="${p.y}" r="13"/>` : ''}${marker(p.outcome, p.x, p.y, keep)}<text x="${p.lx}" y="${p.ly}" text-anchor="${p.lx > cx+10 ? 'start' : p.lx < cx-10 ? 'end' : 'middle'}" dy="4">${String(p.i+1).padStart(2,'0')}</text></g>`;
  }).join('');
  return `<svg class="frontier" viewBox="0 0 480 435" role="img" aria-label="${demo ? 'Example' : 'Your'} task frontier. Distance shows personal difficulty, shapes show test outcomes. A text alternative follows."><g>${rings}${axes}${past ? outline(past, 'ghost') : ''}${outline(points, 'polygon')}${marks}<circle cx="${cx}" cy="${cy}" r="3" fill="var(--muted)"/>${!tasks.length ? '<text x="240" y="400" text-anchor="middle">Your tasks will make this map yours.</text>' : ''}</g></svg>`;
}
