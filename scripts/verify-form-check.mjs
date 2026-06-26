// Pure-logic verification for the form-checker pipeline. We synthesize the
// 33-landmark array MediaPipe would produce, drive each analyzer through a
// known movement, and assert that:
//   * angles & helpers return sane numbers
//   * rep counter only fires on the correct stage transition with debounce
//   * visibility/framing guards fire when the body is off-camera
//   * each rule file's calibrate() converges and analyze() counts reps
//
// Anything that fails exits non-zero so CI / a smoke script can catch it.

import { angleBetween, deviationFromVertical, distance, midpoint, vectorAngleDeg } from "../frontend/src/utils/angle.js";
import { createEMA, createFeedbackStabilizer, createWindow } from "../frontend/src/utils/smoothing.js";
import { createRepCounter } from "../frontend/src/utils/repCounter.js";
import { LANDMARK_NAMES, landmarkIndex } from "../frontend/src/pose/landmarkUtils.js";
import {
  averageVisibility,
  describeFramingIssue,
  missingLandmarks,
} from "../frontend/src/utils/visibilityCheck.js";
import { lungeRules } from "../frontend/src/exercises/lunge.rules.js";
import { armRaiseRules } from "../frontend/src/exercises/armRaise.rules.js";
import { neckStretchRules } from "../frontend/src/exercises/neckStretch.rules.js";
import { backStretchRules } from "../frontend/src/exercises/backStretch.rules.js";
import { elbowBendRules } from "../frontend/src/exercises/elbowBend.rules.js";

const failures = [];
function check(name, ok, detail = "") {
  if (ok) {
    console.log(`  ok  · ${name}`);
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`  FAIL · ${name}${detail ? ` — ${detail}` : ""}`);
  }
}
function approx(actual, expected, tol = 1) {
  if (actual == null) return false;
  return Math.abs(actual - expected) <= tol;
}

// ----- angle.js -----
console.log("\n[angle.js]");
check(
  "right angle = 90°",
  approx(angleBetween({ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 }), 90, 0.1),
);
check(
  "straight line = 180°",
  approx(angleBetween({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }), 180, 0.1),
);
check(
  "vertical aligned = 0°",
  approx(deviationFromVertical({ x: 0.5, y: 0.1 }, { x: 0.5, y: 0.9 }), 0, 0.01),
);
check(
  "lean right = positive degrees",
  deviationFromVertical({ x: 0.6, y: 0.1 }, { x: 0.5, y: 0.9 }) > 0,
);
check(
  "distance",
  approx(distance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5, 0.001),
);
check(
  "midpoint",
  midpoint({ x: 0, y: 0, visibility: 1 }, { x: 1, y: 1, visibility: 0.5 }).x === 0.5,
);
check(
  "vector angle",
  approx(vectorAngleDeg({ x: 0, y: 0 }, { x: 1, y: 0 }), 0, 0.1),
);

// ----- smoothing.js -----
console.log("\n[smoothing.js]");
{
  const ema = createEMA(0.5);
  ema.push(10);
  ema.push(20);
  check("EMA converges toward input", ema.get() === 15);
  const win = createWindow(4);
  win.push(2); win.push(4); win.push(6); win.push(8);
  check("window mean", win.mean() === 5);
  check("window full", win.full());

  const stab = createFeedbackStabilizer(3);
  stab.push("x"); stab.push("x");
  check("stabilizer needs N frames before confirming", stab.current() === null);
  stab.push("x");
  check("stabilizer confirms after N frames", stab.current() === "x");
}

// ----- repCounter.js -----
console.log("\n[repCounter.js]");
{
  const c = createRepCounter({ startStage: "up", countOnReturnTo: "up", minStageMs: 100 });
  // up → down → up = 1 rep
  let t = 0;
  c.update({ now: (t += 200), nextStage: "down", mistakes: [] });
  const r = c.update({ now: (t += 200), nextStage: "up", mistakes: [] });
  check("rep counts on up→down→up", r?.total === 1 && r.correct === 1);

  // debounce: rapid transitions inside minStageMs must not count
  const c2 = createRepCounter({ startStage: "up", countOnReturnTo: "up", minStageMs: 500 });
  let t2 = 0;
  c2.update({ now: (t2 += 100), nextStage: "down", mistakes: [] });
  const fast = c2.update({ now: (t2 += 100), nextStage: "up", mistakes: [] });
  check("debounce blocks too-fast transitions", fast === null);

  // mistake during descent taints the rep
  const c3 = createRepCounter({ startStage: "up", countOnReturnTo: "up", minStageMs: 50 });
  let t3 = 0;
  c3.update({ now: (t3 += 100), nextStage: "down", mistakes: ["bad form"] });
  c3.update({ now: (t3 += 100), nextStage: "down", mistakes: ["bad form"] });
  const tainted = c3.update({ now: (t3 += 100), nextStage: "up", mistakes: [] });
  check("rep marked incorrect when mistake during descent", tainted?.total === 1 && tainted.correct === 0);

  const snap = c3.snapshot();
  check("snapshot mistakes count", snap.mistakes["bad form"] === 2);
}

