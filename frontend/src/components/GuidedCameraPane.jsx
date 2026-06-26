import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, Camera as CameraIcon } from "lucide-react";
import { CameraView } from "./CameraView";
import { PoseCanvas } from "./PoseCanvas";
import { createPoseLandmarker } from "../pose/poseLandmarker";
import { landmarkIndex } from "../pose/landmarkUtils";
import {
  averageVisibility,
  describeFramingIssue,
  missingLandmarks,
} from "../utils/visibilityCheck";
import { createFeedbackStabilizer } from "../utils/smoothing";

// Self-contained inline live-form-check view. Designed to drop into the left
// half of the existing GuidedExercise modal in place of the SVG demonstration.
// Mounts MediaPipe Pose Landmarker, runs the exercise's rule file frame-by-frame,
// surfaces skeleton overlay + coach feedback, and fires onRepCounted whenever
// the analyzer credits a rep so the parent's manual rep counter can advance.

const CALIBRATION_MIN_MS = 2500;
const CALIBRATION_TIMEOUT_MS = 12000;

export function GuidedCameraPane({ exercise, onRepCounted }) {
  const cameraRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const onRepRef = useRef(onRepCounted);
  onRepRef.current = onRepCounted;
  const sessionRef = useRef({
    exerciseState: null,
    feedbackStabilizer: createFeedbackStabilizer(4),
    calibrationStartedAt: null,
    lastReportedTotal: 0,
    lastRepEvent: null,
  });

  const [landmarks, setLandmarks] = useState(null);
  const [status, setStatus] = useState("initializing");
  const [framingMessage, setFramingMessage] = useState(null);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [liveFeedback, setLiveFeedback] = useState(null);

  const indexOf = useCallback((name) => landmarkIndex(name), []);

  // Boot MediaPipe once per mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const lm = await createPoseLandmarker();
        if (cancelled) {
          lm.close();
          return;
        }
        landmarkerRef.current = lm;
        setStatus("framing");
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setFramingMessage(err.message || "Could not load pose model.");
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, []);

  // Reset analyzer state whenever the selected exercise rule changes.
  useEffect(() => {
    if (!exercise) return;
    sessionRef.current.exerciseState = exercise.createState();
    sessionRef.current.feedbackStabilizer.reset();
    sessionRef.current.calibrationStartedAt = null;
    sessionRef.current.lastReportedTotal = 0;
    sessionRef.current.lastRepEvent = null;
    setCalibrationProgress(0);
    setLiveFeedback(null);
    setStatus((current) => (current === "initializing" || current === "error" ? current : "framing"));
  }, [exercise]);

  // Detection loop. We deliberately keep this in one rAF rather than wiring
  // each piece through React state — the loop must hit ~30fps without churn.
  useEffect(() => {
    const cancel = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };

    const tick = () => {
      const video = cameraRef.current?.videoElement;
      const lm = landmarkerRef.current;
      const ex = exercise;
      if (!video || !lm || !ex) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const now = performance.now();
      let detection = null;
      try {
        detection = lm.detect(video, now);
      } catch (err) {
        console.error(err);
      }
      const detected = detection?.landmarks ?? null;
      setLandmarks(detected);

      const framing = describeFramingIssue(detected, indexOf);
      const missing = detected
        ? missingLandmarks(detected, ex.requiredLandmarks, indexOf)
        : ex.requiredLandmarks.slice();
      const requiredConfidence =
        detected ? averageVisibility(detected, ex.requiredLandmarks, indexOf) : 0;
      setConfidence(requiredConfidence);

      setStatus((current) => {
        const exerciseState = sessionRef.current.exerciseState;
        if (current === "initializing" || current === "error") return current;

        if (framing || missing.length > 0) {
          setFramingMessage(framing ?? `Make sure these are visible: ${missing.join(", ")}`);
          if (current === "running" || current === "calibrating") return current;
          return "framing";
        }
        setFramingMessage(null);

        // Auto-progress from "framing" → "calibrating" once landmarks are good.
        if (current === "framing") {
          sessionRef.current.calibrationStartedAt = now;
          return "calibrating";
        }

        if (current === "calibrating" && exerciseState && detected) {
          const startedAt = sessionRef.current.calibrationStartedAt ?? now;
          sessionRef.current.calibrationStartedAt = startedAt;
          const elapsed = now - startedAt;
          const ruleReady = ex.calibrate(detected, exerciseState);
          const minElapsed = Math.min(1, elapsed / CALIBRATION_MIN_MS);
          setCalibrationProgress(ruleReady ? Math.max(0.6, minElapsed) : minElapsed * 0.6);
          if (ruleReady && elapsed >= CALIBRATION_MIN_MS) {
            sessionRef.current.calibrationStartedAt = null;
            setCalibrationProgress(1);
            return "running";
          }
          if (elapsed > CALIBRATION_TIMEOUT_MS) {
            setFramingMessage("Couldn't calibrate — hold the starting position for a moment.");
            sessionRef.current.calibrationStartedAt = null;
            setCalibrationProgress(0);
            return "framing";
          }
          return current;
        }

        if (current === "running" && exerciseState && detected) {
          if (requiredConfidence < 0.5) return current;
          const result = ex.analyze(detected, exerciseState, { now });
          if (result?.repEvent) sessionRef.current.lastRepEvent = result.repEvent;
          const stableFeedback = sessionRef.current.feedbackStabilizer.push(result?.feedback ?? null);
          if (stableFeedback) setLiveFeedback(stableFeedback);
          const snapshot = ex.snapshot
            ? ex.snapshot(exerciseState)
            : exerciseState.counter?.snapshot?.();
          if (snapshot && snapshot.total > sessionRef.current.lastReportedTotal) {
            const delta = snapshot.total - sessionRef.current.lastReportedTotal;
            sessionRef.current.lastReportedTotal = snapshot.total;
            const wasCorrect =
              sessionRef.current.lastRepEvent?.wasCorrect ??
              (snapshot.correct === snapshot.total);
            for (let i = 0; i < delta; i += 1) {
              onRepRef.current?.({ wasCorrect, snapshot });
            }
          }
        }
        return current;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return cancel;
  }, [exercise, indexOf]);

  return (
    <div className="relative h-full min-h-[420px] w-full overflow-hidden rounded-l-[2rem] bg-ink">
      <CameraView ref={cameraRef} className="absolute inset-0" />
      <PoseCanvas landmarks={landmarks} mirror />

      <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
        <span className="pill bg-white/90 text-teal-700 shadow-card">
          <Activity size={14} />
          {STATUS_LABEL[status] ?? "Live"}
        </span>
        <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-extrabold text-slate-600 shadow-card">
          <CameraIcon size={11} className="me-1 inline" />
          {Math.round(confidence * 100)}% visible
        </span>
      </div>

      {status === "calibrating" && (
        <div className="absolute inset-x-6 top-14 rounded-2xl bg-white/90 p-3 text-center shadow-card backdrop-blur">
          <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-blue-600">
            Calibrating
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {exercise?.calibrationPrompt ?? "Hold the starting position."}
          </p>
          <div className="mx-auto mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-[width] duration-200"
              style={{ width: `${Math.round(calibrationProgress * 100)}%` }}
            />
          </div>
        </div>
      )}

      {framingMessage && status !== "running" && (
        <div className="absolute inset-x-6 top-14 rounded-2xl border border-amber-200 bg-amber-50/95 p-3 text-center text-xs font-semibold text-amber-800 shadow-card">
          {framingMessage}
        </div>
      )}

      {liveFeedback && status === "running" && (
        <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-ink/85 p-3 text-center text-white shadow-lg backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
            Coach
          </p>
          <p className="mt-0.5 text-sm font-extrabold">{liveFeedback}</p>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 grid place-items-center bg-ink/85 text-center text-white">
          <div className="max-w-xs px-6">
            <p className="text-sm font-extrabold text-rose-200">Camera form check unavailable</p>
            <p className="mt-2 text-xs text-white/70">{framingMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_LABEL = {
  initializing: "Loading…",
  framing: "Adjust framing",
  calibrating: "Calibrating",
  running: "Live form check",
  error: "Error",
};
