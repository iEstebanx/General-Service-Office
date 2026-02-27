// backend/src/routes/bookings.routes.js
const router = require("express").Router();
const pool = require("../db");

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

// Reads all dates for a booking
async function getBookingDates(bookingId) {
  const [rows] = await pool.query(
    `SELECT booking_date FROM booking_dates WHERE booking_id = ? ORDER BY booking_date ASC`,
    [bookingId]
  );
  return rows.map((r) => r.booking_date);
}

// Conflict checker: same venue + same date + overlapping time, ignore archived, optionally ignore booking id
async function findConflict({ venue, dateList, startTime, endTime, ignoreId = null }) {
  const s = toMinutes(startTime);
  const e = toMinutes(endTime);

  if (!venue) return { ok: false, message: "Venue is required" };
  if (!Number.isFinite(s) || !Number.isFinite(e)) return { ok: false, message: "Invalid time format" };
  if (s >= e) return { ok: false, message: "End time must be after start time" };

  if (!Array.isArray(dateList) || !dateList.length) return { ok: true };

  const placeholders = dateList.map(() => "?").join(",");
  const params = [venue, ...dateList];

  let sql = `
    SELECT b.booking_id, b.venue, b.start_time, b.end_time, bd.booking_date
    FROM bookings b
    JOIN booking_dates bd ON bd.booking_id = b.booking_id
    WHERE b.archived = 0
      AND b.venue = ?
      AND bd.booking_date IN (${placeholders})
  `;
  if (ignoreId) {
    sql += ` AND b.booking_id <> ?`;
    params.push(ignoreId);
  }

  const [rows] = await pool.query(sql, params);

  for (const r of rows) {
    const bs = toMinutes(String(r.start_time).slice(0, 5));
    const be = toMinutes(String(r.end_time).slice(0, 5));
    if (!Number.isFinite(bs) || !Number.isFinite(be)) continue;

    if (rangesOverlap(s, e, bs, be)) {
      return {
        ok: false,
        message: `Schedule conflict: ${venue} already reserved on ${r.booking_date} (${String(r.start_time).slice(0, 5)} - ${String(r.end_time).slice(0, 5)}).`,
        conflict: {
          id: r.id,
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
async function hydrateBooking(b) {
  const dates = await getBookingDates(b.booking_id);

  const amount = Number(b.total_amount);

  // your schema has no final_amount now, so finalAmount == amount
  const finalAmount = amount;

  let parsedResources = null;
  if (b.resources) {
    if (typeof b.resources === "string") {
      try {
        parsedResources = JSON.parse(b.resources);
      } catch (e) {
        parsedResources = null; // don't crash GET
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

    archived: !!b.archived,
    createdAt: b.created_at ? new Date(b.created_at).toISOString() : null,
    updatedAt: b.updated_at ? new Date(b.updated_at).toISOString() : null,
  };
}

// ---------- routes ----------

// GET all bookings
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM bookings ORDER BY primary_date DESC, start_time DESC`
    );
    const hydrated = [];
    for (const b of rows) hydrated.push(await hydrateBooking(b));
    res.json(hydrated);
  } catch (e) {
    console.error("GET /api/bookings error:", e);
    res.status(500).json({
      message: "Failed to load bookings.",
      error: e.message,
      code: e.code,
    });
  }
});

// CREATE booking (multi-date)
router.post("/", async (req, res) => {
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
  } = req.body || {};

  const dateList =
    Array.isArray(dates) && dates.length ? dates.filter(Boolean) : date ? [date] : [];

  if (
    !requestedBy?.trim() ||
    !eventName?.trim() ||
    !venue ||
    !dateList.length ||
    !startTime ||
    !endTime
  ) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const computedAmount = Number(amount);
  if (!Number.isFinite(computedAmount) || computedAmount <= 0) {
    return res.status(400).json({ message: "Amount is required" });
  }

  try {
    const conflict = await findConflict({ venue, dateList, startTime, endTime });
    if (!conflict.ok) {
      return res.status(409).json({ message: conflict.message, conflict: conflict.conflict });
    }

    const id = genId("bk");
    const safeDuration = Number(durationHours || 1) > 0 ? Number(durationHours || 1) : 1;
    const primaryDate = dateList[0];

    // No discounts/donations: final_amount == amount
    await pool.query(
      `INSERT INTO bookings
      (booking_id, requested_by, event_name, venue, primary_date, start_time, end_time, duration_hours,
        total_amount, resources, archived)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        id,
        requestedBy.trim(),
        eventName.trim(),
        venue,
        primaryDate,
        startTime,
        endTime,
        safeDuration,
        computedAmount,
        resources ? JSON.stringify(resources) : null,
      ]
    );

    // insert booking dates
    const placeholders = dateList.map(() => "(?, ?)").join(", ");
    const flatParams = dateList.flatMap((d) => [id, d]);

    await pool.query(
      `INSERT INTO booking_dates (booking_id, booking_date) VALUES ${placeholders}`,
      flatParams
    );

    const [rows] = await pool.query(
      `SELECT * FROM bookings WHERE booking_id = ? LIMIT 1`,
      [id]
    );
    const created = await hydrateBooking(rows[0]);
    return res.json(created);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Reservation failed." });
  }
});

// UPDATE booking (single date edit)
router.put("/:id", async (req, res) => {
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
  } = req.body || {};

  if (!requestedBy?.trim() || !eventName?.trim() || !venue || !date || !startTime || !endTime) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const computedAmount = Number(amount);
  if (!Number.isFinite(computedAmount) || computedAmount <= 0) {
    return res.status(400).json({ message: "Amount is required" });
  }

  try {
    const [exists] = await pool.query(
      `SELECT booking_id FROM bookings WHERE booking_id = ? LIMIT 1`,
      [id]
    );
    if (!exists.length) return res.status(404).json({ message: "Booking not found" });

    const conflict = await findConflict({
      venue,
      dateList: [date],
      startTime,
      endTime,
      ignoreId: id,
    });
    if (!conflict.ok) {
      return res.status(409).json({ message: conflict.message, conflict: conflict.conflict });
    }

    const safeDuration = Number(durationHours || 1) > 0 ? Number(durationHours || 1) : 1;

    await pool.query(
      `UPDATE bookings
      SET requested_by=?, event_name=?, venue=?, primary_date=?, start_time=?, end_time=?, duration_hours=?,
          total_amount=?, resources=?, archived=?
      WHERE booking_id=?`,
      [
        requestedBy.trim(),
        eventName.trim(),
        venue,
        date,
        startTime,
        endTime,
        safeDuration,
        computedAmount,
        resources ? JSON.stringify(resources) : null,
        typeof archived === "boolean" ? (archived ? 1 : 0) : 0,
        id,
      ]
    );

    await pool.query(`DELETE FROM booking_dates WHERE booking_id = ?`, [id]);
    await pool.query(
      `INSERT INTO booking_dates (booking_id, booking_date) VALUES (?, ?)`,
      [id, date]
    );

    const [rows] = await pool.query(
      `SELECT * FROM bookings WHERE booking_id = ? LIMIT 1`,
      [id]
    );
    const updated = await hydrateBooking(rows[0]);
    return res.json(updated);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Update failed." });
  }
});

// DELETE booking
router.delete("/:id", async (req, res) => {
  const id = req.params.id;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) delete booking_dates children
    await conn.query(`DELETE FROM booking_dates WHERE booking_id = ?`, [id]);

    // 2) delete bookings parent
    const [result] = await conn.query(`DELETE FROM bookings WHERE booking_id = ?`, [id]);

    await conn.commit();

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    console.error("DELETE /api/bookings/:id error:", e);
    return res.status(500).json({ message: "Failed to delete reservation.", error: e.message });
  } finally {
    conn.release();
  }
});

// ARCHIVE toggle
router.patch("/:id/archive", async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await pool.query(
      `SELECT * FROM bookings WHERE booking_id = ? LIMIT 1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: "Booking not found" });

    const current = rows[0];
    const next = current.archived ? 0 : 1;

    await pool.query(
      `UPDATE bookings SET archived = ? WHERE booking_id = ?`,
      [next, id]
    );

    const [fresh] = await pool.query(
      `SELECT * FROM bookings WHERE booking_id = ? LIMIT 1`,
      [id]
    );
    const updated = await hydrateBooking(fresh[0]);
    return res.json(updated);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed to archive reservation." });
  }
});

module.exports = router;