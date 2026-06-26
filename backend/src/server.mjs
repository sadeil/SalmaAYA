import { createServer } from "node:http";
import { appConfig } from "./config/appConfig.mjs";
import { handleApi } from "./routes/apiRoutes.mjs";
import { serveStatic } from "./services/staticService.mjs";

createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (url.pathname.startsWith("/api")) return handleApi(request, response, url);
  return serveStatic(response, url);
}).listen(appConfig.port, appConfig.host, () => {
  console.log(`RemedyQuest server listening at http://${appConfig.host}:${appConfig.port}`);
});
