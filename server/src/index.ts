import "./env.js";

console.log("DB connecting to:", process.env.DATABASE_URL ? "Configured DB URL" : "NOT SET (will use localhost)");

import express from "express";
import cors from "cors";
import { initDB } from "./db/index.js";
import papersRouter from "./routes/papers.js";
import analyticsRouter from "./routes/analytics.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/papers", papersRouter);
app.use("/api/analytics", analyticsRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Initialize database and start server
async function start() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