// ----- landmark synth helpers -----
function blankLandmarks() {
  return LANDMARK_NAMES.map(() => ({ x: 0.5, y: 0.5, z: 0, visibility: 0 }));
}
function set(lms, name, x, y, visibility = 0.95) {
  lms[landmarkIndex(name)] = { x, y, z: 0, visibility };
}
// Builds a roughly head-to-feet skeleton with knees bent to the requested
// angle. Uses an isoceles-triangle hip-knee-ankle: thigh = shin = L.
// Law of cosines gives the hip-ankle distance for a given knee angle θ:
//   d = 2L · sin(θ/2)
// The knee sits perpendicular to the hip-ankle line at distance
// sqrt(L² - (d/2)²). We keep ankles fixed and drop the hip as the angle
// closes like a real knee bend.
function buildStandingSkeleton({
  kneeAngleDeg = 175,
  leftKneeAngleDeg,
  rightKneeAngleDeg,
  trunkLeanDeg = 0,
  shoulderTiltX = 0,
} = {}) {
  const lms = blankLandmarks();
  const L = 0.18; // thigh = shin length in normalized units
  const lAngle = leftKneeAngleDeg ?? kneeAngleDeg;
  const rAngle = rightKneeAngleDeg ?? kneeAngleDeg;

  function leg(side, angleDeg) {
    const ankleX = side === "left" ? 0.42 : 0.58;
    const ankleY = 0.95;
    const d = 2 * L * Math.sin((angleDeg * Math.PI) / 360); // = 2L sin(θ/2)
    const hipX = ankleX;
    const hipY = ankleY - d;
    const perp = Math.sqrt(Math.max(0, L * L - (d / 2) * (d / 2)));
    const kneeX = ankleX + (side === "left" ? -perp : perp) * 0.5 + perp * (side === "left" ? -0.5 : 0.5);
    // Simpler: knee perpendicular forward (positive y direction → toward camera).
    // For 2D analysis the side matters less than the magnitude. Push knee out
    // sideways from the hip-ankle line.
    const kneeXFinal = ankleX + (side === "left" ? -perp : perp);
    const kneeY = ankleY - d / 2;
    return { hipX, hipY, kneeX: kneeXFinal, kneeY, ankleX, ankleY };
  }

  const leftLeg = leg("left", lAngle);
  const rightLeg = leg("right", rAngle);
  const hipY = (leftLeg.hipY + rightLeg.hipY) / 2;
  // Shoulders sit a fixed distance above hips so torso stays "rigid".
  const shoulderY = hipY - 0.25;
  const noseY = shoulderY - 0.13;
  const leanX = Math.sin((trunkLeanDeg * Math.PI) / 180) * 0.1;

  set(lms, "nose", 0.5 + leanX * 0.5, noseY);
  set(lms, "leftEar", 0.46 + leanX * 0.5, noseY + 0.01);
  set(lms, "rightEar", 0.54 + leanX * 0.5, noseY + 0.01);
  set(lms, "leftEye", 0.48 + leanX * 0.5, noseY - 0.005);
  set(lms, "rightEye", 0.52 + leanX * 0.5, noseY - 0.005);
  set(lms, "leftShoulder", 0.4 + leanX + shoulderTiltX, shoulderY);
  set(lms, "rightShoulder", 0.6 + leanX - shoulderTiltX, shoulderY);
  set(lms, "leftHip", leftLeg.hipX, leftLeg.hipY);
  set(lms, "rightHip", rightLeg.hipX, rightLeg.hipY);
  set(lms, "leftKnee", leftLeg.kneeX, leftLeg.kneeY);
  set(lms, "rightKnee", rightLeg.kneeX, rightLeg.kneeY);
  set(lms, "leftAnkle", leftLeg.ankleX, leftLeg.ankleY);
  set(lms, "rightAnkle", rightLeg.ankleX, rightLeg.ankleY);
  set(lms, "leftHeel", leftLeg.ankleX, leftLeg.ankleY + 0.02);
  set(lms, "rightHeel", rightLeg.ankleX, rightLeg.ankleY + 0.02);
  set(lms, "leftFootIndex", leftLeg.ankleX - 0.02, leftLeg.ankleY + 0.01);
  set(lms, "rightFootIndex", rightLeg.ankleX + 0.02, rightLeg.ankleY + 0.01);
  // Arms hanging next to torso by default.
  set(lms, "leftElbow", 0.38, shoulderY + 0.15);
  set(lms, "rightElbow", 0.62, shoulderY + 0.15);
  set(lms, "leftWrist", 0.38, shoulderY + 0.25);
  set(lms, "rightWrist", 0.62, shoulderY + 0.25);
  return lms;
}

