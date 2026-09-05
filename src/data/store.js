import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

function isoInDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function useAppData() {
  const [tasks, setTasks] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [t, s, g, m] = await Promise.all([
        api.tasks.list(),
        api.sessions.list(),
        api.goals.list(),
        api.inbox.list(),
      ]);
      setTasks(t);
      setSessions(s);
      setGoals(g);
      setInbox(m);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const addTask = useCallback(async (task) => {
    const created = await api.tasks.create(task);
    setTasks((prev) => [created, ...prev]);
  }, []);

  const updateTask = useCallback(async (id, patch) => {
    const updated = await api.tasks.update(id, patch);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const deleteTask = useCallback(async (id) => {
    await api.tasks.remove(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const cycleStatus = useCallback(
    async (id) => {
      const order = ["todo", "doing", "done"];
      const current = tasks.find((t) => t.id === id);
      if (!current) return;
      const next = order[(order.indexOf(current.status) + 1) % order.length];
      // Optimistic update so the checkbox feels instant.
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: next } : t)));
      try {
        await api.tasks.update(id, { status: next });
      } catch {
        setTasks((prev) => prev.map((t) => (t.id === id ? current : t)));
      }
    },
    [tasks]
  );

  const logSession = useCallback(async (durationMins) => {
    const created = await api.sessions.create(durationMins);
    setSessions((prev) => [created, ...prev]);
  }, []);

  const dismissMail = useCallback(async (id) => {
    setInbox((prev) => prev.filter((m) => m.id !== id));
    try {
      await api.inbox.dismiss(id);
    } catch {
      refreshAll();
    }
  }, [refreshAll]);

  const rankedTasks = useMemo(() => {
    const weight = { high: 3, medium: 2, low: 1 };
    const today = new Date().toISOString().slice(0, 10);
    return [...tasks]
      .filter((t) => t.status !== "done")
      .sort((a, b) => {
        const aOverdue = a.dueDate < today ? 1 : 0;
        const bOverdue = b.dueDate < today ? 1 : 0;
        if (aOverdue !== bOverdue) return bOverdue - aOverdue;
        if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
        return weight[b.priority] - weight[a.priority];
      });
  }, [tasks]);

  const weekMinutes = useMemo(() => {
    const cutoff = isoInDays(-7);
    return sessions
      .filter((s) => s.date >= cutoff)
      .reduce((sum, s) => sum + s.durationMins, 0);
  }, [sessions]);

  const streakDays = useMemo(() => {
    const days = new Set(sessions.map((s) => s.date));
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      const day = isoInDays(-i);
      if (days.has(day)) streak++;
      else if (i === 0) continue;
      else break;
    }
    return streak;
  }, [sessions]);

  return {
    tasks,
    rankedTasks,
    sessions,
    goals,
    inbox,
    weekMinutes,
    streakDays,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    cycleStatus,
    logSession,
    dismissMail,
    refreshAll,
  };
}
