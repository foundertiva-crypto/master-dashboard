import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  app: {
    name: requireEnv("APP_NAME", "master-dashboard"),
    env: requireEnv("NODE_ENV", "development"),
    port: parseInt(requireEnv("APP_PORT", "4000"), 10),
    dashboardPort: parseInt(requireEnv("DASHBOARD_PORT", "3000"), 10),
  },

  erpNext: {
    baseUrl: requireEnv("ERPNEXT_BASE_URL", "http://localhost:8000"),
    apiKey: requireEnv("ERPNEXT_API_KEY", ""),
    apiSecret: requireEnv("ERPNEXT_API_SECRET", ""),
  },

  database: {
    host: requireEnv("DB_HOST", "localhost"),
    port: parseInt(requireEnv("DB_PORT", "5432"), 10),
    name: requireEnv("DB_NAME", "master_dashboard"),
    user: requireEnv("DB_USER", "dashboard_user"),
    password: requireEnv("DB_PASSWORD", ""),
    url: requireEnv(
      "DATABASE_URL",
      "postgresql://dashboard_user:password@localhost:5432/master_dashboard"
    ),
  },

  storage: {
    provider: requireEnv("STORAGE_PROVIDER", "r2") as "r2" | "s3" | "oracle",
    accessKeyId: requireEnv("R2_ACCESS_KEY_ID", process.env.AWS_ACCESS_KEY_ID || ""),
    secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY", process.env.AWS_SECRET_ACCESS_KEY || ""),
    accountId: requireEnv("R2_ACCOUNT_ID", ""),
    bucket: requireEnv("R2_BUCKET_NAME", "tiva-dashboard-storage"),
    endpoint: requireEnv("R2_ENDPOINT", ""),
    publicUrl: requireEnv("R2_PUBLIC_URL", ""),
    uploadPrefix: requireEnv("STORAGE_UPLOAD_PREFIX", "uploads"),
    logsPrefix: requireEnv("STORAGE_LOGS_PREFIX", "logs"),
    reportsPrefix: requireEnv("STORAGE_REPORTS_PREFIX", "reports"),
    tempPrefix: requireEnv("STORAGE_TEMP_PREFIX", "temp"),
  },

  openai: {
    apiKey: requireEnv("OPENAI_API_KEY", ""),
    model: requireEnv("OPENAI_MODEL", "gpt-4o"),
    maxTokens: parseInt(requireEnv("OPENAI_MAX_TOKENS", "2048"), 10),
    temperature: parseFloat(requireEnv("OPENAI_TEMPERATURE", "0.7")),
  },

  jwt: {
    secret: requireEnv("JWT_SECRET", "dev-secret-change-in-production"),
    expiresIn: requireEnv("JWT_EXPIRES_IN", "24h"),
    refreshSecret: requireEnv("JWT_REFRESH_SECRET", "dev-refresh-secret"),
    refreshExpiresIn: requireEnv("JWT_REFRESH_EXPIRES_IN", "7d"),
  },

  rateLimit: {
    windowMs: parseInt(requireEnv("RATE_LIMIT_WINDOW_MS", "900000"), 10),
    maxRequests: parseInt(requireEnv("RATE_LIMIT_MAX_REQUESTS", "100"), 10),
  },

  logging: {
    level: requireEnv("LOG_LEVEL", "info"),
    toFile: requireEnv("LOG_TO_FILE", "true") === "true",
    dir: requireEnv("LOG_DIR", "./logs"),
  },

  cors: {
    origin: requireEnv("CORS_ORIGIN", "http://localhost:3000"),
  },
} as const;

export type Config = typeof config;
export default config;
