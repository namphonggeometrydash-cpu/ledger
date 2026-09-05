# Ledger — a focus & homework planner for students

Ledger helps students see what's due, rearrange it into a sane order, run
focus sessions, and catch spammy/phishing email before it wastes their time.

## Project layout

```
/                 the React frontend (Vite + React Router)
/server           the Express API + JSON-file data store
```

## Run it locally (two terminals)

**Terminal 1 — backend**

```bash
cd server
npm install
cp .env.example .env
npm run dev                 # starts on http://localhost:4000
```

The first run creates `server/ledger.json` automatically. `npm run dev`
uses nodemon so it restarts on changes; `npm start` runs it plainly. No
native modules, no minimum Node version — this runs on any reasonably
recent Node install.

**Terminal 2 — frontend**

```bash
npm install
cp .env.example .env        # points the app at http://localhost:4000/api
npm run dev                  # starts on http://localhost:5173
```

Open `http://localhost:5173`. You'll land on the public home page; click
"Get started" to create an account (any email/password works locally) or
use Google sign-in if you've configured it (see below). New accounts get
pre-seeded sample tasks so the dashboard isn't empty on first login.

To build the static frontend files for deployment:

```bash
npm run build
npm run preview   # sanity-check the build locally
```

## If sign-in gives you "Failed to fetch"

That error means the browser couldn't reach the backend at all — it's a
network problem, not a login problem. Check, in order:

1. **Is the backend actually running?** Look at Terminal 1 — you should
   see `Ledger API listening on http://localhost:4000`. If it crashed,
   the error above it will say why.
2. **Does `VITE_API_URL` in your frontend `.env` match where the backend
   is running?** Default is `http://localhost:4000/api`.
3. **Did you restart the frontend dev server after changing `.env`?**
   Vite only reads env files on startup.
4. Open your browser's DevTools → Network tab, retry, and look at the
   failed request's exact URL and status — that tells you immediately
   whether it's a wrong port, a 404, or something else.

## What's working now (Phase 3)

- **Public home page** at `/` — no login wall. "Get started" and "Sign
  in" lead to `/login`.
- **Accounts** — register/log in with email + password (hashed with
  bcrypt), or **Sign in with Google**. Sessions use a JWT.
- **Remember me** — a checkbox on the login form controls whether your
  session survives closing the browser (stored in `localStorage`) or
  ends with the tab (stored in `sessionStorage`).
- **Today dashboard, task manager, focus timer, inbox scan** — same
  features as before, now living at `/app`, `/app/tasks`, `/app/focus`,
  `/app/inbox`, all backed by the Express API.

### Setting up Google Sign-In

Google sign-in is optional — email/password works fine without it. To
enable it:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/),
   create (or pick) a project.
2. **APIs & Services → OAuth consent screen** — configure it (External is
   fine for testing; add your email as a test user if it stays in
   "Testing" mode).
3. **APIs & Services → Credentials → Create Credentials → OAuth client
   ID** → Application type: **Web application**.
4. Under **Authorized JavaScript origins**, add
   `http://localhost:5173` (and your production URL later).
5. Copy the generated **Client ID** into:
   - `VITE_GOOGLE_CLIENT_ID` in the frontend `.env`
   - `GOOGLE_CLIENT_ID` in `server/.env`
6. Restart both dev servers.

The backend verifies the Google ID token directly against Google's
`tokeninfo` endpoint — no extra SDK dependency required.

### API summary

| Route | Method | What it does |
|---|---|---|
| `/api/auth/register` | POST | Create an account, returns a JWT |
| `/api/auth/login` | POST | Log in, returns a JWT |
| `/api/auth/google` | POST | Verify a Google ID token, returns a JWT |
| `/api/me` | GET | Current user (requires token) |
| `/api/tasks` | GET/POST | List / create tasks |
| `/api/tasks/:id` | PATCH/DELETE | Update / delete a task |
| `/api/sessions` | GET/POST | List / log focus sessions |
| `/api/goals` | GET/POST | List / create weekly goals |
| `/api/inbox` | GET | List scanned mail |
| `/api/inbox/:id` | DELETE | Dismiss a message |

All routes except `/auth/*` and `/api/health` require
`Authorization: Bearer <token>`.

**Security notes for going further:** the JWT lives in browser storage,
fine for a student project but vulnerable to XSS in a public deployment —
a production version should move to an httpOnly cookie. `JWT_SECRET` in
`.env` should be a long random value in any real deployment, never the
placeholder. The JSON-file store (`server/ledger.json`) has no
concurrent-write protection — fine at small scale, but swap in a real
database before this serves many simultaneous users.

## Roadmap

**Still ahead — deeper integrations**
- **Google Calendar API** to pull scheduled events onto the dashboard.
- **Gmail API** (read-only scope) to replace the sample inbox with real
  mail, scanned by the same heuristic — or a stronger classifier trained
  on labeled spam/phishing examples if you want to go beyond rules.
- **Canvas API / Google Classroom API** to pull real assignments and due
  dates into the task list instead of manual entry.
- **AI assistant** — an LLM-backed chat panel that can re-rank tasks,
  explain *why* something was flagged as spam, and suggest a study plan
  from the day's open tasks.

None of these can be "faked" convincingly — they only work against real,
registered API credentials, so they get built and tested incrementally
against your actual accounts.

## Deploying

The frontend (static files) and backend (long-running Node process) need
separate hosts:

- **Frontend → Vercel.** `vercel.json` is already set up with the SPA
  rewrite Vercel needs for client-side routing.
- **Backend → Render, Railway, Fly.io, or similar.** Vercel's serverless
  functions have an ephemeral, read-only filesystem, so the JSON-file
  store (and any real database file) won't persist there — it needs a
  host that runs a normal, always-on Node process with a writable disk.
