// backend/src/routes/bookings.routes.js
const router = require("express").Router();

const STATUS = {
  ACTIVE: "ACTIVE",
  SUBMITTED: "SUBMITTED",
  CANCELED: "CANCELED",
  ARCHIVED: "ARCHIVED",
};

function normalizeStatus(raw) {
  const s = String(raw ?? "").trim().toUpperCase();
  if (!s) return null;
  if (!Object.values(STATUS).includes(s)) return null;
  return s;
}

// ---------- helpers ----------
function toMinutes(hhmm = "") {
  const [h, m] = String(hhmm).split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
}
function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}
function genId(prefix = "bk") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

// Venue normalizer: frontend may send actual venue text (when "Others" is chosen)
// We prevent saving literal "Others" and enforce trimming.
function normalizeVenue(raw, { maxLen = 80 } = {}) {
  const v = String(raw ?? "").trim();

  // Disallow empty or placeholder value
  if (!v) return { ok: false, venue: "", message: "Venue is required" };
  if (v.toLowerCase() === "others") {
    return { ok: false, venue: "", message: 'Please specify the Venue (do not send "Others").' };
  }

  // Optional length limit
  if (v.length > maxLen) {
    return { ok: false, venue: "", message: `Venue is too long (max ${maxLen} characters).` };
  }

  return { ok: true, venue: v };
}

// DB getter (SQLite)
function getDb(req) {
  return req.app.locals.db;
}

// Reads all dates for a booking
function getBookingDates(db, bookingId) {
  const rows = db
    .prepare(
      `SELECT booking_date
       FROM booking_dates
       WHERE booking_id = ?
       ORDER BY booking_date ASC`
    )
    .all(bookingId);

  return rows.map((r) => r.booking_date);
}

// Conflict checker: same venue + same date + overlapping time, ignore archived, optionally ignore booking id
function findConflict(db, { venue, dateList, startTime, endTime, ignoreId = null }) {
  const s = toMinutes(startTime);
  const e = toMinutes(endTime);

  if (!venue) return { ok: false, message: "Venue is required" };
  if (!Number.isFinite(s) || !Number.isFinite(e)) return { ok: false, message: "Invalid time format" };
  if (s >= e) return { ok: false, message: "End time must be after start time" };

  if (!Array.isArray(dateList) || !dateList.length) return { ok: true };

  const placeholders = dateList.map(() => "?").join(", ");

  let sql = `
    SELECT b.booking_id, b.venue, b.start_time, b.end_time, bd.booking_date
    FROM bookings b
    JOIN booking_dates bd ON bd.booking_id = b.booking_id
    WHERE b.archived = 0
      AND UPPER(COALESCE(b.status, 'ACTIVE')) NOT IN ('CANCELED', 'ARCHIVED')
      AND b.venue = ?
      AND bd.booking_date IN (${placeholders})
  `;

  const params = [venue, ...dateList];

  if (ignoreId) {
    sql += ` AND b.booking_id <> ?`;
    params.push(ignoreId);
  }

  const rows = db.prepare(sql).all(...params);

  for (const r of rows) {
    const bs = toMinutes(String(r.start_time).slice(0, 5));
    const be = toMinutes(String(r.end_time).slice(0, 5));
    if (!Number.isFinite(bs) || !Number.isFinite(be)) continue;

    if (rangesOverlap(s, e, bs, be)) {
      return {
        ok: false,
        message: `Schedule conflict: ${venue} already reserved on ${r.booking_date} (${String(r.start_time).slice(0, 5)} - ${String(r.end_time).slice(0, 5)}).`,
        conflict: {
          id: r.booking_id,
          date: r.booking_date,
          venue: r.venue,
          startTime: String(r.start_time).slice(0, 5),
          endTime: String(r.end_time).slice(0, 5),
        },
      };
    }
  }

  return { ok: true };
}

// Format DB booking into frontend shape
function hydrateBooking(db, b) {
  const dates = getBookingDates(db, b.booking_id);

  const amount = Number(b.total_amount);
  const finalAmount = amount;

  let parsedResources = null;
  if (b.resources) {
    if (typeof b.resources === "string") {
      try {
        parsedResources = JSON.parse(b.resources);
      } catch (e) {
        parsedResources = null;
      }
    } else {
      parsedResources = b.resources;
    }
  }

  return {
    id: b.booking_id,
    requestedBy: b.requested_by,
    eventTypeId: null,
    eventName: b.event_name,
    venue: b.venue,
    date: String(b.primary_date),
    dates: dates.map((d) => String(d)),
    startTime: String(b.start_time).slice(0, 5),
    endTime: String(b.end_time).slice(0, 5),
    durationHours: Number(b.duration_hours),

    amount,
    finalAmount,

    resources: parsedResources,

    status: (b.status ? String(b.status).toUpperCase() : null),
    archived: !!b.archived,
    createdAt: b.created_at ? new Date(b.created_at).toISOString() : null,
    updatedAt: b.updated_at ? new Date(b.updated_at).toISOString() : null,
  };
}

