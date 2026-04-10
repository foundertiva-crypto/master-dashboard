/**
 * Files Routes — /api/files
 * MODULE 4 — S3 File Management API
 */

import { Router, Request, Response } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth";
import { getStorage as getS3Storage } from "../../../lib/storage";
import { query, getMany } from "../models/database";
import { logSystem } from "../services/logger.service";

const router = Router();
router.use(authenticate);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

/** POST /api/files/upload — Upload a file to S3 */
router.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const category = req.body.category || "general";
    const tags = req.body.tags || "";

    const s3 = getS3Storage();
    const result = await s3.uploadFile(req.file.buffer, req.file.originalname, {
      prefix: `files/${category}`,
      metadata: { userId: req.user?.userId ?? "unknown", category },
    });

    // Record in DB
    await query(
      `INSERT INTO file_records (user_id, file_name, s3_key, content_type, file_size, category, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        req.user?.userId ?? null,
        req.file.originalname,
        result.key,
        result.contentType,
        req.file.size,
        category,
        tags,
      ]
    );

    await logSystem({
      level: "info",
      source: "files",
      action: "file_uploaded",
      message: `File uploaded: ${req.file.originalname}`,
      userId: req.user?.userId,
    });

    res.status(201).json({ data: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/files — List files */
router.get("/", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const offset = parseInt(req.query.offset as string, 10) || 0;
    const category = req.query.category as string;

    let sql = `SELECT * FROM file_records WHERE is_deleted = false`;
    const params: any[] = [];
    let idx = 1;

    if (category) {
      sql += ` AND category = $${idx++}`;
      params.push(category);
    }

    sql += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const files = await getMany(sql, params);
    res.json({ data: files });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/files/download/:id — Get pre-signed download URL */
router.get("/download/:id", async (req: Request, res: Response) => {
  try {
    const file = await query(
      `SELECT * FROM file_records WHERE id = $1 AND is_deleted = false`,
      [req.params.id]
    );
    if (file.rows.length === 0) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const s3 = getS3Storage();
    const url = await s3.getSignedUrl(file.rows[0].s3_key);
    res.json({ data: { url, file: file.rows[0] } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/files/:id — Soft-delete a file */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await query(`UPDATE file_records SET is_deleted = true WHERE id = $1`, [req.params.id]);

    await logSystem({
      level: "info",
      source: "files",
      action: "file_deleted",
      message: `File soft-deleted: ${req.params.id}`,
      userId: req.user?.userId,
    });

    res.json({ data: { message: "File deleted" } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
