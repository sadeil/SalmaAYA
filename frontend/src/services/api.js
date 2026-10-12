import { clearSession, getSession } from "./session";
import { staticRequest } from "./staticApi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 10000);
const STATIC_DEMO = import.meta.env.VITE_STATIC_DEMO === "true";

export class ApiError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "ApiError";
    this.status = details.status;
    this.code = details.code;
    this.path = details.path;
    this.requestId = details.requestId;
    this.details = details.details;
  }
}

function requestId() {
  return `rq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function parseBody(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();
  const text = await response.text();
  return text ? { message: text } : null;
}

// An expired or unknown token means the session is gone: drop it so the
// route guards send the user back to the login page.
function handleUnauthorized(status, path) {
  if (status === 401 && !path.startsWith("/auth/")) clearSession();
}

async function request(path, options = {}) {
  const token = getSession()?.token ?? null;

  if (STATIC_DEMO) {
    try {
      return await staticRequest(path, options, token);
    } catch (error) {
      handleUnauthorized(error.status, path);
      throw new ApiError(error.message, { status: error.status, code: error.code, path });
    }
  }

  const id = requestId();
  const method = options.method || "GET";

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      method,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Request-ID": id,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    const payload = await parseBody(response);
    if (!response.ok) {
      handleUnauthorized(response.status, path);
      throw new ApiError(payload?.message || "Request failed", {
        code: payload?.code || "HTTP_ERROR",
        details: payload,
        path,
        requestId: id,
        status: response.status,
      });
    }

    return payload;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new ApiError("Request timed out", { code: "TIMEOUT", path, requestId: id });
    }
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || "Network request failed", {
      code: "NETWORK_ERROR",
      path,
      requestId: id,
    });
  } finally {
    window.clearTimeout(timer);
  }
}

export const api = {
  health: () => request("/health"),
  login: (credentials) => request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request("/auth/me"),
  logout: () => request("/auth/logout", { method: "POST" }),
  patientDashboard: () => request("/patient/dashboard"),
  exercises: () => request("/patient/exercises"),
  setExerciseDone: (id, done) => request(`/patient/exercises/${id}/status`, { method: "POST", body: JSON.stringify({ done }) }),
  careMessages: () => request("/patient/care-messages"),
  sendCareMessage: (text) => request("/patient/care-messages", { method: "POST", body: JSON.stringify({ text }) }),
  patients: () => request("/doctor/patients"),
  patientMessages: () => request("/patient/messages"),
  sendPatientMessage: (text) => request("/patient/messages", { method: "POST", body: JSON.stringify({ text }) }),
  endPatientConversation: () => request("/patient/conversations/end", { method: "POST" }),
  saveSession: (session) => request("/patient/sessions", { method: "POST", body: JSON.stringify(session) }),
  sessions: () => request("/patient/sessions"),
  approvePlan: (patientId) => request(`/doctor/patients/${patientId}/plan`, { method: "PATCH" }),
  adminDashboard: () => request("/admin/dashboard"),
  adminDatabase: () => request("/admin/database"),
};

export { API_BASE_URL, API_TIMEOUT_MS, STATIC_DEMO };
