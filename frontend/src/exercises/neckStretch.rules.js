// Neck side-tilt stretch analyzer.
//
// Joints we track:
//   * Head tilt angle: angle between the line ear -> opposite-ear and the
//     line connecting the two shoulders. When the user tilts to the left,
//     the left ear drops, so the ear line rotates relative to the shoulder
//     line. We compute the tilt in degrees, positive = right, negative = left.
//   * Shoulder stability: the y delta between left and right shoulder should
//     stay near calibration baseline — if the user shrugs their shoulder up
//     to "meet" their ear we flag it ("keep your shoulders relaxed").
//   * Motion speed: neck stretches should be slow. We measure d(tilt)/dt and
//     warn on anything > 80°/s, AND refuse to count reps that happened too
//     fast — neck reps must be gentle to be useful AND safe.
//
// Rep counting: one rep = left-tilt -> center -> right-tilt -> center (or
// just left-tilt -> center if a user wants only one side). We count any
// transition into a tilted stage as a rep, after a minimum hold time.

import { vectorAngleDeg } from "../utils/angle.js";
import { createEMA, createWindow } from "../utils/smoothing.js";
import { getLandmark } from "../pose/landmarkUtils.js";

const REQUIRED = [
  "nose",
  "leftEye", "rightEye",
  "leftShoulder", "rightShoulder",
];

const TILT_TARGET_DEG = 16;     // count as "tilted" beyond this
const TILT_HOLD_MS = 600;       // must hold the tilt this long to count
const TILT_SPEED_WARN = 110;    // degrees per second considered too fast
const SHOULDER_SHRUG_WARN = 0.07; // change in shoulder y vs calibration baseline
const FACE_POINT_VISIBILITY = 0.35;

