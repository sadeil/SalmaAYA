// Human-readable names for the 33 MediaPipe Pose landmarks plus the skeleton
// edges we want to draw. Exercise rule files request landmarks by name so we
// don't sprinkle magic numbers around the codebase.
//
// Source order matches:
// https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker#models
export const LANDMARK_NAMES = [
  "nose",
  "leftEyeInner", "leftEye", "leftEyeOuter",
  "rightEyeInner", "rightEye", "rightEyeOuter",
  "leftEar", "rightEar",
  "mouthLeft", "mouthRight",
  "leftShoulder", "rightShoulder",
  "leftElbow", "rightElbow",
  "leftWrist", "rightWrist",
  "leftPinky", "rightPinky",
  "leftIndex", "rightIndex",
  "leftThumb", "rightThumb",
  "leftHip", "rightHip",
  "leftKnee", "rightKnee",
  "leftAnkle", "rightAnkle",
  "leftHeel", "rightHeel",
  "leftFootIndex", "rightFootIndex",
];

const NAME_TO_INDEX = LANDMARK_NAMES.reduce((acc, name, i) => {
  acc[name] = i;
  return acc;
}, {});

export function landmarkIndex(name) {
  const index = NAME_TO_INDEX[name];
  if (index === undefined) throw new Error(`Unknown landmark name: ${name}`);
  return index;
}

// Returns the landmark object (or undefined) for a given name.
export function getLandmark(landmarks, name) {
  return landmarks?.[landmarkIndex(name)];
}

// Skeleton edges to draw — kept to body/limbs (we skip the dense face mesh).
export const POSE_CONNECTIONS = [
  ["leftShoulder", "rightShoulder"],
  ["leftShoulder", "leftElbow"], ["leftElbow", "leftWrist"],
  ["rightShoulder", "rightElbow"], ["rightElbow", "rightWrist"],
  ["leftShoulder", "leftHip"], ["rightShoulder", "rightHip"],
  ["leftHip", "rightHip"],
  ["leftHip", "leftKnee"], ["leftKnee", "leftAnkle"],
  ["rightHip", "rightKnee"], ["rightKnee", "rightAnkle"],
  ["leftAnkle", "leftHeel"], ["leftHeel", "leftFootIndex"], ["leftAnkle", "leftFootIndex"],
  ["rightAnkle", "rightHeel"], ["rightHeel", "rightFootIndex"], ["rightAnkle", "rightFootIndex"],
  ["nose", "leftShoulder"], ["nose", "rightShoulder"],
].map(([a, b]) => [landmarkIndex(a), landmarkIndex(b)]);

// Landmark sets that are commonly referenced by rule files.
export const LANDMARK_GROUPS = {
  lowerBody: ["leftHip", "rightHip", "leftKnee", "rightKnee", "leftAnkle", "rightAnkle"],
  upperBody: ["leftShoulder", "rightShoulder", "leftElbow", "rightElbow", "leftWrist", "rightWrist"],
  torso: ["leftShoulder", "rightShoulder", "leftHip", "rightHip"],
  head: ["nose", "leftEar", "rightEar", "leftShoulder", "rightShoulder"],
};
