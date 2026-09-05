const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", (req, res) => {
  res.json(db.listGoals(req.userId));
});

router.post("/", (req, res) => {
  const { label, targetMinsPerWeek } = req.body || {};
  if (!label || !targetMinsPerWeek) {
    return res.status(400).json({ error: "label and targetMinsPerWeek are required" });
  }
  res.status(201).json(db.createGoal(req.userId, { label, targetMinsPerWeek }));
});

module.exports = router;
