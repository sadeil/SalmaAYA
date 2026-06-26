import { useEffect, useRef } from "react";
import { POSE_CONNECTIONS } from "../pose/landmarkUtils.js";
import { LANDMARK_VISIBILITY_THRESHOLD } from "../utils/visibilityCheck.js";

// Canvas overlay that draws the skeleton on top of the mirrored video. We
// re-render via requestAnimationFrame whenever the parent updates the
// `landmarks` prop — drawing happens on the canvas, NOT in React, to keep
// the render path fast.

export function PoseCanvas({ landmarks, mirror = true, className = "" }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const landmarksRef = useRef(null);
  landmarksRef.current = landmarks;

  // Resize the canvas backing store to match its displayed size.
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const observer = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let raf;
    function draw() {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        const lms = landmarksRef.current;
        if (lms && lms.length) {
          drawSkeleton(ctx, lms, w, h, mirror);
        }
      }
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [mirror]);

  return (
    <div ref={containerRef} className={`pointer-events-none absolute inset-0 ${className}`}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

function drawSkeleton(ctx, landmarks, w, h, mirror) {
  const project = (lm) => {
    const x = (mirror ? 1 - lm.x : lm.x) * w;
    const y = lm.y * h;
    return [x, y];
  };

  ctx.lineWidth = Math.max(2, Math.round(w / 320));
  ctx.lineCap = "round";

  // Connections.
  ctx.strokeStyle = "rgba(78,213,180,0.95)";
  ctx.shadowColor = "rgba(78,213,180,0.5)";
  ctx.shadowBlur = 6;
  for (const [a, b] of POSE_CONNECTIONS) {
    const la = landmarks[a];
    const lb = landmarks[b];
    if (!la || !lb) continue;
    if ((la.visibility ?? 0) < LANDMARK_VISIBILITY_THRESHOLD) continue;
    if ((lb.visibility ?? 0) < LANDMARK_VISIBILITY_THRESHOLD) continue;
    const [ax, ay] = project(la);
    const [bx, by] = project(lb);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // Joints.
  const radius = Math.max(3, Math.round(w / 220));
  for (let i = 0; i < landmarks.length; i += 1) {
    const lm = landmarks[i];
    if (!lm) continue;
    const v = lm.visibility ?? 0;
    if (v < LANDMARK_VISIBILITY_THRESHOLD) continue;
    const [x, y] = project(lm);
    ctx.beginPath();
    ctx.fillStyle =
      v > 0.8 ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.65)";
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
