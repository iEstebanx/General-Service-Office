// backend/src/routes/bookings.routes.js
const router = require("express").Router();
const { bookings, eventTypes, genId, calcAmount } = require("../store");
const { addAudit } = require("../utils/audit");
const { requireAdmin } = require("../auth");

// ✅ helpers: time overlap check
function toMinutes(hhmm = "") {
  const [h, m] = String(hhmm).split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
}

function rangesOverlap(startA, endA, startB, endB) {
  // overlap if A starts before B ends AND A ends after B starts
  return startA < endB && endA > startB;
}

function bookingHasDate(b, dateStr) {
  const ds = Array.isArray(b.dates) && b.dates.length ? b.dates : (b.date ? [b.date] : []);
  return ds.includes(dateStr);
}

function findConflict({ venue, dateList, startTime, endTime, ignoreId = null }) {
  const s = toMinutes(startTime);
  const e = toMinutes(endTime);

  if (!venue) return { ok: false, message: "Venue is required" };
  if (!Number.isFinite(s) || !Number.isFinite(e)) return { ok: false, message: "Invalid time format" };
  if (s >= e) return { ok: false, message: "End time must be after start time" };

  for (const b of bookings) {
    if (ignoreId && b.id === ignoreId) continue;
    if (b.archived) continue; // ✅ ignore archived bookings
    if (b.venue !== venue) continue;

    for (const d of dateList) {
      if (!bookingHasDate(b, d)) continue;

      const bs = toMinutes(b.startTime);
      const be = toMinutes(b.endTime);
      if (!Number.isFinite(bs) || !Number.isFinite(be)) continue;

      if (rangesOverlap(s, e, bs, be)) {
        return {
          ok: false,
          message: `Schedule conflict: ${venue} already booked on ${d} (${b.startTime} - ${b.endTime}).`,
          conflict: { id: b.id, date: d, startTime: b.startTime, endTime: b.endTime, venue: b.venue },
        };
      }
    }
  }

  return { ok: true };
}

// GET all bookings
router.get("/", (req, res) => res.json(bookings));

router.post("/", (req, res) => {
  const {
    requestedBy,

    // can be null for Others
    eventTypeId,
    // required for Others
    eventName,
    venue,
    date,          // "YYYY-MM-DD"
    dates,
    startTime,     // "HH:mm"
    endTime,       // "HH:mm"
    durationHours, // number

    // pricing (frontend may send)
    amount,
    discountPct,
    discountValue,
    finalAmount,
    donation,
    resources, // {chairs, tables, aircon, lights, sounds, led}
  } = req.body || {};

  // ---- basic required fields ----
  const dateList = Array.isArray(dates) && dates.length
    ? dates.filter(Boolean)
    : (date ? [date] : []);

  if (!requestedBy || !venue || !dateList.length || !startTime || !endTime) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // ✅ prevent same venue + overlapping time on same date
  const conflictCheck = findConflict({ venue, dateList, startTime, endTime });
  if (!conflictCheck.ok) {
    return res.status(409).json({ message: conflictCheck.message, conflict: conflictCheck.conflict });
  }

  // ---- resolve event ----
  const hasEventType = !!eventTypeId;
  const hasCustomName = !!(eventName && String(eventName).trim());

  let evt = null;
  let resolvedEventName = "";

  if (hasEventType) {
    evt = eventTypes.find((e) => e.id === eventTypeId);
    if (!evt) return res.status(400).json({ message: "Invalid eventTypeId" });
    resolvedEventName = evt.name;
  } else {
    // Others/custom event
    if (!hasCustomName) {
      return res.status(400).json({ message: "Missing eventName for Others" });
    }
    resolvedEventName = String(eventName).trim();
  }

  // ---- normalize duration ----
  const safeDurationHours = Number(durationHours || 1) > 0 ? Number(durationHours || 1) : 1;

  // ---- pricing rules ----
  // If eventTypeId is present: calculate amount from server (preferred),
  // but allow client "amount" to override if you want to keep manual pricing.
  // For Others: require a valid client amount.
  let computedAmount = 0;

  if (evt) {
    computedAmount = calcAmount(evt, safeDurationHours);

    // If frontend sends amount manually, you can choose whether to override server calc.
    // Keep this line if you want manual amount to be respected:
    if (Number(amount || 0) > 0) computedAmount = Number(amount);
  } else {
    // Others/custom event -> require amount
    if (Number(amount || 0) <= 0) {
      return res.status(400).json({ message: "Amount is required for Others" });
    }
    computedAmount = Number(amount);
  }

  const safeDiscountPct =
    Number.isFinite(Number(discountPct)) ? Math.min(100, Math.max(0, Number(discountPct))) : 0;

  // If client sent discountValue/finalAmount, we'll compute server-side anyway for consistency.
  const computedDiscountValue = Math.round((computedAmount * safeDiscountPct) / 100);
  const computedFinalAmount = Math.max(0, computedAmount - computedDiscountValue);

  const safeDonation = Math.max(0, Number(donation || 0));

  // ---- resources ----
  const resolvedResources = resources || evt?.defaultResources || {
    chairs: 0,
    tables: 0,
    aircon: false,
    lights: true,
    sounds: false,
    led: false,
  };

  const booking = {
    id: genId("bk"),
    requestedBy,

    eventTypeId: evt ? eventTypeId : null,
    eventName: resolvedEventName,
    venue,
    date: dateList[0],   // ✅ keep a primary date
    dates: dateList,     // ✅ store all selected dates
    startTime,
    endTime,
    durationHours: safeDurationHours,

    amount: computedAmount,
    discountPct: safeDiscountPct,
    discountValue: computedDiscountValue,
    finalAmount: computedFinalAmount,
    donation: safeDonation,
    resources: resolvedResources,
    createdAt: new Date().toISOString(),
    archived: false,
  };

  bookings.push(booking);

  addAudit("BOOKING_CREATED", {
    id: booking.id,
    eventName: booking.eventName,
    date: booking.date,
  });

  return res.json(booking);
});

