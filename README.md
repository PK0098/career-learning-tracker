# Career & Learning Tracker

Interactive career + learning tracker. Static site — deployable on GitHub Pages as-is.
No backend; each plan's progress persists in the browser's `localStorage`.

Hosts **multiple plans** from one shared app: every plan is a folder under `plans/` with its
own URL, its own data file, and its own saved progress.

## Structure

```
index.html                  ← directory of all plans
desktop.html, mobile.html   ← the shared app (loaded with ?plan=<planId>)
support.js, tracker-core.js ← shared runtime + schedule math / persistence
plan-template.json          ← fill this in to create a new plan
plans/
  melika/
    index.html              ← device router → mobile or desktop app for this plan
    plan-data.json          ← the plan's data (config + strategicCareerMapping)
```

A person's URL is `plans/<planId>/` — it detects the device and opens the mobile app on
small/touch screens, the desktop dashboard otherwise.

## Adding a new plan

1. Copy `plan-template.json`, fill it in (the placeholder values describe every field and rule).
2. Create `plans/<planId>/plan-data.json` with it.
3. Copy `plans/melika/index.html` to `plans/<planId>/index.html` and change the `PLAN` variable
   (and the two fallback links) to the new planId.
4. Optionally add the plan to the list in the root `index.html`.
5. Push. The plan is live at `…/plans/<planId>/` about a minute later.

Template rules that matter:

- `config.planId` must equal the folder name; it also namespaces the localStorage key
  (`clt.<planId>.progress.v1`), so plans never mix progress even in the same browser.
- Every daily block and every skill declares a `group`; logged block hours flow to the skills
  with the same group (split evenly among a path's skills in that group).
- Block durations should sum to `config.dailyGoalHours`.
- `months` can be any length; `focusAreas` is a free list of label/text rows.

## localStorage

- `clt.<planId>.progress.v1` — `{ "YYYY-MM-DD": { "blocks": [h,…], "task": true } }`
  One record per day: hours logged per cadence block + daily-deliverable done flag.
- Progress is per browser per device (no sync). The Overview tab has
  **Load demo history** and **Reset all data**.

## How progress works

- A study day = Mon–Fri, `dailyGoalHours` across the cadence blocks.
- Drag (or tap) a block's slider to log hours in 15-min steps; "Mark full" logs the planned amount.
- Pace status compares hours logged vs. hours expected through **yesterday**:
  ≥105% Ahead · ≥90% On track · ≥55% Slightly behind · else Behind.
- Curriculum month *n* = calendar month *n* after `config.startDate`.
- Skill bars measure invested hours against each skill's `outstandingC2` target
  (B2/C1 milestones shown as ticks).

## Out of scope (future roadmap)

1. **Cross-device sync** — a backend store (e.g. Supabase) so progress follows a person across devices.
2. **Reminders** — push notifications from the cadence time windows (service worker + Notification API).
3. **Dynamic goal setting** — edit start date, hours/day, and skill targets in-app.
4. **Artifact-creation tasks** — upload essays/research per day alongside the `task` flag.
5. **Automated reviews** — end-of-week/month summaries + plan adjustments.
