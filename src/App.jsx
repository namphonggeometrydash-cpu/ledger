import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { useAppData } from "./data/store";
import Rail from "./components/Rail";
import Dashboard from "./components/Dashboard";
import Tasks from "./components/Tasks";
import Focus from "./components/Focus";
import Inbox from "./components/Inbox";
import Login from "./components/Login";
import "./app.css";

const PAGES = {
  dashboard: { label: "Today", Component: Dashboard },
  tasks: { label: "Tasks", Component: Tasks },
  focus: { label: "Focus", Component: Focus },
  inbox: { label: "Inbox", Component: Inbox },
};

function AuthedApp() {
  const [page, setPage] = useState("dashboard");
  const data = useAppData();
  const { user, logout } = useAuth();
  const { Component } = PAGES[page];

  return (
    <div className="shell">
      <Rail page={page} onNavigate={setPage} pages={PAGES} user={user} onLogout={logout} />
      <main className="shell-main">
        {data.error && <p className="auth-error" style={{ marginBottom: 20 }}>{data.error}</p>}
        {data.loading ? (
          <p className="empty-note">Loading your data…</p>
        ) : (
          <Component data={data} onNavigate={setPage} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-screen">
        <p style={{ color: "var(--ink-soft)" }}>Loading…</p>
      </div>
    );
  }

  return user ? <AuthedApp /> : <Login />;
}
