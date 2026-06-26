import { angleBetween } from "../utils/angle.js";
import { createEMA } from "../utils/smoothing.js";
import { createRepCounter } from "../utils/repCounter.js";
import { getLandmark } from "../pose/landmarkUtils.js";

const REQUIRED = [
  "leftShoulder", "rightShoulder",
  "leftElbow", "rightElbow",
  "leftWrist", "rightWrist",
];

const OPEN_ANGLE = 145;
const BENT_ANGLE = 85;
const ASYMMETRY_WARN = 35;

export const elbowBendRules = {
  id: "elbowBend",
  name: "Elbow bend",
  description: "Easy arm check: bend and straighten both elbows slowly.",
  requiredLandmarks: REQUIRED,
  calibrationPrompt: "Face the camera with both arms relaxed and elbows mostly straight.",
  feedbackVocabulary: {
    bend: "Bend your elbows a little more.",
    straighten: "Straighten your arms fully between reps.",
    together: "Move both arms together.",
    good: "Good elbow bend.",
  },

  createState() {
    return {
      leftEMA: createEMA(0.35),
      rightEMA: createEMA(0.35),
      deepestBendThisRep: 180,
      counter: createRepCounter({ startStage: "open", countOnReturnTo: "open", minStageMs: 220 }),
      calibration: null,
    };
  },

  calibrate(landmarks, state) {
    const angles = elbowAngles(landmarks);
    if (!angles) return false;
    if (angles.left >= 125 && angles.right >= 125) {
      state.calibration = { rest: angles };
      return true;
    }
    return false;
  },

  analyze(landmarks, state, { now }) {
    const angles = elbowAngles(landmarks);
    if (!angles || !state.calibration) {
      return { stage: state.counter.getStage(), mistakes: [], feedback: null };
    }

    const left = state.leftEMA.push(angles.left);
    const right = state.rightEMA.push(angles.right);
    const average = (left + right) / 2;
    state.deepestBendThisRep = Math.min(state.deepestBendThisRep, average);

    const mistakes = [];
    let feedback = null;

    if (Math.abs(left - right) > ASYMMETRY_WARN) {
      mistakes.push("arms not together");
      feedback = elbowBendRules.feedbackVocabulary.together;
    }

    let nextStage = state.counter.getStage();
    if (average <= BENT_ANGLE) nextStage = "bent";
    else if (average >= OPEN_ANGLE) nextStage = "open";

    if (nextStage === "open" && state.deepestBendThisRep > BENT_ANGLE) {
      feedback = elbowBendRules.feedbackVocabulary.bend;
    }

    const repEvent =
      state.deepestBendThisRep <= BENT_ANGLE
        ? state.counter.update({ now, nextStage, mistakes })
        : state.counter.update({
            now,
            nextStage: nextStage === "open" ? state.counter.getStage() : nextStage,
            mistakes,
          });

    if (repEvent) {
      feedback = repEvent.wasCorrect
        ? elbowBendRules.feedbackVocabulary.good
        : elbowBendRules.feedbackVocabulary.straighten;
      state.deepestBendThisRep = 180;
    }

    return {
      stage: state.counter.getStage(),
      mistakes,
      feedback,
      metrics: {
        leftElbow: left,
        rightElbow: right,
        averageElbow: average,
      },
      repEvent,
    };
  },

  reset(state) {
    state.leftEMA.reset();
    state.rightEMA.reset();
    state.deepestBendThisRep = 180;
    state.counter.reset();
    state.calibration = null;
  },
};

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
