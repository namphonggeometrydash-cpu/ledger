require("dotenv").config();
const express = require("express");
const cors = require("cors");

const db = require("./db");
const { requireAuth } = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const sessionRoutes = require("./routes/sessions");
const goalRoutes = require("./routes/goals");
const mailRoutes = require("./routes/mail");
const integrationRoutes = require("./routes/integrations");

const app = express();
const PORT = process.env.PORT || 4000;

// Allow the configured frontend origin (comma-separated list for
// multiple environments), or allow any origin in local dev when
// FRONTEND_URL isn't set at all.
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.get("/api/me", requireAuth, (req, res) => {
  const user = db.findUserById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ id: user.id, email: user.email, name: user.name });
});

app.delete("/api/me", requireAuth, (req, res) => {
  db.deleteUser(req.userId);
  res.status(204).end();
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/inbox", mailRoutes);
app.use("/api/integrations", integrationRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server" });
});

app.listen(PORT, () => {
  console.log(`Ledger API listening on http://localhost:${PORT}`);
});
