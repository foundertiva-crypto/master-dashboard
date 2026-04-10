/**
 * Logging Service — MODULE 7
 * Stores logs in PostgreSQL and writes to Winston transports.
 */

import winston from "winston";
import path from "path";
import { query } from "../models/database";

// ---------------------------------------------------------------------------
// Winston logger
// ---------------------------------------------------------------------------

const logDir = process.env.LOG_DIR || "./logs";

const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "master-dashboard" },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

if (process.env.LOG_TO_FILE === "true") {
  winstonLogger.add(
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      maxsize: 10_000_000,
      maxFiles: 5,
    })
  );
  winstonLogger.add(
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      maxsize: 10_000_000,
      maxFiles: 10,
    })
  );
}

// ---------------------------------------------------------------------------
// DB-backed log writers
// ---------------------------------------------------------------------------

export interface LogEntry {
  level: string;
  source: string;
  action: string;
  message?: string;
  metadata?: Record<string, any>;
  userId?: string;
  ipAddress?: string;
}

/** Write a general system log */
export async function logSystem(entry: LogEntry): Promise<void> {
  winstonLogger.log(entry.level, `[${entry.source}] ${entry.action}`, {
    message: entry.message,
    metadata: entry.metadata,
  });

  try {
    await query(
      `INSERT INTO system_logs (level, source, action, message, metadata, user_id, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        entry.level,
        entry.source,
        entry.action,
        entry.message ?? null,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
        entry.userId ?? null,
        entry.ipAddress ?? null,
      ]
    );
  } catch (err) {
    winstonLogger.error("Failed to write system log to DB", { err });
  }
}

/** Log an ERP API request */
export async function logERPRequest(data: {
  userId?: string;
  method: string;
  endpoint: string;
  statusCode?: number;
  responseTimeMs?: number;
  errorMessage?: string;
  requestBody?: any;
}): Promise<void> {
  winstonLogger.info(`[ERP] ${data.method} ${data.endpoint} → ${data.statusCode ?? "?"}`);

  try {
    await query(
      `INSERT INTO erp_request_logs (user_id, method, endpoint, status_code, response_time_ms, error_message, request_body)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        data.userId ?? null,
        data.method,
        data.endpoint,
        data.statusCode ?? null,
        data.responseTimeMs ?? null,
        data.errorMessage ?? null,
        data.requestBody ? JSON.stringify(data.requestBody) : null,
      ]
    );
  } catch (err) {
    winstonLogger.error("Failed to write ERP request log to DB", { err });
  }
}

/** Log an upload action */
export async function logUpload(data: {
  userId?: string;
  fileName: string;
  fileType: string;
  uploadType: string;
  totalRows?: number;
  successRows?: number;
  failedRows?: number;
  status: string;
  s3Key?: string;
  errorDetails?: any;
}): Promise<string> {
  winstonLogger.info(`[Upload] ${data.fileName} — ${data.status}`);

  try {
    const res = await query(
      `INSERT INTO upload_logs
         (user_id, file_name, file_type, upload_type, total_rows, success_rows, failed_rows, status, s3_key, error_details)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id`,
      [
        data.userId ?? null,
        data.fileName,
        data.fileType,
        data.uploadType,
        data.totalRows ?? 0,
        data.successRows ?? 0,
        data.failedRows ?? 0,
        data.status,
        data.s3Key ?? null,
        data.errorDetails ? JSON.stringify(data.errorDetails) : null,
      ]
    );
    return res.rows[0].id;
  } catch (err) {
    winstonLogger.error("Failed to write upload log to DB", { err });
    return "";
  }
}

/** Update an existing upload log */
export async function updateUploadLog(
  id: string,
  data: Partial<{
    successRows: number;
    failedRows: number;
    status: string;
    errorDetails: any;
    completedAt: Date;
  }>
): Promise<void> {
  const sets: string[] = [];
  const vals: any[] = [];
  let idx = 1;

  if (data.successRows !== undefined) {
    sets.push(`success_rows = $${idx++}`);
    vals.push(data.successRows);
  }
  if (data.failedRows !== undefined) {
    sets.push(`failed_rows = $${idx++}`);
    vals.push(data.failedRows);
  }
  if (data.status !== undefined) {
    sets.push(`status = $${idx++}`);
    vals.push(data.status);
  }
  if (data.errorDetails !== undefined) {
    sets.push(`error_details = $${idx++}`);
    vals.push(JSON.stringify(data.errorDetails));
  }
  if (data.completedAt !== undefined) {
    sets.push(`completed_at = $${idx++}`);
    vals.push(data.completedAt);
  }

  if (sets.length === 0) return;

  vals.push(id);
  await query(
    `UPDATE upload_logs SET ${sets.join(", ")} WHERE id = $${idx}`,
    vals
  );
}

/** Log a chat message */
export async function logChat(data: {
  userId?: string;
  sessionId: string;
  role: string;
  content: string;
  tokensUsed?: number;
  model?: string;
}): Promise<void> {
  try {
    await query(
      `INSERT INTO chat_logs (user_id, session_id, role, content, tokens_used, model)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        data.userId ?? null,
        data.sessionId,
        data.role,
        data.content,
        data.tokensUsed ?? 0,
        data.model ?? null,
      ]
    );
  } catch (err) {
    winstonLogger.error("Failed to write chat log to DB", { err });
  }
}

// ---------------------------------------------------------------------------
// Query helpers for the Logs Viewer
// ---------------------------------------------------------------------------

export async function getUploadLogs(limit = 50, offset = 0) {
  return query(
    `SELECT * FROM upload_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  ).then((r) => r.rows);
}

export async function getChatLogs(limit = 50, offset = 0) {
  return query(
    `SELECT * FROM chat_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  ).then((r) => r.rows);
}

export async function getERPLogs(limit = 50, offset = 0) {
  return query(
    `SELECT * FROM erp_request_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  ).then((r) => r.rows);
}

export async function getSystemLogs(limit = 50, offset = 0) {
  return query(
    `SELECT * FROM system_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  ).then((r) => r.rows);
}

export { winstonLogger as logger };
export default {
  logSystem,
  logERPRequest,
  logUpload,
  updateUploadLog,
  logChat,
  getUploadLogs,
  getChatLogs,
  getERPLogs,
  getSystemLogs,
  logger: winstonLogger,
};
