import { Link, useOutletContext } from "react-router-dom";
import { scoreMessage } from "../lib/spamHeuristic";

export default function Inbox() {
  const data = useOutletContext();
  const { inbox, dismissMail } = data;
  const suspiciousCount = inbox.filter((m) => m.flag === "suspicious").length;
  const isLive = inbox.length > 0 && inbox[0].live;

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

      {isLive ? (
        <div className="callout">Connected to your real Gmail — these are your actual recent messages.</div>
      ) : (
        <div className="callout">
          This is sample mail. <Link to="/app/connections">Connect your Gmail</Link> on the
          Connections page to scan your real inbox instead.
        </div>
      )}

      <div className="ruled-list">
        {inbox.length === 0 && !isLive && (
          <p className="empty-note">
            No mail to show yet. <Link to="/app/connections">Connect Gmail</Link> on the
            Connections tab to scan your real inbox.
          </p>
        )}
        {inbox.length === 0 && isLive && <p className="empty-note">Inbox clear.</p>}
        {inbox.map((mail) => {
          const scored = mail.reasons
            ? { reasons: mail.reasons, suspicious: mail.flag === "suspicious" }
            : scoreMessage(mail);
          const { reasons, suspicious } = scored;
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
              {!isLive && (
                <button className="mail-dismiss" onClick={() => dismissMail(mail.id)}>
                  Dismiss
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
