/**
 * Master Dashboard — API Gateway Server
 * =========================================
 * Central entry point for all backend API routes.
 * PORT 4000 (default)
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";

// Load env before anything else
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { generalLimiter } from "./middleware/rateLimiter";
import { validateApiKey } from "./middleware/auth";
import { logSystem, logger } from "./services/logger.service";

// Route imports
import authRoutes from "./routes/auth.routes";
import erpRoutes from "./routes/erp.routes";
import uploadRoutes from "./routes/upload.routes";
import chatRoutes from "./routes/chat.routes";
import filesRoutes from "./routes/files.routes";
import logsRoutes from "./routes/logs.routes";
import trackerRoutes from "./routes/tracker.routes";

const app = express();
const PORT = parseInt(process.env.APP_PORT || "4000", 10);

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("combined"));
app.use(generalLimiter);
app.use(validateApiKey);

// ---------------------------------------------------------------------------
// Health check (no auth required)
// ---------------------------------------------------------------------------

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "master-dashboard-api",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ---------------------------------------------------------------------------
// Route mounts — MODULE 6: API Gateway
// ---------------------------------------------------------------------------

app.use("/api/auth", authRoutes);
app.use("/api/erp", erpRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/files", filesRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/tracker", trackerRoutes);

// ---------------------------------------------------------------------------
// 404 handler
// ---------------------------------------------------------------------------

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error("Unhandled error", { error: err.message, stack: err.stack });

  logSystem({
    level: "error",
    source: "server",
    action: "unhandled_error",
    message: err.message,
    metadata: { stack: err.stack },
  }).catch(() => {}); // fire and forget

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

app.listen(PORT, "0.0.0.0", () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);

  logSystem({
    level: "info",
    source: "server",
    action: "server_started",
    message: `API Gateway started on port ${PORT}`,
    metadata: { port: PORT, env: process.env.NODE_ENV || "development" },
  }).catch(() => {});
});