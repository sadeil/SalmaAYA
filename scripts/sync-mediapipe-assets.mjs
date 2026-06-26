import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourceDir = path.join(root, "node_modules", "@mediapipe", "tasks-vision", "wasm");
const targetDir = path.join(root, "frontend", "public", "mediapipe", "wasm");

const files = [
  "vision_wasm_internal.js",
  "vision_wasm_internal.wasm",
  "vision_wasm_module_internal.js",
  "vision_wasm_module_internal.wasm",
  "vision_wasm_nosimd_internal.js",
  "vision_wasm_nosimd_internal.wasm",
];

await mkdir(targetDir, { recursive: true });
await Promise.all(
  files.map((file) => copyFile(path.join(sourceDir, file), path.join(targetDir, file))),
);

console.log(`Synced MediaPipe WASM assets to ${path.relative(root, targetDir)}`);
