import { sendJson } from "../utils/http.mjs";
import { databaseStatus } from "../config/database.mjs";

export function healthCheck(_request, response) {
  return sendJson(response, 200, {
    status: "ok",
    service: "RemedyQuest API",
    database: databaseStatus(),
    checkedAt: new Date().toISOString(),
  });
}
