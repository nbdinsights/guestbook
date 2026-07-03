// Numbered-SQL migration runner: applies app/migrations/*.sql in filename order,
// tracked in schema_migrations. Idempotent; runs at service start because Render's
// pre-deploy command is unavailable on the free instance type.
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

// External Render connection strings require SSL; internal (dpg-xxx host) do not.
const ssl = /\.render\.com/.test(process.env.DATABASE_URL || "")
  ? { rejectUnauthorized: false }
  : false;

async function connectWithRetry(attempts = 5, delayMs = 3000) {
  for (let i = 1; ; i++) {
    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl });
    try {
      await client.connect();
      return client;
    } catch (err) {
      await client.end().catch(() => {});
      if (i >= attempts) throw err;
      console.error(`connect attempt ${i} failed (${err.message}), retrying...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

async function main() {
  const client = await connectWithRetry();
  try {
    await client.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now())"
    );
    const { rows } = await client.query("SELECT version FROM schema_migrations");
    const done = new Set(rows.map((r) => r.version));
    const dir = path.join(__dirname, "migrations");
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files) {
      if (done.has(file)) continue;
      const sql = fs.readFileSync(path.join(dir, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log("applied", file);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }
    console.log("migrations up to date");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("migration failed:", err.message);
  process.exit(1);
});
