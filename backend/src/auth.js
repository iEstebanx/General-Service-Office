const { ADMIN_TOKEN } = require("./config");

function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || token !== ADMIN_TOKEN) return res.status(401).json({ message: "Unauthorized" });
  next();
}

module.exports = { requireAdmin };