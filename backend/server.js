// backend/server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { initDb } = require("./src/db");
const bookingsRoutes = require("./src/routes/bookings.routes");

const app = express();

app.use(
  cors({
    origin: [
      /^http:\/\/localhost(?::\d+)?$/,
      /^http:\/\/127\.0\.0\.1(?::\d+)?$/,
    ],
    credentials: true,
  })
);

app.use(express.json());

// ✅ init sqlite db (DB_PATH will be set by Electron later)
const dbPath = process.env.DB_PATH || path.join(__dirname, "data", "app.db");
const db = initDb(dbPath);
app.locals.db = db;

// ✅ Auto-migration: ensure "status" column exists
try {
  const columns = db.prepare(`PRAGMA table_info(bookings)`).all();
  const hasStatus = columns.some((col) => col.name === "status");

  if (!hasStatus) {
    console.log("🔄 Adding missing 'status' column to bookings table...");
    db.prepare(`ALTER TABLE bookings ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE'`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_status ON bookings(status)`).run();
    console.log("✅ Migration complete: status column added.");
  }
} catch (err) {
  console.error("❌ Migration error:", err);
}

app.get("/api/health", (_, res) => res.json({ ok: true }));
app.use("/api/bookings", bookingsRoutes);

// ✅ Serve frontend build
const distPath =
  process.env.FRONTEND_DIST ||
  path.join(__dirname, "..", "frontend", "dist");

app.use(express.static(distPath));

// ✅ SPA fallback
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () =>
  console.log(`Server running on http://localhost:${port}`)
);