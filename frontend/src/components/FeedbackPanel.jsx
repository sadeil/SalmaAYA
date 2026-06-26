import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Sparkles,
  Target,
} from "lucide-react";

// Side panel showing real-time stats, live feedback, framing warnings and the
// calibration progress. Receives a single `state` object so the parent owns
// all of the data and the panel stays purely presentational.

const STATUS_TONES = {
  idle: { label: "Ready when you are", tone: "bg-teal-50 text-teal-700", icon: Sparkles },
  initializing: { label: "Loading pose model…", tone: "bg-slate-100 text-slate-600", icon: Sparkles },
  framing: { label: "Adjust your camera framing", tone: "bg-amber-50 text-amber-700", icon: AlertTriangle },
  calibrating: { label: "Calibrating…", tone: "bg-blue-50 text-blue-700", icon: Target },
  running: { label: "Live form check", tone: "bg-teal-50 text-teal-700", icon: CheckCircle2 },
  paused: { label: "Paused", tone: "bg-slate-100 text-slate-600", icon: Eye },
  finished: { label: "Session finished", tone: "bg-violet-50 text-violet-700", icon: CheckCircle2 },
  error: { label: "Error", tone: "bg-rose-50 text-rose-700", icon: AlertTriangle },
};

export function FeedbackPanel({
  exercise,
  status,
  framingMessage,
  calibrationProgress,
  confidence,
  reps,
  correctReps,
  targetReps = 5,
  liveFeedback,
  mistakes,
  metrics,
  elapsedMs,
  onStart,
  onStop,
}) {
  const statusInfo = STATUS_TONES[status] ?? STATUS_TONES.initializing;
  const StatusIcon = statusInfo.icon;
  const accuracy = reps > 0 ? Math.round((correctReps / reps) * 100) : null;
  const elapsedLabel = formatElapsed(elapsedMs);
  const confidencePct = Math.round((confidence ?? 0) * 100);
  const startDisabled = !exercise || status === "initializing";
  const repProgress = Math.min(100, Math.round(((reps ?? 0) / targetReps) * 100));

  return (
    <div className="card flex h-full flex-col gap-5 p-5">
      <div>
        <span className={`pill ${statusInfo.tone}`}>
          <StatusIcon size={14} />
          {statusInfo.label}
        </span>
        <h2 className="mt-3 text-xl font-extrabold">{exercise?.name ?? "Select an exercise"}</h2>
        {exercise?.description && (
          <p className="mt-1 text-sm text-slate-500">{exercise.description}</p>
        )}
      </div>

      {framingMessage && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
          {framingMessage}
        </div>
      )}

      {status === "calibrating" && (
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Calibration
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {exercise?.calibrationPrompt ?? "Hold the starting position."}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-[width] duration-200"
              style={{ width: `${Math.round((calibrationProgress ?? 0) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Reps" value={<span dir="ltr">{Math.min(reps ?? 0, targetReps)} / {targetReps}</span>} />
        <Stat label="Correct" value={correctReps ?? 0} accent="text-teal-600" />
        <Stat label="Accuracy" value={accuracy == null ? "–" : `${accuracy}%`} accent="text-violet-600" />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            5-rep target
          </p>
          <p className="text-xs font-extrabold text-teal-700">{repProgress}%</p>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-teal-500 transition-[width] duration-300"
            style={{ width: `${repProgress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          The session auto-saves when you complete 5 counted reps.
        </p>
      </div>

      {exercise?.id === "neckStretch" && <NeckCheck metrics={metrics} status={status} />}

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
          Joint visibility
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-[width] duration-200 ${confidencePct > 70 ? "bg-teal-500" : confidencePct > 45 ? "bg-amber-500" : "bg-rose-500"}`}
              style={{ width: `${confidencePct}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-500">{confidencePct}%</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {liveFeedback && (
          <motion.div
            key={liveFeedback}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="rounded-2xl bg-ink p-4 text-white"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Coach</p>
            <p className="mt-1 text-base font-extrabold">{liveFeedback}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {metrics?.postureScore != null && (
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Posture score
          </p>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-teal-500 transition-[width] duration-200"
                style={{ width: `${metrics.postureScore}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-500">{metrics.postureScore}</span>
          </div>
        </div>
      )}

      {mistakes && Object.keys(mistakes).length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Most common issues
          </p>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {Object.entries(mistakes)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 4)
              .map(([name, count]) => (
                <li key={name} className="flex items-center justify-between">
                  <span className="capitalize">{name}</span>
                  <span className="text-xs font-bold text-rose-500">×{count}</span>
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Session time
          </p>
          <p className="text-base font-extrabold text-ink">{elapsedLabel}</p>
        </div>
        {status === "running" ? (
          <button onClick={onStop} className="btn-primary !bg-rose-600 hover:!bg-rose-700">
            End session
          </button>
        ) : (
          <button onClick={onStart} className="btn-primary disabled:cursor-not-allowed disabled:opacity-60" disabled={startDisabled}>
            {status === "initializing" ? "Loading..." : "Start session"}
          </button>
        )}
      </div>

      <p className="text-[10px] leading-4 text-slate-400">
        This is an assistive guidance tool. It does not provide medical advice
        and is not a substitute for a doctor or physiotherapist.
      </p>
    </div>
  );
}

function Stat({ label, value, accent = "text-ink" }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-xl font-extrabold ${accent}`}>{value}</p>
    </div>
  );
}

function NeckCheck({ metrics, status }) {
  const tilt = Math.round(Math.abs(metrics?.tilt ?? 0));
  const speed = Math.round(metrics?.dTilt ?? 0);
  const side = metrics?.side ?? "center";
  const isLive = status === "running";
  const isCorrect = Boolean(metrics?.isNeckCorrect);
  const isTooFast = Boolean(metrics?.isTooFast);
  const isShrugging = Boolean(metrics?.isShrugging);
  const label = !isLive
    ? "Start session to check your neck movement"
    : isCorrect
      ? "Correct neck movement"
      : isTooFast
        ? "Move slower"
        : isShrugging
          ? "Relax your shoulders"
          : "Tilt a little more";

  return (
    <div className={`rounded-2xl border p-4 ${isCorrect ? "border-teal-200 bg-teal-50" : "border-amber-200 bg-amber-50"}`}>
      <p className={`flex items-center gap-2 text-sm font-extrabold ${isCorrect ? "text-teal-800" : "text-amber-800"}`}>
        {isCorrect ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
        {label}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <MiniStat label="Side" value={side} />
        <MiniStat label="Tilt" value={`${tilt}°`} />
        <MiniStat label="Speed" value={`${speed}°/s`} />
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-600">
        Correct = tilt around 20° or more, slow movement, shoulders relaxed.
      </p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-white/70 p-2">
      <p className="font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-extrabold capitalize text-ink">{value}</p>
    </div>
  );
}

function formatElapsed(ms) {
  const total = Math.max(0, Math.round((ms ?? 0) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
