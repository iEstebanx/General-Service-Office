const auditTrail = [];

function addAudit(action, meta = {}) {
  auditTrail.push({
    id: `aud-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    action,
    meta,
    at: new Date().toISOString()
  });
}

module.exports = { auditTrail, addAudit };