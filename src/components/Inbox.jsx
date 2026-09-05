import { scoreMessage } from "../lib/spamHeuristic";

export default function Inbox({ data }) {
  const { inbox, dismissMail } = data;
  const suspiciousCount = inbox.filter((m) => m.flag === "suspicious").length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Inbox scan</h1>
          <p>Ledger scans subject lines and previews for deadline info and scam signals.</p>
        </div>
        <div className="stat-row">
          <div className="stat">
            <span className="n">{inbox.length}</span>
            <span className="l">Scanned</span>
          </div>
          <div className="stat">
            <span className="n">{suspiciousCount}</span>
            <span className="l">Flagged</span>
          </div>
        </div>
      </div>

      <div className="callout">
        This view runs on a connected Gmail account in the full version (via Google OAuth, read-only
        scope). Here it works on sample mail using an explainable rule-based scan — every flag below
        shows the exact signal that tripped it.
      </div>

      <div className="ruled-list">
        {inbox.length === 0 && <p className="empty-note">Inbox clear.</p>}
        {inbox.map((mail) => {
          const { reasons, suspicious } = scoreMessage(mail);
          return (
            <div className="mail-row" key={mail.id}>
              <span className={`mail-flag ${suspicious ? "suspicious" : "safe"}`} />
              <div className="mail-body">
                <div className="mail-from">{mail.from}</div>
                <div className="mail-subject">{mail.subject}</div>
                <div className="mail-preview">{mail.preview}</div>
                {suspicious && reasons.length > 0 && (
                  <div className="mail-warning">Flagged: {reasons[0]}</div>
                )}
              </div>
              <button className="mail-dismiss" onClick={() => dismissMail(mail.id)}>
                Dismiss
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
