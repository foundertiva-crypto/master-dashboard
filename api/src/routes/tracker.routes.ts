/**
 * Upgrade Tracker Routes — /api/tracker
 * Tiva requirement & phase tracking
 */

import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import {
  getRequirements,
  getPhaseOverview,
  updateRequirementStatus,
  addRequirement,
  TIVA_ROADMAP,
} from "../../../modules/upgrade-tracker";
import { query, getMany } from "../models/database";

const router = Router();
router.use(authenticate);

/** GET /api/tracker/phases — Phase overview with progress */
router.get("/phases", async (_req: Request, res: Response) => {
  try {
    const overview = await getPhaseOverview();
    res.json({ data: overview });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/tracker/requirements — All requirements (optional ?phase=1) */
router.get("/requirements", async (req: Request, res: Response) => {
  try {
    const phase = req.query.phase ? parseInt(req.query.phase as string, 10) : undefined;
    const reqs = await getRequirements(phase);
    res.json({ data: reqs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** PUT /api/tracker/requirements/:id — Update status */
router.put("/requirements/:id", async (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body;
    await updateRequirementStatus(req.params.id, status, notes);
    res.json({ data: { message: "Updated" } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/tracker/requirements — Add new requirement */
router.post("/requirements", async (req: Request, res: Response) => {
  try {
    await addRequirement(req.body);
    res.status(201).json({ data: { message: "Created" } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/tracker/seed — Seed the default Tiva roadmap */
router.post("/seed", async (_req: Request, res: Response) => {
  try {
    const existing = await getMany("SELECT id FROM upgrade_requirements LIMIT 1");
    if (existing.length > 0) {
      res.json({ data: { message: "Already seeded" } });
      return;
    }

    const priorityMap: Record<string, number> = { critical: 1, high: 2, medium: 3, low: 4 };

    for (const req of TIVA_ROADMAP) {
      await query(
        `INSERT INTO upgrade_requirements (phase, category, title, description, priority, priority_order, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [req.phase, req.category, req.title, req.description, req.priority, priorityMap[req.priority] || 3, req.status]
      );
    }

    res.status(201).json({ data: { message: `Seeded ${TIVA_ROADMAP.length} requirements` } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
