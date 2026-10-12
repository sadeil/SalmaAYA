import { databaseStatus } from "../config/database.mjs";
import { handleError } from "../middleware/errorHandler.mjs";
import { db, hashPassword, newToken, saveAppStore, verifyPassword } from "../models/appStore.mjs";
import { aiProviderStatus, summarizePlan } from "../services/openRouter.mjs";
import { readJson, sendJson } from "../utils/http.mjs";
import { handleRequest } from "../../../shared/remedyCore.mjs";

const deps = {
  hashPassword,
  verifyPassword,
  newToken,
  summarizePlan,
  aiStatus: aiProviderStatus,
  databaseStatus,
  health: () => ({
    status: "ok",
    service: "RemedyQuest API",
    database: databaseStatus(),
    checkedAt: new Date().toISOString(),
  }),
};

function bearerToken(request) {
  const header = request.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : null;
}

export async function handleApi(request, response, url) {
  if (request.method === "OPTIONS") return sendJson(response, 204, {});

  try {
    const body = ["POST", "PATCH", "PUT"].includes(request.method) ? await readJson(request) : {};
    const result = await handleRequest(db, {
      method: request.method,
      path: url.pathname.replace(/^\/api/, "") || "/",
      body,
      token: bearerToken(request),
    }, deps);
    if (result.changed) saveAppStore();
    return sendJson(response, result.status, result.body);
  } catch (error) {
    return handleError(response, error);
  }
}
