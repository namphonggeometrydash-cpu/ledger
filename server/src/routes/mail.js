const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", (req, res) => {
  res.json(db.listMail(req.userId));
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const ok = db.deleteMail(req.userId, id);
  if (!ok) return res.status(404).json({ error: "Message not found" });
  res.status(204).end();
});

module.exports = router;
