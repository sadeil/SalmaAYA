import { useEffect, useMemo, useState } from "react";

const BASE = {
  head: [180, 72],
  neck: [180, 112],
  leftShoulder: [145, 126],
  rightShoulder: [215, 126],
  leftElbow: [120, 178],
  rightElbow: [240, 178],
  leftWrist: [112, 238],
  rightWrist: [248, 238],
  leftHip: [158, 222],
  rightHip: [202, 222],
  leftKnee: [145, 295],
  rightKnee: [215, 295],
  leftAnkle: [134, 348],
  rightAnkle: [226, 348],
  chest: [180, 158],
  headTilt: 0,
};

const POSES = {
  lunge: [
    {},
    {
      head: [174, 82],
      neck: [174, 122],
      leftShoulder: [138, 136],
      rightShoulder: [210, 136],
      leftElbow: [116, 182],
      rightElbow: [236, 178],
      leftWrist: [120, 236],
      rightWrist: [238, 232],
      leftHip: [150, 250],
      rightHip: [194, 250],
      leftKnee: [112, 310],
      rightKnee: [240, 310],
      leftAnkle: [92, 348],
      rightAnkle: [268, 348],
      chest: [174, 184],
      headTilt: -1,
    },
    {
      head: [170, 94],
      neck: [170, 134],
      leftShoulder: [134, 148],
      rightShoulder: [206, 148],
      leftElbow: [112, 194],
      rightElbow: [232, 190],
      leftWrist: [116, 248],
      rightWrist: [234, 244],
      leftHip: [145, 278],
      rightHip: [190, 278],
      leftKnee: [98, 322],
      rightKnee: [250, 322],
      leftAnkle: [78, 350],
      rightAnkle: [286, 350],
      chest: [170, 210],
      headTilt: -2,
    },
    {
      head: [174, 82],
      neck: [174, 122],
      leftShoulder: [138, 136],
      rightShoulder: [210, 136],
      leftElbow: [116, 182],
      rightElbow: [236, 178],
      leftWrist: [120, 236],
      rightWrist: [238, 232],
      leftHip: [150, 250],
      rightHip: [194, 250],
      leftKnee: [112, 310],
      rightKnee: [240, 310],
      leftAnkle: [92, 348],
      rightAnkle: [268, 348],
      chest: [174, 184],
      headTilt: -1,
    },
  ],
  armRaise: [
    {},
    {
      leftElbow: [106, 145],
      rightElbow: [254, 145],
      leftWrist: [82, 132],
      rightWrist: [278, 132],
      chest: [180, 154],
      head: [180, 68],
      neck: [180, 108],
    },
    {
      leftElbow: [96, 98],
      rightElbow: [264, 98],
      leftWrist: [114, 42],
      rightWrist: [246, 42],
      chest: [180, 150],
      head: [180, 66],
      neck: [180, 106],
    },
    {
      leftElbow: [106, 145],
      rightElbow: [254, 145],
      leftWrist: [82, 132],
      rightWrist: [278, 132],
      chest: [180, 154],
      head: [180, 68],
      neck: [180, 108],
    },
  ],
  elbowBend: [
    {},
    {
      leftElbow: [118, 172],
      rightElbow: [242, 172],
      leftWrist: [140, 138],
      rightWrist: [220, 138],
      chest: [180, 154],
      head: [180, 68],
      neck: [180, 108],
    },
    {
      leftElbow: [120, 170],
      rightElbow: [240, 170],
      leftWrist: [150, 130],
      rightWrist: [210, 130],
      chest: [180, 154],
      head: [180, 68],
      neck: [180, 108],
    },
    {},
  ],
  neck: [
    {},
    { head: [168, 74], neck: [180, 112], headTilt: -15 },
    {},
    { head: [192, 74], neck: [180, 112], headTilt: 15 },
  ],
  posture: [
    {
      head: [184, 82],
      neck: [180, 120],
      leftShoulder: [150, 134],
      rightShoulder: [210, 134],
      leftHip: [162, 226],
      rightHip: [198, 226],
      chest: [178, 168],
      headTilt: 6,
    },
    {
      head: [180, 70],
      neck: [180, 110],
      leftShoulder: [142, 122],
      rightShoulder: [218, 122],
      leftHip: [156, 222],
      rightHip: [204, 222],
      chest: [180, 150],
      headTilt: 0,
    },
    {
      head: [180, 66],
      neck: [180, 106],
      leftShoulder: [138, 120],
      rightShoulder: [222, 120],
      leftElbow: [112, 178],
      rightElbow: [248, 178],
      leftWrist: [104, 236],
      rightWrist: [256, 236],
      leftHip: [156, 220],
      rightHip: [204, 220],
      chest: [180, 146],
      headTilt: -1,
    },
    {
      head: [180, 70],
      neck: [180, 110],
      leftShoulder: [142, 122],
      rightShoulder: [218, 122],
      leftHip: [156, 222],
      rightHip: [204, 222],
      chest: [180, 150],
      headTilt: 0,
    },
  ],
};

const LIMBS = [
  ["leftShoulder", "leftElbow", "leftWrist", "skin"],
  ["rightShoulder", "rightElbow", "rightWrist", "skin"],
  ["leftHip", "leftKnee", "leftAnkle", "pants"],
  ["rightHip", "rightKnee", "rightAnkle", "pants"],
];

