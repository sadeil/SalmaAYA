// Back / posture analyzer.
//
// This exercise has no "rep" in the traditional sense — instead we score how
// long the user holds good upright posture in a 60-second observation window.
// One "rep" is awarded for every full 10 seconds of clean posture.
//
// Joints we track:
//   * Trunk deviation from vertical (mid-shoulder over mid-hip): should be
//     close to 0°. > 12° from vertical = "straighten your back".
//   * Shoulder symmetry: left and right shoulder y values should be close.
//     If their delta exceeds 6% of frame height we flag "keep shoulders level".
//   * Head forward posture: nose.x vs mid-shoulder.x. A nose forward by more
//     than ~8% of frame width relative to the shoulder centerline indicates
//     a forward-head posture.
//
// We also expose a `posture score` (0-100) computed from the above —
// FeedbackPanel renders it as a progress bar.

import { deviationFromVertical, midpoint } from "../utils/angle.js";
import { createEMA } from "../utils/smoothing.js";
import { getLandmark } from "../pose/landmarkUtils.js";

const REQUIRED = [
  "nose",
  "leftShoulder", "rightShoulder",
  "leftHip", "rightHip",
];

const TRUNK_LEAN_WARN = 12;
const SHOULDER_LEVEL_WARN = 0.06;
const FORWARD_HEAD_WARN = 0.08;
const CLEAN_HOLD_MS_PER_REP = 10000;

export const backStretchRules = {
  id: "backStretch",
  name: "Back / posture",
  description: "Sit or stand tall, shoulders relaxed, looking forward.",
  requiredLandmarks: REQUIRED,
  calibrationPrompt: "Find your tallest posture — chest open, shoulders back.",
  feedbackVocabulary: {
    straighten: "Straighten your back.",
    shouldersLevel: "Keep your shoulders level.",
    chinTuck: "Pull your chin gently back.",
    good: "Good posture — hold it.",
    leaning: "You're leaning to one side.",
  },

  createState() {
    return {
      trunkEMA: createEMA(0.25),
      shoulderDeltaEMA: createEMA(0.25),
      headForwardEMA: createEMA(0.25),
      calibration: null,
      cleanHoldMs: 0,
      lastFrameAt: 0,
      total: 0,
      correct: 0,
      mistakeBuckets: new Map(),
    };
  },

  calibrate(landmarks, state) {
    const trunk = trunkDeviation(landmarks);
    const shoulderDelta = shoulderYDelta(landmarks);
    const headForward = headForwardOffset(landmarks);
    if (trunk == null || shoulderDelta == null || headForward == null) return false;
    if (Math.abs(trunk) > 20) return false; // require near-upright start
    state.calibration = {
      trunkBaseline: trunk,
      shoulderBaseline: shoulderDelta,
      headBaseline: headForward,
    };
    return true;
  },

  analyze(landmarks, state, { now }) {
    const trunkRaw = trunkDeviation(landmarks);
    const shoulderRaw = shoulderYDelta(landmarks);
    const headRaw = headForwardOffset(landmarks);
    if (trunkRaw == null || shoulderRaw == null || headRaw == null || !state.calibration) {
      return { stage: "observing", mistakes: [], feedback: null };
    }

    const trunk = state.trunkEMA.push(trunkRaw - state.calibration.trunkBaseline);
    const shoulder = state.shoulderDeltaEMA.push(
      shoulderRaw - state.calibration.shoulderBaseline,
    );
    const head = state.headForwardEMA.push(
      headRaw - state.calibration.headBaseline,
    );

    const mistakes = [];
    let feedback = null;

    if (Math.abs(trunk) > TRUNK_LEAN_WARN) {
      mistakes.push("trunk leaning");
      feedback = Math.abs(trunk) > 18
        ? backStretchRules.feedbackVocabulary.leaning
        : backStretchRules.feedbackVocabulary.straighten;
    }
    if (Math.abs(shoulder) > SHOULDER_LEVEL_WARN) {
      mistakes.push("shoulders uneven");
      feedback = backStretchRules.feedbackVocabulary.shouldersLevel;
    }
    if (Math.abs(head) > FORWARD_HEAD_WARN) {
      mistakes.push("head forward");
      feedback = backStretchRules.feedbackVocabulary.chinTuck;
    }

    // Tally clean-hold time and credit reps for every full chunk.
    if (state.lastFrameAt > 0) {
      const dt = now - state.lastFrameAt;
      if (mistakes.length === 0) {
        state.cleanHoldMs += dt;
        if (state.cleanHoldMs >= CLEAN_HOLD_MS_PER_REP) {
          state.cleanHoldMs -= CLEAN_HOLD_MS_PER_REP;
          state.total += 1;
          state.correct += 1;
          feedback = backStretchRules.feedbackVocabulary.good;
        }
      } else {
        state.cleanHoldMs = Math.max(0, state.cleanHoldMs - dt);
        for (const m of mistakes) {
          state.mistakeBuckets.set(m, (state.mistakeBuckets.get(m) ?? 0) + 1);
        }
      }
    }
    state.lastFrameAt = now;

    const postureScore = Math.max(
      0,
      Math.round(
        100
          - Math.min(100, Math.abs(trunk) * 4)
          - Math.min(100, Math.abs(shoulder) * 600)
          - Math.min(100, Math.abs(head) * 400),
      ),
    );

    return {
      stage: mistakes.length === 0 ? "holding" : "correcting",
      mistakes,
      feedback,
      metrics: {
        trunk,
        shoulder,
        head,
        postureScore,
        holdProgress: state.cleanHoldMs / CLEAN_HOLD_MS_PER_REP,
      },
      repEvent: null,
    };
  },

  snapshot(state) {
    return {
      total: state.total,
      correct: state.correct,
      incorrect: state.total - state.correct,
      mistakes: Object.fromEntries(state.mistakeBuckets),
    };
  },

  reset(state) {
    state.trunkEMA.reset();
    state.shoulderDeltaEMA.reset();
    state.headForwardEMA.reset();
    state.calibration = null;
    state.cleanHoldMs = 0;
    state.lastFrameAt = 0;
    state.total = 0;
    state.correct = 0;
    state.mistakeBuckets.clear();
  },
};

function trunkDeviation(landmarks) {
  const midShoulder = midpoint(
    getLandmark(landmarks, "leftShoulder"),
    getLandmark(landmarks, "rightShoulder"),
  );
  const midHip = midpoint(
    getLandmark(landmarks, "leftHip"),
    getLandmark(landmarks, "rightHip"),
  );
  return deviationFromVertical(midShoulder, midHip);
}

function shoulderYDelta(landmarks) {
  const leftShoulder = getLandmark(landmarks, "leftShoulder");
  const rightShoulder = getLandmark(landmarks, "rightShoulder");
  if (!leftShoulder || !rightShoulder) return null;
  return leftShoulder.y - rightShoulder.y;
}

function headForwardOffset(landmarks) {
  const nose = getLandmark(landmarks, "nose");
  const midShoulder = midpoint(
    getLandmark(landmarks, "leftShoulder"),
    getLandmark(landmarks, "rightShoulder"),
  );
  if (!nose || !midShoulder) return null;
  return nose.x - midShoulder.x;
}