// ----- visibility check -----
console.log("\n[visibility check]");
{
  const good = buildStandingSkeleton();
  check("good framing returns no issue", describeFramingIssue(good, landmarkIndex) === null);

  // missing required landmark
  good[landmarkIndex("leftKnee")].visibility = 0.1;
  const missing = missingLandmarks(good, ["leftKnee"], landmarkIndex);
  check("missing landmark detected", missing.includes("leftKnee"));

  // no person
  check(
    "empty landmarks → no person",
    describeFramingIssue([], landmarkIndex)?.toLowerCase().includes("no person"),
  );

  // shoulders tilted strongly
  const tilted = buildStandingSkeleton({ shoulderTiltX: 0.1 });
  // raise one shoulder's y to break symmetry
  tilted[landmarkIndex("leftShoulder")].y = 0.20;
  tilted[landmarkIndex("rightShoulder")].y = 0.40;
  check(
    "shoulder asymmetry → camera angle warning",
    describeFramingIssue(tilted, landmarkIndex)?.toLowerCase().includes("camera angle"),
  );

  const avgVis = averageVisibility(good, ["leftHip", "rightHip"], landmarkIndex);
  check("average visibility computed", avgVis > 0.9);
}

// Drives an analyzer through one rep-cycle with hold frames at each end so
// the EMA has time to settle past the threshold. Returns total reps counted.
function runRepCycles({
  rule,
  state,
  startAngle,
  bottomAngle,
  step = 6,
  startNow = 0,
  cycles = 3,
  buildFn,
}) {
  let now = startNow;
  for (let cycle = 0; cycle < cycles; cycle += 1) {
    // Hold at top so the EMA catches up before descent — except cycle 0
    // where calibration already left us there.
    for (let i = 0; i < 8; i += 1) {
      now += 80;
      rule.analyze(buildFn(startAngle), state, { now });
    }
    for (let k = startAngle; k >= bottomAngle; k -= step) {
      now += 80;
      rule.analyze(buildFn(k), state, { now });
    }
    // Hold at the bottom so the deepest-angle check is satisfied confidently.
    for (let i = 0; i < 6; i += 1) {
      now += 80;
      rule.analyze(buildFn(bottomAngle), state, { now });
    }
    for (let k = bottomAngle; k <= startAngle; k += step) {
      now += 80;
      rule.analyze(buildFn(k), state, { now });
    }
  }
  // Final hold at the top so the EMA settles past the "up" threshold and
  // the last rep's down→up transition fires.
  for (let i = 0; i < 12; i += 1) {
    now += 80;
    rule.analyze(buildFn(startAngle), state, { now });
  }
  return now;
}

// ----- lunge rule -----
console.log("\n[lunge rule]");
{
  const state = lungeRules.createState();
  let calibrated = false;
  for (let i = 0; i < 30 && !calibrated; i += 1) {
    calibrated = lungeRules.calibrate(buildStandingSkeleton({ kneeAngleDeg: 175 }), state);
  }
  check("lunge calibrates while standing", calibrated);

  runRepCycles({
    rule: lungeRules,
    state,
    startAngle: 175,
    bottomAngle: 85,
    cycles: 2,
    buildFn: (k) => buildStandingSkeleton({ leftKneeAngleDeg: k, rightKneeAngleDeg: 175 }),
  });
  const snap = state.counter.snapshot();
  check(`lunge counts ≥ 1 rep from 2 cycles (got ${snap.total})`, snap.total >= 1);
}