function resolvePose(frame) {
  return Object.fromEntries(
    Object.entries(BASE).map(([key, value]) => [key, frame[key] ?? value]),
  );
}

function ease(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
}

function interpolate(a, b, t) {
  if (typeof a === "number") return a + (b - a) * t;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function useAnimatedPose(motionType, playing, speed) {
  const frames = useMemo(
    () => (POSES[motionType] ?? POSES.posture).map(resolvePose),
    [motionType],
  );
  const [pose, setPose] = useState(frames[0]);

  useEffect(() => {
    if (!playing) {
      setPose(frames[0]);
      return undefined;
    }

    let raf = 0;
    const startedAt = performance.now();
    const cycleMs = 3600 / speed;

    function tick(now) {
      const raw = ((now - startedAt) % cycleMs) / cycleMs;
      const scaled = raw * frames.length;
      const index = Math.min(frames.length - 1, Math.max(0, Math.floor(scaled)));
      const nextIndex = (index + 1) % frames.length;
      const local = ease(Math.min(1, Math.max(0, scaled - index)));
      const current = frames[index];
      const next = frames[nextIndex];
      const mixed = {};
      for (const key of Object.keys(BASE)) {
        mixed[key] = interpolate(current?.[key] ?? BASE[key], next?.[key] ?? BASE[key], local);
      }
      setPose(mixed);
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [frames, playing, speed]);

  return pose;
}

function point([x, y]) {
  return `${x} ${y}`;
}

function curve(a, b, c) {
  return `M${point(a)} Q${point(b)} ${point(c)}`;
}

function footPath(ankle, side) {
  const [x, y] = ankle;
  const dir = side === "left" ? -1 : 1;
  return `M${x - 5 * dir} ${y - 1} q${18 * dir} -5 ${34 * dir} 5 l${-2 * dir} 11 h${-38 * dir} q${-5 * dir} -7 ${6 * dir} -16Z`;
}

export function MotionGuide({ motionType, playing, speed = 1 }) {
  const pose = resolvePose(useAnimatedPose(motionType, playing, speed) ?? {});
  const shoulderMid = [
    (pose.leftShoulder[0] + pose.rightShoulder[0]) / 2,
    (pose.leftShoulder[1] + pose.rightShoulder[1]) / 2,
  ];
  const hipMid = [
    (pose.leftHip[0] + pose.rightHip[0]) / 2,
    (pose.leftHip[1] + pose.rightHip[1]) / 2,
  ];

  return (
    <div className="motion-guide" aria-label="Animated motion guide">
      <svg viewBox="0 0 360 380" role="img">
        <defs>
          <linearGradient id="motionSkin" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffe0c2" />
            <stop offset="100%" stopColor="#d79a72" />
          </linearGradient>
          <linearGradient id="motionShirt" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5eead4" />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>
          <linearGradient id="motionPants" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>
        </defs>

        <ellipse className="motion-guide-shadow" cx="180" cy="360" rx="104" ry="16" />
        <path className="motion-guide-ring motion-guide-ring-left" d="M92 92C38 154 42 258 112 316" />
        <path className="motion-guide-ring motion-guide-ring-right" d="M268 92c54 62 50 166-20 224" />

        <path
          className="motion-guide-torso"
          d={`M${point(pose.leftShoulder)} Q${point(shoulderMid)} ${point(pose.rightShoulder)} L${point(pose.rightHip)} Q${point(hipMid)} ${point(pose.leftHip)} Z`}
        />
        <path className="motion-guide-spine" d={`M${point(shoulderMid)} Q${point(pose.chest)} ${point(hipMid)}`} />
        <path className="motion-guide-neck" d={`M${point(pose.neck)} L${point(shoulderMid)}`} />

        {LIMBS.map(([start, mid, end, tone]) => (
          <path
            key={`${start}-${end}`}
            className={`motion-guide-limb motion-guide-limb-${tone}`}
            d={curve(pose[start], pose[mid], pose[end])}
          />
        ))}

        <path className="motion-guide-foot" d={footPath(pose.leftAnkle, "left")} />
        <path className="motion-guide-foot" d={footPath(pose.rightAnkle, "right")} />

        {["leftShoulder", "rightShoulder", "leftElbow", "rightElbow", "leftHip", "rightHip", "leftKnee", "rightKnee"].map((name) => (
          <circle key={name} className="motion-guide-joint" cx={pose[name][0]} cy={pose[name][1]} r="7" />
        ))}

        <g
          className="motion-guide-head"
          transform={`rotate(${pose.headTilt} ${pose.neck[0]} ${pose.neck[1]})`}
        >
          <ellipse className="motion-guide-face" cx={pose.head[0]} cy={pose.head[1]} rx="31" ry="36" />
          <path
            className="motion-guide-hair"
            d={`M${pose.head[0] - 31} ${pose.head[1] - 2}c-1-40 62-46 64-3-16-10-29-13-47-8-7 2-12 6-17 11Z`}
          />
          <circle className="motion-guide-eye" cx={pose.head[0] - 11} cy={pose.head[1] + 6} r="2.4" />
          <circle className="motion-guide-eye" cx={pose.head[0] + 12} cy={pose.head[1] + 6} r="2.4" />
          <path className="motion-guide-smile" d={`M${pose.head[0] - 9} ${pose.head[1] + 22}q9 7 18 0`} />
        </g>
      </svg>
      <span className="motion-guide-badge">Breathe</span>
    </div>
  );
}
