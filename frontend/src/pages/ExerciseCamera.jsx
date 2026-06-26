import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "../components/UI";
import { CameraView } from "../components/CameraView";
import { PoseCanvas } from "../components/PoseCanvas";
import { FeedbackPanel } from "../components/FeedbackPanel";
import { ExerciseSelector } from "../components/ExerciseSelector";
import { FormCoachAvatar } from "../components/FormCoachAvatar";
import { exerciseRegistry, getExerciseById } from "../exercises";
import { createPoseLandmarker } from "../pose/poseLandmarker";
import { landmarkIndex } from "../pose/landmarkUtils";
import {
  averageVisibility,
  describeFramingIssue,
  missingLandmarks,
} from "../utils/visibilityCheck";
import { createFeedbackStabilizer } from "../utils/smoothing";
import { api } from "../services/api";

// Calibration must run for at least this long, even if the rule file says it's
// ready earlier — gives the user a moment to settle.
const CALIBRATION_MIN_MS = 2500;
// Max time we wait for calibration before bailing back to "framing" state.
const CALIBRATION_TIMEOUT_MS = 12000;
const TARGET_REPS = 5;

// Mapping of the high-level status the FeedbackPanel renders.
const STATUS = {
  IDLE: "idle",
  INITIALIZING: "initializing",
  FRAMING: "framing",
  CALIBRATING: "calibrating",
  RUNNING: "running",
  FINISHED: "finished",
  ERROR: "error",
};

const UPPER_BODY_EXERCISES = new Set(["neckStretch", "armRaise", "elbowBend", "backStretch"]);

function describeExerciseFramingIssue(landmarks, exercise, indexOf) {
  if (!UPPER_BODY_EXERCISES.has(exercise?.id)) {
    return describeFramingIssue(landmarks, indexOf);
  }
  if (!landmarks || landmarks.length === 0) {
    return "No person detected. Sit or stand in front of the camera.";
  }
  const nose = landmarks[indexOf("nose")];
  const leftShoulder = landmarks[indexOf("leftShoulder")];
  const rightShoulder = landmarks[indexOf("rightShoulder")];
  const visible = (lm) => (lm?.visibility ?? 0) >= 0.45;
  if (!visible(nose) || !visible(leftShoulder) || !visible(rightShoulder)) {
    return "Make sure your face and both shoulders are visible.";
  }
  if ((nose?.y ?? 1) < 0.04) {
    return "Move back a little so your head is not cut off.";
  }
  if (Math.abs((leftShoulder?.y ?? 0) - (rightShoulder?.y ?? 0)) > 0.16) {
    return "Face the camera straight on and keep both shoulders visible.";
  }
  return null;
}

function getExerciseSnapshot(exercise, exerciseState) {
  return exercise.snapshot
    ? exercise.snapshot(exerciseState)
    : exerciseState.counter?.snapshot?.() ?? { total: 0, correct: 0, mistakes: {} };
}

