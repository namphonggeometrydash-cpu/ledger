# Ledger — a focus & homework planner for students

Ledger helps students see what's due, rearrange it into a sane order, run
focus sessions, and catch spammy/phishing email before it wastes their time.
This repo is **Phase 1**: a fully working frontend (task manager, focus
timer, dashboard, inbox scanner) running on realistic sample data in the
browser. Phases 2 and 3 (below) add the real backend and live account
connections.

## Run it locally

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`). Your tasks,
sessions, and settings are saved to your browser's local storage, so they
persist between visits on the same device — no backend needed yet.

To build the static production files (what you'd deploy):

```bash
npm run build
npm run preview   # sanity-check the build locally
```

## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. In `vite.config.js`, set `base: '/your-repo-name/'`.
3. Run `npm run build`, then deploy the `dist/` folder with a tool like
   [`gh-pages`](https://www.npmjs.com/package/gh-pages) or GitHub Actions.

## What's in Phase 1

- **Today dashboard** — streak, weekly focus minutes, tasks due today, and
  a suggested task order (overdue first, then soonest due date, then
  priority).
- **Task manager** — add, complete (cycles to-do → doing → done), and
  delete tasks with course, due date, and priority.
- **Focus timer** — 25/45/50-minute sessions with a circular progress dial;
  finished sessions log automatically toward your weekly goals.
- **Inbox scan** — a transparent, rule-based scorer (`src/lib/spamHeuristic.js`)
  flags likely spam/phishing mail and shows exactly which signal tripped it
  (urgency language, prize/money hooks, odd sender domains, excess
  punctuation). It runs on sample messages for now.

Everything reads/writes through `src/data/store.js`, a single hook
(`useAppData`) that currently persists to `localStorage`. That's
intentional: it's the one file you swap out in Phase 2 to point at a real
API instead of local storage, without touching any component.

## Roadmap

**Phase 2 — real backend**
- Node/Express (or similar) API + a real database (Postgres/SQLite) for
  tasks, sessions, and goals, replacing `localStorage`.
- User accounts and sessions.

**Phase 3 — real integrations**
- **Google OAuth 2.0** so students sign in with their school Google
  account. This needs a Google Cloud project with OAuth credentials —
  that setup happens in your Google Cloud Console, not in this code.
- **Google Calendar API** to pull scheduled events onto the dashboard.
- **Gmail API** (read-only scope) to replace the sample inbox with real
  mail, scanned by the same heuristic — or a stronger classifier trained
  on labeled spam/phishing examples if you want to go beyond rules.
- **Canvas API / Google Classroom API** to pull real assignments and due
  dates into the task list instead of manual entry.
- **AI assistant** — an LLM-backed chat panel that can re-rank tasks,
  explain *why* something was flagged as spam, and suggest a study plan
  from the day's open tasks.

None of Phase 3 can be "faked" convincingly — OAuth and these APIs only
work against real, registered credentials, so that phase is built
incrementally and tested against your actual accounts as you go.

## Project structure

```
src/
  data/store.js       # data model + localStorage-backed hook (swap point for a real API)
  lib/spamHeuristic.js# explainable spam/phishing scorer
  components/         # Rail, Dashboard, Tasks, Focus, Inbox, TaskRow
  App.jsx             # page shell + navigation
  index.css           # design tokens (color, type)
  app.css             # component styles
```
