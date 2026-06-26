import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const isWindows = process.platform === "win32";
const npm = isWindows ? "npm.cmd" : "npm";
const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function startProcess(command, args, options = {}) {
  const child = spawn(command, args, {
    ...options,
    stdio: ["ignore", "pipe", "pipe"],
    shell: isWindows,
    windowsHide: true,
  });

  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);

  return child;
}

const processes = [
  startProcess("node", ["backend/src/server.mjs"], {
    cwd: projectRoot,
    env: { ...process.env, HOST: "127.0.0.1", PORT: process.env.API_PORT || "8787" },
  }),
  startProcess(npm, ["run", "dev"], {
    cwd: join(projectRoot, "frontend"),
    env: { ...process.env, VITE_API_TARGET: process.env.VITE_API_TARGET || "http://127.0.0.1:8787" },
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
