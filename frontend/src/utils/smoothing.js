// Smoothing helpers. Raw MediaPipe angles jitter by a few degrees per frame from
// keypoint noise alone — feeding that straight into "did the user reach 90°?" makes
// the rep counter flicker. We use:
//   * one-euro-style EMA for continuous values (angles, distances)
//   * a short feedback queue so a one-frame mistake does not flash on screen
// Both are intentionally tiny — production-ready does NOT mean over-engineered.

// Exponential moving average. alpha closer to 1 reacts faster but smooths less.
// 0.35 strikes a good balance for ~30fps pose detection.
export function createEMA(alpha = 0.35) {
  let value = null;
  return {
    push(next) {
      if (next == null || Number.isNaN(next)) return value;
      value = value == null ? next : value + alpha * (next - value);
      return value;
    },
    get() {
      return value;
    },
    reset() {
      value = null;
    },
  };
}

// Rolling window of the last N values. Used to detect "stable" posture
// (low variance over a short window) during calibration and rest detection.
export function createWindow(size = 12) {
  const buf = [];
  return {
    push(v) {
      if (v == null || Number.isNaN(v)) return;
      buf.push(v);
      if (buf.length > size) buf.shift();
    },
    values() {
      return buf.slice();
    },
    mean() {
      if (buf.length === 0) return null;
      return buf.reduce((s, x) => s + x, 0) / buf.length;
    },
    stddev() {
      if (buf.length < 2) return null;
      const m = buf.reduce((s, x) => s + x, 0) / buf.length;
      const variance = buf.reduce((s, x) => s + (x - m) ** 2, 0) / buf.length;
      return Math.sqrt(variance);
    },
    full() {
      return buf.length >= size;
    },
    reset() {
      buf.length = 0;
    },
  };
}

// Holds the most recent feedback messages and surfaces only the one that has
// been seen across `requireFrames` consecutive frames. This prevents the panel
// from jittering when the analyzer briefly disagrees with itself.
export function createFeedbackStabilizer(requireFrames = 4) {
  let candidate = null;
  let streak = 0;
  let confirmed = null;
  return {
    push(message) {
      if (message === candidate) {
        streak += 1;
      } else {
        candidate = message;
        streak = 1;
      }
      if (streak >= requireFrames) {
        confirmed = candidate;
      }
      return confirmed;
    },
    current() {
      return confirmed;
    },
    reset() {
      candidate = null;
      streak = 0;
      confirmed = null;
    },
  };
}
