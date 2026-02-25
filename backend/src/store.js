const { addAudit } = require("./utils/audit");

// Default sample event types
const eventTypes = [
  {
    id: "evt-1",
    name: "VOLLEYBALL TRAINING",
    baseAmount: 500,
    defaultResources: { chairs: false, tables: false, aircon: false, lights: true, sounds: false, led: false }
  },
  {
    id: "evt-2",
    name: "BASKETBALL TRAINING",
    baseAmount: 600,
    defaultResources: { chairs: false, tables: false, aircon: false, lights: true, sounds: true, led: false }
  },
  {
    id: "evt-3",
    name: "BADMINTON SESSION",
    baseAmount: 450,
    defaultResources: { chairs: false, tables: false, aircon: false, lights: true, sounds: false, led: false }
  }
];

const bookings = [];

function genId(prefix) {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

function calcAmount(eventType, durationHours) {
  // simple rule: baseAmount * durationHours (min 1 hour)
  const hrs = Math.max(1, Number(durationHours || 1));
  return Math.round(eventType.baseAmount * hrs);
}

module.exports = {
  eventTypes,
  bookings,
  genId,
  calcAmount
};