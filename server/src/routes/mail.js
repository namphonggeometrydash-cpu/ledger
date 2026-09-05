const express = require("express");
const { db } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

function toClient(row) {
  return {
    id: String(row.id),
    from: row.from_addr,
    subject: row.subject,
    preview: row.preview,
    flag: row.flag,
    receivedAt: row.received_at,
  };
}

router.get("/", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM mail WHERE user_id = ? ORDER BY received_at DESC, id DESC")
    .all(req.userId);
  res.json(rows.map(toClient));
});

router.delete("/:id", (req, res) => {
  const info = db
    .prepare("DELETE FROM mail WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.userId);
  if (info.changes === 0) return res.status(404).json({ error: "Message not found" });
  res.status(204).end();
});

module.exports = router;
