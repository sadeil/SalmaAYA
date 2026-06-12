const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options
  });
  if (!response.ok) throw new Error("Request failed");
  return response.json();
}

export const api = {
  login: (credentials) => request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  patientDashboard: () => request("/patient/dashboard"),
  exercises: () => request("/patient/exercises"),
  patients: () => request("/doctor/patients"),
  adminDashboard: () => request("/admin/dashboard")
};

export { API_BASE_URL };
