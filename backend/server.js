// backend/server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { initDb } = require("./src/db");
const bookingsRoutes = require("./src/routes/bookings.routes");

const app = express(); // Move this to the top after requires

console.log("🚀 Starting server...");
console.log("Current directory:", __dirname);
console.log("Environment:", process.env.NODE_ENV);
console.log("PORT from env:", process.env.PORT);
console.log("DB_PATH from env:", process.env.DB_PATH);

app.use(
  cors({
    origin: [
      /^http:\/\/localhost(?::\d+)?$/,
      /^http:\/\/127\.0\.0\.1(?::\d+)?$/,
    ],
    credentials: true,
  })
);
console.log("✅ CORS configured");

app.use(express.json());
console.log("✅ JSON parser configured");

// ✅ init sqlite db
const dbPath = process.env.DB_PATH || path.join(__dirname, "data", "app.db");
console.log("📁 Database path:", dbPath);

try {
  const db = initDb(dbPath);
  app.locals.db = db;
  console.log("✅ Database initialized successfully");
  
  // Test the database connection
  const tableCount = db.prepare("SELECT COUNT(*) as count FROM bookings").get();
  console.log("📊 Bookings table has", tableCount.count, "records");
  
} catch (err) {
  console.error("❌ Database initialization error:", err);
  process.exit(1);
}

// ✅ Auto-migration: ensure "status" column exists
try {
  const db = app.locals.db; // Get db from app.locals
  const columns = db.prepare(`PRAGMA table_info(bookings)`).all();
  const hasStatus = columns.some((col) => col.name === "status");

  if (!hasStatus) {
    console.log("🔄 Adding missing 'status' column to bookings table...");
    db.prepare(`ALTER TABLE bookings ADD COLUMN status TEXT NOT NULL DEFAULT 'SUBMITTED'`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_status ON bookings(status)`).run();
    console.log("✅ Migration complete: status column added.");
  } else {
    console.log("✅ Status column already exists");
  }
} catch (err) {
  console.error("❌ Migration error:", err);
}

// Test endpoint - Moved after app is defined and db is initialized
app.get("/api/test", (req, res) => {
  try {
    const db = app.locals.db;
    const bookings = db.prepare("SELECT * FROM bookings LIMIT 5").all();
    res.json({ 
      message: "Database connection working", 
      bookingCount: bookings.length,
      sampleBookings: bookings 
    });
  } catch (err) {
    console.error("Test endpoint error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Health check endpoint
app.get("/api/health", (_, res) => {
  console.log("Health check called");
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Bookings routes
console.log("📡 Setting up bookings routes...");
app.use("/api/bookings", bookingsRoutes);
console.log("✅ Bookings routes configured");

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("🔥 Unhandled error:", err);
  console.error("Stack trace:", err.stack);
  res.status(500).json({ 
    message: "Internal server error", 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// ✅ Serve frontend build
const distPath =
  process.env.FRONTEND_DIST ||
  path.join(__dirname, "..", "frontend", "dist");

console.log("📁 Frontend dist path:", distPath);
app.use(express.static(distPath));

// ✅ SPA fallback
app.get(/.*/, (req, res) => {
  console.log("Serving index.html for:", req.url);
  res.sendFile(path.join(distPath, "index.html"));
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () =>
  console.log(`🚀 Server running on http://localhost:${port}`)
);