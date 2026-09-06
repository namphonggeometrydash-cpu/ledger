import { useState } from "react";
import { usePreferences, THEMES } from "../context/PreferencesContext";
import { api } from "../lib/api";

const TABS = ["Appearance", "Notifications", "Focus", "Account"];

export default function PreferencesModal({ user, onLogout, onClose, appData }) {
  const { prefs, setPref, playTestSound, requestBrowserNotifications } = usePreferences();
  const [tab, setTab] = useState("Appearance");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleToggleNotifications(checked) {
    if (checked) {
      const granted = await requestBrowserNotifications();
      setPref("browserNotifications", granted);
    } else {
      setPref("browserNotifications", false);
    }
  }

  function handleExportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      tasks: appData?.tasks || [],
      sessions: appData?.sessions || [],
      goals: appData?.goals || [],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ledger-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDeleteAccount() {
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await api.deleteAccount();
      onLogout();
    } catch (err) {
      setDeleteError(err.message);
      setDeleteBusy(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Preferences</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              className={`modal-tab${tab === t ? " active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {tab === "Appearance" && (
            <>
              <div className="pref-section">
                <h4>Theme</h4>
                <div className="theme-grid">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      className={`theme-swatch${prefs.theme === t.id ? " active" : ""}`}
                      onClick={() => setPref("theme", t.id)}
                    >
                      <span className="theme-swatch-preview">
                        <span style={{ background: t.swatch[0] }} />
                        <span style={{ background: t.swatch[1] }} />
                        <span style={{ background: t.swatch[2] }} />
                      </span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pref-section">
                <h4>Density</h4>
                <div className="pref-row-group">
                  <label className="pref-radio">
                    <input
                      type="radio"
                      name="density"
                      checked={prefs.density === "comfortable"}
                      onChange={() => setPref("density", "comfortable")}
                    />
                    Comfortable
                  </label>
                  <label className="pref-radio">
                    <input
                      type="radio"
                      name="density"
                      checked={prefs.density === "compact"}
                      onChange={() => setPref("density", "compact")}
                    />
                    Compact
                  </label>
                </div>
              </div>

              <div className="pref-section">
                <ToggleRow
                  label="Reduce motion"
                  help="Turns off animations regardless of your system setting."
                  checked={prefs.reduceMotion}
                  onChange={(v) => setPref("reduceMotion", v)}
                />
              </div>
            </>
          )}

          {tab === "Notifications" && (
            <>
              <div className="pref-section">
                <ToggleRow
                  label="Sound when a focus session ends"
                  help="A short chime plays when the timer finishes."
                  checked={prefs.soundOnComplete}
                  onChange={(v) => setPref("soundOnComplete", v)}
                />
                <button className="linklike" style={{ fontSize: 12.5 }} onClick={playTestSound}>
                  Test sound
                </button>
              </div>

              <div className="pref-section">
                <ToggleRow
                  label="Browser notification when a session ends"
                  help="Shows a system notification even if this tab isn't focused."
                  checked={prefs.browserNotifications}
                  onChange={handleToggleNotifications}
                />
              </div>

              <div className="pref-section">
                <ToggleRow
                  label="Daily email digest of due tasks"
                  help="Coming soon — needs an email-sending backend we haven't built yet."
                  checked={false}
                  onChange={() => {}}
                  disabled
                />
              </div>
            </>
          )}

          {tab === "Focus" && (
            <>
              <div className="pref-section">
                <h4>Default session length</h4>
                <div className="pref-row-group">
                  {[25, 45, 50].map((mins) => (
                    <label className="pref-radio" key={mins}>
                      <input
                        type="radio"
                        name="defaultFocusLength"
                        checked={prefs.defaultFocusLength === mins}
                        onChange={() => setPref("defaultFocusLength", mins)}
                      />
                      {mins} min
                    </label>
                  ))}
                </div>
              </div>

              <div className="pref-section">
                <ToggleRow
                  label="Auto-start the next session after a short break"
                  help="Coming soon — break cycling isn't built into the timer yet."
                  checked={false}
                  onChange={() => {}}
                  disabled
                />
              </div>
            </>
          )}

          {tab === "Account" && (
            <>
              <div className="pref-section">
                <h4>Signed in as</h4>
                <p className="connection-detail">
                  <strong>{user?.name}</strong> — {user?.email}
                </p>
                <button className="timer-btn" onClick={onLogout}>
                  Sign out
                </button>
              </div>

              <div className="pref-section">
                <h4>Your data</h4>
                <p className="connection-help" style={{ marginBottom: 10 }}>
                  Download everything Ledger has stored for you as a JSON file.
                </p>
                <button className="timer-btn" onClick={handleExportData}>
                  Export my data
                </button>
              </div>

              <div className="pref-section pref-danger">
                <h4>Danger zone</h4>
                {!confirmingDelete ? (
                  <button className="timer-btn danger" onClick={() => setConfirmingDelete(true)}>
                    Delete my account
                  </button>
                ) : (
                  <>
                    <p className="connection-help" style={{ marginBottom: 10 }}>
                      This permanently deletes your account and every task, session, and
                      connection tied to it. This can't be undone.
                    </p>
                    {deleteError && <p className="auth-error">{deleteError}</p>}
                    <div className="connection-actions">
                      <button className="timer-btn danger" onClick={handleDeleteAccount} disabled={deleteBusy}>
                        {deleteBusy ? "Deleting…" : "Yes, delete everything"}
                      </button>
                      <button className="timer-btn" onClick={() => setConfirmingDelete(false)}>
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, help, checked, onChange, disabled = false }) {
  return (
    <div className={`toggle-row${disabled ? " disabled" : ""}`}>
      <div>
        <div className="toggle-label">{label}</div>
        {help && <div className="toggle-help">{help}</div>}
      </div>
      <label className="switch">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="switch-track">
          <span className="switch-thumb" />
        </span>
      </label>
    </div>
  );
}
