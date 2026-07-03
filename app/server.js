const path = require("path");
const express = require("express");
const { Pool } = require("pg");

// External Render connection strings require SSL; internal (dpg-xxx host) do not.
const ssl = /\.render\.com/.test(process.env.DATABASE_URL || "")
  ? { rejectUnauthorized: false }
  : false;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl });
pool.on("error", (err) => console.error("idle client error:", err.message));
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/healthz", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/entries", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, message, created_at FROM guestbook_entries ORDER BY created_at DESC, id DESC LIMIT 50"
    );
    res.json(rows);
  } catch (err) {
    console.error("list failed:", err.message);
    res.status(500).json({ error: "could not load entries" });
  }
});

app.post("/api/entries", async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
  if (!name || !message) {
    return res.status(400).json({ error: "name and message are required" });
  }
  if (name.length > 80) {
    return res.status(400).json({ error: "name must be 80 characters or fewer" });
  }
  if (message.length > 500) {
    return res.status(400).json({ error: "message must be 500 characters or fewer" });
  }
  try {
    const { rows } = await pool.query(
      "INSERT INTO guestbook_entries (name, message) VALUES ($1, $2) RETURNING id, name, message, created_at",
      [name, message]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("insert failed:", err.message);
    res.status(500).json({ error: "could not save entry" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`guestbook listening on ${port}`);
});
