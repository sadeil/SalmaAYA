import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { appConfig } from "../config/appConfig.mjs";
import { sendJson } from "../utils/http.mjs";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

export async function serveStatic(response, url) {
  if (!existsSync(appConfig.distDir)) {
    return sendJson(response, 503, {
      code: "BUILD_MISSING",
      message: "Run npm run build before starting the production server",
    });
  }

  const requested = url.pathname === "/" ? "/index.html" : url.pathname;
  const resolved = path.normalize(path.join(appConfig.distDir, requested));
  const safePath = resolved.startsWith(appConfig.distDir) && existsSync(resolved)
    ? resolved
    : path.join(appConfig.distDir, "index.html");
  const extension = path.extname(safePath);
  const body = await readFile(safePath);

  response.writeHead(200, { "Content-Type": contentTypes[extension] || "application/octet-stream" });
  response.end(body);
}
