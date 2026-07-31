import dotenv from "dotenv";
import path from "node:path";

// Env vars live in a single .env at the monorepo root (see specifications/07-environment-variables.md).
// Resolve relative to this file, not process.cwd(), since workspace scripts run with
// cwd=packages/server regardless of where `npm run` was invoked from.
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

const REQUIRED_ENV_VARS = ["MONGODB_URI", "JWT_SECRET", "JWT_REFRESH_SECRET"] as const;

function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        `Copy .env.example to .env at the repo root and fill these in before starting the server.`
    );
  }
}

// Runs at import time, before any route/DB/service code executes — the server
// refuses to boot rather than fail later with a confusing runtime error.
validateEnv();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",

  mongodbUri: process.env.MONGODB_URI as string,

  jwtSecret: process.env.JWT_SECRET as string,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET as string,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",

  // Optional at boot — features that depend on these degrade gracefully
  // (see services/aiCategorizer.ts fallback path) rather than crashing the server.
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
};

export const isProduction = config.nodeEnv === "production";
