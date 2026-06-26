// Lunge analyzer.
//
// We focus on the FRONT leg (closer to the camera). MediaPipe gives us a single
// pose, so we infer the front leg by whichever knee is more bent during the
// "down" phase — the back leg stays straight by definition.
//
// Joints we track:
//   * Front knee angle (hip-knee-ankle): should reach ~90° at the bottom.
//   * Back knee angle: should also bend (~90-110°) — if it stays straight the
//     user is doing a static split stance instead of a lunge ("bend your back knee").
//   * Trunk lean: torso should stay roughly vertical. Forward lean > 25° from
//     vertical is a posture mistake.
//   * Front knee over front toe: the front knee x should not travel far past
//     the front toe x — that puts strain on the patella.

import { angleBetween, deviationFromVertical, midpoint } from "../utils/angle.js";
import { createEMA, createWindow } from "../utils/smoothing.js";
import { createRepCounter } from "../utils/repCounter.js";
import { getLandmark } from "../pose/landmarkUtils.js";

const REQUIRED = [
  "leftShoulder", "rightShoulder",
  "leftHip", "rightHip",
  "leftKnee", "rightKnee",
  "leftAnkle", "rightAnkle",
  "leftFootIndex", "rightFootIndex",
];

const STANDING_KNEE_ANGLE = 160;
const TARGET_FRONT_KNEE_ANGLE = 100;
const SHALLOW_WARN_ANGLE = 130;
const BACK_KNEE_BEND_WARN = 150; // back knee should bend below this at bottom
const TRUNK_LEAN_WARN_DEG = 25;
const KNEE_OVER_TOE_LIMIT = 0.05; // normalized x

