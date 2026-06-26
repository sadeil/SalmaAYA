// Visibility / framing checks. Pose models will happily return very confident
// landmarks for body parts that are off-camera or occluded — `visibility` is the
// only honest signal we have, so we gate analysis behind it.

// Minimum visibility we trust for any individual landmark before using it in math.
export const LANDMARK_VISIBILITY_THRESHOLD = 0.55;

// Returns the set of names whose landmark is missing or below threshold.
export function missingLandmarks(landmarks, requiredNames, indexOf) {
  const missing = [];
  if (!landmarks) return requiredNames.slice();
  for (const name of requiredNames) {
    const idx = indexOf(name);
    const lm = landmarks[idx];
    if (!lm || (lm.visibility ?? 0) < LANDMARK_VISIBILITY_THRESHOLD) {
      missing.push(name);
    }
  }
  return missing;
}

// Decide what high-level framing issue to surface to the user. Returns null when
// the framing is fine; otherwise returns a short translation-ready message.
//
// Heuristics:
//   - if both ankles AND head are present but their vertical span is < 0.55 of
//     the frame, the person is too far away (full body is small in frame),
//     or — equivalently — the full body just barely fits.
//   - if the head or ankles are off the top/bottom edges, the user is too close.
//   - if shoulders are highly asymmetric in x, the camera angle is off.
export function describeFramingIssue(landmarks, indexOf) {
  if (!landmarks || landmarks.length === 0) {
    return "No person detected. Stand in front of the camera.";
  }
  const nose = landmarks[indexOf("nose")];
  const leftAnkle = landmarks[indexOf("leftAnkle")];
  const rightAnkle = landmarks[indexOf("rightAnkle")];
  const leftShoulder = landmarks[indexOf("leftShoulder")];
  const rightShoulder = landmarks[indexOf("rightShoulder")];

  const noseVisible = (nose?.visibility ?? 0) >= LANDMARK_VISIBILITY_THRESHOLD;
  const lAnkleVisible = (leftAnkle?.visibility ?? 0) >= LANDMARK_VISIBILITY_THRESHOLD;
  const rAnkleVisible = (rightAnkle?.visibility ?? 0) >= LANDMARK_VISIBILITY_THRESHOLD;
  const anyAnkleVisible = lAnkleVisible || rAnkleVisible;

  // Full body framing check for lower-body exercises.
  if (!noseVisible || !anyAnkleVisible) {
    return "Make sure your full body is visible in the frame.";
  }

  const lowestAnkleY = Math.max(leftAnkle?.y ?? 0, rightAnkle?.y ?? 0);
  const span = lowestAnkleY - (nose?.y ?? 0);
  if (span < 0.55) {
    // Person is in frame but small — usually means they are too far back
    // OR are sitting / tilted. Asking them to move closer is the safer hint.
    return "Move a little closer so we can see all your joints clearly.";
  }
  if ((nose?.y ?? 1) < 0.04) {
    return "Please move back — your head is at the edge of the frame.";
  }
  if (lowestAnkleY > 0.985) {
    return "Please move back — your feet are out of the frame.";
  }

  // Shoulder symmetry — strong horizontal tilt usually means the camera is
  // not perpendicular to the user.
  if (leftShoulder && rightShoulder) {
    const dy = Math.abs(leftShoulder.y - rightShoulder.y);
    if (dy > 0.12) {
      return "Camera angle is not suitable. Face the camera straight on.";
    }
  }
  return null;
}

// Average visibility across a set of landmarks (used for the confidence bar UI).
export function averageVisibility(landmarks, names, indexOf) {
  if (!landmarks) return 0;
  let total = 0;
  let count = 0;
  for (const name of names) {
    const lm = landmarks[indexOf(name)];
    if (!lm) continue;
    total += lm.visibility ?? 0;
    count += 1;
  }
  return count === 0 ? 0 : total / count;
}
