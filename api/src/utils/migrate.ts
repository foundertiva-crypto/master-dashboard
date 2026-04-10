/**
 * Database Migration Runner
 * Reads db/schema.sql and applies it to PostgreSQL.
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import { getPool, closePool } from "../models/database";

async function migrate() {
  console.log("Running database migration...");

  const schemaPath = path.resolve(__dirname, "../../../db/schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");

  const pool = getPool();

  try {
    await pool.query(sql);
    console.log("Migration completed successfully.");
  } catch (err: any) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    await closePool();
  }
}

migrate();
