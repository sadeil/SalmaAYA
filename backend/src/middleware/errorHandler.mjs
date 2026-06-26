import { sendJson } from "../utils/http.mjs";

export function handleError(response, error) {
  return sendJson(response, 500, {
    code: "SERVER_ERROR",
    message: error.message || "Unexpected server error",
  });
}
