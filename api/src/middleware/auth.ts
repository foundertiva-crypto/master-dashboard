/**
 * Authentication & Security Middleware — MODULE 10
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { query, getOne } from "../models/database";
import { logSystem } from "../services/logger.service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || "24h";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "dev-refresh-secret";
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES } as any);
}

export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES,
  } as any);
}

export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export function verifyRefreshToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
}

// ---------------------------------------------------------------------------
// Password helpers
// ---------------------------------------------------------------------------

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function comparePassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ---------------------------------------------------------------------------
// Middleware: Authenticate JWT
// ---------------------------------------------------------------------------

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      res.status(401).json({ error: "Token expired" });
      return;
    }
    res.status(401).json({ error: "Invalid token" });
  }
}

// ---------------------------------------------------------------------------
// Middleware: Authorize roles
// ---------------------------------------------------------------------------

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      logSystem({
        level: "warn",
        source: "auth",
        action: "unauthorized_access",
        message: `User ${req.user.email} attempted access with role ${req.user.role}`,
        userId: req.user.userId,
        ipAddress: req.ip,
      });
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

// ---------------------------------------------------------------------------
// Middleware: API Key validation (for service-to-service calls)
// ---------------------------------------------------------------------------

export function validateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const apiKey = req.headers["x-api-key"] as string;

  if (!apiKey) {
    // Fall through to JWT auth
    next();
    return;
  }

  // In production, validate against a stored set of API keys.
  // For Phase-1 we use a single env-based key.
  const validKey = process.env.INTERNAL_API_KEY;
  if (validKey && apiKey === validKey) {
    req.user = { userId: "system", email: "system@internal", role: "admin" };
    next();
    return;
  }

  res.status(401).json({ error: "Invalid API key" });
}

// ---------------------------------------------------------------------------
// Auth controller helpers (login / register / refresh)
// ---------------------------------------------------------------------------

export async function registerUser(
  email: string,
  password: string,
  fullName: string,
  role = "viewer"
) {
  const existing = await getOne("SELECT id FROM users WHERE email = $1", [
    email,
  ]);
  if (existing) throw new Error("User already exists");

  const hash = await hashPassword(password);
  const res = await query(
    `INSERT INTO users (email, password_hash, full_name, role) VALUES ($1,$2,$3,$4) RETURNING id, email, full_name, role`,
    [email, hash, fullName, role]
  );
  return res.rows[0];
}

export async function loginUser(email: string, password: string) {
  const user = await getOne(
    "SELECT id, email, password_hash, full_name, role, is_active FROM users WHERE email = $1",
    [email]
  );
  if (!user) throw new Error("Invalid credentials");
  if (!user.is_active) throw new Error("Account is disabled");

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) throw new Error("Invalid credentials");

  await query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);

  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return {
    user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role },
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

export default {
  authenticate,
  authorize,
  validateApiKey,
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  comparePassword,
  registerUser,
  loginUser,
};
