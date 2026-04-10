/**
 * Database Seed — creates a default admin user
 */

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import { hashPassword } from "../middleware/auth";
import { query, closePool } from "../models/database";

async function seed() {
  console.log("Seeding database...");

  const email = "admin@dashboard.local";
  const password = "admin123"; // CHANGE IN PRODUCTION
  const fullName = "Dashboard Admin";
  const role = "admin";

  const hash = await hashPassword(password);

  try {
    await query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [email, hash, fullName, role]
    );
    console.log(`Admin user created: ${email} / ${password}`);
    console.log("⚠ Change the password immediately in production!");
  } catch (err: any) {
    console.error("Seed failed:", err.message);
  } finally {
    await closePool();
  }
}

seed();
