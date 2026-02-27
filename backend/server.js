// General-Service-Office/backend/server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

console.log("DB_HOST:", process.env.DB_HOST, "DB_NAME:", process.env.DB_NAME);

const bookingsRoutes = require("./src/routes/bookings.routes");

const app = express();

app.use(
  cors({
    origin: [/^http:\/\/localhost(?::\d+)?$/, /^http:\/\/127\.0\.0\.1(?::\d+)?$/],
    credentials: true,
  })
);

app.use(express.json());

app.get("/api/health", (_, res) => res.json({ ok: true }));

// ✅ only schedule page backend
app.use("/api/bookings", bookingsRoutes);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`Backend running on http://localhost:${port}`));