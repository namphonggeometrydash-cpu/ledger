# Ledger — a focus & homework planner for students

Ledger helps students see what's due, rearrange it into a sane order, run
focus sessions, and catch spammy/phishing email before it wastes their time.

This repo is now at **Phase 2**: a real Express + SQLite backend with actual
user accounts, sitting behind the same React frontend from Phase 1. Your
tasks, focus sessions, and inbox now live in a database tied to your login,
not just one browser's local storage. Phase 3 (below) adds live Google/Canvas
connections and an AI assistant.

## Project layout

```
/                 the React frontend (Vite)
/server           the Express API + SQLite database
```

## Run it locally (two terminals)

**Terminal 1 — backend**

```bash
cd server
npm install
cp .env.example .env      # fine to use as-is for local dev
npm run dev                # starts on http://localhost:4000
```

The first run creates `server/ledger.db` automatically — nothing else to
set up. `npm run dev` uses nodemon so it restarts on changes; `npm start`
runs it plainly.

**Terminal 2 — frontend**

```bash
npm install
cp .env.example .env       # points the app at http://localhost:4000/api
npm run dev                 # starts on http://localhost:5173
```

Open `http://localhost:5173`, create an account (any email/password works
locally), and you'll land on a dashboard pre-seeded with sample tasks so
it's not empty on first login.

To build the static frontend files for deployment:

```bash
npm run build
npm run preview   # sanity-check the build locally
```

The backend deploys separately (it's a long-running Node process, not a
static site) — any host that runs Node works, e.g. Render, Railway, or a
small VPS. Point the frontend's `VITE_API_URL` at wherever you deploy it.

## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. In `vite.config.js`, set `base: '/your-repo-name/'`.
3. Run `npm run build`, then deploy the `dist/` folder with a tool like
   [`gh-pages`](https://www.npmjs.com/package/gh-pages) or GitHub Actions.

## What's working now

- **Accounts** — register/log in with email + password (hashed with
  bcrypt), sessions handled with a JWT stored in the browser. Every
  account gets its own tasks, sessions, goals, and inbox, enforced at the
  database level (every query is scoped to the logged-in user's id).
- **Today dashboard** — streak, weekly focus minutes, tasks due today, and
  a suggested task order (overdue first, then soonest due date, then
  priority).
- **Task manager** — add, complete (cycles to-do → doing → done), and
  delete tasks with course, due date, and priority. Persisted in SQLite.
- **Focus timer** — 25/45/50-minute sessions with a circular progress dial;
  finished sessions are saved to the database and count toward weekly goals.
- **Inbox scan** — a transparent, rule-based scorer (`src/lib/spamHeuristic.js`)
  flags likely spam/phishing mail and shows exactly which signal tripped it
  (urgency language, prize/money hooks, odd sender domains, excess
  punctuation). It runs on sample messages seeded per account for now.

Everything reads/writes through `src/data/store.js` (frontend) and
`src/lib/api.js`, which talk to the Express routes in `server/src/routes/`.
That boundary is exactly where Phase 3 plugs in real Gmail/Canvas data
instead of the seeded sample rows — no other files need to change.

### API summary

| Route | Method | What it does |
|---|---|---|
| `/api/auth/register` | POST | Create an account, returns a JWT |
| `/api/auth/login` | POST | Log in, returns a JWT |
| `/api/me` | GET | Current user (requires token) |
| `/api/tasks` | GET/POST | List / create tasks |
| `/api/tasks/:id` | PATCH/DELETE | Update / delete a task |
| `/api/sessions` | GET/POST | List / log focus sessions |
| `/api/goals` | GET/POST | List / create weekly goals |
| `/api/inbox` | GET | List scanned mail |
| `/api/inbox/:id` | DELETE | Dismiss a message |

All routes except `/auth/*` and `/api/health` require
`Authorization: Bearer <token>`.

**Security notes for going further:** this JWT lives in `localStorage`,
which is fine for a local/student project but is vulnerable to XSS in a
public deployment — a production version should move to an httpOnly
cookie. `JWT_SECRET` in `.env` should be a long random value in any real
deployment, not the placeholder.

## Roadmap

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
