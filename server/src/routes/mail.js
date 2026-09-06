const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");
const google = require("../lib/google");
const gmail = require("../lib/gmail");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const user = db.findUserById(req.userId);

  if (user.google && user.google.scopes?.some((s) => s.includes("gmail"))) {
    try {
      const accessToken = await google.getValidAccessToken(db, user);
      const messages = await gmail.fetchRecentMessages(accessToken);
      return res.json(messages.map((m) => ({ ...m, live: true })));
    } catch (err) {
      // Fall through to sample data rather than breaking the page, but
      // let the frontend know real mail couldn't be loaded right now.
      return res.status(502).json({ error: err.message });
    }
  }

  res.json(db.listMail(req.userId).map((m) => ({ ...m, live: false })));
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const ok = db.deleteMail(req.userId, id);
  if (!ok) return res.status(404).json({ error: "Message not found (live Gmail messages can't be dismissed here yet)" });
  res.status(204).end();
});

module.exports = router;