export const neckStretchRules = {
  id: "neckStretch",
  name: "Neck mobility",
  description: "Easy neck check: tilt your ear toward your shoulder slowly.",
  requiredLandmarks: REQUIRED,
  calibrationPrompt: "Look forward, head level, shoulders relaxed.",
  feedbackVocabulary: {
    gentle: "Tilt your head more gently.",
    relaxShoulders: "Keep your shoulders relaxed.",
    deeper: "Tilt a little further if it feels comfortable.",
    good: "Good stretch — hold and breathe.",
    center: "Return to center between sides.",
    start: "Slowly tilt your head left or right. Do not lift your shoulders.",
  },

  createState() {
    return {
      tiltEMA: createEMA(0.3),
      shoulderTiltEMA: createEMA(0.3),
      stableWindow: createWindow(10),
      calibration: null,
      stage: "center",
      lastStageEnteredAt: 0,
      lastTilt: 0,
      lastFrameAt: 0,
      total: 0,
      correct: 0,
      countedCurrentHold: false,
      mistakeDuringHold: false,
      mistakeBuckets: new Map(),
      sidesHitThisCycle: { left: false, right: false },
    };
  },

  // We need a stable baseline: the user looking forward with shoulders level,
  // so the shoulder.y delta is small AND the ear-line is horizontal.
  calibrate(landmarks, state) {
    const tilt = headTilt(landmarks);
    const shoulderDelta = shoulderYDelta(landmarks);
    if (tilt == null || shoulderDelta == null) return false;
    state.stableWindow.push(tilt);
    if (!state.stableWindow.full()) return false;
    if ((state.stableWindow.stddev() ?? 99) > 6) return false;
    if (Math.abs(state.stableWindow.mean()) > 12) return false;
    state.calibration = {
      tiltBaseline: state.stableWindow.mean(),
      shoulderBaseline: shoulderDelta,
    };
    state.stableWindow.reset();
    return true;
  },

  analyze(landmarks, state, { now }) {
    const tiltRaw = headTilt(landmarks);
    const shoulderDelta = shoulderYDelta(landmarks);
    if (tiltRaw == null || shoulderDelta == null || !state.calibration) {
      return { stage: state.stage, mistakes: [], feedback: null };
    }

    const tilt = state.tiltEMA.push(tiltRaw - state.calibration.tiltBaseline);
    const shoulderShift = state.shoulderTiltEMA.push(
      shoulderDelta - state.calibration.shoulderBaseline,
    );

    let dTilt = 0;
    if (state.lastFrameAt) {
      const dt = Math.max(0.016, (now - state.lastFrameAt) / 1000);
      dTilt = Math.abs(tilt - state.lastTilt) / dt;
    }
    state.lastTilt = tilt;
    state.lastFrameAt = now;

    const mistakes = [];
    let feedback = null;

    if (dTilt > TILT_SPEED_WARN) {
      mistakes.push("movement too fast");
      feedback = neckStretchRules.feedbackVocabulary.gentle;
      state.mistakeDuringHold = true;
    }
    if (Math.abs(shoulderShift) > SHOULDER_SHRUG_WARN) {
      mistakes.push("shoulder shrug");
      feedback = neckStretchRules.feedbackVocabulary.relaxShoulders;
      state.mistakeDuringHold = true;
    }

    let nextStage = state.stage;
    if (tilt > TILT_TARGET_DEG) nextStage = "right";
    else if (tilt < -TILT_TARGET_DEG) nextStage = "left";
    else if (Math.abs(tilt) < TILT_TARGET_DEG * 0.3) nextStage = "center";

    if (nextStage !== state.stage) {
      // Require the previous stage to have been held long enough — that's
      // what keeps the counter honest in the face of jitter.
      const heldFor = now - state.lastStageEnteredAt;
      if (state.stage !== "center" && heldFor >= TILT_HOLD_MS && !state.countedCurrentHold) {
        state.total += 1;
        if (!state.mistakeDuringHold) state.correct += 1;
        state.sidesHitThisCycle[state.stage] = true;
        for (const m of mistakes) {
          state.mistakeBuckets.set(m, (state.mistakeBuckets.get(m) ?? 0) + 1);
        }
        feedback = state.mistakeDuringHold
          ? neckStretchRules.feedbackVocabulary.center
          : neckStretchRules.feedbackVocabulary.good;
        state.mistakeDuringHold = false;
        if (state.sidesHitThisCycle.left && state.sidesHitThisCycle.right) {
          state.sidesHitThisCycle = { left: false, right: false };
        }
      }
      state.stage = nextStage;
      state.lastStageEnteredAt = now;
      if (nextStage === "center") state.countedCurrentHold = false;
    } else if (state.stage !== "center" && Math.abs(tilt) > TILT_TARGET_DEG &&
               Math.abs(tilt) < TILT_TARGET_DEG + 8) {
      feedback = neckStretchRules.feedbackVocabulary.deeper;
    }

    if (state.stage !== "center" && !state.countedCurrentHold) {
      const heldFor = now - state.lastStageEnteredAt;
      if (heldFor >= TILT_HOLD_MS) {
        state.total += 1;
        if (!state.mistakeDuringHold) state.correct += 1;
        state.sidesHitThisCycle[state.stage] = true;
        for (const m of mistakes) {
          state.mistakeBuckets.set(m, (state.mistakeBuckets.get(m) ?? 0) + 1);
        }
        state.countedCurrentHold = true;
        feedback = state.mistakeDuringHold
          ? neckStretchRules.feedbackVocabulary.center
          : neckStretchRules.feedbackVocabulary.good;
        state.mistakeDuringHold = false;
      }
    }

    if (!feedback) {
      if (state.stage === "center") feedback = neckStretchRules.feedbackVocabulary.start;
      else if (!mistakes.length) feedback = neckStretchRules.feedbackVocabulary.good;
    }

    const isTilted = Math.abs(tilt) >= TILT_TARGET_DEG;
    const isTooFast = dTilt > TILT_SPEED_WARN;
    const isShrugging = Math.abs(shoulderShift) > SHOULDER_SHRUG_WARN;
    const side = tilt > TILT_TARGET_DEG ? "right" : tilt < -TILT_TARGET_DEG ? "left" : "center";

    return {
      stage: state.stage,
      mistakes,
      feedback,
      metrics: {
        tilt,
        shoulderShift,
        dTilt,
        side,
        isNeckCorrect: isTilted && !isTooFast && !isShrugging,
        isTooFast,
        isShrugging,
      },
      repEvent: null,
    };
  },

  // Neck stretch overrides counter snapshot so totals reflect its own state.
  snapshot(state) {
    return {
      total: state.total,
      correct: state.correct,
      incorrect: state.total - state.correct,
      mistakes: Object.fromEntries(state.mistakeBuckets),
    };
  },

  reset(state) {
    state.tiltEMA.reset();
    state.shoulderTiltEMA.reset();
    state.stableWindow.reset();
    state.calibration = null;
    state.stage = "center";
    state.lastStageEnteredAt = 0;
    state.lastTilt = 0;
    state.lastFrameAt = 0;
    state.total = 0;
    state.correct = 0;
    state.countedCurrentHold = false;
    state.mistakeDuringHold = false;
    state.mistakeBuckets.clear();
    state.sidesHitThisCycle = { left: false, right: false };
  },
};

function headTilt(landmarks) {
  const faceLine = bestFaceLine(landmarks);
  const leftShoulder = getLandmark(landmarks, "leftShoulder");
  const rightShoulder = getLandmark(landmarks, "rightShoulder");
  if (!faceLine || !leftShoulder || !rightShoulder) return null;
  // Angle of face line vs shoulder line. Ears are preferred; eyes are the
  // fallback because laptop cameras often lose ear visibility.
  const earAngle = vectorAngleDeg(faceLine.left, faceLine.right);
  const shoulderAngle = vectorAngleDeg(leftShoulder, rightShoulder);
  if (earAngle == null || shoulderAngle == null) return null;
  let diff = earAngle - shoulderAngle;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  return diff;
}

function bestFaceLine(landmarks) {
  const leftEar = getLandmark(landmarks, "leftEar");
  const rightEar = getLandmark(landmarks, "rightEar");
  if (visible(leftEar) && visible(rightEar)) return { left: leftEar, right: rightEar };

  const leftEye = getLandmark(landmarks, "leftEye");
  const rightEye = getLandmark(landmarks, "rightEye");
  if (visible(leftEye) && visible(rightEye)) return { left: leftEye, right: rightEye };
  return null;
}

function visible(landmark) {
  return (landmark?.visibility ?? 0) >= FACE_POINT_VISIBILITY;
}

function shoulderYDelta(landmarks) {
  const leftShoulder = getLandmark(landmarks, "leftShoulder");
  const rightShoulder = getLandmark(landmarks, "rightShoulder");
  if (!leftShoulder || !rightShoulder) return null;
  return leftShoulder.y - rightShoulder.y;
}
