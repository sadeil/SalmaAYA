import { dashboard as adminDashboard, databaseSnapshot } from "../controllers/adminController.mjs";
import { login, register } from "../controllers/authController.mjs";
import { approvePlan, patientList } from "../controllers/doctorController.mjs";
import { createSession, listSessions } from "../controllers/formCheckController.mjs";
import { healthCheck } from "../controllers/healthController.mjs";
import {
  createMessage,
  dashboard as patientDashboard,
  exerciseList,
  messageList,
} from "../controllers/patientController.mjs";
import { handleError } from "../middleware/errorHandler.mjs";
import { routeKey, sendJson } from "../utils/http.mjs";

export async function handleApi(request, response, url) {
  if (request.method === "OPTIONS") return sendJson(response, 204, {});

  const route = routeKey(request, url);

  try {
    if (route === "GET /health") return healthCheck(request, response);
    if (route === "POST /auth/login") return login(request, response);
    if (route === "POST /auth/register") return register(request, response);
    if (route === "GET /patient/dashboard") return patientDashboard(request, response);
    if (route === "GET /patient/exercises") return exerciseList(request, response);
    if (route === "GET /patient/messages") return messageList(request, response);
    if (route === "POST /patient/messages") return createMessage(request, response);
    if (route === "POST /patient/sessions") return createSession(request, response);
    if (route === "GET /patient/sessions") return listSessions(request, response);
    if (route === "GET /doctor/patients") return patientList(request, response);
    if (route === "GET /admin/dashboard") return adminDashboard(request, response);
    if (route === "GET /admin/database") return databaseSnapshot(request, response);

    const patientPlanMatch = route.match(/^PATCH \/doctor\/patients\/(\d+)\/plan$/);
    if (patientPlanMatch) return approvePlan(request, response, patientPlanMatch);

    return sendJson(response, 404, { code: "NOT_FOUND", message: `No API route for ${route}` });
  } catch (error) {
    return handleError(response, error);
  }
}
