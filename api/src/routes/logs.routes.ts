/**
 * Logs Routes — /api/logs
 * MODULE 7 — Log Viewer API
 */

import { Router, Request, Response } from "express";
import { authenticate, authorize } from "../middleware/auth";
import {
  getUploadLogs,
  getChatLogs,
  getERPLogs,
  getSystemLogs,
} from "../services/logger.service";

const router = Router();
router.use(authenticate);

/** GET /api/logs/uploads */
router.get("/uploads", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const offset = parseInt(req.query.offset as string, 10) || 0;
    const logs = await getUploadLogs(limit, offset);
    res.json({ data: logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/logs/chat */
router.get("/chat", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const offset = parseInt(req.query.offset as string, 10) || 0;
    const logs = await getChatLogs(limit, offset);
    res.json({ data: logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/logs/erp */
router.get("/erp", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const offset = parseInt(req.query.offset as string, 10) || 0;
    const logs = await getERPLogs(limit, offset);
    res.json({ data: logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/logs/system */
router.get("/system", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const offset = parseInt(req.query.offset as string, 10) || 0;
    const logs = await getSystemLogs(limit, offset);
    res.json({ data: logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
