const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", (req, res) => {
  res.json(db.listTasks(req.userId));
});

router.post("/", (req, res) => {
  const { title, dueDate } = req.body || {};
  if (!title || !dueDate) return res.status(400).json({ error: "title and dueDate are required" });
  res.status(201).json(db.createTask(req.userId, req.body));
});

router.patch("/:id", (req, res) => {
  const id = Number(req.params.id);
  const updated = db.updateTask(req.userId, id, req.body || {});
  if (!updated) return res.status(404).json({ error: "Task not found" });
  res.json(updated);
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const ok = db.deleteTask(req.userId, id);
  if (!ok) return res.status(404).json({ error: "Task not found" });
  res.status(204).end();
});

module.exports = router;