export default function ExerciseCamera() {
  const cameraRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const stateRef = useRef({
    exerciseState: null,
    feedbackStabilizer: createFeedbackStabilizer(4),
    sessionStartedAt: null,
    calibrationStartedAt: null,
    autoFinishing: false,
  });

  const [selectedId, setSelectedId] = useState(exerciseRegistry[0].id);
  const [status, setStatus] = useState(STATUS.IDLE);
  const [landmarks, setLandmarks] = useState(null);
  const [framingMessage, setFramingMessage] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [liveFeedback, setLiveFeedback] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [reps, setReps] = useState({ total: 0, correct: 0, mistakes: {} });
  const [finalSummary, setFinalSummary] = useState(null);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [saveStatus, setSaveStatus] = useState(null);

  const exercise = useMemo(() => getExerciseById(selectedId), [selectedId]);
  const indexOf = useCallback((name) => landmarkIndex(name), []);

  // Resets all per-session state when the user switches exercise or starts over.
  const resetExerciseState = useCallback(() => {
    if (!exercise) return;
    const fresh = exercise.createState();
    stateRef.current.exerciseState = fresh;
    stateRef.current.feedbackStabilizer.reset();
    stateRef.current.sessionStartedAt = null;
    stateRef.current.calibrationStartedAt = null;
    stateRef.current.autoFinishing = false;
    setReps({ total: 0, correct: 0, mistakes: {} });
    setFinalSummary(null);
    setLiveFeedback(null);
    setMetrics(null);
    setCalibrationProgress(0);
    setElapsedMs(0);
  }, [exercise]);

  useEffect(() => {
    resetExerciseState();
  }, [resetExerciseState]);

  const ensureLandmarker = useCallback(async () => {
    if (landmarkerRef.current) return true;

    try {
      setStatus(STATUS.INITIALIZING);
      const landmarker = await createPoseLandmarker();
      landmarkerRef.current = landmarker;
      setStatus(STATUS.FRAMING);
      return true;
    } catch (err) {
      setFramingMessage(err.message || "Could not load pose model.");
      setStatus(STATUS.ERROR);
      return false;
    }
  }, []);

  // Keep the MediaPipe handle alive for the page lifetime once the user starts
  // the coach, and close it when leaving the page.
  useEffect(() => {
    return () => {
      const lm = landmarkerRef.current;
      if (lm) lm.close();
      landmarkerRef.current = null;
    };
  }, []);

  // Detection + analysis loop. We keep the running flag in a ref so the
  // callback closure stays stable, and we only mutate React state when the
  // values change meaningfully.
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
      let result = null;
      try {
        result = lm.detect(video, now);
      } catch (err) {
        console.error(err);
      }
      const detected = result?.landmarks ?? null;
      setLandmarks(detected);

      const framing = describeExerciseFramingIssue(detected, ex, indexOf);
      const missing = detected
        ? missingLandmarks(detected, ex.requiredLandmarks, indexOf)
        : ex.requiredLandmarks.slice();
      const requiredConfidence =
        detected ? averageVisibility(detected, ex.requiredLandmarks, indexOf) : 0;
      setConfidence(requiredConfidence);

      // Driven by `status`, not by status state from React closure: we read
      // it through stateRef-adjacent setters to avoid stale closures.
      setStatus((current) => {
        const exerciseState = stateRef.current.exerciseState;
        if (current === STATUS.INITIALIZING || current === STATUS.ERROR || current === STATUS.FINISHED) {
          return current;
        }

        // ---- Framing gate ----
        if (framing || missing.length > 0) {
          setFramingMessage(framing ?? `Make sure these are visible: ${missing.join(", ")}`);
          if (current === STATUS.RUNNING || current === STATUS.CALIBRATING) {
            // Don't lose progress — just pause feedback and wait for re-framing.
            return current;
          }
          return STATUS.FRAMING;
        }
        setFramingMessage(null);

        // ---- Calibrating ----
        if (current === STATUS.CALIBRATING && exerciseState && detected) {
          const startedAt = stateRef.current.calibrationStartedAt ?? now;
          stateRef.current.calibrationStartedAt = startedAt;
          const elapsed = now - startedAt;
          const ruleReady = ex.calibrate(detected, exerciseState);
          const minElapsed = Math.min(1, elapsed / CALIBRATION_MIN_MS);
          setCalibrationProgress(ruleReady ? Math.max(0.6, minElapsed) : minElapsed * 0.6);
          if (ruleReady && elapsed >= CALIBRATION_MIN_MS) {
            stateRef.current.sessionStartedAt = now;
            stateRef.current.calibrationStartedAt = null;
            setCalibrationProgress(1);
            return STATUS.RUNNING;
          }
          if (elapsed > CALIBRATION_TIMEOUT_MS) {
            // Calibration kept failing. Drop back to framing with a hint.
            setFramingMessage("Couldn't calibrate — try standing in the starting position and stay still.");
            stateRef.current.calibrationStartedAt = null;
            setCalibrationProgress(0);
            return STATUS.FRAMING;
          }
          return current;
        }

        // ---- Running analysis ----
        if (current === STATUS.RUNNING && exerciseState && detected) {
          if (requiredConfidence < 0.5) {
            // Drop feedback while landmarks are too noisy, but stay in RUNNING.
            return current;
          }
          const result = ex.analyze(detected, exerciseState, { now });
          if (result?.metrics) setMetrics(result.metrics);
          const stableFeedback = stateRef.current.feedbackStabilizer.push(result?.feedback ?? null);
          if (stableFeedback) setLiveFeedback(stableFeedback);
          // Pull rep numbers from rule file if it owns its own counters,
          // otherwise from the generic counter inside its state.
          const snapshot = ex.snapshot
            ? ex.snapshot(exerciseState)
            : exerciseState.counter?.snapshot?.();
          if (snapshot) setReps(snapshot);
          const elapsed = now - (stateRef.current.sessionStartedAt ?? now);
          setElapsedMs(elapsed);
        }
        return current;
      });

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return cancel;
  }, [exercise, indexOf]);

  // Save the final session to the backend. We never send raw video — only the
  // aggregated counters and the elapsed time.
  const persistSession = useCallback(async () => {
    const exerciseState = stateRef.current.exerciseState;
    if (!exercise || !exerciseState) return;
    const snapshot = getExerciseSnapshot(exercise, exerciseState);
    setFinalSummary(snapshot);
    setReps(snapshot);
    const finishedAt = new Date();
    const payload = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      durationMs: elapsedMs,
      totalReps: snapshot.total,
      correctReps: snapshot.correct,
      targetReps: TARGET_REPS,
      completed: snapshot.total >= TARGET_REPS,
      mistakes: snapshot.mistakes,
      endedAt: finishedAt.toISOString(),
      startedAt: new Date(finishedAt.getTime() - elapsedMs).toISOString(),
    };
    setSaveStatus("saving");
    try {
      await api.saveSession(payload);
      setSaveStatus("saved");
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    }
  }, [exercise, elapsedMs]);

  const startSession = useCallback(async () => {
    if (!exercise) return;
    setSaveStatus(null);
    resetExerciseState();
    const ready = await ensureLandmarker();
    if (ready) setStatus(STATUS.CALIBRATING);
  }, [ensureLandmarker, exercise, resetExerciseState]);

  const endSession = useCallback(async () => {
    setStatus(STATUS.FINISHED);
    await persistSession();
  }, [persistSession]);

  useEffect(() => {
    if (status !== STATUS.RUNNING) return;
    if ((reps.total ?? 0) < TARGET_REPS) return;
    if (stateRef.current.autoFinishing) return;
    stateRef.current.autoFinishing = true;
    setLiveFeedback(`Great work. You completed ${TARGET_REPS} reps.`);
    endSession();
  }, [endSession, reps.total, status]);

  const handleSelect = useCallback(
    (id) => {
      if (status === STATUS.RUNNING || status === STATUS.CALIBRATING) return;
      setSelectedId(id);
      setStatus(landmarkerRef.current ? STATUS.FRAMING : STATUS.IDLE);
      setSaveStatus(null);
    },
    [status],
  );

  const displayStatus = finalSummary ? STATUS.FINISHED : status;
  const displayReps = finalSummary?.total ?? reps.total;
  const displayCorrectReps = finalSummary?.correct ?? reps.correct;
  const displayMistakes = finalSummary?.mistakes ?? reps.mistakes;

  return (
    <>
      <PageHeader
        eyebrow="Form check"
        title="AI exercise form coach"
        description="Real-time guidance via your camera. Your video never leaves this device — only the session summary is saved."
        action={
          <span className="pill bg-teal-50 text-teal-700">
            <ShieldCheck size={14} />
            Privacy-safe
          </span>
        }
      />

      <ExerciseSelector
        exercises={exerciseRegistry}
        selectedId={selectedId}
        onSelect={handleSelect}
        disabled={status === STATUS.RUNNING || status === STATUS.CALIBRATING}
      />

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.88fr)]">
        <div className="space-y-5" data-testid="form-camera-column">
          <div className="card overflow-hidden p-0" data-testid="form-camera-card">
          <div className="relative aspect-video w-full">
            <div className="absolute inset-0">
              <CameraView ref={cameraRef} className="h-full w-full" />
            </div>
            <PoseCanvas landmarks={landmarks} mirror />
            {status === STATUS.CALIBRATING && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-4 text-center text-white">
                <p className="text-sm font-extrabold">Hold still while we calibrate…</p>
                <p className="text-xs text-white/70">{exercise?.calibrationPrompt}</p>
              </div>
            )}
            {displayStatus === STATUS.FINISHED && (
              <div className="absolute inset-0 grid place-items-center bg-ink/70 text-center text-white">
                <div className="max-w-sm px-6">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">
                    Session summary
                  </p>
                  <p className="mt-2 text-2xl font-extrabold">
                    <span className="inline-block" dir="ltr">
                      {Math.min(finalSummary?.total ?? reps.total ?? 0, TARGET_REPS)} / {TARGET_REPS}
                    </span>{" "}
                    counted reps
                  </p>
                  <p className="mt-1 text-sm font-bold text-teal-100">
                    <span className="inline-block" dir="ltr">
                      {finalSummary?.correct ?? reps.correct ?? 0}
                    </span>{" "}
                    good reps
                  </p>
                  <p className="mt-1 text-sm text-white/70">
                    {Math.round(elapsedMs / 1000)} seconds
                  </p>
                  <p className="mt-4 text-xs text-white/60">
                    {saveStatus === "saving" && "Saving your session…"}
                    {saveStatus === "saved" && "Session saved to your history."}
                    {saveStatus === "error" && "Couldn't save the session — your reps are still tracked locally."}
                  </p>
                  <button onClick={startSession} className="btn-primary mt-5">
                    Start a new session
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>

          <div data-testid="form-feedback-panel">
            <FeedbackPanel
              exercise={exercise}
              status={displayStatus}
              framingMessage={framingMessage}
              calibrationProgress={calibrationProgress}
              confidence={confidence}
              reps={displayReps}
              correctReps={displayCorrectReps}
              targetReps={TARGET_REPS}
              liveFeedback={liveFeedback}
              mistakes={displayMistakes}
              metrics={metrics}
              elapsedMs={elapsedMs}
              onStart={startSession}
              onStop={endSession}
            />
          </div>
        </div>

        <FormCoachAvatar
          exercise={exercise}
          status={displayStatus}
          feedback={liveFeedback}
          framingMessage={framingMessage}
          metrics={metrics}
          reps={displayReps}
          targetReps={TARGET_REPS}
        />
      </div>
    </>
  );
}
