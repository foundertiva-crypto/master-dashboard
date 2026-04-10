/**
 * Chat Routes — /api/chat
 * MODULE 5 — Dual AI Chatbot API (OpenAI + Claude)
 */

import { Router, Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { authenticate } from "../middleware/auth";
import { chatLimiter } from "../middleware/rateLimiter";
import { chat, getChatHistory, getAvailableProviders } from "../../../modules/chat";
import { logSystem } from "../services/logger.service";

const router = Router();
router.use(authenticate);

/** POST /api/chat/send — Send a message to the AI chatbot */
router.post("/send", chatLimiter, async (req: Request, res: Response) => {
  try {
    const { message: userMessage, sessionId, history, provider } = req.body;

    if (!userMessage || typeof userMessage !== "string" || userMessage.trim() === "") {
      res.status(400).json({ error: "message is required" });
      return;
    }

    const sid = sessionId || uuid();
    const chatHistory = history ?? [];

    const response = await chat(
      userMessage.trim(),
      sid,
      chatHistory,
      req.user?.userId,
      provider // "openai" | "claude" | undefined (uses default)
    );

    res.json({ data: response });
  } catch (err: any) {
    await logSystem({
      level: "error",
      source: "chat",
      action: "chat_error",
      message: err.message,
      userId: req.user?.userId,
    });
    res.status(500).json({ error: "Chat service error", details: err.message });
  }
});

/** GET /api/chat/providers — List available AI providers */
router.get("/providers", (_req: Request, res: Response) => {
  const providers = getAvailableProviders();
  const defaultProvider = (process.env.AI_PROVIDER || "openai").toLowerCase();
  res.json({ data: { providers, default: defaultProvider } });
});

/** GET /api/chat/history/:sessionId — Get chat history for a session */
router.get("/history/:sessionId", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const history = await getChatHistory(sessionId, limit);
    res.json({ data: history });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;