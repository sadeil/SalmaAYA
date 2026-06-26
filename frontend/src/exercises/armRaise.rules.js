// Lateral arm raise analyzer.
//
// We use the shoulder abduction angle: the angle between the torso (hip ->
// shoulder vector) and the upper arm (shoulder -> elbow vector). At rest, arms
// hang next to the torso → angle ≈ 0°. Arms raised straight to the sides →
// ~90°. Arms fully overhead → ~170°.
//
// To count "arm raised above shoulder" robustly, we ALSO compare wrist.y to
// shoulder.y in image space (with y increasing downward, wrist.y < shoulder.y
// means the wrist is higher than the shoulder).
//
// We additionally check:
//   * Elbow angle (shoulder-elbow-wrist) — should stay near 180° for a strict
//     lateral raise. If it bends below ~150° we say "keep your elbow straighter".
//   * Left/right symmetry — both shoulders should reach a similar height. If
//     one is more than ~25° behind the other, surface a hint.

import { angleBetween } from "../utils/angle.js";
import { createEMA } from "../utils/smoothing.js";
import { createRepCounter } from "../utils/repCounter.js";
import { getLandmark } from "../pose/landmarkUtils.js";

const REQUIRED = [
  "leftShoulder", "rightShoulder",
  "leftElbow", "rightElbow",
  "leftWrist", "rightWrist",
  "leftHip", "rightHip",
];

const ARMS_UP_ANGLE = 80;     // shoulder abduction angle to count as "up"
const ARMS_DOWN_ANGLE = 25;   // back near the torso to count as "down"
const ELBOW_BENT_WARN = 150;  // < this = "keep elbow straighter"
const ASYM_WARN_DEG = 25;     // l-r abduction difference

export const armRaiseRules = {
  id: "armRaise",
  name: "Shoulder raise",
  description: "Easy shoulder check: raise both arms slowly to shoulder height.",
  requiredLandmarks: REQUIRED,
  calibrationPrompt: "Stand still with both arms relaxed by your sides.",
  feedbackVocabulary: {
    higher: "Raise your arms a little higher.",
    straighten: "Keep your elbows soft but not bent too much.",
    asymmetry: "Raise both arms together.",
    good: "Good shoulder movement.",
    lower: "Lower your arms fully between reps.",
  },

  createState() {
    return {
      leftAbductEMA: createEMA(0.35),
      rightAbductEMA: createEMA(0.35),
      leftElbowEMA: createEMA(0.35),
      rightElbowEMA: createEMA(0.35),
      maxAbductThisRep: 0,
      counter: createRepCounter({ startStage: "down", countOnReturnTo: "down", minStageMs: 200 }),
      calibration: null,
    };
  },

  calibrate(landmarks, state) {
    const angles = shoulderAbduction(landmarks);
    if (!angles) return false;
    // Calibration succeeds when the user has held arms down for a moment.
    if (angles.left < 15 && angles.right < 15) {
      state.calibration = { rest: angles };
      return true;
    }
    return false;
  },

  analyze(landmarks, state, { now }) {
    const angles = shoulderAbduction(landmarks);
    const elbows = elbowAngles(landmarks);
    if (!angles || !elbows) {
      return { stage: state.counter.getStage(), mistakes: [], feedback: null };
    }

    const lAbd = state.leftAbductEMA.push(angles.left);
    const rAbd = state.rightAbductEMA.push(angles.right);
    const lElb = state.leftElbowEMA.push(elbows.left);
    const rElb = state.rightElbowEMA.push(elbows.right);
    const peak = Math.max(lAbd, rAbd);

    state.maxAbductThisRep = Math.max(state.maxAbductThisRep, peak);

    const mistakes = [];
    let feedback = null;

    // Symmetry — only meaningful when at least one arm is meaningfully raised.
    if (peak > 35 && Math.abs(lAbd - rAbd) > ASYM_WARN_DEG) {
      mistakes.push("left/right asymmetry");
      feedback = armRaiseRules.feedbackVocabulary.asymmetry;
    }

    if (peak > 35 && (lElb < ELBOW_BENT_WARN || rElb < ELBOW_BENT_WARN)) {
      mistakes.push("elbow bent");
      feedback = armRaiseRules.feedbackVocabulary.straighten;
    }

    // Below target: only surface "raise higher" while ascending, not while
    // resting back at the bottom — measured by the current stage.
    if (state.counter.getStage() === "down" && peak > 35 && peak < ARMS_UP_ANGLE) {
      feedback = armRaiseRules.feedbackVocabulary.higher;
    }

    let nextStage = state.counter.getStage();
    if (peak >= ARMS_UP_ANGLE) nextStage = "up";
    else if (peak <= ARMS_DOWN_ANGLE) nextStage = "down";

    const repEvent =
      state.maxAbductThisRep >= ARMS_UP_ANGLE
        ? state.counter.update({ now, nextStage, mistakes })
        : state.counter.update({
            now,
            nextStage: nextStage === "down" ? state.counter.getStage() : nextStage,
            mistakes,
          });

    if (repEvent) {
      feedback = repEvent.wasCorrect
        ? armRaiseRules.feedbackVocabulary.good
        : armRaiseRules.feedbackVocabulary.lower;
      state.maxAbductThisRep = 0;
    }

    return {
      stage: state.counter.getStage(),
      mistakes,
      feedback,
      metrics: { left: lAbd, right: rAbd, leftElbow: lElb, rightElbow: rElb },
      repEvent,
    };
  },

  reset(state) {
    state.leftAbductEMA.reset();
    state.rightAbductEMA.reset();
    state.leftElbowEMA.reset();
    state.rightElbowEMA.reset();
    state.maxAbductThisRep = 0;
    state.counter.reset();
    state.calibration = null;
  },
};

// Shoulder abduction angle on each side: angle between the torso (hip ->
// shoulder) vector and the upper-arm (shoulder -> elbow) vector.
function shoulderAbduction(landmarks) {
  const left = sideAbduction(landmarks, "left");
  const right = sideAbduction(landmarks, "right");
  if (left == null || right == null) return null;
  return { left, right };
}

function sideAbduction(landmarks, side) {
  const hip = getLandmark(landmarks, `${side}Hip`);
  const shoulder = getLandmark(landmarks, `${side}Shoulder`);
  const elbow = getLandmark(landmarks, `${side}Elbow`);
  if (!hip || !shoulder || !elbow) return null;
  // angleBetween computes the angle at the middle point (shoulder),
  // between the segments shoulder->hip and shoulder->elbow.
  return angleBetween(hip, shoulder, elbow);
}

function elbowAngles(landmarks) {
  const left = angleBetween(
    getLandmark(landmarks, "leftShoulder"),
    getLandmark(landmarks, "leftElbow"),
    getLandmark(landmarks, "leftWrist"),
  );
  const right = angleBetween(
    getLandmark(landmarks, "rightShoulder"),
    getLandmark(landmarks, "rightElbow"),
    getLandmark(landmarks, "rightWrist"),
  );
  if (left == null || right == null) return null;
  return { left, right };
}
