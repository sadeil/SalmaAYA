import { readJson, sendJson } from "../utils/http.mjs";
import { tokenFor } from "../utils/tokens.mjs";

export async function login(request, response) {
  const body = await readJson(request);
  if (!body.email || !body.password) {
    return sendJson(response, 400, { code: "VALIDATION_ERROR", message: "Email and password are required" });
  }

  const role = body.role === "doctor" ? "doctor" : "patient";
  const user = {
    id: role === "doctor" ? "doctor_aya" : "patient_salma",
    name: role === "doctor" ? "Dr. Aya" : "Salma",
    role,
  };

  return sendJson(response, 200, { token: tokenFor(user), user });
}

export async function register(request, response) {
  const body = await readJson(request);
  if (!body.name || !body.email || !body.password || !body.role) {
    return sendJson(response, 400, {
      code: "VALIDATION_ERROR",
      message: "Name, email, password, and role are required",
    });
  }

  const user = { id: `${body.role}_${Date.now()}`, name: body.name, role: body.role };
  return sendJson(response, 201, { token: tokenFor(user), user });
}
