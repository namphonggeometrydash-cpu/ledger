import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../data/store";
import Rail from "./Rail";

export default function AppShell() {
  const data = useAppData();
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <Rail user={user} onLogout={logout} />
      <main className="shell-main">
        {data.error && <p className="auth-error" style={{ marginBottom: 20 }}>{data.error}</p>}
        {data.loading ? <p className="empty-note">Loading your data…</p> : <Outlet context={data} />}
      </main>
    </div>
  );
}
