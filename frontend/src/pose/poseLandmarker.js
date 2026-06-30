import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

// MediaPipe is bundled from npm. The WASM files and pose model are served from
// frontend/public so the form coach does not depend on jsDelivr at runtime.
const PUBLIC_BASE = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;
const WASM_ROOT = `${PUBLIC_BASE}mediapipe/wasm`;
const MODEL_URL = `${PUBLIC_BASE}models/pose_landmarker_lite.task`;

let filesetPromise = null;
function loadFileset() {
  if (!filesetPromise) {
    filesetPromise = FilesetResolver.forVisionTasks(WASM_ROOT).catch((err) => {
      filesetPromise = null;
      throw new Error(
        `Failed to load local MediaPipe assets (${err.message}). ` +
        "Run npm install and make sure frontend/public/mediapipe/wasm exists.",
      );
    });
  }
  return filesetPromise;
}

export async function createPoseLandmarker({
  modelUrl = MODEL_URL,
  numPoses = 1,
  minDetectionConfidence = 0.6,
  minPresenceConfidence = 0.6,
  minTrackingConfidence = 0.6,
} = {}) {
  const filesetResolver = await loadFileset();
  const options = {
    baseOptions: { modelAssetPath: modelUrl, delegate: "GPU" },
    runningMode: "VIDEO",
    numPoses,
    minPoseDetectionConfidence: minDetectionConfidence,
    minPosePresenceConfidence: minPresenceConfidence,
    minTrackingConfidence,
    outputSegmentationMasks: false,
  };

  let landmarker;
  try {
    landmarker = await PoseLandmarker.createFromOptions(filesetResolver, options);
  } catch (gpuError) {
    console.warn(`MediaPipe GPU initialization failed; using CPU (${gpuError.message}).`);
    landmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
      ...options,
      baseOptions: { modelAssetPath: modelUrl, delegate: "CPU" },
    });
  }

  let lastTimestampMs = -1;
  return {
    detect(videoElement, timestampMs) {
      if (!videoElement || videoElement.readyState < 2) return null;
      const ts = Math.max(timestampMs, lastTimestampMs + 1);
      lastTimestampMs = ts;
      const result = landmarker.detectForVideo(videoElement, ts);
      return {
        landmarks: result.landmarks?.[0] ?? null,
        worldLandmarks: result.worldLandmarks?.[0] ?? null,
      };
    },
    close() {
      try {
        landmarker.close();
      } catch {
        // already closed
      }
    },
  };
}
