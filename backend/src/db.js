// backend/src/db.js
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

function initDb(dbPath) {
  try {
    // Ensure the directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      console.log(`📁 Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }

    console.log(`🔌 Connecting to database: ${dbPath}`);
    const db = new Database(dbPath);

    db.pragma("foreign_keys = ON");

    const schemaPath = path.join(__dirname, "schema.sql");
    console.log(`📄 Reading schema from: ${schemaPath}`);
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }
    
    const schema = fs.readFileSync(schemaPath, "utf8");
    console.log("📝 Executing schema...");
    db.exec(schema);
    
    console.log("✅ Schema executed successfully");
    
    // Verify tables were created
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log("📊 Created tables:", tables.map(t => t.name));

    return db;
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    throw error; // Re-throw to handle in server.js
  }
}

module.exports = { initDb };