/**
 * Tiva Upgrade Tracker Module
 * ================================
 * Tracks all Tiva platform requirements, phases, and upgrade status.
 * Phase 1: ERP Dashboard (current)
 * Phase 2: Platform integrations (Payments, Logistics, CRM, WhatsApp)
 * Phase 3: Tiva AOS Dashboard
 */

import { query, getMany } from "../../api/src/models/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Requirement {
  id?: string;
  phase: number;
  category: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "pending" | "in_progress" | "completed" | "blocked";
  assignee?: string;
  targetDate?: string;
  completedDate?: string;
  notes?: string;
}

export interface PhaseOverview {
  phase: number;
  name: string;
  description: string;
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  pending: number;
  percentComplete: number;
}

// ---------------------------------------------------------------------------
// Default Tiva Roadmap — seeded on first load
// ---------------------------------------------------------------------------

export const TIVA_ROADMAP: Requirement[] = [
  // Phase 1 — Deliver & Ship
  { phase: 1, category: "ERP Integration", title: "ERPNext REST API connected", description: "All ERP data flows through REST API, zero direct DB access", priority: "critical", status: "completed" },
  { phase: 1, category: "Dashboard", title: "Next.js 14 Refine Dashboard built", description: "Dashboard UI with Ant Design, all pages functional", priority: "critical", status: "completed" },
  { phase: 1, category: "AI", title: "OpenAI + Claude dual wired", description: "Both AI providers integrated with provider switching", priority: "high", status: "completed" },
  { phase: 1, category: "Bulk Upload", title: "Bulk upload with validation", description: "CSV/Excel/JSON parsing, schema validation, ERPNext push with retry", priority: "high", status: "completed" },
  { phase: 1, category: "AI", title: "AI chatbot handles Tiva ERP needs", description: "Context-aware chatbot with ERP system prompt", priority: "high", status: "completed" },
  { phase: 1, category: "Infrastructure", title: "Hosted & live on AWS", description: "Docker Compose, Nginx, EC2 deployment", priority: "critical", status: "in_progress" },
  { phase: 1, category: "Upgrade Tracker", title: "Tiva upgrade tracker live", description: "Track all requirements and phases in dashboard", priority: "medium", status: "completed" },
  { phase: 1, category: "Storage", title: "AWS S3 file storage", description: "Upload, download, delete files via S3", priority: "high", status: "completed" },
  { phase: 1, category: "Security", title: "JWT auth + rate limiting", description: "Full auth system with refresh tokens", priority: "critical", status: "completed" },
  { phase: 1, category: "Logging", title: "Full logging system", description: "Upload, chat, ERP, system logs in PostgreSQL", priority: "high", status: "completed" },

  // Phase 2 — Post-Hosting, More Platforms
  { phase: 2, category: "Payments", title: "Payment gateway integration", description: "Connect payment processors to dashboard", priority: "high", status: "pending" },
  { phase: 2, category: "Logistics", title: "Logistics platform integration", description: "Shipping and delivery tracking in dashboard", priority: "high", status: "pending" },
  { phase: 2, category: "CRM", title: "CRM integration", description: "Customer relationship management connected", priority: "medium", status: "pending" },
  { phase: 2, category: "WhatsApp", title: "WhatsApp Business integration", description: "WhatsApp messaging from dashboard", priority: "medium", status: "pending" },
  { phase: 2, category: "AI", title: "AI context grows with each platform", description: "Chatbot automatically gains knowledge of new integrations", priority: "high", status: "pending" },
  { phase: 2, category: "Platform", title: "Plugin architecture for new platforms", description: "Each new platform plugs into same dashboard — no rebuild", priority: "high", status: "pending" },

  // Phase 3 — Tiva AOS Dashboard
  { phase: 3, category: "AOS", title: "Tiva AOS dashboard", description: "Separate AOS-specific views built on same foundation", priority: "high", status: "pending" },
  { phase: 3, category: "AOS", title: "AOS requirements tracked", description: "AOS upgrade requirements managed in tracker", priority: "medium", status: "pending" },
  { phase: 3, category: "AOS", title: "AOS upgrades managed", description: "Full AOS upgrade lifecycle in dashboard", priority: "medium", status: "pending" },
  { phase: 3, category: "AI", title: "Same AI chatbot — AOS context added", description: "Founder asks once, gets answers across both ERP and AOS", priority: "high", status: "pending" },
  { phase: 3, category: "AOS", title: "Synced with ERP dashboard", description: "AOS and ERP dashboards share data layer", priority: "high", status: "pending" },
];

// ---------------------------------------------------------------------------
// Database operations
// ---------------------------------------------------------------------------

export async function getRequirements(phase?: number): Promise<Requirement[]> {
  let sql = `SELECT * FROM upgrade_requirements ORDER BY phase ASC, priority_order ASC, created_at ASC`;
  const params: any[] = [];

  if (phase !== undefined) {
    sql = `SELECT * FROM upgrade_requirements WHERE phase = $1 ORDER BY priority_order ASC, created_at ASC`;
    params.push(phase);
  }

  try {
    return await getMany(sql, params);
  } catch {
    // Table may not exist yet — return defaults
    return TIVA_ROADMAP;
  }
}

export async function getPhaseOverview(): Promise<PhaseOverview[]> {
  const reqs = await getRequirements();
  const phases = [
    { phase: 1, name: "Deliver & Ship", description: "ERP Dashboard — full delivery" },
    { phase: 2, name: "Post-Hosting", description: "Platform integrations expand" },
    { phase: 3, name: "Tiva AOS Dashboard", description: "AOS — own dashboard, own upgrade cycle" },
  ];

  return phases.map((p) => {
    const items = reqs.filter((r) => r.phase === p.phase);
    const completed = items.filter((r) => r.status === "completed").length;
    const inProgress = items.filter((r) => r.status === "in_progress").length;
    const blocked = items.filter((r) => r.status === "blocked").length;
    const pending = items.filter((r) => r.status === "pending").length;

    return {
      ...p,
      total: items.length,
      completed,
      inProgress,
      blocked,
      pending,
      percentComplete: items.length > 0 ? Math.round((completed / items.length) * 100) : 0,
    };
  });
}

export async function updateRequirementStatus(
  id: string,
  status: Requirement["status"],
  notes?: string
): Promise<void> {
  const sets = [`status = $1`];
  const params: any[] = [status];
  let idx = 2;

  if (status === "completed") {
    sets.push(`completed_date = $${idx++}`);
    params.push(new Date().toISOString().slice(0, 10));
  }
  if (notes) {
    sets.push(`notes = $${idx++}`);
    params.push(notes);
  }

  params.push(id);
  await query(
    `UPDATE upgrade_requirements SET ${sets.join(", ")} WHERE id = $${idx}`,
    params
  );
}

export async function addRequirement(req: Requirement): Promise<void> {
  const priorityMap = { critical: 1, high: 2, medium: 3, low: 4 };
  await query(
    `INSERT INTO upgrade_requirements (phase, category, title, description, priority, priority_order, status, assignee, target_date, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      req.phase,
      req.category,
      req.title,
      req.description,
      req.priority,
      priorityMap[req.priority] || 3,
      req.status || "pending",
      req.assignee || null,
      req.targetDate || null,
      req.notes || null,
    ]
  );
}

export default { getRequirements, getPhaseOverview, updateRequirementStatus, addRequirement, TIVA_ROADMAP };
