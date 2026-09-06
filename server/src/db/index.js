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
    // Integrations — all optional, absent/null means "not connected".
    canvas: null, // { domain, token }
    google: null, // { accessToken, refreshToken, expiryDate, scopes, email }
  };
  state.users.push(user);
  persist();
  return user;
}

function saveCanvasConnection(userId, { domain, token }) {
  const user = findUserById(userId);
  if (!user) return null;
  user.canvas = { domain, token };
  persist();
  return user;
}

function clearCanvasConnection(userId) {
  const user = findUserById(userId);
  if (!user) return null;
  user.canvas = null;
  persist();
  return user;
}

function saveGoogleTokens(userId, { accessToken, refreshToken, expiryDate, scopes, email }) {
  const user = findUserById(userId);
  if (!user) return null;
  user.google = {
    accessToken,
    // Google only sends a refresh token on the very first consent —
    // keep the old one if a later exchange doesn't include a new one.
    refreshToken: refreshToken || user.google?.refreshToken || null,
    expiryDate,
    scopes,
    email,
  };
  persist();
  return user;
}

function clearGoogleConnection(userId) {
  const user = findUserById(userId);
  if (!user) return null;
  user.google = null;
  persist();
  return user;
}

function deleteUser(userId) {
  state.users = state.users.filter((u) => u.id !== userId);
  state.tasks = state.tasks.filter((t) => t.userId !== userId);
  state.sessions = state.sessions.filter((s) => s.userId !== userId);
  state.goals = state.goals.filter((g) => g.userId !== userId);
  state.mail = state.mail.filter((m) => m.userId !== userId);
  persist();
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
    status: data.status || "todo",
    estimateMins: data.estimateMins || 30,
    source: data.source || "manual",
    sourceId: data.sourceId || null, // used to avoid duplicate imports from Canvas etc.
  };
  state.tasks.push(task);
  persist();
  return task;
}

function findTaskBySourceId(userId, source, sourceId) {
  return state.tasks.find((t) => t.userId === userId && t.source === source && t.sourceId === sourceId) || null;
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
  // No sample tasks or mail anymore — new accounts start clean, and the
  // empty states point people at the Connections tab instead of showing
  // fake data that looks real. Keep sensible default weekly goals only.
  state.goals.push({ id: nextId(), userId, label: "Deep focus time", targetMinsPerWeek: 300 });
  state.goals.push({ id: nextId(), userId, label: "Reading", targetMinsPerWeek: 120 });
  persist();
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  linkGoogleId,
  saveCanvasConnection,
  clearCanvasConnection,
  saveGoogleTokens,
  clearGoogleConnection,
  deleteUser,
  listTasks,
  createTask,
  findTaskBySourceId,
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
