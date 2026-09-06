const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { requireAuth, JWT_SECRET } = require("../middleware/auth");
const canvas = require("../lib/canvas");
const google = require("../lib/google");

const router = express.Router();

function frontendUrl() {
  const list = (process.env.FRONTEND_URL || "http://localhost:5173").split(",");
  return list[0].trim();
}

// ---------- status ----------

router.get("/status", requireAuth, (req, res) => {
  const user = db.findUserById(req.userId);
  res.json({
    canvas: user.canvas ? { connected: true, domain: user.canvas.domain } : { connected: false },
    google: user.google
      ? { connected: true, email: user.google.email, scopes: user.google.scopes }
      : { connected: false },
  });
});

// ---------- Canvas ----------

router.post("/canvas", requireAuth, async (req, res) => {
  const { domain, token } = req.body || {};
  if (!domain || !token) return res.status(400).json({ error: "domain and token are both required" });

  try {
    await canvas.verifyCanvasToken(domain, token);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  db.saveCanvasConnection(req.userId, { domain, token });
  res.json({ connected: true, domain });
});

router.delete("/canvas", requireAuth, (req, res) => {
  db.clearCanvasConnection(req.userId);
  res.status(204).end();
});

router.post("/canvas/sync", requireAuth, async (req, res) => {
  const user = db.findUserById(req.userId);
  if (!user.canvas) return res.status(400).json({ error: "Canvas isn't connected yet" });

  let items;
  try {
    items = await canvas.fetchUpcomingPlannerItems(user.canvas.domain, user.canvas.token);
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }

  let created = 0;
  for (const item of items) {
    const existing = db.findTaskBySourceId(req.userId, "canvas", item.sourceId);
    if (existing) {
      db.updateTask(req.userId, existing.id, { dueDate: item.dueDate, title: item.title, course: item.course });
    } else {
      db.createTask(req.userId, {
        title: item.title,
        course: item.course,
        dueDate: item.dueDate,
        priority: "medium",
        source: "canvas",
        sourceId: item.sourceId,
      });
      created += 1;
    }
  }

  res.json({ synced: items.length, created });
});

// ---------- Google (Calendar + Gmail) ----------

// Full-page redirect flow: the frontend navigates here directly (can't
// attach an Authorization header to a browser navigation), so the JWT is
// passed as a query param instead and verified manually.
router.get("/google/start", (req, res) => {
  const { token, hint } = req.query;
  if (!token) return res.status(401).send("Missing token");
  let userId;
  try {
    userId = jwt.verify(token, JWT_SECRET).userId;
  } catch {
    return res.status(401).send("Invalid or expired session — please sign in again and retry.");
  }
  res.redirect(google.buildAuthUrl(userId, { loginHint: hint || undefined }));
});

router.get("/google/callback", async (req, res) => {
  const { code, error, state } = req.query;
  if (error) return res.redirect(`${frontendUrl()}/app/connections?google=error`);

  try {
    const userId = google.verifyState(state);
    const tokens = await google.exchangeCodeForTokens(code);
    const info = await google.fetchGoogleUserInfo(tokens.access_token);

    db.saveGoogleTokens(userId, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: Date.now() + tokens.expires_in * 1000,
      scopes: (tokens.scope || "").split(" "),
      email: info?.email || null,
    });

    res.redirect(`${frontendUrl()}/app/connections?google=connected`);
  } catch (err) {
    console.error("Google OAuth callback failed:", err.message);
    res.redirect(`${frontendUrl()}/app/connections?google=error`);
  }
});

router.delete("/google", requireAuth, (req, res) => {
  db.clearGoogleConnection(req.userId);
  res.status(204).end();
});

router.get("/calendar/events", requireAuth, async (req, res) => {
  const user = db.findUserById(req.userId);
  if (!user.google) return res.status(400).json({ error: "Google isn't connected yet" });

  try {
    const accessToken = await google.getValidAccessToken(db, user);
    const params = new URLSearchParams({
      timeMin: new Date().toISOString(),
      maxResults: "10",
      singleEvents: "true",
      orderBy: "startTime",
    });
    const calRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!calRes.ok) throw new Error(`Calendar request failed (${calRes.status})`);
    const { items = [] } = await calRes.json();

    res.json(
      items.map((e) => ({
        id: e.id,
        title: e.summary || "(untitled event)",
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
      }))
    );
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

module.exports = router;
