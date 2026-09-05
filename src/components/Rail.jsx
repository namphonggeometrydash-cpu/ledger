const ICONS = {
  dashboard: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 10.5 10 4l7 6.5" />
      <path d="M5 9v7h10V9" />
    </svg>
  ),
  tasks: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 5.5h12M4 10h12M4 14.5h7" strokeLinecap="round" />
      <circle cx="4.5" cy="5.5" r="0" />
    </svg>
  ),
  focus: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="10" r="6.5" />
      <path d="M10 6.5V10l2.5 2" strokeLinecap="round" />
    </svg>
  ),
  inbox: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 6.5 10 11l7-4.5" />
      <rect x="3" y="4.5" width="14" height="11" rx="1.2" />
    </svg>
  ),
};

export default function Rail({ page, onNavigate, pages }) {
  return (
    <nav className="rail">
      <div className="rail-mark">
        <span className="rail-mark-glyph">§</span>
        <span className="rail-mark-word">Ledger</span>
      </div>
      <div className="rail-nav">
        {Object.entries(pages).map(([key, { label }]) => (
          <button
            key={key}
            className={`rail-item${page === key ? " active" : ""}`}
            onClick={() => onNavigate(key)}
          >
            {ICONS[key]}
            {label}
          </button>
        ))}
      </div>
      <div className="rail-foot">
        Connected to Canvas &amp; Gmail
        <br />
        will unlock in a later step.
      </div>
    </nav>
  );
}
