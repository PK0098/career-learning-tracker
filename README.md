# Career & Learning Tracker

Interactive 6-month career + learning tracker for Melika's C2-English / Global-Art-History plan.
Static site — deployable on GitHub Pages as-is. No backend; everything persists in `localStorage`.

## Pages

- **index.html** — routes to the layout that fits the device (small/touch screens → mobile, otherwise desktop)
- **mobile.html** — mobile-first app (bottom tab bar: Today / Journey / Paths / Overview)
- **desktop.html** — desktop dashboard (At a glance on top, then today's targets, journey, paths)

Both pages read the same data and share the same saved progress.

## Data

- `plan-data.json` — the Gemini-generated plan (exact structure preserved: `strategicCareerMapping` → `contextProfile`, `careerPaths[]`, `masterCurriculum`). Swap this file to load a new plan; the UI populates dynamically.
- `tracker-core.js` / `support.js` — shared schedule math, runtime, (study-day counting, pace status, streaks, skill-hour attribution) and persistence.

### localStorage

- `clt.progress.v1` — `{ "YYYY-MM-DD": { "blocks": [h,h,h,h], "task": true } }`
  One record per day: hours logged per cadence block + daily-deliverable done flag.

## How progress works

- A study day = Mon–Fri, 6h across the 4 cadence blocks from `dailyOperationalCadence`.
- Drag (or tap) a block's slider to log hours in 15-min steps; "Mark full" logs the planned amount in one tap.
- Pace status compares hours logged vs. hours expected through **yesterday** (so mornings don't count against you): ≥105% Ahead · ≥90% On track · ≥55% Slightly behind · else Behind.
- Curriculum month *n* = calendar month *n* after the start date.
- Career-path skill bars: block hours flow to skill groups (English mechanics + literary immersion → English skills; history acquisition → art/theory skills; output & synthesis → craft skills), split evenly among a path's skills in that group, measured against each skill's C2-hour target (B2/C1 milestones shown as ticks).

## Configuration

Start date (default `2026-06-29`) and daily goal hours (default 6) are tweakable props on each page.

## Demo / reset

Overview tab → **Load demo history** fills past days with plausible data; **Reset all data** clears everything.

## Out of scope (future roadmap)

1. **Reminders** — Duolingo-style push notifications (needs a service worker + Notification API; schedule from `dailyOperationalCadence` time windows).
2. **Dynamic goal setting** — let the user edit start date, hours/day, study days, and skill targets in-app at any time (write overrides to localStorage on top of the JSON).
3. **Artifact-creation tasks** — regular prompts to upload essays/research/presentations instead of check-offs; store file handles or links per day alongside the `task` flag.
4. **Automated reviews** — end-of-week and end-of-month summaries of logged work + auto-generated plan adjustments for the coming period.
