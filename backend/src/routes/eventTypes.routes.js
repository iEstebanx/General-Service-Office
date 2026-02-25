const router = require("express").Router();
const { requireAdmin } = require("../auth");
const { eventTypes, genId } = require("../store");
const { addAudit } = require("../utils/audit");

router.get("/", (req, res) => res.json(eventTypes));

router.post("/", requireAdmin, (req, res) => {
  const { name, baseAmount, defaultResources } = req.body || {};
  if (!name) return res.status(400).json({ message: "name is required" });

  const evt = {
    id: genId("evt"),
    name,
    baseAmount: Number(baseAmount || 0),
    defaultResources: defaultResources || {}
  };
  eventTypes.push(evt);
  addAudit("EVENT_TYPE_CREATED", { id: evt.id, name: evt.name });
  res.json(evt);
});

router.put("/:id", requireAdmin, (req, res) => {
  const idx = eventTypes.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Not found" });

  eventTypes[idx] = { ...eventTypes[idx], ...req.body };
  addAudit("EVENT_TYPE_UPDATED", { id: req.params.id });
  res.json(eventTypes[idx]);
});

router.delete("/:id", requireAdmin, (req, res) => {
  const idx = eventTypes.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Not found" });

  const removed = eventTypes.splice(idx, 1)[0];
  addAudit("EVENT_TYPE_DELETED", { id: removed.id, name: removed.name });
  res.json({ ok: true });
});

module.exports = router;