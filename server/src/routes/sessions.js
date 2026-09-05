const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", (req, res) => {
  res.json(db.listSessions(req.userId));
});

router.post("/", (req, res) => {
  const { durationMins } = req.body || {};
  if (!durationMins || durationMins <= 0) {
    return res.status(400).json({ error: "durationMins must be a positive number" });
  }
  res.status(201).json(db.createSession(req.userId, durationMins));
});

module.exports = router;
