import { useEffect, useState, useCallback, useMemo } from "react";

const STORAGE_KEY = "ledger.v1";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function isoInDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const SEED = {
  tasks: [
    {
      id: uid(),
      title: "Draft essay: Rise of the novel",
      course: "English Lit",
      dueDate: isoInDays(1),
      priority: "high",
      status: "todo",
      estimateMins: 60,
      source: "canvas",
    },
    {
      id: uid(),
      title: "Problem set 4 — integrals",
      course: "Calculus II",
      dueDate: isoInDays(2),
      priority: "high",
      status: "todo",
      estimateMins: 45,
      source: "classroom",
    },
    {
      id: uid(),
      title: "Read chapter 6, annotate",
      course: "World History",
      dueDate: isoInDays(3),
      priority: "medium",
      status: "todo",
      estimateMins: 30,
      source: "manual",
    },
    {
      id: uid(),
      title: "Lab report: titration results",
      course: "Chemistry",
      dueDate: isoInDays(0),
      priority: "high",
      status: "doing",
      estimateMins: 50,
      source: "canvas",
    },
    {
      id: uid(),
      title: "Vocabulary quiz review",
      course: "Spanish III",
      dueDate: isoInDays(5),
      priority: "low",
      status: "todo",
      estimateMins: 20,
      source: "manual",
    },
    {
      id: uid(),
      title: "Group project outline",
      course: "World History",
      dueDate: isoInDays(-1),
      priority: "medium",
      status: "done",
      estimateMins: 40,
      source: "classroom",
    },
  ],
  sessions: [
    { id: uid(), date: isoInDays(-2), durationMins: 25 },
    { id: uid(), date: isoInDays(-2), durationMins: 25 },
    { id: uid(), date: isoInDays(-1), durationMins: 50 },
    { id: uid(), date: isoInDays(0), durationMins: 25 },
  ],
  goals: [
    { id: uid(), label: "Deep focus time", targetMinsPerWeek: 300 },
    { id: uid(), label: "Reading", targetMinsPerWeek: 120 },
  ],
  inbox: [
    {
      id: uid(),
      from: "registrar@school.edu",
      subject: "Add/drop deadline moved to Friday",
      preview: "The last day to modify your schedule without penalty is now...",
      flag: "safe",
      receivedAt: isoInDays(0),
    },
    {
      id: uid(),
      from: "prize-notify@free-giftcards.win",
      subject: "You have WON a $500 gift card!! Claim NOW",
      preview: "Congratulations!! Click the link below within 24 hours to claim your reward...",
      flag: "suspicious",
      receivedAt: isoInDays(0),
    },
    {
      id: uid(),
      from: "prof.alvarez@school.edu",
      subject: "Office hours moved to Thursday",
      preview: "Just a heads up that this week's office hours will be held on Thursday instead...",
      flag: "safe",
      receivedAt: isoInDays(-1),
    },
    {
      id: uid(),
      from: "no-reply@campus-verify-secure.com",
      subject: "Action required: verify your student account",
      preview: "Your account will be suspended unless you confirm your login within 12 hours...",
      flag: "suspicious",
      receivedAt: isoInDays(-1),
    },
  ],
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(SEED);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(SEED), ...parsed };
  } catch {
    return structuredClone(SEED);
  }
}

export function useAppData() {
  const [data, setData] = useState(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const addTask = useCallback((task) => {
    setData((d) => ({
      ...d,
      tasks: [
        { id: uid(), status: "todo", priority: "medium", source: "manual", ...task },
        ...d.tasks,
      ],
    }));
  }, []);

  const updateTask = useCallback((id, patch) => {
    setData((d) => ({
      ...d,
      tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const deleteTask = useCallback((id) => {
    setData((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));
  }, []);

  const cycleStatus = useCallback((id) => {
    const order = ["todo", "doing", "done"];
    setData((d) => ({
      ...d,
      tasks: d.tasks.map((t) =>
        t.id === id
          ? { ...t, status: order[(order.indexOf(t.status) + 1) % order.length] }
          : t
      ),
    }));
  }, []);

  const logSession = useCallback((durationMins) => {
    setData((d) => ({
      ...d,
      sessions: [
        { id: uid(), date: new Date().toISOString().slice(0, 10), durationMins },
        ...d.sessions,
      ],
    }));
  }, []);

  const dismissMail = useCallback((id) => {
    setData((d) => ({ ...d, inbox: d.inbox.filter((m) => m.id !== id) }));
  }, []);

  // Priority score used to auto-rank tasks: overdue/urgent + importance first.
  const rankedTasks = useMemo(() => {
    const weight = { high: 3, medium: 2, low: 1 };
    const today = new Date().toISOString().slice(0, 10);
    return [...data.tasks]
      .filter((t) => t.status !== "done")
      .sort((a, b) => {
        const aOverdue = a.dueDate < today ? 1 : 0;
        const bOverdue = b.dueDate < today ? 1 : 0;
        if (aOverdue !== bOverdue) return bOverdue - aOverdue;
        if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
        return weight[b.priority] - weight[a.priority];
      });
  }, [data.tasks]);

  const weekMinutes = useMemo(() => {
    const cutoff = isoInDays(-7);
    return data.sessions
      .filter((s) => s.date >= cutoff)
      .reduce((sum, s) => sum + s.durationMins, 0);
  }, [data.sessions]);

  const streakDays = useMemo(() => {
    const days = new Set(data.sessions.map((s) => s.date));
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      const day = isoInDays(-i);
      if (days.has(day)) streak++;
      else if (i === 0) continue; // today may not have a session yet
      else break;
    }
    return streak;
  }, [data.sessions]);

  return {
    tasks: data.tasks,
    rankedTasks,
    sessions: data.sessions,
    goals: data.goals,
    inbox: data.inbox,
    weekMinutes,
    streakDays,
    addTask,
    updateTask,
    deleteTask,
    cycleStatus,
    logSession,
    dismissMail,
  };
}
