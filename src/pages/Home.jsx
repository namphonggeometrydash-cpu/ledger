import { Link } from "react-router-dom";

const FEATURES = [
  {
    title: "A suggested order, not just a list",
    body: "Ledger looks at what's overdue, what's due soonest, and how important it is, and tells you what to do first — so you're not stuck deciding.",
  },
  {
    title: "Focus sessions that actually log",
    body: "Pick 25, 45, or 50 minutes and go. Every finished session counts toward a weekly goal, so you can see the habit forming.",
  },
  {
    title: "An inbox that explains itself",
    body: "Ledger flags scammy or clickbait email and shows you exactly why — the urgency language, the odd sender, the prize hook — instead of just trusting a black box.",
  },
  {
    title: "Real data, not a demo",
    body: "Connect Canvas with a personal access token and Google Calendar/Gmail with your own account — Ledger works off your actual courses and inbox, not sample rows.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Connect your tools",
    body: "Paste a Canvas token and sign in with Google. Takes about two minutes.",
  },
  {
    n: "02",
    title: "Get your suggested order",
    body: "Ledger ranks what's due across every class into one list — no more checking five tabs.",
  },
  {
    n: "03",
    title: "Focus, then repeat",
    body: "Run a timed session, watch your streak grow, and let Ledger quietly screen your inbox.",
  },
];

export default function Home() {
  return (
    <div className="home">
      <div className="home-blobs" aria-hidden="true">
        <span className="blob blob-amber" />
        <span className="blob blob-moss" />
        <span className="blob blob-rust" />
      </div>

      <header className="home-nav">
        <div className="rail-mark">
          <img src="/ledger-icon.png" alt="" className="rail-mark-icon" />
          <span className="rail-mark-word">Ledger</span>
        </div>
        <Link to="/login" className="home-nav-cta">
          Sign in
        </Link>
      </header>

      <section className="home-hero">
        <img src="/ledger-logo.png" alt="Ledger" className="home-hero-logo" />
        <p className="home-eyebrow">
          <span className="home-eyebrow-dot" /> for students who have too many tabs open
        </p>
        <h1>
          Homework, focus time, and your inbox —
          <br />
          one calm place to run all three.
        </h1>
        <p className="home-sub">
          Ledger pulls your assignments into one ranked list, times your focus sessions, and
          quietly screens your inbox for spam and scams — so the hard part of the day is doing
          the work, not figuring out what to do.
        </p>
        <div className="home-hero-actions">
          <Link to="/login?mode=register" className="home-btn primary">
            Get started — it's free
          </Link>
          <Link to="/login" className="home-btn">
            I already have an account
          </Link>
        </div>
      </section>

      <section className="home-features">
        {FEATURES.map((f) => (
          <div className="home-feature" key={f.title}>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </section>

      <section className="home-steps">
        <h2 className="home-section-title">How it works</h2>
        <div className="home-steps-grid">
          {STEPS.map((s) => (
            <div className="home-step" key={s.n}>
              <span className="home-step-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-cta-band">
        <img src="/ledger-icon.png" alt="" className="home-cta-icon" />
        <h2>Open a new tab less. Close more tasks.</h2>
        <Link to="/login?mode=register" className="home-btn primary">
          Create your free account
        </Link>
      </section>

      <footer className="home-foot">
        Built for students, by design that respects your attention.
      </footer>
    </div>
  );
}
