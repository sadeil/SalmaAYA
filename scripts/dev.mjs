import { spawn } from "node:child_process";

const isWindows = process.platform === "win32";
const npm = isWindows ? "npm.cmd" : "npm";

const processes = [
  spawn("node", ["backend/src/server.mjs"], {
    env: { ...process.env, HOST: "127.0.0.1", PORT: process.env.API_PORT || "8787" },
    stdio: "inherit",
  }),
  spawn(npm, ["run", "dev"], {
    cwd: "frontend",
    env: { ...process.env, VITE_API_TARGET: process.env.VITE_API_TARGET || "http://127.0.0.1:8787" },
    stdio: "inherit",
  }),
];

function shutdown(code = 0) {
  for (const child of processes) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

for (const child of processes) {
  child.on("exit", (code) => {
    if (code && code !== 0) shutdown(code);
  });
}
