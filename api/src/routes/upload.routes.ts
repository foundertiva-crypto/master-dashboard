/**
 * Upload Routes — /api/upload
 * MODULE 3 — Bulk Upload API
 */

import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { authenticate } from "../middleware/auth";
import { uploadLimiter } from "../middleware/rateLimiter";
import { parseFile, generateTemplate, processUpload } from "../../../modules/bulk-upload";
import { validateUploadData, getSupportedUploadTypes, getTemplateColumns } from "../../../modules/bulk-upload/validators";
import { getStorage as getS3Storage } from "../../../lib/storage";
import { logSystem, getUploadLogs } from "../services/logger.service";

const router = Router();
router.use(authenticate);

// Multer — memory storage for small-to-mid files (< 50 MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".csv", ".xlsx", ".xls", ".json"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file format: ${ext}. Allowed: ${allowed.join(", ")}`));
    }
  },
});

/** GET /api/upload/types — List supported upload types */
router.get("/types", (_req: Request, res: Response) => {
  const types = getSupportedUploadTypes();
  const result = types.map((t) => ({
    type: t,
    columns: getTemplateColumns(t),
  }));
  res.json({ data: result });
});

/** GET /api/upload/template/:type — Download template */
router.get("/template/:type", (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const format = (req.query.format as string) === "xlsx" ? "xlsx" : "csv";
    const buffer = generateTemplate(type, format);
    const ext = format === "xlsx" ? "xlsx" : "csv";
    const contentType =
      format === "xlsx"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "text/csv";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename=template_${type}.${ext}`);
    res.send(buffer);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/** POST /api/upload/preview — Upload file, parse, and return preview */
router.post("/preview", uploadLimiter, upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const ext = path.extname(req.file.originalname).toLowerCase().replace(".", "");
    const parsed = parseFile(req.file.buffer, ext);

    const uploadType = req.body.uploadType;
    let validation = null;
    if (uploadType) {
      validation = validateUploadData(uploadType, parsed.rows);
    }

    res.json({
      data: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        headers: parsed.headers,
        totalRows: parsed.totalRows,
        preview: parsed.rows.slice(0, 10),
        validation: validation
          ? {
              valid: validation.valid,
              errorCount: validation.errors.length,
              errors: validation.errors.slice(0, 20),
              validRowCount: validation.cleanedData.length,
            }
          : null,
      },
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/** POST /api/upload/process — Validate + push to ERPNext */
router.post("/process", uploadLimiter, upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const uploadType = req.body.uploadType;
    if (!uploadType) {
      res.status(400).json({ error: "uploadType is required" });
      return;
    }

    const ext = path.extname(req.file.originalname).toLowerCase().replace(".", "");
    const parsed = parseFile(req.file.buffer, ext);

    // Upload source file to S3 for audit trail
    let s3Key: string | undefined;
    try {
      const s3 = getS3Storage();
      const result = await s3.uploadFile(req.file.buffer, req.file.originalname, {
        prefix: "uploads/bulk",
        metadata: { uploadType, userId: req.user?.userId ?? "unknown" },
      });
      s3Key = result.key;
    } catch {
      // S3 upload failure should not block the ERP push
    }

    await logSystem({
      level: "info",
      source: "upload",
      action: "bulk_upload_started",
      message: `${uploadType} upload started: ${req.file.originalname} (${parsed.totalRows} rows)`,
      userId: req.user?.userId,
      ipAddress: req.ip,
    });

    const progress = await processUpload(
      uploadType,
      parsed.rows,
      req.user?.userId,
      req.file.originalname,
      s3Key
    );

    res.json({ data: progress });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/upload/logs — Fetch upload history */
router.get("/logs", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const offset = parseInt(req.query.offset as string, 10) || 0;
    const logs = await getUploadLogs(limit, offset);
    res.json({ data: logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
