import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { usePreferences } from "../context/PreferencesContext";

const LENGTHS = [
  { label: "25 min", mins: 25 },
  { label: "45 min", mins: 45 },
  { label: "50 min", mins: 50 },
];

const RADIUS = 96;
const CIRC = 2 * Math.PI * RADIUS;

export default function Focus() {
  const data = useOutletContext();
  const { prefs, playTestSound } = usePreferences();
  const { logSession, sessions, goals, weekMinutes } = data;
  const [lengthMins, setLengthMins] = useState(prefs.defaultFocusLength);
  const [secondsLeft, setSecondsLeft] = useState(prefs.defaultFocusLength * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          logSession(lengthMins);
          if (prefs.soundOnComplete) playTestSound();
          if (prefs.browserNotifications && "Notification" in window && Notification.permission === "granted") {
            new Notification("Focus session complete", {
              body: `Nice work — you finished a ${lengthMins} minute block.`,
            });
          }
          return lengthMins * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, lengthMins, logSession, prefs.soundOnComplete, prefs.browserNotifications, playTestSound]);

  function selectLength(mins) {
    if (running) return;
    setLengthMins(mins);
    setSecondsLeft(mins * 60);
  }

  function reset() {
    setRunning(false);
    setSecondsLeft(lengthMins * 60);
  }

  const totalSeconds = lengthMins * 60;
  const fraction = 1 - secondsLeft / totalSeconds;
  const offset = CIRC * (1 - fraction);
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Focus</h1>
          <p>Pick a length, start the timer, and stay with one task until it rings.</p>
        </div>
      </div>

      <div className="two-col">
        <div className="timer-card">
          <div className="timer-lengths">
            {LENGTHS.map((l) => (
              <button
                key={l.mins}
                className={lengthMins === l.mins ? "active" : ""}
                onClick={() => selectLength(l.mins)}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="timer-dial">
            <svg viewBox="0 0 220 220">
              <circle cx="110" cy="110" r={RADIUS} fill="none" stroke="var(--line)" strokeWidth="10" />
              <circle
                cx="110"
                cy="110"
                r={RADIUS}
                fill="none"
                stroke="var(--amber)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <div className="timer-dial-time">
              {mm}:{ss}
              <span className="timer-dial-label">{running ? "focusing" : "ready"}</span>
            </div>
          </div>

          <div className="timer-controls">
            <button className="timer-btn primary" onClick={() => setRunning((r) => !r)}>
              {running ? "Pause" : secondsLeft === totalSeconds ? "Start" : "Resume"}
            </button>
            <button className="timer-btn" onClick={reset}>
              Reset
            </button>
          </div>
        </div>

        <div>
          <div className="panel-title">
            <span>Weekly goals</span>
          </div>
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((weekMinutes / g.targetMinsPerWeek) * 100));
            return (
              <div className="goal-row" key={g.id}>
                <div className="goal-row-top">
                  <span>{g.label}</span>
                  <span className="amt">
                    {weekMinutes}m / {g.targetMinsPerWeek}m
                  </span>
                </div>
                <div className="ruler">
                  <div className="ruler-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}

          <div className="panel-title" style={{ marginTop: 28 }}>
            <span>Recent sessions</span>
          </div>
          <div className="ruled-list">
            {sessions.slice(0, 6).map((s) => (
              <div className="task-row" key={s.id}>
                <div className="task-body">
                  <div className="task-title">{s.durationMins} min focus block</div>
                  <div className="task-meta">
                    <span>{new Date(s.date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
