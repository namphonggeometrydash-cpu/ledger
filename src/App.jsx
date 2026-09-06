import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import Login from "./components/Login";
import AppShell from "./components/AppShell";
import Dashboard from "./components/Dashboard";
import Tasks from "./components/Tasks";
import Focus from "./components/Focus";
import Inbox from "./components/Inbox";
import Connections from "./components/Connections";
import "./app.css";

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="auth-screen">
        <p style={{ color: "var(--ink-soft)" }}>Loading…</p>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user, loading } = useAuth();

  return (
    <Routes>
      <Route path="/" element={loading ? null : user ? <Navigate to="/app" replace /> : <Home />} />
      <Route path="/login" element={user ? <Navigate to="/app" replace /> : <Login />} />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="focus" element={<Focus />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="connections" element={<Connections />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
