// backend/test-db.js
const { initDb } = require("./src/db");
const path = require("path");

try {
  const dbPath = path.join(__dirname, "data", "app.db");
  console.log("Testing database at:", dbPath);
  
  const db = initDb(dbPath);
  
  // Test inserting a record
  const testId = "test_" + Date.now();
  const insert = db.prepare(`
    INSERT INTO bookings (booking_id, requested_by, event_name, venue, primary_date, start_time, end_time, duration_hours, total_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  insert.run(
    testId,
    "Test User",
    "Test Event",
    "Test Venue",
    "2024-01-01",
    "09:00",
    "17:00",
    8,
    1000
  );
  
  console.log("✅ Test record inserted successfully");
  
  // Read it back
  const result = db.prepare("SELECT * FROM bookings WHERE booking_id = ?").get(testId);
  console.log("📄 Test record:", result);
  
  // Clean up
  db.prepare("DELETE FROM bookings WHERE booking_id = ?").run(testId);
  console.log("✅ Test record cleaned up");
  
  console.log("🎉 Database test passed!");
  
} catch (error) {
  console.error("❌ Database test failed:", error);
  process.exit(1);
}