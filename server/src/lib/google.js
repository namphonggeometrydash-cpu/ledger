const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../middleware/auth");

const SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
];

function getRedirectUri() {
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;
  return `${backendUrl}/api/integrations/google/callback`;
}

// Short-lived token carrying the user id through Google's redirect, since
// the callback is a plain browser GET with no Authorization header.
function signState(userId) {
  return jwt.sign({ userId, purpose: "google-oauth" }, JWT_SECRET, { expiresIn: "10m" });
}

function verifyState(state) {
  const payload = jwt.verify(state, JWT_SECRET);
  if (payload.purpose !== "google-oauth") throw new Error("Invalid state token");
  return payload.userId;
}

function buildAuthUrl(userId, { loginHint } = {}) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    // Forcing the account chooser when there's no hint mirrors Google's own
    // "choose an account" screen; a hint skips straight to consent for that
    // specific address.
    prompt: loginHint ? "consent" : "select_account consent",
    state: signState(userId),
  });
  if (loginHint) params.set("login_hint", loginHint);
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeCodeForTokens(code) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error_description || "Google token exchange failed");
  return body; // { access_token, refresh_token?, expires_in, scope, id_token }
}

async function refreshAccessToken(refreshToken) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error_description || "Google token refresh failed");
  return body; // { access_token, expires_in, scope }
}

// Returns a valid access token for this user, refreshing it first if it's
// expired (or about to expire in the next minute).
async function getValidAccessToken(db, user) {
  if (!user.google) throw new Error("Google isn't connected for this user");
  const soon = Date.now() + 60_000;
  if (user.google.expiryDate && user.google.expiryDate > soon) {
    return user.google.accessToken;
  }
  if (!user.google.refreshToken) {
    throw new Error("Google connection expired — please reconnect it on the Connections page.");
  }
  const refreshed = await refreshAccessToken(user.google.refreshToken);
  db.saveGoogleTokens(user.id, {
    accessToken: refreshed.access_token,
    refreshToken: user.google.refreshToken,
    expiryDate: Date.now() + refreshed.expires_in * 1000,
    scopes: user.google.scopes,
    email: user.google.email,
  });
  return refreshed.access_token;
}

async function fetchGoogleUserInfo(accessToken) {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return res.json();
}

module.exports = {
  buildAuthUrl,
  verifyState,
  exchangeCodeForTokens,
  getValidAccessToken,
  fetchGoogleUserInfo,
};
