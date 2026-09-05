const express = require("express");
const { db } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

function toClient(row) {
  return {
    id: String(row.id),
    title: row.title,
    course: row.course,
    dueDate: row.due_date,
    priority: row.priority,
    status: row.status,
    estimateMins: row.estimate_mins,
    source: row.source,
  };
}

router.get("/", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM tasks WHERE user_id = ? ORDER BY due_date ASC")
    .all(req.userId);
  res.json(rows.map(toClient));
});

router.post("/", (req, res) => {
  const { title, course = "General", dueDate, priority = "medium", estimateMins = 30 } = req.body || {};
  if (!title || !dueDate) return res.status(400).json({ error: "title and dueDate are required" });

  const info = db
    .prepare(
      `INSERT INTO tasks (user_id, title, course, due_date, priority, status, estimate_mins, source)
       VALUES (?, ?, ?, ?, ?, 'todo', ?, 'manual')`
    )
    .run(req.userId, title, course, dueDate, priority, estimateMins);

  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(toClient(row));
});

router.patch("/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);
  if (!row) return res.status(404).json({ error: "Task not found" });

  const fields = {
    title: req.body.title ?? row.title,
    course: req.body.course ?? row.course,
    due_date: req.body.dueDate ?? row.due_date,
    priority: req.body.priority ?? row.priority,
    status: req.body.status ?? row.status,
    estimate_mins: req.body.estimateMins ?? row.estimate_mins,
  };

  db.prepare(
    `UPDATE tasks SET title=?, course=?, due_date=?,
     priority=?, status=?, estimate_mins=? WHERE id=?`
  ).run(
    fields.title,
    fields.course,
    fields.due_date,
    fields.priority,
    fields.status,
    fields.estimate_mins,
    row.id
  );

  const updated = db.prepare("SELECT * FROM tasks WHERE id = ?").get(row.id);
  res.json(toClient(updated));
});

router.delete("/:id", (req, res) => {
  const info = db
    .prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.userId);
  if (info.changes === 0) return res.status(404).json({ error: "Task not found" });
  res.status(204).end();
});

module.exports = router;
