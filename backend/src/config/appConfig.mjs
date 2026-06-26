import path from "node:path";
import { fileURLToPath } from "node:url";
import "./env.mjs";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const projectRoot = path.resolve(backendRoot, "..");

export const appConfig = {
  backendRoot,
  projectRoot,
  distDir: process.env.FRONTEND_DIST_DIR
    ? path.resolve(projectRoot, process.env.FRONTEND_DIST_DIR)
    : path.resolve(projectRoot, "frontend", "dist"),
  host: process.env.HOST || "127.0.0.1",
  port: Number(process.env.PORT || 8787),
  corsOrigin: process.env.CORS_ORIGIN || "*",
};
