// General-Service-Office/backend/server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const bookingsRoutes = require("./src/routes/bookings.routes");

const app = express();

app.use(
  cors({
    origin: [
      /^http:\/\/localhost(?::\d+)?$/,
      /^http:\/\/127\.0\.0\.1(?::\d+)?$/,
    ],
    credentials: true,
  })
);

app.use(express.json());

app.get("/api/health", (_, res) => res.json({ ok: true }));
app.use("/api/bookings", bookingsRoutes);

// ✅ Serve frontend build
const distPath = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(distPath));

// ✅ SPA fallback (React Router)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));