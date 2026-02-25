const router = require("express").Router();
const { requireAdmin } = require("../auth");
const { auditTrail } = require("../utils/audit");
const { eventTypes, bookings } = require("../store");

router.get("/audit", requireAdmin, (req, res) => res.json(auditTrail));

router.get("/backup", requireAdmin, (req, res) => {
  res.json({ eventTypes, bookings, exportedAt: new Date().toISOString() });
});

router.post("/restore", requireAdmin, (req, res) => {
  const { eventTypes: et, bookings: bk } = req.body || {};
  if (!Array.isArray(et) || !Array.isArray(bk)) return res.status(400).json({ message: "Invalid payload" });

  eventTypes.splice(0, eventTypes.length, ...et);
  bookings.splice(0, bookings.length, ...bk);
  res.json({ ok: true });
});

module.exports = router;