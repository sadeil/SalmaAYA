import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const dist = join(process.cwd(), "frontend", "dist");
const expectedBase = process.env.VITE_BASE_PATH || "/SalmaAYA/";
const modelPath = join(dist, "models", "pose_landmarker_lite.task");
const wasmPath = join(dist, "mediapipe", "wasm", "vision_wasm_internal.wasm");
const source = await readFile(join(process.cwd(), "frontend", "src", "pose", "poseLandmarker.js"), "utf8");
const [model, wasm] = await Promise.all([stat(modelPath), stat(wasmPath)]);

if (!source.includes("import.meta.env.BASE_URL")) {
  throw new Error("MediaPipe asset URLs are not derived from Vite BASE_URL.");
}
if (expectedBase !== "/" && !expectedBase.startsWith("/")) {
  throw new Error(`Invalid GitHub Pages base path: ${expectedBase}`);
}
if (model.size < 1_000_000) {
  throw new Error(`Pose model is missing or truncated (${model.size} bytes).`);
}
if (wasm.size < 1_000_000) {
  throw new Error(`MediaPipe WASM is missing or truncated (${wasm.size} bytes).`);
}

console.log(`GitHub Pages pose assets verified: model ${model.size} bytes, WASM ${wasm.size} bytes, base ${expectedBase}`);
