import { patients } from "../models/appStore.mjs";
import { sendJson } from "../utils/http.mjs";

export function patientList(_request, response) {
  return sendJson(response, 200, patients);
}

export function approvePlan(_request, response, match) {
  const patient = patients.find((item) => item.id === Number(match[1]));
  if (!patient) return sendJson(response, 404, { code: "NOT_FOUND", message: "Patient not found" });

  patient.status = "Approved";
  return sendJson(response, 200, patient);
}
