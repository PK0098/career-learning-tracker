// tracker-core.js — shared schedule math + localStorage persistence
// Used by both Tracker Mobile.dc.html and Tracker Desktop.dc.html

export const LS_PROGRESS = 'clt.progress.v1';

const pad = (n) => String(n).padStart(2, '0');
export const keyOf = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const parseDate = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); };
export const isStudyDay = (d) => d.getDay() >= 1 && d.getDay() <= 5; // Mon–Fri
export const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };

export function parseHours(s) { const m = /(\d+(?:\.\d+)?)/.exec(String(s || '')); return m ? +m[1] : null; }

// Count Mon–Fri days between two dates, inclusive.
export function studyDaysBetween(start, end) {
  let c = 0; const d = new Date(start);
  while (d <= end) { if (isStudyDay(d)) c++; d.setDate(d.getDate() + 1); }
  return c;
}

// Curriculum month i covers [start + i months, start + i+1 months)
export function monthWindow(start, i) {
  return { from: addMonths(start, i), to: new Date(addMonths(start, i + 1).getTime() - 86400000) };
}

export function monthIndexFor(start, today) {
  let mi = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
  if (today.getDate() < start.getDate()) mi--;
  return Math.max(0, Math.min(5, mi));
}

// ---- persistence ----
export function loadProgress() {
  try { return JSON.parse(localStorage.getItem(LS_PROGRESS)) || {}; } catch (e) { return {}; }
}
export function saveProgress(p) { localStorage.setItem(LS_PROGRESS, JSON.stringify(p)); }

// One record per day: { blocks: [h,h,h,h], task: bool }
export function dayHours(rec) { return rec && rec.blocks ? rec.blocks.reduce((a, b) => a + (+b || 0), 0) : 0; }

export function sumRange(progress, start, end) {
  let t = 0; const d = new Date(start);
  while (d <= end) { t += dayHours(progress[keyOf(d)]); d.setDate(d.getDate() + 1); }
  return t;
}

export function statusFor(logged, expected) {
  if (expected <= 0) return { label: 'Not started', tone: 'neutral', ratio: 1 };
  const r = logged / expected;
  if (r >= 1.05) return { label: 'Ahead', tone: 'ahead', ratio: r };
  if (r >= 0.9) return { label: 'On track', tone: 'ok', ratio: r };
  if (r >= 0.55) return { label: 'Slightly behind', tone: 'warn', ratio: r };
  return { label: 'Behind', tone: 'behind', ratio: r };
}

// Consecutive study days with any logged hours, ending today (or yesterday if today is still empty).
export function streakOf(progress, today, start) {
  let s = 0; const d = new Date(today);
  if (dayHours(progress[keyOf(d)]) <= 0) d.setDate(d.getDate() - 1);
  while (d >= start) {
    if (isStudyDay(d)) { if (dayHours(progress[keyOf(d)]) > 0) s++; else break; }
    d.setDate(d.getDate() - 1);
  }
  return s;
}

// ---- career-path skill attribution ----
// Each daily cadence block feeds a skill group; logged hours flow to matching skills.
export const BLOCK_GROUPS = ['english', 'art', 'english', 'craft'];

export function groupOf(skillName) {
  const n = String(skillName).toLowerCase();
  if (n.includes('english') || n.includes('rhetoric')) return 'english';
  if (n.includes('art') || n.includes('history') || n.includes('theory')) return 'art';
  return 'craft';
}

export function groupHours(progress) {
  const g = { english: 0, art: 0, craft: 0 };
  Object.values(progress).forEach((rec) => (rec.blocks || []).forEach((h, i) => {
    g[BLOCK_GROUPS[i] || 'craft'] += +h || 0;
  }));
  return g;
}

// Fill past study days with plausible demo hours (for trying the dashboard).
export function seedDemo(start, today, cadence) {
  const p = {}; const d = new Date(start); let i = 0;
  const factors = [1, 0.85, 0.7, 1, 0.5, 0.95, 0.8, 1, 0.65, 0.9];
  while (d < today) {
    if (isStudyDay(d)) {
      const f = factors[i % factors.length];
      p[keyOf(d)] = {
        blocks: cadence.map((c) => Math.round(parseFloat(c.duration) * f * 4) / 4),
        task: i % 3 !== 1,
      };
      i++;
    }
    d.setDate(d.getDate() + 1);
  }
  return p;
}