// UPDATE booking
router.put("/:id", (req, res) => {
  const idx = bookings.findIndex((b) => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Booking not found" });

  const existing = bookings[idx];

  const {
    requestedBy,
    eventTypeId,
    eventName,
    venue,
    date,
    startTime,
    endTime,
    durationHours,
    amount,
    discountPct,
    donation,
    resources,
    archived,
  } = req.body || {};

  // required
  if (!requestedBy || !venue || !date || !startTime || !endTime) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // ✅ prevent same venue + overlapping time on same date (ignore self)
  const conflictCheck = findConflict({
    venue,
    dateList: [date],
    startTime,
    endTime,
    ignoreId: req.params.id,
  });
  if (!conflictCheck.ok) {
    return res.status(409).json({ message: conflictCheck.message, conflict: conflictCheck.conflict });
  }

  // resolve event
  const hasEventType = !!eventTypeId;
  const hasCustomName = !!(eventName && String(eventName).trim());

  let evt = null;
  let resolvedEventName = "";

  if (hasEventType) {
    evt = eventTypes.find((e) => e.id === eventTypeId);
    if (!evt) return res.status(400).json({ message: "Invalid eventTypeId" });
    resolvedEventName = evt.name;
  } else {
    if (!hasCustomName) {
      return res.status(400).json({ message: "Missing eventName for Others" });
    }
    resolvedEventName = String(eventName).trim();
  }

  const safeDurationHours =
    Number(durationHours || 1) > 0 ? Number(durationHours || 1) : 1;

  // pricing
  let computedAmount = 0;

  if (evt) {
    computedAmount = calcAmount(evt, safeDurationHours);
    if (Number(amount || 0) > 0) computedAmount = Number(amount);
  } else {
    if (Number(amount || 0) <= 0) {
      return res.status(400).json({ message: "Amount is required for Others" });
    }
    computedAmount = Number(amount);
  }

  const safeDiscountPct =
    Number.isFinite(Number(discountPct))
      ? Math.min(100, Math.max(0, Number(discountPct)))
      : 0;

  const computedDiscountValue = Math.round((computedAmount * safeDiscountPct) / 100);
  const computedFinalAmount = Math.max(0, computedAmount - computedDiscountValue);
  const safeDonation = Math.max(0, Number(donation || 0));

  const resolvedResources = resources || evt?.defaultResources || {
    chairs: 0,
    tables: 0,
    aircon: false,
    lights: true,
    sounds: false,
    led: false,
  };

  const updated = {
    ...existing,
    requestedBy,
    venue: venue ?? existing.venue,
    eventTypeId: evt ? eventTypeId : null,
    eventName: resolvedEventName,
    date,
    startTime,
    endTime,
    durationHours: safeDurationHours,
    amount: computedAmount,
    discountPct: safeDiscountPct,
    discountValue: computedDiscountValue,
    finalAmount: computedFinalAmount,
    donation: safeDonation,
    resources: resolvedResources,
    archived: typeof archived === "boolean" ? archived : (existing.archived ?? false),
    updatedAt: new Date().toISOString(),
  };

  bookings[idx] = updated;

  addAudit("BOOKING_UPDATED", { id: updated.id, date: updated.date, eventName: updated.eventName });
  return res.json(updated);
});

// DELETE booking
router.delete("/:id", (req, res) => {
  const idx = bookings.findIndex((b) => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Booking not found" });

  const removed = bookings.splice(idx, 1)[0];

  addAudit("BOOKING_DELETED", { id: removed.id, date: removed.date, eventName: removed.eventName });
  return res.json({ ok: true });
});

// ARCHIVE booking
router.patch("/:id/archive", (req, res) => {
  const idx = bookings.findIndex((b) => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Booking not found" });

  // Toggle archive status
  bookings[idx].archived = !bookings[idx].archived;
  bookings[idx].updatedAt = new Date().toISOString();

  addAudit("BOOKING_ARCHIVED", { 
    id: bookings[idx].id, 
    date: bookings[idx].date, 
    eventName: bookings[idx].eventName,
    archived: bookings[idx].archived 
  });
  
  return res.json(bookings[idx]);
});

module.exports = router;