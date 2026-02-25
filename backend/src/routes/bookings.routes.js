const router = require("express").Router();
const { bookings, eventTypes, genId, calcAmount } = require("../store");
const { addAudit } = require("../utils/audit");
const { requireAdmin } = require("../auth");

router.get("/", requireAdmin, (req, res) => res.json(bookings));

router.post("/", (req, res) => {
  const {
    requestedBy,
    eventTypeId,
    date,          // "YYYY-MM-DD"
    startTime,     // "HH:mm"
    endTime,       // "HH:mm"
    durationHours, // number
    resources      // {chairs, tables, aircon, lights, sounds, led}
  } = req.body || {};

  if (!requestedBy || !eventTypeId || !date || !startTime || !endTime) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const evt = eventTypes.find(e => e.id === eventTypeId);
  if (!evt) return res.status(400).json({ message: "Invalid eventTypeId" });

  const amount = calcAmount(evt, durationHours);

  const booking = {
    id: genId("bk"),
    requestedBy,
    eventTypeId,
    eventName: evt.name,
    date,
    startTime,
    endTime,
    durationHours: Number(durationHours || 1),
    amount,
    resources: resources || evt.defaultResources,
    createdAt: new Date().toISOString()
  };

  bookings.push(booking);
  addAudit("BOOKING_CREATED", { id: booking.id, eventName: booking.eventName, date });
  res.json(booking);
});

module.exports = router;