export const lungeRules = {
  id: "lunge",
  name: "Lunge",
  description: "Step one foot forward, keep your torso tall, drop straight down.",
  requiredLandmarks: REQUIRED,
  calibrationPrompt: "Stand tall with feet together, facing the camera.",
  feedbackVocabulary: {
    goLower: "Bend your front knee more.",
    bendBack: "Bend your back knee — lower your hips straight down.",
    keepTrunkUp: "Keep your chest tall.",
    kneeOverToe: "Don't let your front knee pass your toes.",
    good: "Good lunge — nice control.",
    standTall: "Return to standing before the next rep.",
  },

  createState() {
    return {
      frontKneeEMA: createEMA(0.3),
      backKneeEMA: createEMA(0.3),
      trunkEMA: createEMA(0.3),
      stabilityWindow: createWindow(8),
      deepestFrontKnee: 180,
      backKneeAtBottom: 180,
      counter: createRepCounter({ startStage: "up", countOnReturnTo: "up" }),
      calibration: null,
    };
  },

  calibrate(landmarks, state) {
    const leftKnee = angleBetween(
      getLandmark(landmarks, "leftHip"),
      getLandmark(landmarks, "leftKnee"),
      getLandmark(landmarks, "leftAnkle"),
    );
    const rightKnee = angleBetween(
      getLandmark(landmarks, "rightHip"),
      getLandmark(landmarks, "rightKnee"),
      getLandmark(landmarks, "rightAnkle"),
    );
    if (leftKnee == null || rightKnee == null) return false;
    state.stabilityWindow.push((leftKnee + rightKnee) / 2);
    if (!state.stabilityWindow.full()) return false;
    if ((state.stabilityWindow.stddev() ?? 99) > 3) return false;
    state.calibration = {
      standingKnee: state.stabilityWindow.mean(),
    };
    state.stabilityWindow.reset();
    return true;
  },

  analyze(landmarks, state, { now }) {
    const left = legAngles(landmarks, "left");
    const right = legAngles(landmarks, "right");
    if (!left || !right) {
      return { stage: state.counter.getStage(), mistakes: [], feedback: null };
    }

    // The "front" leg is the more bent of the two during the descent.
    const frontIsLeft = left.knee < right.knee;
    const front = frontIsLeft ? left : right;
    const back = frontIsLeft ? right : left;
    const frontSide = frontIsLeft ? "left" : "right";

    const frontKnee = state.frontKneeEMA.push(front.knee);
    const backKnee = state.backKneeEMA.push(back.knee);
    const trunk = state.trunkEMA.push(Math.abs(trunkDeviation(landmarks) ?? 0));

    state.deepestFrontKnee = Math.min(state.deepestFrontKnee, frontKnee);
    if (frontKnee < SHALLOW_WARN_ANGLE) {
      state.backKneeAtBottom = Math.min(state.backKneeAtBottom, backKnee);
    }

    const mistakes = [];
    let feedback = null;

    if (frontKnee < STANDING_KNEE_ANGLE && frontKnee > TARGET_FRONT_KNEE_ANGLE && frontKnee <= SHALLOW_WARN_ANGLE) {
      mistakes.push("front knee not bent enough");
      feedback = lungeRules.feedbackVocabulary.goLower;
    }

    if (frontKnee < SHALLOW_WARN_ANGLE && backKnee > BACK_KNEE_BEND_WARN) {
      mistakes.push("back knee too straight");
      feedback = lungeRules.feedbackVocabulary.bendBack;
    }

    if (trunk > TRUNK_LEAN_WARN_DEG) {
      mistakes.push("torso leaning forward");
      feedback = lungeRules.feedbackVocabulary.keepTrunkUp;
    }

    // Knee-over-toe: only meaningful when the user is actually down.
    if (frontKnee < SHALLOW_WARN_ANGLE) {
      const knee = getLandmark(landmarks, `${frontSide}Knee`);
      const toe = getLandmark(landmarks, `${frontSide}FootIndex`);
      if (knee && toe) {
        // Front-facing user: toe is "below" knee in screen y. We only flag if
        // the knee x has moved significantly past the toe x in the direction
        // the foot is pointing — we approximate "forward" as same side of toe.
        const overshoot = frontSide === "left"
          ? knee.x - toe.x
          : toe.x - knee.x;
        if (overshoot > KNEE_OVER_TOE_LIMIT) {
          mistakes.push("front knee past toes");
          feedback = lungeRules.feedbackVocabulary.kneeOverToe;
        }
      }
    }

    let nextStage = state.counter.getStage();
    if (frontKnee >= STANDING_KNEE_ANGLE) nextStage = "up";
    else if (frontKnee <= TARGET_FRONT_KNEE_ANGLE) nextStage = "down";

    const repEvent =
      state.deepestFrontKnee <= TARGET_FRONT_KNEE_ANGLE
        ? state.counter.update({ now, nextStage, mistakes })
        : state.counter.update({
            now,
            nextStage: nextStage === "up" ? state.counter.getStage() : nextStage,
            mistakes,
          });

    if (repEvent) {
      feedback = repEvent.wasCorrect
        ? lungeRules.feedbackVocabulary.good
        : lungeRules.feedbackVocabulary.standTall;
      state.deepestFrontKnee = 180;
      state.backKneeAtBottom = 180;
    }

    return {
      stage: state.counter.getStage(),
      mistakes,
      feedback,
      metrics: { frontKnee, backKnee, trunk, frontSide },
      repEvent,
    };
  },

  reset(state) {
    state.frontKneeEMA.reset();
    state.backKneeEMA.reset();
    state.trunkEMA.reset();
    state.stabilityWindow.reset();
    state.deepestFrontKnee = 180;
    state.backKneeAtBottom = 180;
    state.counter.reset();
    state.calibration = null;
  },
};

function legAngles(landmarks, side) {
  const hip = getLandmark(landmarks, `${side}Hip`);
  const knee = getLandmark(landmarks, `${side}Knee`);
  const ankle = getLandmark(landmarks, `${side}Ankle`);
  const shoulder = getLandmark(landmarks, `${side}Shoulder`);
  if (!hip || !knee || !ankle || !shoulder) return null;
  return {
    knee: angleBetween(hip, knee, ankle),
    hip: angleBetween(shoulder, hip, knee),
  };
}

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
