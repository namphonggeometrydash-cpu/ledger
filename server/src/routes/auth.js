const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

function issueToken(user) {
  return jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
}

function toClientUser(user) {
  return { id: user.id, email: user.email, name: user.name };
}

router.post("/register", async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Name, email, and password are all required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  if (db.findUserByEmail(email)) {
    return res.status(409).json({ error: "An account with that email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = db.createUser({ email, name, passwordHash });
  db.seedForUser(user.id);

  res.status(201).json({ token: issueToken(user), user: toClientUser(user) });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = db.findUserByEmail(email);
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "Incorrect email or password" });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ error: "Incorrect email or password" });

  res.json({ token: issueToken(user), user: toClientUser(user) });
});

// Google Sign-In: the frontend sends the ID token it got from Google's
// Identity Services widget. We verify it directly against Google's
// tokeninfo endpoint rather than pulling in a heavier SDK — plenty robust
// at this scale, and one less dependency to install.
router.post("/google", async (req, res) => {
  const { idToken } = req.body || {};
  if (!idToken) return res.status(400).json({ error: "Missing idToken" });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({
      error: "Google sign-in isn't configured on the server yet (missing GOOGLE_CLIENT_ID).",
    });
  }

  let payload;
  try {
    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    if (!verifyRes.ok) throw new Error("Token rejected by Google");
    payload = await verifyRes.json();
  } catch {
    return res.status(401).json({ error: "Could not verify Google sign-in. Please try again." });
  }

  if (payload.aud !== clientId) {
    return res.status(401).json({ error: "This sign-in wasn't issued for this app." });
  }
  if (!payload.email_verified || payload.email_verified === "false") {
    return res.status(401).json({ error: "That Google account's email isn't verified." });
  }

  let user = db.findUserByEmail(payload.email);
  if (!user) {
    user = db.createUser({ email: payload.email, name: payload.name || payload.email, googleId: payload.sub });
    db.seedForUser(user.id);
  } else if (!user.googleId) {
    user = db.linkGoogleId(user.id, payload.sub);
  }

  res.json({ token: issueToken(user), user: toClientUser(user) });
});

module.exports = router;
