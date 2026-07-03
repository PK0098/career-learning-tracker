// tracker-core.js — shared schedule math + localStorage persistence
// Used by desktop.html and mobile.html; one plan per plans/<planId>/ folder.

export const LS_LEGACY = 'clt.progress.v1'; // pre-multi-plan key (single-plan era)
export const keyFor = (planId) => 'clt.' + planId + '.progress.v1';

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

export function monthIndexFor(start, today, maxIdx) {
  let mi = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
  if (today.getDate() < start.getDate()) mi--;
  return Math.max(0, Math.min(maxIdx, mi));
}

// ---- persistence (one localStorage key per plan; all plans share the origin) ----
export function loadProgress(planId, migrateLegacy) {
  const key = keyFor(planId);
  try {
    let raw = localStorage.getItem(key);
    if (raw == null && migrateLegacy) {
      raw = localStorage.getItem(LS_LEGACY);
      if (raw != null) { localStorage.setItem(key, raw); localStorage.removeItem(LS_LEGACY); }
    }
    return JSON.parse(raw) || {};
  } catch (e) { return {}; }
}
export function saveProgress(planId, p) { localStorage.setItem(keyFor(planId), JSON.stringify(p)); }

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
// Each daily cadence block declares a `group` in plan-data.json; logged hours
// flow to the skills that declare the same group.
export function groupHours(progress, cadence) {
  const g = {};
  Object.values(progress).forEach((rec) => (rec.blocks || []).forEach((h, i) => {
    const grp = (cadence[i] && cadence[i].group) || 'other';
    g[grp] = (g[grp] || 0) + (+h || 0);
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
