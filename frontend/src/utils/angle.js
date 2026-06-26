// 2D joint-angle math used by every exercise rule file.
// MediaPipe landmarks are normalized to the image: x,y in [0,1], z relative depth,
// and visibility in [0,1]. For joint angles 2D (x,y) is more stable than 3D because
// the z-axis from a monocular camera is noisy, so we deliberately use 2D here.

const RAD_TO_DEG = 180 / Math.PI;

// Angle at point b, formed by segments b-a and b-c. Result is in degrees in [0, 180].
export function angleBetween(a, b, c) {
  if (!a || !b || !c) return null;
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const magAB = Math.hypot(abx, aby);
  const magCB = Math.hypot(cbx, cby);
  if (magAB === 0 || magCB === 0) return null;
  const cos = Math.min(1, Math.max(-1, dot / (magAB * magCB)));
  return Math.acos(cos) * RAD_TO_DEG;
}

// Signed angle of the vector b->a relative to the horizontal axis,
// measured counter-clockwise. Useful for "is the torso leaning forward?".
export function vectorAngleDeg(from, to) {
  if (!from || !to) return null;
  return Math.atan2(to.y - from.y, to.x - from.x) * RAD_TO_DEG;
}

// Vertical alignment in degrees: 0 means a and b are perfectly stacked on the y axis.
// Negative = b is to the left of a; positive = b is to the right.
export function deviationFromVertical(top, bottom) {
  if (!top || !bottom) return null;
  return Math.atan2(top.x - bottom.x, bottom.y - top.y) * RAD_TO_DEG;
}

// Euclidean distance in normalized image space.
export function distance(a, b) {
  if (!a || !b) return null;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Midpoint between two landmarks (returns null if either is missing).
export function midpoint(a, b) {
  if (!a || !b) return null;
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: ((a.z ?? 0) + (b.z ?? 0)) / 2,
    visibility: Math.min(a.visibility ?? 1, b.visibility ?? 1),
  };
}
