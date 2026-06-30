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

async function request(path, options = {}) {
  if (STATIC_DEMO) return staticRequest(path, options);

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
        ...options.headers,
      },
    });

    const payload = await parseBody(response);
    if (!response.ok) {
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
  patientDashboard: () => request("/patient/dashboard"),
  exercises: () => request("/patient/exercises"),
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
