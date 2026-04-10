/**
 * Auth Routes — /api/auth
 */

import { Router, Request, Response } from "express";
import { loginUser, registerUser, authenticate, verifyRefreshToken, generateAccessToken } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimiter";
import { logSystem } from "../services/logger.service";

const router = Router();

/** POST /api/auth/register */
router.post("/register", authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, role } = req.body;

    if (!email || !password || !fullName) {
      res.status(400).json({ error: "email, password, and fullName are required" });
      return;
    }

    const user = await registerUser(email, password, fullName, role);

    await logSystem({
      level: "info",
      source: "auth",
      action: "user_registered",
      message: `New user registered: ${email}`,
      userId: user.id,
      ipAddress: req.ip,
    });

    res.status(201).json({ data: user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/** POST /api/auth/login */
router.post("/login", authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }

    const result = await loginUser(email, password);

    await logSystem({
      level: "info",
      source: "auth",
      action: "user_login",
      message: `User logged in: ${email}`,
      userId: result.user.id,
      ipAddress: req.ip,
    });

    res.json({ data: result });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

/** POST /api/auth/refresh */
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: "refreshToken is required" });
      return;
    }

    const payload = verifyRefreshToken(refreshToken);
    const newAccess = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    res.json({ data: { accessToken: newAccess } });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

/** GET /api/auth/me */
router.get("/me", authenticate, (req: Request, res: Response) => {
  res.json({ data: req.user });
});

export default router;
