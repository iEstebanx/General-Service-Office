// backend/src/db.js
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

function initDb(dbPath) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);

  db.pragma("foreign_keys = ON");

  const schemaPath = path.join(__dirname, "schema.sql");
  db.exec(fs.readFileSync(schemaPath, "utf8"));

  return db;
}

module.exports = { initDb };