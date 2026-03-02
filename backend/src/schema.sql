-- backend/src/schema.sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS bookings (
  booking_id TEXT PRIMARY KEY,
  requested_by TEXT NOT NULL,
  event_name TEXT NOT NULL,
  venue TEXT NOT NULL,

  primary_date TEXT NOT NULL,           -- YYYY-MM-DD
  start_time TEXT NOT NULL,             -- HH:MM (or HH:MM:SS)
  end_time TEXT NOT NULL,               -- HH:MM (or HH:MM:SS)
  duration_hours REAL NOT NULL DEFAULT 1.00,

  total_amount INTEGER NOT NULL,
  resources TEXT,                       -- JSON string

  status TEXT NOT NULL DEFAULT 'SUBMITTED', -- ACTIVE | SUBMITTED | CANCELED | ARCHIVED
  archived INTEGER NOT NULL DEFAULT 0,   -- 0/1 (kept for backward compatibility)

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_venue ON bookings (venue);
CREATE INDEX IF NOT EXISTS idx_primary_date ON bookings (primary_date);
CREATE INDEX IF NOT EXISTS idx_archived ON bookings (archived);

CREATE TABLE IF NOT EXISTS booking_dates (
  booking_id TEXT NOT NULL,
  booking_date TEXT NOT NULL,          -- YYYY-MM-DD
  PRIMARY KEY (booking_id, booking_date),
  FOREIGN KEY (booking_id) REFERENCES bookings (booking_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_booking_date ON booking_dates (booking_date);
CREATE INDEX IF NOT EXISTS idx_date_booking ON booking_dates (booking_date, booking_id);

-- updated_at auto-update trigger
CREATE TRIGGER IF NOT EXISTS trg_bookings_updated_at
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
  UPDATE bookings SET updated_at = datetime('now') WHERE booking_id = OLD.booking_id;
END;