// ----- arm raise rule -----
console.log("\n[arm raise rule]");
{
  const state = armRaiseRules.createState();
  let calibrated = false;
  for (let i = 0; i < 30 && !calibrated; i += 1) {
    calibrated = armRaiseRules.calibrate(buildStandingSkeleton(), state);
  }
  check("arm raise calibrates with arms down", calibrated);

  let now = 0;
  for (let rep = 0; rep < 5; rep += 1) {
    // Raise.
    for (let theta = 0; theta <= 100; theta += 10) {
      now += 80;
      const lms = buildStandingSkeleton();
      const armLen = 0.18;
      const rad = theta * (Math.PI / 180);
      const lShoulder = lms[landmarkIndex("leftShoulder")];
      const rShoulder = lms[landmarkIndex("rightShoulder")];
      lms[landmarkIndex("leftElbow")] = { x: lShoulder.x - Math.sin(rad) * armLen, y: lShoulder.y - Math.cos(rad) * armLen * -1 + (Math.cos(rad) * 0.001), z: 0, visibility: 0.95 };
      // Actually we need the elbow to be ABOVE shoulder when raised. y decreases upward.
      lms[landmarkIndex("leftElbow")] = { x: lShoulder.x - Math.sin(rad) * armLen, y: lShoulder.y + Math.cos(rad) * armLen, z: 0, visibility: 0.95 };
      lms[landmarkIndex("rightElbow")] = { x: rShoulder.x + Math.sin(rad) * armLen, y: rShoulder.y + Math.cos(rad) * armLen, z: 0, visibility: 0.95 };
      // Wrists straight out from elbows in same direction.
      lms[landmarkIndex("leftWrist")] = { x: lShoulder.x - Math.sin(rad) * armLen * 2, y: lShoulder.y + Math.cos(rad) * armLen * 2, z: 0, visibility: 0.95 };
      lms[landmarkIndex("rightWrist")] = { x: rShoulder.x + Math.sin(rad) * armLen * 2, y: rShoulder.y + Math.cos(rad) * armLen * 2, z: 0, visibility: 0.95 };
      armRaiseRules.analyze(lms, state, { now });
    }
    // Lower.
    for (let theta = 100; theta >= 0; theta -= 10) {
      now += 80;
      const lms = buildStandingSkeleton();
      const armLen = 0.18;
      const rad = theta * (Math.PI / 180);
      const lShoulder = lms[landmarkIndex("leftShoulder")];
      const rShoulder = lms[landmarkIndex("rightShoulder")];
      lms[landmarkIndex("leftElbow")] = { x: lShoulder.x - Math.sin(rad) * armLen, y: lShoulder.y + Math.cos(rad) * armLen, z: 0, visibility: 0.95 };
      lms[landmarkIndex("rightElbow")] = { x: rShoulder.x + Math.sin(rad) * armLen, y: rShoulder.y + Math.cos(rad) * armLen, z: 0, visibility: 0.95 };
      lms[landmarkIndex("leftWrist")] = { x: lShoulder.x - Math.sin(rad) * armLen * 2, y: lShoulder.y + Math.cos(rad) * armLen * 2, z: 0, visibility: 0.95 };
      lms[landmarkIndex("rightWrist")] = { x: rShoulder.x + Math.sin(rad) * armLen * 2, y: rShoulder.y + Math.cos(rad) * armLen * 2, z: 0, visibility: 0.95 };
      armRaiseRules.analyze(lms, state, { now });
    }
  }
  const snap = state.counter.snapshot();
  check(`arm raise counts ≥ 1 rep from 3 cycles (got ${snap.total})`, snap.total >= 1);
}