// ---------- routes ----------

// GET bookings (optional filter by date=YYYY-MM-DD)
router.get("/", (req, res) => {
  try {
    const db = getDb(req);
    const { date } = req.query;

    // validate date if provided
    if (date != null) {
      const d = String(date).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
      }

      // bookings that have that date in booking_dates
      const rows = db.prepare(`
        SELECT b.*
        FROM bookings b
        JOIN booking_dates bd ON bd.booking_id = b.booking_id
        WHERE bd.booking_date = ?
        GROUP BY b.booking_id
        ORDER BY b.start_time ASC
      `).all(d);

      return res.json(rows.map((b) => hydrateBooking(db, b)));
    }

    // default: all bookings
    const rows = db
      .prepare(`SELECT * FROM bookings ORDER BY primary_date DESC, start_time DESC`)
      .all();

    res.json(rows.map((b) => hydrateBooking(db, b)));
  } catch (e) {
    console.error("GET /api/bookings error:", e);
    res.status(500).json({ message: "Failed to load bookings.", error: e.message });
  }
});

// CREATE booking (multi-date)
router.post("/", (req, res) => {
  const {
    requestedBy,
    eventName,
    venue,
    date,
    dates,
    startTime,
    endTime,
    durationHours,
    amount,
    resources,
    status,
  } = req.body || {};

  const dateList =
    Array.isArray(dates) && dates.length ? dates.filter(Boolean) : date ? [date] : [];

  const venueNorm = normalizeVenue(venue);
  if (!venueNorm.ok) {
    return res.status(400).json({ message: venueNorm.message });
  }

  if (!requestedBy?.trim() || !eventName?.trim() || !dateList.length || !startTime || !endTime) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const computedAmount = Number(amount);
  const finalStatus = normalizeStatus(status) || STATUS.SUBMITTED;
  if (!Number.isFinite(computedAmount) || computedAmount <= 0) {
    return res.status(400).json({ message: "Amount is required" });
  }

  try {
    const db = getDb(req);

    const conflict = findConflict(db, { venue: venueNorm.venue, dateList, startTime, endTime });
    if (!conflict.ok) {
      return res.status(409).json({ message: conflict.message, conflict: conflict.conflict });
    }

    const id = genId("bk");
    const safeDuration = Number(durationHours || 1) > 0 ? Number(durationHours || 1) : 1;
    const primaryDate = dateList[0];

    const insertBooking = db.prepare(`
      INSERT INTO bookings
      (booking_id, requested_by, event_name, venue, primary_date, start_time, end_time, duration_hours,
      total_amount, resources, status, archived)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);

    const insertBookingDate = db.prepare(`
      INSERT INTO booking_dates (booking_id, booking_date) VALUES (?, ?)
    `);

    const tx = db.transaction(() => {
      insertBooking.run(
        id,
        requestedBy.trim(),
        eventName.trim(),
        venueNorm.venue,
        primaryDate,
        startTime,
        endTime,
        safeDuration,
        computedAmount,
        resources ? JSON.stringify(resources) : null,
        finalStatus
      );

      for (const d of dateList) {
        insertBookingDate.run(id, d);
      }
    });

    tx();

    const createdRow = db.prepare(`SELECT * FROM bookings WHERE booking_id = ? LIMIT 1`).get(id);
    const created = hydrateBooking(db, createdRow);
    return res.json(created);
  } catch (e) {
    console.error("POST /api/bookings error:", e);
    return res.status(500).json({ message: "Reservation failed.", error: e.message });
  }
});

// UPDATE booking (single date edit)
router.put("/:id", (req, res) => {
  const id = req.params.id;

  const {
    requestedBy,
    eventName,
    venue,
    date,
    startTime,
    endTime,
    durationHours,
    amount,
    resources,
    archived,
    status,
  } = req.body || {};

  const venueNorm = normalizeVenue(venue);
  if (!venueNorm.ok) {
    return res.status(400).json({ message: venueNorm.message });
  }

  if (!requestedBy?.trim() || !eventName?.trim() || !date || !startTime || !endTime) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const computedAmount = Number(amount);
  const finalStatus = normalizeStatus(status) || STATUS.SUBMITTED;
  if (!Number.isFinite(computedAmount) || computedAmount <= 0) {
    return res.status(400).json({ message: "Amount is required" });
  }

  try {
    const db = getDb(req);

    const exists = db.prepare(`SELECT booking_id FROM bookings WHERE booking_id = ? LIMIT 1`).get(id);
    if (!exists) return res.status(404).json({ message: "Booking not found" });

    const conflict = findConflict(db, {
      venue: venueNorm.venue,
      dateList: [date],
      startTime,
      endTime,
      ignoreId: id,
    });
    if (!conflict.ok) {
      return res.status(409).json({ message: conflict.message, conflict: conflict.conflict });
    }

    const safeDuration = Number(durationHours || 1) > 0 ? Number(durationHours || 1) : 1;

    const updateBooking = db.prepare(`
      UPDATE bookings
      SET requested_by=?, event_name=?, venue=?, primary_date=?, start_time=?, end_time=?, duration_hours=?,
          total_amount=?, resources=?, status=?, archived=?
      WHERE booking_id=?
    `);

    const deleteDates = db.prepare(`DELETE FROM booking_dates WHERE booking_id = ?`);
    const insertDate = db.prepare(`INSERT INTO booking_dates (booking_id, booking_date) VALUES (?, ?)`);

    const tx = db.transaction(() => {
      updateBooking.run(
        requestedBy.trim(),
        eventName.trim(),
        venueNorm.venue,
        date,
        startTime,
        endTime,
        safeDuration,
        computedAmount,
        resources ? JSON.stringify(resources) : null,
        finalStatus,
        typeof archived === "boolean" ? (archived ? 1 : 0) : 0,
        id
      );

      deleteDates.run(id);
      insertDate.run(id, date);
    });

    tx();

    const updatedRow = db.prepare(`SELECT * FROM bookings WHERE booking_id = ? LIMIT 1`).get(id);
    const updated = hydrateBooking(db, updatedRow);
    return res.json(updated);
  } catch (e) {
    console.error("PUT /api/bookings/:id error:", e);
    return res.status(500).json({ message: "Update failed.", error: e.message });
  }
});

// DELETE booking
router.delete("/:id", (req, res) => {
  const id = req.params.id;

  try {
    const db = req.app.locals.db;
    const tx = db.transaction(() => {
      db.prepare(`DELETE FROM booking_dates WHERE booking_id = ?`).run(id);
      const info = db.prepare(`DELETE FROM bookings WHERE booking_id = ?`).run(id);
      return info;
    });

    const info = tx();
    if (!info.changes) return res.status(404).json({ message: "Booking not found" });

    return res.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/bookings/:id error:", e);
    return res.status(500).json({ message: "Failed to delete reservation.", error: e.message });
  }
});

// ARCHIVE toggle
router.patch("/:id/archive", (req, res) => {
  const id = req.params.id;

  try {
    const db = getDb(req);

    const current = db.prepare(`SELECT * FROM bookings WHERE booking_id = ? LIMIT 1`).get(id);
    if (!current) return res.status(404).json({ message: "Booking not found" });

    const nextArchived = current.archived ? 0 : 1;

    // If archiving -> status becomes ARCHIVED
    // If unarchiving -> status becomes ACTIVE (you can change to SUBMITTED if you prefer)
    const nextStatus = nextArchived ? STATUS.ARCHIVED : STATUS.SUBMITTED;

    db.prepare(`UPDATE bookings SET archived = ?, status = ? WHERE booking_id = ?`).run(nextArchived, nextStatus, id);

    const fresh = db.prepare(`SELECT * FROM bookings WHERE booking_id = ? LIMIT 1`).get(id);
    const updated = hydrateBooking(db, fresh);
    return res.json(updated);
  } catch (e) {
    console.error("PATCH /api/bookings/:id/archive error:", e);
    return res.status(500).json({ message: "Failed to archive reservation.", error: e.message });
  }
});

// CANCEL booking (mark as CANCELED)
router.patch("/:id/cancel", (req, res) => {
  const id = req.params.id;

  try {
    const db = getDb(req);

    const current = db.prepare(`SELECT * FROM bookings WHERE booking_id = ? LIMIT 1`).get(id);
    if (!current) return res.status(404).json({ message: "Booking not found" });

    // If already archived, you can decide whether to block cancel:
    // if (current.archived) return res.status(400).json({ message: "Cannot cancel an archived booking." });

    // Mark as canceled (does NOT delete)
    db.prepare(`UPDATE bookings SET status = ? WHERE booking_id = ?`).run(STATUS.CANCELED, id);

    const fresh = db.prepare(`SELECT * FROM bookings WHERE booking_id = ? LIMIT 1`).get(id);
    const updated = hydrateBooking(db, fresh);
    return res.json(updated);
  } catch (e) {
    console.error("PATCH /api/bookings/:id/cancel error:", e);
    return res.status(500).json({ message: "Failed to cancel reservation.", error: e.message });
  }
});

module.exports = router;