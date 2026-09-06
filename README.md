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

## What's working now

- **Public home page** at `/` — no login wall, with an animated background
  and the Ledger logo. "Get started" and "Sign in" lead to `/login`.
- **Accounts** — register/log in with email + password (hashed with
  bcrypt), or **Sign in with Google**. Sessions use a JWT.
- **Remember me** — a checkbox on the login form controls whether your
  session survives closing the browser (stored in `localStorage`) or
  ends with the tab (stored in `sessionStorage`).
- **No fake sample data** — new accounts start empty. The Dashboard,
  Tasks, and Inbox pages point you at the Connections tab (or manual
  task entry) instead of showing placeholder rows.
- **Preferences** — click your name at the bottom of the nav rail. Six
  working themes (Paper, Dark, Cream, Forest, Tomorrow Night, Cyberpunk)
  that actually swap the app's colors live, plus density and reduced-motion
  controls, a real sound + browser notification when a focus session ends,
  a default session length, data export (JSON download), and account
  deletion — all functional, not just UI mockups. A couple of items
  (email digest, auto-start breaks) are visibly marked "coming soon"
  since they need infrastructure that isn't built yet.
- **Today dashboard, task manager, focus timer, inbox scan, Connections**
  — same core features as before, all backed by the Express API.

### A note on the Connections page crash

If you hit a blank/broken page opening Connections before, the cause was
a missing null-check: if the status request failed for any reason, the
page tried to read properties off a `null` value and crashed React
entirely. That's fixed, and there's now an app-wide error boundary so any
future bug shows a recoverable error screen instead of a blank page.

### Setting up Google Sign-In vs. Google Calendar/Gmail

These are two **separate** Google connections in this app:

- **"Sign in with Google"** on the login page — just authenticates you.
  Only needs `VITE_GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_ID`.
- **"Connect Google Calendar & Gmail"** on the Connections page — a
  separate OAuth flow requesting `calendar.readonly` and `gmail.readonly`
  scopes, so Ledger can show your real schedule and scan your real inbox.
  This one additionally needs `GOOGLE_CLIENT_SECRET` and a registered
  **redirect URI** (not just a JavaScript origin).

To set up both:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/),
   create (or pick) a project.
2. **APIs & Services → OAuth consent screen** — configure it (External is
   fine for testing; add your own email as a test user while it's in
   "Testing" mode — only test users can sign in until you publish it).
3. **APIs & Services → Credentials → Create Credentials → OAuth client
   ID** → Application type: **Web application**.
4. Under **Authorized JavaScript origins**, add `http://localhost:5173`
   and your production frontend URL.
5. Under **Authorized redirect URIs**, add
   `http://localhost:4000/api/integrations/google/callback` and your
   production backend's equivalent — this exact URL must match
   `BACKEND_URL` in `server/.env` plus `/api/integrations/google/callback`.
6. Copy the **Client ID** and **Client Secret** into:
   - Frontend `.env`: `VITE_GOOGLE_CLIENT_ID`
   - Backend `server/.env`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
     and `BACKEND_URL` (where your backend is actually reachable)
7. Restart both dev servers.

**Canvas** needs no app registration at all — it's connected per-student
with a personal access token. In Canvas: Account → Settings → scroll to
"Approved Integrations" → "+ New Access Token". Paste the domain (e.g.
`yourschool.instructure.com`) and the token into the Connections page.

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
| `/api/inbox` | GET | List mail — real Gmail if connected, sample otherwise |
| `/api/inbox/:id` | DELETE | Dismiss a sample message |
| `/api/integrations/status` | GET | Canvas/Google connection status |
| `/api/integrations/canvas` | POST/DELETE | Connect / disconnect Canvas |
| `/api/integrations/canvas/sync` | POST | Pull upcoming Canvas assignments in as tasks |
| `/api/integrations/google/start` | GET | Redirects to Google's consent screen |
| `/api/integrations/google/callback` | GET | Google redirects here after consent |
| `/api/integrations/google` | DELETE | Disconnect Google Calendar/Gmail |
| `/api/integrations/calendar/events` | GET | Upcoming events from Google Calendar |
| `/api/me` | DELETE | Permanently delete your account and all its data |

All routes except `/auth/*`, `/api/health`, and the two OAuth redirect
routes require `Authorization: Bearer <token>`.

**Security notes for going further:** the JWT lives in browser storage,
fine for a student project but vulnerable to XSS in a public deployment —
a production version should move to an httpOnly cookie. `JWT_SECRET` and
`GOOGLE_CLIENT_SECRET` in `.env` must never be committed or shared —
treat them like passwords. If one is ever exposed (pasted somewhere,
committed by accident), rotate it immediately in Google Cloud Console /
regenerate `JWT_SECRET`. The JSON-file store (`server/ledger.json`) has
no concurrent-write protection — fine at small scale, but swap in a real
database before this serves many simultaneous users.

## Roadmap

**Still ahead**
- **AI assistant** — an LLM-backed chat panel that can re-rank tasks,
  explain *why* something was flagged as spam, and suggest a study plan
  from the day's open tasks.
- **Google Classroom API** as an alternative/addition to Canvas for
  schools that use Classroom instead.

**A note on Google's "unverified app" screen:** while your OAuth consent
screen is in Testing mode, only accounts you've explicitly added as test
users can connect Google Calendar/Gmail, and they'll see an "unverified
app" warning during consent (expected — click through it). Because
`gmail.readonly` and `calendar.readonly` are "sensitive" scopes, taking
this out of Testing mode for the public eventually requires Google's app
verification review, not just clicking "Publish."

## Deploying

The frontend (static files) and backend (long-running Node process) need
separate hosts:

- **Frontend → Vercel.** `vercel.json` is already set up with the SPA
  rewrite Vercel needs for client-side routing.
- **Backend → Render, Railway, Fly.io, or similar.** Vercel's serverless
  functions have an ephemeral, read-only filesystem, so the JSON-file
  store (and any real database file) won't persist there — it needs a
  host that runs a normal, always-on Node process with a writable disk.
