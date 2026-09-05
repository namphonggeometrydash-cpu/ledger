const express = require("express");
const { db } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM goals WHERE user_id = ?").all(req.userId);
  res.json(rows.map((r) => ({ id: String(r.id), label: r.label, targetMinsPerWeek: r.target_mins_per_week })));
});

router.post("/", (req, res) => {
  const { label, targetMinsPerWeek } = req.body || {};
  if (!label || !targetMinsPerWeek) {
    return res.status(400).json({ error: "label and targetMinsPerWeek are required" });
  }
  const info = db
    .prepare("INSERT INTO goals (user_id, label, target_mins_per_week) VALUES (?, ?, ?)")
    .run(req.userId, label, targetMinsPerWeek);
  res.status(201).json({ id: String(info.lastInsertRowid), label, targetMinsPerWeek });
});

module.exports = router;