// ----- neck stretch rule -----
console.log("\n[neck stretch rule]");
{
  const state = neckStretchRules.createState();
  let calibrated = false;
  for (let i = 0; i < 30 && !calibrated; i += 1) {
    calibrated = neckStretchRules.calibrate(buildStandingSkeleton(), state);
  }
  check("neck stretch calibrates head-level", calibrated);
  // Tilt head left (drop left ear) then return.
  let now = 0;
  function tiltedSkeleton(deg) {
    const lms = buildStandingSkeleton();
    // Rotate the ear line by `deg` around the head center.
    const rad = (deg * Math.PI) / 180;
    const cx = 0.5;
    const cy = 0.16;
    const offset = 0.04;
    lms[landmarkIndex("leftEar")] = { x: cx - Math.cos(rad) * offset, y: cy - Math.sin(rad) * offset, z: 0, visibility: 0.95 };
    lms[landmarkIndex("rightEar")] = { x: cx + Math.cos(rad) * offset, y: cy + Math.sin(rad) * offset, z: 0, visibility: 0.95 };
    return lms;
  }
  // Hold center
  for (let i = 0; i < 5; i += 1) { now += 100; neckStretchRules.analyze(tiltedSkeleton(0), state, { now }); }
  // Tilt left slowly
  for (let d = 0; d <= 25; d += 2) { now += 100; neckStretchRules.analyze(tiltedSkeleton(-d), state, { now }); }
  // Hold left to satisfy TILT_HOLD_MS
  for (let i = 0; i < 8; i += 1) { now += 100; neckStretchRules.analyze(tiltedSkeleton(-25), state, { now }); }
  // Return center
  for (let d = 25; d >= 0; d -= 2) { now += 100; neckStretchRules.analyze(tiltedSkeleton(-d), state, { now }); }
  const snap = neckStretchRules.snapshot(state);
  check(`neck stretch counts left tilt (got ${snap.total})`, snap.total >= 1);
}

// ----- back stretch rule -----
console.log("\n[5-rep target checks]");
{
  const armState = armRaiseRules.createState();
  for (let i = 0; i < 30 && !armState.calibration; i += 1) {
    armRaiseRules.calibrate(buildStandingSkeleton(), armState);
  }
  let now = 0;
  function armSkeleton(theta) {
    const lms = buildStandingSkeleton();
    const armLen = 0.18;
    const rad = theta * (Math.PI / 180);
    const lShoulder = lms[landmarkIndex("leftShoulder")];
    const rShoulder = lms[landmarkIndex("rightShoulder")];
    lms[landmarkIndex("leftElbow")] = { x: lShoulder.x - Math.sin(rad) * armLen, y: lShoulder.y + Math.cos(rad) * armLen, z: 0, visibility: 0.95 };
    lms[landmarkIndex("rightElbow")] = { x: rShoulder.x + Math.sin(rad) * armLen, y: rShoulder.y + Math.cos(rad) * armLen, z: 0, visibility: 0.95 };
    lms[landmarkIndex("leftWrist")] = { x: lShoulder.x - Math.sin(rad) * armLen * 2, y: lShoulder.y + Math.cos(rad) * armLen * 2, z: 0, visibility: 0.95 };
    lms[landmarkIndex("rightWrist")] = { x: rShoulder.x + Math.sin(rad) * armLen * 2, y: rShoulder.y + Math.cos(rad) * armLen * 2, z: 0, visibility: 0.95 };
    return lms;
  }
  for (let rep = 0; rep < 5; rep += 1) {
    for (let theta = 0; theta <= 100; theta += 10) {
      now += 80;
      armRaiseRules.analyze(armSkeleton(theta), armState, { now });
    }
    for (let theta = 100; theta >= 0; theta -= 10) {
      now += 80;
      armRaiseRules.analyze(armSkeleton(theta), armState, { now });
    }
  }
  const armSnap = armState.counter.snapshot();
  check(`shoulder raise target counts 5 reps exactly (got ${armSnap.total})`, armSnap.total === 5);
  check(`shoulder raise target keeps 5 reps correct (got ${armSnap.correct})`, armSnap.correct === 5);

  const neckState = neckStretchRules.createState();
  let neckCalibrated = false;
  for (let i = 0; i < 30 && !neckCalibrated; i += 1) {
    neckCalibrated = neckStretchRules.calibrate(buildStandingSkeleton(), neckState);
  }
  check("neck target check calibrates", neckCalibrated);
  let neckNow = 0;
  function tiltedSkeleton(deg) {
    const lms = buildStandingSkeleton();
    const rad = (deg * Math.PI) / 180;
    const cx = 0.5;
    const cy = 0.16;
    const offset = 0.04;
    lms[landmarkIndex("leftEar")] = { x: cx - Math.cos(rad) * offset, y: cy - Math.sin(rad) * offset, z: 0, visibility: 0.95 };
    lms[landmarkIndex("rightEar")] = { x: cx + Math.cos(rad) * offset, y: cy + Math.sin(rad) * offset, z: 0, visibility: 0.95 };
    return lms;
  }
  function runNeckRep(sign) {
    for (let i = 0; i < 6; i += 1) {
      neckNow += 100;
      neckStretchRules.analyze(tiltedSkeleton(0), neckState, { now: neckNow });
    }
    for (let d = 0; d <= 25; d += 2) {
      neckNow += 100;
      neckStretchRules.analyze(tiltedSkeleton(sign * d), neckState, { now: neckNow });
    }
    for (let i = 0; i < 8; i += 1) {
      neckNow += 100;
      neckStretchRules.analyze(tiltedSkeleton(sign * 25), neckState, { now: neckNow });
    }
    for (let d = 25; d >= 0; d -= 2) {
      neckNow += 100;
      neckStretchRules.analyze(tiltedSkeleton(sign * d), neckState, { now: neckNow });
    }
  }
  [-1, 1, -1, 1, -1].forEach(runNeckRep);
  const neckSnap = neckStretchRules.snapshot(neckState);
  check(`neck mobility target counts 5 reps exactly (got ${neckSnap.total})`, neckSnap.total === 5);
  check(`neck mobility target keeps 5 reps correct (got ${neckSnap.correct})`, neckSnap.correct === 5);
}

