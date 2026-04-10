/**
 * Rate Limiting Middleware
 */

import rateLimit from "express-rate-limit";

export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again later.",
  },
});

export const uploadLimiter = rateLimit({
  windowMs: 60_000, // 1 minute
  max: 10,
  message: { error: "Upload rate limit exceeded. Wait a moment." },
});

export const chatLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  message: { error: "Chat rate limit exceeded. Slow down." },
});

export const authLimiter = rateLimit({
  windowMs: 900_000, // 15 min
  max: 10,
  message: { error: "Too many auth attempts. Try again later." },
});

export default { generalLimiter, uploadLimiter, chatLimiter, authLimiter };
