const router = require("express").Router();
const { ADMIN_USER, ADMIN_PASS, ADMIN_TOKEN } = require("../config");
const { addAudit } = require("../utils/audit");

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  const ok = username === ADMIN_USER && password === ADMIN_PASS;
  addAudit("ADMIN_LOGIN_ATTEMPT", { username, ok });

  if (!ok) return res.status(401).json({ message: "Invalid credentials" });
  return res.json({ token: ADMIN_TOKEN, username });
});

module.exports = router;