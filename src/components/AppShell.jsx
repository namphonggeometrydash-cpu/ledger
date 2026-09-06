import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../data/store";
import Rail from "./Rail";
import PreferencesModal from "./PreferencesModal";

export default function AppShell() {
  const data = useAppData();
  const { user, logout } = useAuth();
  const [prefsOpen, setPrefsOpen] = useState(false);

  return (
    <div className="shell">
      <Rail user={user} onOpenPreferences={() => setPrefsOpen(true)} />
      <main className="shell-main">
        {data.error && <p className="auth-error" style={{ marginBottom: 20 }}>{data.error}</p>}
        {data.loading ? <p className="empty-note">Loading your data…</p> : <Outlet context={data} />}
      </main>
      {prefsOpen && (
        <PreferencesModal
          user={user}
          onLogout={logout}
          onClose={() => setPrefsOpen(false)}
          appData={data}
        />
      )}
    </div>
  );
}
