import { useOutletContext, useNavigate } from "react-router-dom";
import TaskRow from "./TaskRow";

export default function Dashboard() {
  const data = useOutletContext();
  const navigate = useNavigate();
  const { rankedTasks, weekMinutes, streakDays, goals, sessions, cycleStatus, inbox } = data;
  const today = new Date().toISOString().slice(0, 10);
  const dueToday = rankedTasks.filter((t) => t.dueDate === today).length;
  const suspicious = inbox.filter((m) => m.flag === "suspicious").length;
  const upNext = rankedTasks.slice(0, 5);

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Today</h1>
          <p>{dateLabel}</p>
        </div>
        <div className="stat-row">
          <div className="stat">
            <span className="n">{streakDays}d</span>
            <span className="l">Focus streak</span>
          </div>
          <div className="stat">
            <span className="n">{Math.round(weekMinutes / 60)}h</span>
            <span className="l">This week</span>
          </div>
          <div className="stat">
            <span className="n">{dueToday}</span>
            <span className="l">Due today</span>
          </div>
        </div>
      </div>

      {suspicious > 0 && (
        <div className="callout">
          Ledger flagged {suspicious} message{suspicious > 1 ? "s" : ""} in your inbox that look
          like spam or phishing.{" "}
          <button className="linklike" onClick={() => navigate("/app/inbox")} style={{ textDecoration: "underline" }}>
            Review inbox
          </button>
        </div>
      )}

      <div className="two-col">
        <div>
          <div className="panel-title">
            <span>Suggested order</span>
            <button className="linklike" onClick={() => navigate("/app/tasks")}>
              See all tasks
            </button>
          </div>
          <div className="ruled-list">
            {upNext.length === 0 && <p className="empty-note">Nothing urgent — nice work.</p>}
            {upNext.map((t) => (
              <TaskRow key={t.id} task={t} onCycle={cycleStatus} />
            ))}
          </div>
        </div>

        <div>
          <div className="panel-title">
            <span>Weekly goals</span>
            <button className="linklike" onClick={() => navigate("/app/focus")}>
              Start a session
            </button>
          </div>
          {goals.map((g) => {
            const minsThisWeek = weekMinutes; // shared pool for the prototype
            const pct = Math.min(100, Math.round((minsThisWeek / g.targetMinsPerWeek) * 100));
            return (
              <div className="goal-row" key={g.id}>
                <div className="goal-row-top">
                  <span>{g.label}</span>
                  <span className="amt">
                    {minsThisWeek}m / {g.targetMinsPerWeek}m
                  </span>
                </div>
                <div className="ruler">
                  <div className="ruler-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          <p style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 18 }}>
            {sessions.length} focus session{sessions.length === 1 ? "" : "s"} logged so far.
          </p>
        </div>
      </div>
    </>
  );
}
