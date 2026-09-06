import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";

export default function Connections() {
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const [domain, setDomain] = useState("");
  const [canvasToken, setCanvasToken] = useState("");
  const [canvasBusy, setCanvasBusy] = useState(false);
  const [canvasError, setCanvasError] = useState("");
  const [syncResult, setSyncResult] = useState("");

  async function loadStatus() {
    setLoading(true);
    try {
      const s = await api.integrations.status();
      setStatus(s);
    } catch (err) {
      setNotice(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    const g = params.get("google");
    if (g === "connected") setNotice("Google connected — Calendar and Gmail are now linked.");
    if (g === "error") setNotice("Something went wrong connecting Google. Please try again.");
    if (g) {
      params.delete("google");
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCanvasConnect(e) {
    e.preventDefault();
    setCanvasError("");
    setCanvasBusy(true);
    try {
      await api.integrations.connectCanvas(domain.trim(), canvasToken.trim());
      setCanvasToken("");
      await loadStatus();
    } catch (err) {
      setCanvasError(err.message);
    } finally {
      setCanvasBusy(false);
    }
  }

  async function handleCanvasDisconnect() {
    await api.integrations.disconnectCanvas();
    setDomain("");
    await loadStatus();
  }

  async function handleSync() {
    setSyncResult("Syncing…");
    try {
      const result = await api.integrations.syncCanvas();
      setSyncResult(`Synced ${result.synced} item${result.synced === 1 ? "" : "s"} — ${result.created} new task${result.created === 1 ? "" : "s"} added.`);
    } catch (err) {
      setSyncResult(err.message);
    }
  }

  async function handleGoogleDisconnect() {
    await api.integrations.disconnectGoogle();
    await loadStatus();
  }

  if (loading) {
    return (
      <>
        <div className="page-head">
          <div>
            <h1>Connections</h1>
          </div>
        </div>
        <p className="empty-note">Loading…</p>
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Connections</h1>
          <p>Link real data sources so Ledger stops guessing and starts pulling from your actual accounts.</p>
        </div>
      </div>

      {notice && <div className="callout">{notice}</div>}

      <div className="connection-card">
        <div className="connection-head">
          <div>
            <h3>Canvas</h3>
            <p>Pulls your upcoming assignments and quizzes in as tasks automatically.</p>
          </div>
          {status.canvas.connected && <span className="tag low">Connected</span>}
        </div>

        {status.canvas.connected ? (
          <>
            <p className="connection-detail">Connected to <strong>{status.canvas.domain}</strong>.</p>
            <div className="connection-actions">
              <button className="timer-btn primary" onClick={handleSync}>
                Sync assignments now
              </button>
              <button className="timer-btn" onClick={handleCanvasDisconnect}>
                Disconnect
              </button>
            </div>
            {syncResult && <p className="connection-detail">{syncResult}</p>}
          </>
        ) : (
          <form className="connection-form" onSubmit={handleCanvasConnect}>
            <label>
              Canvas domain
              <input
                type="text"
                placeholder="yourschool.instructure.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                required
              />
            </label>
            <label>
              Access token
              <input
                type="password"
                placeholder="Paste your Canvas access token"
                value={canvasToken}
                onChange={(e) => setCanvasToken(e.target.value)}
                required
              />
            </label>
            <p className="connection-help">
              Generate one in Canvas: Account → Settings → scroll to "Approved Integrations" →
              "+ New Access Token". Paste the token here — it's stored only on your own backend,
              never shared.
            </p>
            {canvasError && <p className="auth-error">{canvasError}</p>}
            <button type="submit" disabled={canvasBusy}>
              {canvasBusy ? "Connecting…" : "Connect Canvas"}
            </button>
          </form>
        )}
      </div>

      <div className="connection-card">
        <div className="connection-head">
          <div>
            <h3>Google Calendar &amp; Gmail</h3>
            <p>Shows your real schedule and scans your real inbox for spam/phishing signals.</p>
          </div>
          {status.google.connected && <span className="tag low">Connected</span>}
        </div>

        {status.google.connected ? (
          <>
            <p className="connection-detail">Connected as <strong>{status.google.email}</strong>.</p>
            <div className="connection-actions">
              <button className="timer-btn" onClick={handleGoogleDisconnect}>
                Disconnect
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="connection-help" style={{ marginBottom: 14 }}>
              Requests read-only access to your Calendar and Gmail — Ledger never sends email or
              edits your calendar on your behalf.
            </p>
            <a className="timer-btn primary" style={{ textDecoration: "none", display: "inline-block" }} href={api.integrations.googleStartUrl()}>
              Connect Google Calendar &amp; Gmail
            </a>
          </>
        )}
      </div>
    </>
  );
}