// ----- back stretch rule -----
console.log("\n[elbow bend rule]");
{
  const state = elbowBendRules.createState();
  let calibrated = false;
  const straight = buildStandingSkeleton();
  for (let i = 0; i < 30 && !calibrated; i += 1) {
    calibrated = elbowBendRules.calibrate(straight, state);
  }
  check("elbow bend calibrates with arms straight", calibrated);

  let now = 0;
  function elbowSkeleton(angleDeg) {
    const lms = buildStandingSkeleton();
    const upper = 0.11;
    const forearm = 0.11;
    const bend = ((180 - angleDeg) * Math.PI) / 180;
    const lShoulder = lms[landmarkIndex("leftShoulder")];
    const rShoulder = lms[landmarkIndex("rightShoulder")];

    const leftElbow = { x: lShoulder.x, y: lShoulder.y + upper, z: 0, visibility: 0.95 };
    const rightElbow = { x: rShoulder.x, y: rShoulder.y + upper, z: 0, visibility: 0.95 };
    lms[landmarkIndex("leftElbow")] = leftElbow;
    lms[landmarkIndex("rightElbow")] = rightElbow;
    lms[landmarkIndex("leftWrist")] = {
      x: leftElbow.x + Math.sin(bend) * forearm,
      y: leftElbow.y + Math.cos(bend) * forearm,
      z: 0,
      visibility: 0.95,
    };
    lms[landmarkIndex("rightWrist")] = {
      x: rightElbow.x - Math.sin(bend) * forearm,
      y: rightElbow.y + Math.cos(bend) * forearm,
      z: 0,
      visibility: 0.95,
    };
    return lms;
  }

  for (let rep = 0; rep < 5; rep += 1) {
    for (let angle = 170; angle >= 60; angle -= 10) {
      now += 90;
      elbowBendRules.analyze(elbowSkeleton(angle), state, { now });
    }
    for (let angle = 60; angle <= 170; angle += 10) {
      now += 90;
      elbowBendRules.analyze(elbowSkeleton(angle), state, { now });
    }
  }
  const snap = state.counter.snapshot();
  check(`elbow bend counts exactly 5 reps (got ${snap.total})`, snap.total === 5);
  check(`elbow bend marks 5 reps correct (got ${snap.correct})`, snap.correct === 5);
}

// ----- back stretch rule -----
console.log("\n[back stretch rule]");
{
  const state = backStretchRules.createState();
  const calibrated = backStretchRules.calibrate(buildStandingSkeleton(), state);
  check("back stretch calibrates upright", calibrated);
  // Hold good posture for 11 seconds → expect 1 rep.
  let now = 0;
  for (let i = 0; i < 120; i += 1) {
    now += 100;
    backStretchRules.analyze(buildStandingSkeleton(), state, { now });
  }
  const snap = backStretchRules.snapshot(state);
  check(`good posture for 11s yields 1 rep (got ${snap.total})`, snap.total >= 1);
}

// ----- summary -----
if (failures.length) {
  console.error(`\n❌ ${failures.length} check(s) failed:`);
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
} else {
  console.log("\n✅ All form-checker logic verified.");
}
