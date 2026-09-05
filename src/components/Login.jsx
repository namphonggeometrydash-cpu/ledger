import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Login() {
  const { login, register, loginWithGoogle } = useAuth();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get("mode") === "register" ? "register" : "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const googleBtnRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password, remember);
      } else {
        await register(name, email, password, remember);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Render Google's own "Sign in with Google" button once the Identity
  // Services script (loaded in index.html) is ready. Requires
  // VITE_GOOGLE_CLIENT_ID to be set — see server/README for setup.
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleBtnRef.current) return;

    let cancelled = false;

    function render() {
      if (cancelled || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          setError("");
          setBusy(true);
          try {
            await loginWithGoogle(response.credential, remember);
          } catch (err) {
            setError(err.message);
          } finally {
            setBusy(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        width: 296,
      });
    }

    if (window.google?.accounts?.id) {
      render();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          render();
        }
      }, 200);
      setTimeout(() => clearInterval(interval), 8000);
      return () => clearInterval(interval);
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remember]);

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <Link to="/" className="rail-mark" style={{ marginBottom: 24, textDecoration: "none" }}>
          <span className="rail-mark-glyph">§</span>
          <span className="rail-mark-word">Ledger</span>
        </Link>
        <h1 style={{ fontSize: 22, marginBottom: 6 }}>
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginBottom: 22 }}>
          {mode === "login"
            ? "Sign in to see your tasks, focus history, and inbox."
            : "Takes a few seconds — your data stays tied to this account."}
        </p>

        {GOOGLE_CLIENT_ID ? (
          <div style={{ marginBottom: 18 }}>
            <div ref={googleBtnRef} />
          </div>
        ) : (
          <p style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 18 }}>
            Google sign-in isn't configured yet — set VITE_GOOGLE_CLIENT_ID to enable it.
          </p>
        )}

        <div className="auth-divider">
          <span>or use email</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "register" && (
            <label>
              Name
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
          )}
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </label>

          <label className="auth-remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Keep me signed in on this device
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          className="linklike"
          style={{ marginTop: 16, fontSize: 13 }}
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
        >
          {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
