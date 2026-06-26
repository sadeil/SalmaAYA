import { Activity, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { MotionGuide } from "./MotionGuide";

const avatarConfig = {
  lunge: {
    label: "Lunge",
    cue: "Step forward, drop straight down, and keep the front knee stacked over the ankle.",
    motion: "lunge",
  },
  armRaise: {
    label: "Shoulder raise",
    cue: "Raise both arms slowly to shoulder height. Keep the neck relaxed and do not shrug.",
    motion: "armRaise",
  },
  elbowBend: {
    label: "Elbow bend",
    cue: "Bend both elbows slowly, then straighten your arms fully before the next rep.",
    motion: "elbowBend",
  },
  neckStretch: {
    label: "Neck mobility",
    cue: "Tilt your head slowly side to side. The app checks if your shoulders stay relaxed.",
    motion: "neck",
  },
  backStretch: {
    label: "Posture reset",
    cue: "Grow tall through the spine, open the chest, and tuck the chin slightly back.",
    motion: "posture",
  },
};

const fallbackConfig = {
  label: "Movement guide",
  cue: "Pick an exercise and start the session. The guide will move beside you and correct your form.",
  motion: "posture",
};

export function FormCoachAvatar({
  exercise,
  status,
  feedback,
  framingMessage,
  metrics,
  reps = 0,
  targetReps = 5,
}) {
  const config = avatarConfig[exercise?.id] ?? fallbackConfig;
  const isActive = ["idle", "framing", "calibrating", "running"].includes(status);
  const correction = framingMessage || feedback;
  const score = metrics?.postureScore ?? metrics?.score;
  const count = Math.min(reps ?? 0, targetReps);

  return (
    <section className="coach-buddy-card card flex h-full min-h-[430px] flex-col overflow-hidden p-0">
      <div className="flex items-center justify-between gap-3 border-b border-white/20 bg-ink px-5 py-4 text-white">
        <span className="pill bg-white/10 text-teal-50">
          <Sparkles size={14} /> Movement guide
        </span>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-white/75">
            {config.label}
          </span>
          <span className="rounded-full bg-teal-300 px-3 py-1 text-xs font-extrabold text-ink" dir="ltr">
            {count}/{targetReps}
          </span>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_10%,rgba(94,234,212,.2),transparent_30rem),linear-gradient(180deg,#123c3a_0%,#0f2929_100%)] p-5 text-white">
        <div className="relative z-10 grid min-h-[315px] flex-1 place-items-center">
          <MotionGuide
            motionType={config.motion}
            playing={isActive}
            speed={status === "running" ? 1.12 : 0.92}
          />
        </div>

        <div className="relative z-10 rounded-3xl border border-white/10 bg-white/95 p-4 text-ink shadow-card">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-teal-600">
            Mirror this movement · 5 reps
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{config.cue}</p>

          <div className="mt-4 rounded-2xl bg-slate-50 p-3">
            <p className="flex items-center gap-2 text-sm font-extrabold">
              {correction ? (
                <AlertTriangle size={17} className="text-amber-500" />
              ) : (
                <CheckCircle2 size={17} className="text-teal-600" />
              )}
              {correction ? "Adjust your form" : "Copy the guide"}
            </p>
            <p className={`mt-1 text-sm leading-6 ${correction ? "font-bold text-amber-800" : "text-slate-500"}`}>
              {correction || "Stay in frame and match the guide beside you. I will call out corrections while you move."}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-teal-50 p-3">
              <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-teal-700">
                <Activity size={14} /> Mode
              </p>
              <p className="mt-1 text-sm font-extrabold text-ink">
                {status === "running" ? "Live tracking" : "Demo loop"}
              </p>
            </div>
            <div className="rounded-2xl bg-violet-50 p-3">
              <p className="text-xs font-extrabold uppercase tracking-wide text-violet-700">Score</p>
              <p className="mt-1 text-sm font-extrabold text-ink">
                {score == null ? "Ready" : `${Math.round(score)}% posture`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
