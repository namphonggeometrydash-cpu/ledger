const express = require("express");
const { db } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM focus_sessions WHERE user_id = ? ORDER BY date DESC, id DESC")
    .all(req.userId);
  res.json(rows.map((r) => ({ id: String(r.id), date: r.date, durationMins: r.duration_mins })));
});

router.post("/", (req, res) => {
  const { durationMins } = req.body || {};
  if (!durationMins || durationMins <= 0) {
    return res.status(400).json({ error: "durationMins must be a positive number" });
  }
  const date = new Date().toISOString().slice(0, 10);
  const info = db
    .prepare("INSERT INTO focus_sessions (user_id, date, duration_mins) VALUES (?, ?, ?)")
    .run(req.userId, date, durationMins);
  res.status(201).json({ id: String(info.lastInsertRowid), date, durationMins });
});

module.exports = router;
