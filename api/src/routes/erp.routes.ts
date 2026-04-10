/**
 * ERP Routes — /api/erp
 * Proxies all ERPNext API calls through the gateway.
 */

import { Router, Request, Response } from "express";
import { getERPClient } from "../../../lib/erp";
import { authenticate } from "../middleware/auth";
import { logERPRequest } from "../services/logger.service";

const router = Router();

// All ERP routes require authentication
router.use(authenticate);

/** GET /api/erp/health — Check ERPNext connectivity */
router.get("/health", async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const erp = getERPClient();
    const alive = await erp.ping();
    const ms = Date.now() - start;

    await logERPRequest({
      userId: req.user?.userId,
      method: "GET",
      endpoint: "/health",
      statusCode: alive ? 200 : 503,
      responseTimeMs: ms,
    });

    res.json({ data: { status: alive ? "connected" : "unreachable", responseTimeMs: ms } });
  } catch (err: any) {
    res.status(503).json({ error: "ERPNext unreachable", details: err.message });
  }
});

/** GET /api/erp/dashboard — Full dashboard overview */
router.get("/dashboard", async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const erp = getERPClient();
    const overview = await erp.getDashboardOverview();
    const ms = Date.now() - start;

    await logERPRequest({
      userId: req.user?.userId,
      method: "GET",
      endpoint: "/dashboard",
      statusCode: 200,
      responseTimeMs: ms,
    });

    res.json({ data: overview });
  } catch (err: any) {
    const ms = Date.now() - start;
    await logERPRequest({
      userId: req.user?.userId,
      method: "GET",
      endpoint: "/dashboard",
      statusCode: err.status || 500,
      responseTimeMs: ms,
      errorMessage: err.message,
    });
    res.status(500).json({ error: "Failed to fetch dashboard data", details: err.message });
  }
});

/** GET /api/erp/sales */
router.get("/sales", async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const erp = getERPClient();
    const data = await erp.getSales();
    await logERPRequest({ userId: req.user?.userId, method: "GET", endpoint: "/sales", statusCode: 200, responseTimeMs: Date.now() - start });
    res.json({ data });
  } catch (err: any) {
    await logERPRequest({ userId: req.user?.userId, method: "GET", endpoint: "/sales", statusCode: 500, responseTimeMs: Date.now() - start, errorMessage: err.message });
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/erp/customers */
router.get("/customers", async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const erp = getERPClient();
    const data = await erp.getCustomers();
    await logERPRequest({ userId: req.user?.userId, method: "GET", endpoint: "/customers", statusCode: 200, responseTimeMs: Date.now() - start });
    res.json({ data });
  } catch (err: any) {
    await logERPRequest({ userId: req.user?.userId, method: "GET", endpoint: "/customers", statusCode: 500, responseTimeMs: Date.now() - start, errorMessage: err.message });
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/erp/inventory */
router.get("/inventory", async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const erp = getERPClient();
    const data = await erp.getInventory();
    await logERPRequest({ userId: req.user?.userId, method: "GET", endpoint: "/inventory", statusCode: 200, responseTimeMs: Date.now() - start });
    res.json({ data });
  } catch (err: any) {
    await logERPRequest({ userId: req.user?.userId, method: "GET", endpoint: "/inventory", statusCode: 500, responseTimeMs: Date.now() - start, errorMessage: err.message });
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/erp/orders */
router.get("/orders", async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const erp = getERPClient();
    const data = await erp.getOrders();
    await logERPRequest({ userId: req.user?.userId, method: "GET", endpoint: "/orders", statusCode: 200, responseTimeMs: Date.now() - start });
    res.json({ data });
  } catch (err: any) {
    await logERPRequest({ userId: req.user?.userId, method: "GET", endpoint: "/orders", statusCode: 500, responseTimeMs: Date.now() - start, errorMessage: err.message });
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/erp/invoices */
router.get("/invoices", async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const erp = getERPClient();
    const data = await erp.getInvoices();
    await logERPRequest({ userId: req.user?.userId, method: "GET", endpoint: "/invoices", statusCode: 200, responseTimeMs: Date.now() - start });
    res.json({ data });
  } catch (err: any) {
    await logERPRequest({ userId: req.user?.userId, method: "GET", endpoint: "/invoices", statusCode: 500, responseTimeMs: Date.now() - start, errorMessage: err.message });
    res.status(500).json({ error: err.message });
  }
});

/** Generic resource proxy: GET /api/erp/resource/:doctype */
router.get("/resource/:doctype", async (req: Request, res: Response) => {
  const start = Date.now();
  const { doctype } = req.params;
  try {
    const erp = getERPClient();
    const fields = req.query.fields ? JSON.parse(req.query.fields as string) : undefined;
    const filters = req.query.filters ? JSON.parse(req.query.filters as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const data = await erp.getList(doctype, { fields, filters, limitPageLength: limit });

    await logERPRequest({ userId: req.user?.userId, method: "GET", endpoint: `/resource/${doctype}`, statusCode: 200, responseTimeMs: Date.now() - start });
    res.json({ data });
  } catch (err: any) {
    await logERPRequest({ userId: req.user?.userId, method: "GET", endpoint: `/resource/${doctype}`, statusCode: 500, responseTimeMs: Date.now() - start, errorMessage: err.message });
    res.status(500).json({ error: err.message });
  }
});

/** POST to ERPNext: POST /api/erp/resource/:doctype */
router.post("/resource/:doctype", async (req: Request, res: Response) => {
  const start = Date.now();
  const { doctype } = req.params;
  try {
    const erp = getERPClient();
    const data = await erp.createDoc(doctype, req.body);

    await logERPRequest({ userId: req.user?.userId, method: "POST", endpoint: `/resource/${doctype}`, statusCode: 201, responseTimeMs: Date.now() - start, requestBody: req.body });
    res.status(201).json({ data });
  } catch (err: any) {
    await logERPRequest({ userId: req.user?.userId, method: "POST", endpoint: `/resource/${doctype}`, statusCode: 500, responseTimeMs: Date.now() - start, errorMessage: err.message, requestBody: req.body });
    res.status(500).json({ error: err.message });
  }
});

export default router;
