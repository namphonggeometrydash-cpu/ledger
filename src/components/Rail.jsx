import { NavLink } from "react-router-dom";

const NAV = [
  {
    to: "/app",
    label: "Today",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 10.5 10 4l7 6.5" />
        <path d="M5 9v7h10V9" />
      </svg>
    ),
  },
  {
    to: "/app/tasks",
    label: "Tasks",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 5.5h12M4 10h12M4 14.5h7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: "/app/focus",
    label: "Focus",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="10" cy="10" r="6.5" />
        <path d="M10 6.5V10l2.5 2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: "/app/inbox",
    label: "Inbox",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 6.5 10 11l7-4.5" />
        <rect x="3" y="4.5" width="14" height="11" rx="1.2" />
      </svg>
    ),
  },
  {
    to: "/app/connections",
    label: "Connections",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M7 13 13 7" strokeLinecap="round" />
        <path d="M8.5 4.5 6 7a3 3 0 0 0 4 4.5l2.5-2.5" strokeLinecap="round" />
        <path d="M11.5 15.5 14 13a3 3 0 0 0-4-4.5L7.5 11" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function Rail({ user, onLogout }) {
  return (
    <nav className="rail">
      <div className="rail-mark">
        <span className="rail-mark-glyph">§</span>
        <span className="rail-mark-word">Ledger</span>
      </div>
      <div className="rail-nav">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/app"}
            className={({ isActive }) => `rail-item${isActive ? " active" : ""}`}
          >
            {icon}
            {label}
          </NavLink>
        ))}
      </div>
      <div className="rail-foot">
        {user && (
          <>
            Signed in as <strong style={{ color: "var(--ink-soft)" }}>{user.name}</strong>
            <br />
            <button className="linklike" style={{ marginTop: 6 }} onClick={onLogout}>
              Sign out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
