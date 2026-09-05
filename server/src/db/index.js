// A plain JSON-file store. No native modules, no minimum Node version,
// nothing to compile — it just reads/writes a JSON file on disk. That
// trade-off (no SQL, no concurrent-writer safety) is the right one for a
// single-student local/small-deployment app; swap this module out first
// if you ever need to scale past that.

const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "..", "..", "ledger.json");

function emptyState() {
  return { nextId: 1, users: [], tasks: [], sessions: [], goals: [], mail: [] };
}

function load() {
  if (!fs.existsSync(DB_FILE)) return emptyState();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch {
    return emptyState();
  }
}

let state = load();

function persist() {
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
}

function nextId() {
  const id = state.nextId;
  state.nextId += 1;
  return id;
}

function isoInDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ---------- users ----------

function findUserByEmail(email) {
  return state.users.find((u) => u.email === email.toLowerCase()) || null;
}

function findUserById(id) {
  return state.users.find((u) => u.id === id) || null;
}

function createUser({ email, name, passwordHash = null, googleId = null }) {
  const user = {
    id: nextId(),
    email: email.toLowerCase(),
    name,
    passwordHash,
    googleId,
    createdAt: new Date().toISOString(),
  };
  state.users.push(user);
  persist();
  return user;
}

function linkGoogleId(userId, googleId) {
  const user = findUserById(userId);
  if (user) {
    user.googleId = googleId;
    persist();
  }
  return user;
}

// ---------- tasks ----------

function listTasks(userId) {
  return state.tasks
    .filter((t) => t.userId === userId)
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
}

function createTask(userId, data) {
  const task = {
    id: nextId(),
    userId,
    title: data.title,
    course: data.course || "General",
    dueDate: data.dueDate,
    priority: data.priority || "medium",
    status: "todo",
    estimateMins: data.estimateMins || 30,
    source: "manual",
  };
  state.tasks.push(task);
  persist();
  return task;
}

function updateTask(userId, id, patch) {
  const task = state.tasks.find((t) => t.id === id && t.userId === userId);
  if (!task) return null;
  Object.assign(task, patch);
  persist();
  return task;
}

function deleteTask(userId, id) {
  const before = state.tasks.length;
  state.tasks = state.tasks.filter((t) => !(t.id === id && t.userId === userId));
  persist();
  return state.tasks.length < before;
}

// ---------- focus sessions ----------

function listSessions(userId) {
  return state.sessions
    .filter((s) => s.userId === userId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

function createSession(userId, durationMins) {
  const session = {
    id: nextId(),
    userId,
    date: new Date().toISOString().slice(0, 10),
    durationMins,
  };
  state.sessions.push(session);
  persist();
  return session;
}

// ---------- goals ----------

function listGoals(userId) {
  return state.goals.filter((g) => g.userId === userId);
}

function createGoal(userId, { label, targetMinsPerWeek }) {
  const goal = { id: nextId(), userId, label, targetMinsPerWeek };
  state.goals.push(goal);
  persist();
  return goal;
}

// ---------- mail ----------

function listMail(userId) {
  return state.mail
    .filter((m) => m.userId === userId)
    .sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1));
}

function deleteMail(userId, id) {
  const before = state.mail.length;
  state.mail = state.mail.filter((m) => !(m.id === id && m.userId === userId));
  persist();
  return state.mail.length < before;
}

// ---------- seed data for a brand new account ----------

function seedForUser(userId) {
  const tasks = [
    { title: "Draft essay: Rise of the novel", course: "English Lit", dueDate: isoInDays(1), priority: "high", status: "todo", estimateMins: 60, source: "canvas" },
    { title: "Problem set 4 — integrals", course: "Calculus II", dueDate: isoInDays(2), priority: "high", status: "todo", estimateMins: 45, source: "classroom" },
    { title: "Read chapter 6, annotate", course: "World History", dueDate: isoInDays(3), priority: "medium", status: "todo", estimateMins: 30, source: "manual" },
    { title: "Lab report: titration results", course: "Chemistry", dueDate: isoInDays(0), priority: "high", status: "doing", estimateMins: 50, source: "canvas" },
    { title: "Vocabulary quiz review", course: "Spanish III", dueDate: isoInDays(5), priority: "low", status: "todo", estimateMins: 20, source: "manual" },
  ];
  for (const t of tasks) state.tasks.push({ id: nextId(), userId, ...t });

  state.sessions.push({ id: nextId(), userId, date: isoInDays(-2), durationMins: 25 });
  state.sessions.push({ id: nextId(), userId, date: isoInDays(-1), durationMins: 50 });

  state.goals.push({ id: nextId(), userId, label: "Deep focus time", targetMinsPerWeek: 300 });
  state.goals.push({ id: nextId(), userId, label: "Reading", targetMinsPerWeek: 120 });

  const mail = [
    { from: "registrar@school.edu", subject: "Add/drop deadline moved to Friday", preview: "The last day to modify your schedule without penalty is now...", flag: "safe", receivedAt: isoInDays(0) },
    { from: "prize-notify@free-giftcards.win", subject: "You have WON a $500 gift card!! Claim NOW", preview: "Congratulations!! Click the link below within 24 hours to claim your reward...", flag: "suspicious", receivedAt: isoInDays(0) },
    { from: "prof.alvarez@school.edu", subject: "Office hours moved to Thursday", preview: "Just a heads up that this week's office hours will be held on Thursday instead...", flag: "safe", receivedAt: isoInDays(-1) },
    { from: "no-reply@campus-verify-secure.com", subject: "Action required: verify your student account", preview: "Your account will be suspended unless you confirm your login within 12 hours...", flag: "suspicious", receivedAt: isoInDays(-1) },
  ];
  for (const m of mail) state.mail.push({ id: nextId(), userId, ...m, from: m.from });

  persist();
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  linkGoogleId,
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  listSessions,
  createSession,
  listGoals,
  createGoal,
  listMail,
  deleteMail,
  seedForUser,
};
