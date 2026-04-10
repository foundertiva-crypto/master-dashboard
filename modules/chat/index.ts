/**
 * AI Chatbot Module — MODULE 5
 * ================================
 * Dual-provider: OpenAI + Claude (Anthropic)
 * Selectable at runtime via AI_PROVIDER env var or per-request.
 * Streaming-ready architecture.
 */

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { logChat } from "../../api/src/services/logger.service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
  tokensUsed: number;
  model: string;
  provider: "openai" | "claude";
  sessionId: string;
}

export type AIProvider = "openai" | "claude";

// ---------------------------------------------------------------------------
// Client singletons
// ---------------------------------------------------------------------------

let openaiClient: OpenAI | null = null;
let claudeClient: Anthropic | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
  }
  return openaiClient;
}

function getClaude(): Anthropic {
  if (!claudeClient) {
    claudeClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });
  }
  return claudeClient;
}

// ---------------------------------------------------------------------------
// System prompt — contextualised for Tiva ERP dashboard
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are the Tiva Master Dashboard AI assistant.
You help the founder and team understand ERP data — sales, inventory, customers, orders, invoices.
You guide bulk upload processes, file management, and track Tiva upgrade requirements.
You know about:
- ERPNext integration (all data comes from ERPNext REST API)
- Bulk upload engine (CSV/Excel/JSON → ERPNext)
- S3 file storage
- The Tiva upgrade tracker and phase roadmap
Be concise, accurate, and proactive. If you don't know, say so.
Current date: ${new Date().toISOString().slice(0, 10)}.`;

// ---------------------------------------------------------------------------
// Resolve which provider to use
// ---------------------------------------------------------------------------

function resolveProvider(requested?: AIProvider): AIProvider {
  if (requested) return requested;
  const env = (process.env.AI_PROVIDER || "openai").toLowerCase();
  if (env === "claude" || env === "anthropic") return "claude";
  return "openai";
}

// ---------------------------------------------------------------------------
// OpenAI handler
// ---------------------------------------------------------------------------

async function chatOpenAI(
  messages: ChatMessage[],
  maxTokens: number,
  temperature: number
): Promise<{ reply: string; tokensUsed: number; model: string }> {
  const openai = getOpenAI();
  const model = process.env.OPENAI_MODEL || "gpt-4o";

  const completion = await openai.chat.completions.create({
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
  });

  return {
    reply: completion.choices[0]?.message?.content ?? "No response generated.",
    tokensUsed: completion.usage?.total_tokens ?? 0,
    model,
  };
}

// ---------------------------------------------------------------------------
// Claude (Anthropic) handler
// ---------------------------------------------------------------------------

async function chatClaude(
  messages: ChatMessage[],
  maxTokens: number,
  temperature: number
): Promise<{ reply: string; tokensUsed: number; model: string }> {
  const claude = getClaude();
  const model = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";

  // Separate system message from conversation
  const systemMsg = messages.find((m) => m.role === "system")?.content ?? SYSTEM_PROMPT;
  const conversation = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const response = await claude.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemMsg,
    messages: conversation,
  });

  const reply =
    response.content[0]?.type === "text"
      ? response.content[0].text
      : "No response generated.";

  return {
    reply,
    tokensUsed: (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0),
    model,
  };
}

// ---------------------------------------------------------------------------
// Main chat function
// ---------------------------------------------------------------------------

export async function chat(
  userMessage: string,
  sessionId: string,
  history: ChatMessage[] = [],
  userId?: string,
  provider?: AIProvider
): Promise<ChatResponse> {
  const resolvedProvider = resolveProvider(provider);
  const maxTokens = parseInt(process.env.AI_MAX_TOKENS || "2048", 10);
  const temperature = parseFloat(process.env.AI_TEMPERATURE || "0.7");

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: userMessage },
  ];

  // Log user message
  await logChat({ userId, sessionId, role: "user", content: userMessage });

  let result: { reply: string; tokensUsed: number; model: string };

  if (resolvedProvider === "claude") {
    result = await chatClaude(messages, maxTokens, temperature);
  } else {
    result = await chatOpenAI(messages, maxTokens, temperature);
  }

  // Log assistant reply
  await logChat({
    userId,
    sessionId,
    role: "assistant",
    content: result.reply,
    tokensUsed: result.tokensUsed,
    model: result.model,
  });

  return {
    reply: result.reply,
    tokensUsed: result.tokensUsed,
    model: result.model,
    provider: resolvedProvider,
    sessionId,
  };
}

// ---------------------------------------------------------------------------
// Chat history from DB
// ---------------------------------------------------------------------------

export async function getChatHistory(
  sessionId: string,
  limit = 50
): Promise<ChatMessage[]> {
  // Import query dynamically to avoid circular dependency at module load
  const { getMany } = await import("../../api/src/models/database");
  const rows = await getMany(
    `SELECT role, content FROM chat_logs WHERE session_id = $1 ORDER BY created_at ASC LIMIT $2`,
    [sessionId, limit]
  );
  return rows.map((r: any) => ({ role: r.role, content: r.content }));
}

// ---------------------------------------------------------------------------
// Provider availability
// ---------------------------------------------------------------------------

export function getAvailableProviders(): AIProvider[] {
  const providers: AIProvider[] = [];
  if (process.env.OPENAI_API_KEY) providers.push("openai");
  if (process.env.ANTHROPIC_API_KEY) providers.push("claude");
  if (providers.length === 0) providers.push("openai"); // fallback
  return providers;
}

export default { chat, getChatHistory, getAvailableProviders };