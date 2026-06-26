export function jsonHeaders() {
  return {
    "Access-Control-Allow-Headers": "Content-Type, X-Request-ID",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
    "Content-Type": "application/json; charset=utf-8",
  };
}

export function sendJson(response, status, payload) {
  response.writeHead(status, jsonHeaders());
  response.end(JSON.stringify(payload));
}

export async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

export function routeKey(request, url) {
  return `${request.method} ${url.pathname.replace(/^\/api/, "") || "/"}`;
}
