// Uses Node's built-in SQLite (available from Node 22.5+) so there's no
// native module to compile — one less thing that can fail on setup.
const { DatabaseSync } = require("node:sqlite");
const path = require("path");

const dbPath = path.join(__dirname, "..", "..", "ledger.db");
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    course TEXT NOT NULL DEFAULT 'General',
    due_date TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'todo',
    estimate_mins INTEGER DEFAULT 30,
    source TEXT NOT NULL DEFAULT 'manual',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS focus_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    duration_mins INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    target_mins_per_week INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS mail (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_addr TEXT NOT NULL,
    subject TEXT NOT NULL,
    preview TEXT NOT NULL,
    flag TEXT NOT NULL DEFAULT 'safe',
    received_at TEXT NOT NULL
  );
`);

function isoInDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Give every new account a few realistic sample rows so the dashboard
// isn't empty on first login. Students delete these once they add real
// tasks; nothing here is shared between accounts.
function seedForUser(userId) {
  const insertTask = db.prepare(
    `INSERT INTO tasks (user_id, title, course, due_date, priority, status, estimate_mins, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const tasks = [
    { title: "Draft essay: Rise of the novel", course: "English Lit", dueDate: isoInDays(1), priority: "high", status: "todo", estimateMins: 60, source: "canvas" },
    { title: "Problem set 4 — integrals", course: "Calculus II", dueDate: isoInDays(2), priority: "high", status: "todo", estimateMins: 45, source: "classroom" },
    { title: "Read chapter 6, annotate", course: "World History", dueDate: isoInDays(3), priority: "medium", status: "todo", estimateMins: 30, source: "manual" },
    { title: "Lab report: titration results", course: "Chemistry", dueDate: isoInDays(0), priority: "high", status: "doing", estimateMins: 50, source: "canvas" },
    { title: "Vocabulary quiz review", course: "Spanish III", dueDate: isoInDays(5), priority: "low", status: "todo", estimateMins: 20, source: "manual" },
  ];
  for (const t of tasks) {
    insertTask.run(userId, t.title, t.course, t.dueDate, t.priority, t.status, t.estimateMins, t.source);
  }

  const insertSession = db.prepare(
    `INSERT INTO focus_sessions (user_id, date, duration_mins) VALUES (?, ?, ?)`
  );
  insertSession.run(userId, isoInDays(-2), 25);
  insertSession.run(userId, isoInDays(-1), 50);

  const insertGoal = db.prepare(
    `INSERT INTO goals (user_id, label, target_mins_per_week) VALUES (?, ?, ?)`
  );
  insertGoal.run(userId, "Deep focus time", 300);
  insertGoal.run(userId, "Reading", 120);

  const insertMail = db.prepare(
    `INSERT INTO mail (user_id, from_addr, subject, preview, flag, received_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const mail = [
    { from: "registrar@school.edu", subject: "Add/drop deadline moved to Friday", preview: "The last day to modify your schedule without penalty is now...", flag: "safe", receivedAt: isoInDays(0) },
    { from: "prize-notify@free-giftcards.win", subject: "You have WON a $500 gift card!! Claim NOW", preview: "Congratulations!! Click the link below within 24 hours to claim your reward...", flag: "suspicious", receivedAt: isoInDays(0) },
    { from: "prof.alvarez@school.edu", subject: "Office hours moved to Thursday", preview: "Just a heads up that this week's office hours will be held on Thursday instead...", flag: "safe", receivedAt: isoInDays(-1) },
    { from: "no-reply@campus-verify-secure.com", subject: "Action required: verify your student account", preview: "Your account will be suspended unless you confirm your login within 12 hours...", flag: "suspicious", receivedAt: isoInDays(-1) },
  ];
  for (const m of mail) {
    insertMail.run(userId, m.from, m.subject, m.preview, m.flag, m.receivedAt);
  }
}

module.exports = { db, seedForUser };
