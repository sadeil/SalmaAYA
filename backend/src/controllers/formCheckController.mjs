import { formCheckSessions, nextFormCheckSessionId, saveAppStore } from "../models/appStore.mjs";
import { readJson, sendJson } from "../utils/http.mjs";

// Validates and normalises the payload the frontend sends. We deliberately
// strip anything that isn't on this allow-list — clients should never be able
// to slip in raw frames or large fields.
function sanitizeSession(payload) {
  if (!payload || typeof payload !== "object") return null;
  const exerciseId = String(payload.exerciseId ?? "").trim().slice(0, 50);
  const exerciseName = String(payload.exerciseName ?? exerciseId).trim().slice(0, 80);
  if (!exerciseId) return null;
  const durationMs = Math.max(0, Math.min(Number(payload.durationMs) || 0, 4 * 60 * 60 * 1000));
  const totalReps = Math.max(0, Math.min(Math.floor(Number(payload.totalReps) || 0), 9999));
  const correctReps = Math.max(0, Math.min(Math.floor(Number(payload.correctReps) || 0), totalReps));
  const targetReps = Math.max(1, Math.min(Math.floor(Number(payload.targetReps) || 5), 9999));
  const completed = Boolean(payload.completed ?? totalReps >= targetReps);

  let mistakes = {};
  if (payload.mistakes && typeof payload.mistakes === "object") {
    for (const [key, value] of Object.entries(payload.mistakes)) {
      const cleanKey = String(key).slice(0, 80);
      const cleanValue = Math.max(0, Math.min(Math.floor(Number(value) || 0), 9999));
      if (cleanValue > 0) mistakes[cleanKey] = cleanValue;
    }
  }

  const endedAt = isValidDate(payload.endedAt) ? payload.endedAt : new Date().toISOString();
  const startedAt = isValidDate(payload.startedAt)
    ? payload.startedAt
    : new Date(Date.parse(endedAt) - durationMs).toISOString();

  return {
    exerciseId,
    exerciseName,
    durationMs,
    totalReps,
    correctReps,
    targetReps,
    completed,
    mistakes,
    startedAt,
    endedAt,
  };
}

function isValidDate(value) {
  if (typeof value !== "string") return false;
  const ms = Date.parse(value);
  return Number.isFinite(ms);
}

export async function createSession(request, response) {
  const body = await readJson(request);
  const clean = sanitizeSession(body);
  if (!clean) {
    return sendJson(response, 400, {
      code: "VALIDATION_ERROR",
      message: "Invalid session payload.",
    });
  }
  const record = { id: nextFormCheckSessionId(), createdAt: new Date().toISOString(), ...clean };
  formCheckSessions.push(record);
  saveAppStore();
  return sendJson(response, 201, record);
}

export function listSessions(_request, response) {
  // Newest first; cap to the last 50 so the response stays small.
  const recent = [...formCheckSessions].sort((a, b) => Date.parse(b.endedAt) - Date.parse(a.endedAt)).slice(0, 50);
  return sendJson(response, 200, recent);
}
