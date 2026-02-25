// General-Service-Office/backend/vite.config.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./src/routes/auth.routes");
const eventTypesRoutes = require("./src/routes/eventTypes.routes");
const bookingsRoutes = require("./src/routes/bookings.routes");
const adminRoutes = require("./src/routes/admin.routes");

const app = express();

// ✅ allow any localhost port (5173, 5174, etc.)
app.use(
  cors({
    origin: [/^http:\/\/localhost(?::\d+)?$/, /^http:\/\/127\.0\.0\.1(?::\d+)?$/],
    credentials: true,
  })
);

app.use(express.json());

app.get("/api/health", (_, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/event-types", eventTypesRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/admin", adminRoutes);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`Backend running on http://localhost:${port}`));