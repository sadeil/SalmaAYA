import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Award,
  Bot,
  Camera,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Flame,
  Gamepad2,
  Gift,
  HeartPulse,
  Lock,
  Pause,
  Play,
  Rabbit,
  RotateCcw,
  Send,
  Sparkles,
  Star,
  Target,
  Turtle,
  Trophy,
  X,
  WalletCards,
  Zap,
} from "lucide-react";
import {
  exercises as initialExercises,
  messages as seedMessages,
  progressData,
} from "../data/appData";
import { CountUp, PageHeader, Progress, StatCard, Status } from "../components/UI";
import { GuidedCameraPane } from "../components/GuidedCameraPane";
import { getExerciseById } from "../exercises";
import { useLanguage } from "../i18n/LanguageContext";
import { api } from "../services/api";

// Maps each exercise id from the daily plan to the rule file that knows how
// to analyze that movement on camera. Exercises that don't have a matching
// rule simply don't expose the camera toggle â€” we'd rather be honest about
// what we can actually score than fake feedback.
const exerciseCameraRuleByPlanId = {
  1: "neckStretch",     // Neck release
  2: "armRaise",        // Shoulder rolls (shares the shoulder/elbow geometry)
  5: "backStretch",     // Posture reset
};

export function PatientDashboard() {
  return (
    <>
      <PageHeader
        eyebrow="Friday, 12 June"
        title="Good morning, Salma"
        description="Your body has shown up for you today. Let's return the favor."
        action={
          <button className="btn-primary">
            <Play size={16} /> Start today's exercises
          </button>
        }
      />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Star}
          label="Current points"
          value="82 pts"
          note="+10 this week"
          trend={[60, 65, 62, 70, 74, 78, 82]}
        />
        <StatCard
          icon={Trophy}
          label="Current level"
          value="Level 3"
          note="18 pts to Level 4"
          tone="purple"
          trend={[1, 1, 2, 2, 2, 3, 3]}
        />
        <StatCard
          icon={Flame}
          label="Day streak"
          value="12 days"
          note="Personal best"
          tone="amber"
          trend={[1, 3, 5, 7, 9, 11, 12]}
        />
        <StatCard
          icon={CircleDollarSign}
          label="Refund earned"
          value="5 ILS"
          note="12.5% returned"
          tone="blue"
        />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_.6fr]">
        <div className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="pill bg-teal-50 text-teal-700">
                <HeartPulse size={14} /> Today's care plan
              </span>
              <h2 className="mt-4 text-2xl font-extrabold">
                Gentle back mobility
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                5 exercises آ· 25 minutes آ· Low impact
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold">
                <CountUp value={40} />%
              </p>
              <p className="text-xs font-bold text-slate-400">
                2 of 5 complete
              </p>
            </div>
          </div>
          <div className="mt-7">
            <Progress value={40} />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {initialExercises.slice(0, 4).map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                whileHover={{ y: -2 }}
                className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 transition hover:border-teal-200 hover:shadow-card"
              >
                <span
                  className={`grid h-10 w-10 place-items-center rounded-xl transition-transform group-hover:scale-110 ${e.color}`}
                >
                  {e.done ? (
                    <Check size={17} />
                  ) : (
                    <span className="text-xs font-extrabold">{i + 1}</span>
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold">{e.name}</p>
                  <p className="truncate text-xs text-slate-400">
                    {e.duration} آ· {e.area}
                  </p>
                </div>
                {!e.done && (
                  <ArrowRight
                    size={14}
                    className="ms-auto text-slate-300 transition group-hover:translate-x-1 group-hover:text-teal-600"
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>
        <div className="card relative flex flex-col overflow-hidden bg-gradient-to-br from-ink to-teal-700 text-white">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-teal-300/25 blur-3xl anim-float" />
          <div className="pointer-events-none absolute -bottom-16 -left-12 h-48 w-48 rounded-full bg-violet-400/15 blur-3xl" />
          <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white/10 backdrop-blur">
            <Bot />
          </span>
          <h3 className="relative mt-6 text-2xl font-extrabold">
            How are you feeling today?
          </h3>
          <p className="relative mt-3 text-sm leading-6 text-white/65">
            Tell your AI assistant about any changes before starting your plan.
          </p>
          <Link
            to="/patient/chat"
            className="group relative mt-auto flex items-center justify-between rounded-2xl bg-white/10 p-4 text-sm font-extrabold transition hover:bg-white/15"
          >
            Chat with AI
            <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_.4fr]">
        <ProgressChart />
        <div className="card">
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-slate-400">
            Health focus
          </p>
          <h3 className="mt-3 text-xl font-extrabold">Lower back tension</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your reported discomfort is down from 6 to 4 this month.
          </p>
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-xs font-bold">
              <span>Recovery confidence</span>
              <span>72%</span>
            </div>
            <Progress value={72} color="bg-violet-500" />
          </div>
        </div>
      </div>
    </>
  );
}

function ProgressChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-white bg-white/95 px-4 py-3 shadow-soft backdrop-blur-xl">
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-extrabold text-teal-700">
        {payload[0].value} pts
      </p>
    </div>
  );
}

function ProgressChart() {
  return (
    <div className="card">
      <div className="mb-5 flex justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-slate-400">
            Movement score
          </p>
          <h3 className="mt-2 text-xl font-extrabold">Your week in motion</h3>
        </div>
        <span className="pill h-fit bg-teal-50 text-teal-700">
          +<CountUp value={18} />%
        </span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={progressData} margin={{ top: 10, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="score" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#20a88a" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#20a88a" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="scoreStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#20a88a" />
                <stop offset="100%" stopColor="#8e82d9" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8eeee" />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
            />
            <Tooltip cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }} content={<ProgressChartTooltip />} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="url(#scoreStroke)"
              strokeWidth={3}
              fill="url(#score)"
              activeDot={{ r: 5, fill: "#20a88a", strokeWidth: 2, stroke: "#fff" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ExerciseSchedule() {
  const [items, setItems] = useState(initialExercises);
  const [activeExercise, setActiveExercise] = useState(null);
  const { isArabic } = useLanguage();
  const done = items.filter((x) => x.done).length;
  const setDone = (id, value) =>
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, done: value } : item)),
    );

  useEffect(() => {
    let active = true;
    api.exercises()
      .then((apiExercises) => active && setItems(apiExercises))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Daily plan"
        title="Today's movement quest"
        description="Move gently and stop if an exercise causes sharp or unusual pain."
        action={
          <span className="pill bg-teal-50 text-teal-700">
            <Clock3 size={15} /> 25 minutes
          </span>
        }
      />
      <div className="card mb-5 flex flex-col gap-4 md:flex-row md:items-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-600">
          <Target />
        </span>
        <div className="flex-1">
          <div className="mb-2 flex justify-between text-sm font-extrabold">
            <span>{isArabic ? `ط§ظƒطھظ…ظ„ ${done} ظ…ظ† ${items.length} طھظ…ط§ط±ظٹظ†` : `${done} of ${items.length} exercises complete`}</span>
            <span>{Math.round((done / items.length) * 100)}%</span>
          </div>
          <Progress value={(done / items.length) * 100} />
        </div>
        <span className="pill bg-amber-50 text-amber-700">+5 points each</span>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {items.map((e, index) => (
          <motion.div
            layout
            key={e.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: index * 0.05, ease: [0.45, 0, 0.18, 1] }}
            whileHover={{ y: -4 }}
            onMouseMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
              event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
            }}
            data-spotlight
            className={`card group relative overflow-hidden p-6 ${e.done ? "border-teal-200 bg-teal-50/30" : ""}`}
          >
            <div className={`absolute inset-x-0 top-0 h-1 ${e.done ? "bg-teal-400" : "bg-gradient-to-r from-teal-400 via-violet-400 to-amber-300"}`} />
            <div className="flex items-start justify-between">
              <span
                className={`grid h-12 w-12 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${e.color}`}
              >
                {e.done ? <CheckCircle2 /> : <Activity />}
              </span>
              <Status>{e.done ? "Completed" : "Not completed"}</Status>
            </div>
            <h3 className="mt-5 text-xl font-extrabold">{e.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{e.area}</p>
            <div className="my-5 grid grid-cols-3 gap-2">
              {[
                [e.duration, "Duration"],
                [e.sets, "Sets"],
                [e.reps, "Reps"],
              ].map(([v, l]) => (
                <div
                  key={l}
                  className="rounded-2xl bg-slate-50 p-3 text-center transition group-hover:bg-white group-hover:shadow-sm"
                >
                  <p className="font-extrabold">{v}</p>
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    {l}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs leading-5 text-slate-500">
              Move slowly through a comfortable range, breathe steadily, and
              keep your posture relaxed.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setActiveExercise(e)}
                className="btn-primary flex-1"
              >
                <Play size={16} /> {e.done ? "Do it again" : "Start exercise"}
              </button>
              {e.done && (
                <button
                  aria-label="Mark incomplete"
                  title="Mark incomplete"
                  onClick={() => setDone(e.id, false)}
                  className="btn-soft px-4"
                >
                  <RotateCcw size={16} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      <AnimatePresence>
        {activeExercise && (
          <GuidedExercise
            exercise={activeExercise}
            onClose={() => setActiveExercise(null)}
            onComplete={() => {
              setDone(activeExercise.id, true);
              setActiveExercise(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

const exerciseGuides = {
  1: {
    phases: ["Center and breathe", "Tilt gently to the left", "Return through center", "Tilt gently to the right"],
    tip: "Keep both shoulders heavy. Move your ear toward your shoulder without lifting the shoulder.",
    motion: "neck",
  },
  2: {
    phases: ["Relax your arms", "Lift shoulders toward ears", "Draw shoulders gently back", "Lower and release"],
    tip: "Make smooth circles and keep your chin level. Avoid forcing the shoulders backward.",
    motion: "shoulders",
  },
  3: {
    phases: ["Find a neutral tabletop", "Exhale and round your spine", "Return slowly to neutral", "Inhale and open your chest"],
    tip: "Stack shoulders above wrists and hips above knees. Let your breath lead the movement.",
    motion: "catcow",
  },
  4: {
    phases: ["Plant both feet", "Lower knees gently left", "Return using your core", "Lower knees gently right"],
    tip: "Keep both shoulders grounded. Only lower the knees as far as you can without discomfort.",
    motion: "lowerback",
  },
  5: {
    phases: ["Stand naturally", "Draw your chin gently back", "Open chest and rotate palms out", "Hold tall, then release"],
    tip: "Imagine a string lifting your head. Keep your ribs relaxed instead of arching your lower back.",
    motion: "posture",
  },
};

function GuidedExercise({ exercise, onClose, onComplete }) {
  const guide = exerciseGuides[exercise.id];
  const [playing, setPlaying] = useState(true);
  const [reps, setReps] = useState(1);
  const [set, setSet] = useState(1);
  const [phase, setPhase] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraStats, setCameraStats] = useState({ total: 0, correct: 0 });
  const totalReps = Number(exercise.reps);
  const totalSets = Number(exercise.sets);
  const progress = (((set - 1) * totalReps + reps) / (totalSets * totalReps)) * 100;

  // Resolve the rule file for this plan exercise (or null if we don't support
  // it on camera yet). We look it up by the plan-side id, not by name, so
  // the UI stays in sync if a coach renames an exercise.
  const cameraRule = exerciseCameraRuleByPlanId[exercise.id]
    ? getExerciseById(exerciseCameraRuleByPlanId[exercise.id])
    : null;

  useEffect(() => {
    // Pause the SVG animation when the camera is on â€” it's hidden anyway.
    if (cameraMode) return undefined;
    if (!playing) return undefined;
    const timer = window.setInterval(
      () => setPhase((current) => (current + 1) % guide.phases.length),
      1800 / speed,
    );
    return () => window.clearInterval(timer);
  }, [guide.phases.length, playing, speed, cameraMode]);

  const nextRep = () => {
    if (reps < totalReps) {
      setReps(reps + 1);
    } else if (set < totalSets) {
      setSet(set + 1);
      setReps(1);
    } else {
      onComplete();
    }
  };

  // The camera pane calls this each time the analyzer credits a rep. We
  // advance the modal's manual rep counter so both views stay aligned, and
  // call onComplete when the user reaches the final rep of the final set.
  const onCameraRep = ({ wasCorrect }) => {
    setCameraStats((prev) => ({
      total: prev.total + 1,
      correct: prev.correct + (wasCorrect ? 1 : 0),
    }));
    nextRep();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] grid place-items-center bg-ink/65 p-3 backdrop-blur-md md:p-6"
      onClick={onClose}
    >
      <motion.section
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        onClick={(event) => event.stopPropagation()}
        className="relative grid max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-[#f8fbfa] shadow-2xl lg:grid-cols-[1.15fr_.85fr]"
      >
        <button aria-label="Close" onClick={onClose} className="absolute end-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-slate-500 shadow-card">
          <X size={18} />
        </button>
        {cameraMode && cameraRule ? (
          <GuidedCameraPane exercise={cameraRule} onRepCounted={onCameraRep} />
        ) : (
          <div className="relative grid min-h-[420px] place-items-center overflow-hidden bg-gradient-to-br from-teal-50 via-white to-violet-50 p-8">
            <div className="exercise-orbit exercise-orbit-one" />
            <div className="exercise-orbit exercise-orbit-two" />
            <span className="absolute start-5 top-5 pill bg-white/80 text-teal-700 shadow-card">
              <Activity size={14} /> Live guide
            </span>
            <ExerciseDemonstration motionType={guide.motion} phase={phase} playing={playing} speed={speed} />
            <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-white/80 p-4 text-center shadow-card backdrop-blur-md">
              <div className="mx-auto mb-3 flex max-w-xs gap-1.5">
                {guide.phases.map((_, index) => <span key={index} className={`h-1.5 flex-1 rounded-full transition ${index <= phase ? "bg-teal-500" : "bg-slate-200"}`} />)}
              </div>
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-teal-600">Movement phase {phase + 1}</p>
              <p className="mt-1 font-extrabold">{guide.phases[phase]}</p>
            </div>
          </div>
        )}
        <div className="flex flex-col p-6 md:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-teal-600">Guided session</p>
          <h2 className="mt-2 pe-10 text-3xl font-extrabold">{exercise.name}</h2>
          <p className="mt-2 text-sm text-slate-500">{exercise.area} آ· {exercise.duration}</p>
          <div className="my-7">
            <div className="mb-2 flex justify-between text-xs font-extrabold">
              <span>Set {set} of {totalSets}</span>
              <span>Rep {reps} of {totalReps}</span>
            </div>
            <Progress value={progress} />
          </div>
          <div className="mb-5 rounded-3xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold">Demonstration speed</p>
                <p className="mt-1 text-xs text-slate-500">Choose a pace you can follow comfortably.</p>
              </div>
              <div className="flex gap-1.5">
                {[0.75, 1, 1.25].map((value) => (
                  <button aria-label={`Set demonstration speed to ${value}x`} key={value} onClick={() => setSpeed(value)} className={`rounded-xl px-2.5 py-2 text-[10px] font-extrabold transition ${speed === value ? "bg-ink text-white shadow-md" : "bg-white text-slate-500 shadow-sm"}`}>
                    {value === 0.75 ? <Turtle size={13} /> : value === 1.25 ? <Rabbit size={13} /> : "1x"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
            <p className="flex items-center gap-2 text-sm font-extrabold text-amber-900"><Sparkles size={16} /> Coach tip</p>
            <p className="mt-2 text-sm leading-6 text-amber-800">{guide.tip}</p>
          </div>

          <div className="mt-5 rounded-3xl border border-teal-100 bg-teal-50/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-extrabold text-teal-900">
                  <Camera size={16} /> Camera form check
                </p>
                <p className="mt-1 text-xs text-teal-800/80">
                  {cameraRule
                    ? "Use your webcam â€” we count reps and flag form issues in real time."
                    : "Camera form check isn't available for this exercise yet."}
                </p>
              </div>
              <button
                aria-pressed={cameraMode}
                disabled={!cameraRule}
                onClick={() => setCameraMode((current) => !current)}
                className={`rounded-2xl px-3 py-2 text-xs font-extrabold shadow-sm transition ${cameraMode ? "bg-ink text-white" : "bg-white text-teal-700"} ${!cameraRule ? "cursor-not-allowed opacity-50" : ""}`}
              >
                {cameraMode ? "Turn off" : "Turn on"}
              </button>
            </div>
            {cameraMode && cameraStats.total > 0 && (
              <p className="mt-3 text-xs font-bold text-teal-800">
                Camera reps: {cameraStats.correct} good of {cameraStats.total}
              </p>
            )}
          </div>

          <div className="mt-auto pt-7">
            <button
              aria-label={set === totalSets && reps === totalReps ? "Finish exercise" : "Complete this rep"}
              onClick={nextRep}
              className="btn-primary w-full py-4"
            >
              <Check size={17} />
              <span key={set === totalSets && reps === totalReps ? "finish" : "rep"}>
                {set === totalSets && reps === totalReps ? "Finish exercise" : "Complete this rep"}
              </span>
            </button>
            <button
              aria-label={playing ? "Pause demonstration" : "Resume demonstration"}
              onClick={() => setPlaying((current) => !current)}
              disabled={cameraMode}
              className={`btn-soft mt-3 w-full ${cameraMode ? "opacity-50" : ""}`}
            >
              {playing ? <Pause size={17} /> : <Play size={17} />}
              <span key={playing ? "pause" : "resume"}>{playing ? "Pause demonstration" : "Resume demonstration"}</span>
            </button>
            <p className="mt-4 text-center text-[11px] leading-5 text-slate-400">Stop immediately if you feel sharp or unusual pain.</p>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}

function ExerciseDemonstration({ motionType, phase, playing, speed }) {
  return (
    <div
      className={`exercise-demo exercise-demo-${motionType} phase-${phase} ${playing ? "is-playing" : ""}`}
      style={{
        "--demo-speed": `${5 / speed}s`,
        "--phase-speed": `${1650 / speed}ms`,
        "--micro-speed": `${3200 / speed}ms`,
      }}
      aria-label="Animated exercise demonstration"
    >
      <svg viewBox="0 0 440 360" role="img">
        <defs>
          <linearGradient id="skinTone" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffe0c2" />
            <stop offset="100%" stopColor="#d99b72" />
          </linearGradient>
          <linearGradient id="shirtTone" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#35c6a4" />
            <stop offset="100%" stopColor="#127568" />
          </linearGradient>
          <linearGradient id="pantsTone" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#385969" />
            <stop offset="100%" stopColor="#172f3a" />
          </linearGradient>
        </defs>
        <ellipse className="demo-shadow" cx="220" cy="325" rx="125" ry="15" />
        <g className="demo-focus-rings">
          <circle className="demo-focus demo-focus-neck" cx="220" cy="102" r="42" />
          <circle className="demo-focus demo-focus-shoulders" cx="220" cy="130" r="62" />
          <circle className="demo-focus demo-focus-spine" cx="220" cy="170" r="67" />
          <circle className="demo-focus demo-focus-lowerback" cx="220" cy="205" r="55" />
          <circle className="demo-focus demo-focus-posture" cx="220" cy="165" r="82" />
        </g>
        <g className="demo-person">
          <g className="demo-head-group">
            <ellipse className="demo-neck" cx="220" cy="104" rx="14" ry="20" />
            <path className="demo-ear demo-ear-left" d="M190 67c-10-3-11 18 1 20Z" />
            <path className="demo-ear demo-ear-right" d="M250 67c10-3 11 18-1 20Z" />
            <ellipse className="demo-head" cx="220" cy="68" rx="31" ry="36" />
            <path className="demo-hair" d="M190 66c-1-41 62-47 65-3-15-10-28-14-45-10-8 2-14 7-20 13Z" />
            <path className="demo-brow" d="M202 67q7-4 13 0M226 67q7-4 13 0" />
            <circle className="demo-eye" cx="209" cy="73" r="2.5" />
            <circle className="demo-eye" cx="232" cy="73" r="2.5" />
            <path className="demo-nose" d="M220 74l-2 10 5 1" />
            <path className="demo-smile" d="M211 91q9 7 18 0" />
            <circle className="demo-cheek" cx="202" cy="86" r="4" />
            <circle className="demo-cheek" cx="238" cy="86" r="4" />
          </g>
          <path className="demo-torso" d="M190 112Q220 98 250 112L263 196Q244 214 220 214Q196 214 177 196Z" />
          <path className="demo-shirt-highlight" d="M200 113Q215 106 226 108L218 199Q202 202 190 194Z" />
          <path className="demo-collar" d="M202 108Q220 125 238 108" />
          <path className="demo-shirt-seam" d="M220 126v68" />
          <path className="demo-waist" d="M184 194Q220 210 256 194L254 218Q220 230 186 218Z" />
          <g className="demo-arm demo-arm-left">
            <path className="demo-upper-arm" d="M188 121Q164 139 157 166" />
            <circle className="demo-elbow" cx="157" cy="166" r="10" />
            <g className="demo-lower-arm">
              <path className="demo-forearm" d="M157 166Q151 187 153 205" />
              <path className="demo-hand" d="M145 201q8-7 17 0l2 16q-10 9-20 0Z" />
            </g>
          </g>
          <g className="demo-arm demo-arm-right">
            <path className="demo-upper-arm" d="M252 121Q276 139 283 166" />
            <circle className="demo-elbow" cx="283" cy="166" r="10" />
            <g className="demo-lower-arm">
              <path className="demo-forearm" d="M283 166Q289 187 287 205" />
              <path className="demo-hand" d="M278 201q8-7 17 0l1 16q-10 9-20 0Z" />
            </g>
          </g>
          <g className="demo-leg demo-leg-left">
            <path className="demo-thigh" d="M204 216Q190 248 184 266" />
            <circle className="demo-knee" cx="184" cy="266" r="11" />
            <g className="demo-lower-leg">
              <path className="demo-shin" d="M184 266Q180 291 178 312" />
              <path className="demo-shoe" d="M164 308q16-7 29 2l-2 12h-31Z" />
            </g>
          </g>
          <g className="demo-leg demo-leg-right">
            <path className="demo-thigh" d="M236 216Q250 248 256 266" />
            <circle className="demo-knee" cx="256" cy="266" r="11" />
            <g className="demo-lower-leg">
              <path className="demo-shin" d="M256 266Q260 291 262 312" />
              <path className="demo-shoe" d="M247 310q13-9 29-2l4 14h-31Z" />
            </g>
          </g>
        </g>
        <g className="demo-catcow-person">
          <rect className="cat-mat" x="75" y="292" width="300" height="12" rx="6" />
          <path className="cat-back-limb cat-arm-back" d="M286 177Q300 218 302 286" />
          <path className="cat-back-limb cat-leg-back" d="M154 188Q133 225 137 280L105 288" />
          <path className="cat-pelvis" d="M137 169Q157 154 177 169L181 201Q158 213 137 197Z" />
          <path className="cat-ribcage" d="M245 163Q274 158 291 178L283 211Q259 217 239 201Z" />
          <path className="cat-shirt" d="M166 166Q211 151 256 168L249 205Q207 194 173 203Z" />
          <path className="cat-spine" d="M158 177Q210 150 270 181" />
          <path className="cat-limb cat-leg-front" d="M160 194Q158 236 160 280L124 288" />
          <circle className="cat-joint" cx="160" cy="194" r="9" />
          <path className="cat-limb cat-arm-front" d="M270 190Q280 232 280 286" />
          <circle className="cat-joint" cx="270" cy="190" r="9" />
          <path className="cat-palm" d="M265 284h36q5 0 5 7v5h-43Z" />
          <path className="cat-foot" d="M112 281h46v15h-51q-5-9 5-15Z" />
          <path className="cat-neck" d="M278 181Q300 178 308 192" />
          <g className="cat-head-group">
            <ellipse className="cat-head" cx="321" cy="202" rx="24" ry="28" />
            <path className="cat-hair" d="M298 199q-2-30 34-29 20 4 15 29-20-13-49 0Z" />
            <circle className="cat-eye" cx="331" cy="202" r="2" />
            <path className="cat-face" d="M334 212q5 3 9-1" />
          </g>
          <path className="cat-motion-arrow" d="M188 139Q220 115 252 139" />
          <path className="cat-motion-tip" d="m247 130 7 10-12 2" />
        </g>
        <g className="demo-lowerback-person">
          <rect className="back-mat" x="95" y="30" width="250" height="300" rx="38" />
          <path className="back-arm back-arm-left" d="M190 126Q145 145 112 178" />
          <path className="back-arm back-arm-right" d="M250 126Q295 145 328 178" />
          <path className="back-palm" d="M99 172q14-8 25 4l-10 16q-14 5-22-6Z" />
          <path className="back-palm back-palm-right" d="M341 172q-14-8-25 4l10 16q14 5 22-6Z" />
          <path className="back-torso" d="M186 115Q220 100 254 115L262 226Q220 245 178 226Z" />
          <path className="back-centerline" d="M220 122v102" />
          <path className="back-thigh back-thigh-left" d="M202 225Q190 260 180 280" />
          <path className="back-thigh back-thigh-right" d="M238 225Q250 260 260 280" />
          <path className="back-shin back-shin-left" d="M180 280Q195 300 211 307" />
          <path className="back-shin back-shin-right" d="M260 280Q245 300 229 307" />
          <circle className="back-knee back-knee-left" cx="180" cy="280" r="11" />
          <circle className="back-knee back-knee-right" cx="260" cy="280" r="11" />
          <circle className="back-head" cx="220" cy="82" r="32" />
          <path className="back-hair" d="M190 81q-1-42 42-37 23 4 19 38-27-16-61-1Z" />
          <circle className="back-eye" cx="209" cy="84" r="2" />
          <circle className="back-eye" cx="231" cy="84" r="2" />
          <path className="back-smile" d="M211 96q9 5 18 0" />
          <path className="back-motion back-motion-left" d="M165 244Q125 270 135 310" />
          <path className="back-motion back-motion-right" d="M275 244Q315 270 305 310" />
        </g>
        <path className="demo-guide demo-guide-left" d="M135 105 C85 140 85 210 135 240" />
        <path className="demo-guide demo-guide-right" d="M305 105 C355 140 355 210 305 240" />
      </svg>
      <span className="demo-breathe">Breathe</span>
    </div>
  );
}

export function AIChat() {
  const [messages, setMessages] = useState(seedMessages);
  const [profile, setProfile] = useState(null);
  const [intake, setIntake] = useState({});
  const [draftPlan, setDraftPlan] = useState(null);
  const [aiStatus, setAiStatus] = useState({ enabled: false, provider: "Local fallback" });
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    let active = true;
    api.patientMessages()
      .then((payload) => {
        if (!active) return;
        const nextMessages = Array.isArray(payload) ? payload : payload.messages;
        setMessages(nextMessages ?? []);
        if (!Array.isArray(payload)) {
          setProfile(payload.profile ?? null);
          setIntake(payload.intake ?? {});
          setDraftPlan(payload.draftPlan ?? null);
          setAiStatus(payload.ai ?? { enabled: false, provider: "Local fallback" });
        }
      })
      .catch((apiError) => active && setError(apiError.message));
    return () => {
      active = false;
    };
  }, []);

  // Auto-scroll to the latest message whenever the list changes â€” but only
  // if the user was already near the bottom (so we don't yank them away
  // from scrollback they're reading).
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const nearBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 80;
    if (nearBottom || sending) {
      node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
    }
  }, [messages, sending]);

  const send = async (overrideText) => {
    const outgoing = (typeof overrideText === "string" ? overrideText : text).trim();
    if (!outgoing) return;
    setError("");
    setSending(true);
    setText("");
    setMessages((current) => [...current, { from: "user", text: outgoing }]);
    try {
      const payload = await api.sendPatientMessage(outgoing);
      setMessages((current) => [...current, ...(payload.messages ?? [])]);
      setProfile(payload.profile ?? null);
      setIntake(payload.intake ?? {});
      setDraftPlan(payload.draftPlan ?? null);
      setAiStatus(payload.ai ?? { enabled: false, provider: "Local fallback" });
    } catch (apiError) {
      setError(apiError.message);
      setText(outgoing);
      setMessages((current) => current.filter((message) => message.text !== outgoing));
    } finally {
      setSending(false);
    }
  };
  return (
    <>
      <PageHeader
        eyebrow="AI health assistant"
        title="Let's understand how you feel"
        description="Your answers help prepare a suggested plan for doctor review."
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_.38fr]">
        <div className="card flex min-h-[650px] flex-col p-0 overflow-hidden">
          <div className="flex items-center gap-3 border-b p-5">
            <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-100 to-teal-50 text-teal-600 shadow-inner">
              <Bot />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
            </span>
            <div>
              <p className="text-sm font-extrabold">{"\u0627\u0644\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0635\u062D\u064A"}</p>
              <p className="flex items-center gap-1 text-xs text-teal-600">
                <span className="h-2 w-2 rounded-full bg-teal-500 anim-pulse-glow" /> Online
              </p>
            </div>
            <span className="pill ml-auto bg-violet-50 text-violet-700">
              <Sparkles size={13} /> {aiStatus.enabled ? "OpenRouter active" : "Local AI fallback"}
            </span>
          </div>
          <div ref={scrollRef} className="no-scrollbar flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-slate-50/60 to-white p-5">
            {messages.map((m, i) => (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                key={i}
                className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`group max-w-[80%] rounded-3xl px-4 py-3 text-sm leading-6 transition ${m.from === "user" ? "rounded-br-md bg-ink text-white shadow-lg shadow-teal-900/10" : "rounded-bl-md bg-white shadow-card"}`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                  {m.plan && <ChatPlanPreview plan={m.plan} onApprove={() => send("approve")} />}
                </div>
              </motion.div>
            ))}
            {sending && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="typing-dots inline-flex gap-1 rounded-3xl rounded-bl-md bg-white px-4 py-3 text-slate-400 shadow-card">
                  <span /><span /><span />
                </div>
              </motion.div>
            )}
          </div>
          <div className="border-t bg-white p-4">
            {error && <p className="mb-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
            <div className="flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                className="field"
                placeholder={draftPlan ? "\u0627\u0643\u062A\u0628\u064A \u0645\u0648\u0627\u0641\u0642\u0629 \u0644\u0644\u0625\u0636\u0627\u0641\u0629 \u0623\u0648 \u062A\u063A\u064A\u064A\u0631 \u0644\u0644\u062A\u0639\u062F\u064A\u0644..." : "\u0627\u0643\u062A\u0628\u064A \u0625\u062C\u0627\u0628\u062A\u0643..."}
              />
              <button disabled={sending || !text.trim()} onClick={send} className="btn-primary px-4 disabled:cursor-not-allowed disabled:opacity-60">
                <Send size={18} />
              </button>
            </div>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-300">
              Press <span className="kbd">Enter</span> to send
            </p>
          </div>
        </div>
        <div className="space-y-5">
          <div className="card">
            <span className="pill bg-teal-50 text-teal-700">
              <CheckCircle2 size={14} /> Intake summary
            </span>
            <h3 className="mt-5 text-lg font-extrabold">Suggested care path</h3>
            <div className="mt-5 space-y-4 text-sm">
              {[
                ["Profile", profile?.problem ?? "Lower back pain"],
                ["Problem", intake.currentProblem ?? "Not answered"],
                ["Location", intake.location ?? "Not answered"],
                ["Pain level", intake.painLevel != null ? `${intake.painLevel} / 10` : `${profile?.painLevel ?? 4} / 10`],
                ["Symptoms", intake.symptoms ?? "Not answered"],
                ["Duration", intake.duration ?? "Not answered"],
                ["Daily time", intake.dailyTimeMinutes ? `${intake.dailyTimeMinutes} minutes` : `${profile?.dailyTimeMinutes ?? 25} minutes`],
                ["Goal", intake.goal ?? "Not answered"],
                ["Level", intake.difficulty ?? "Not answered"],
                ["AI mode", aiStatus.provider ?? "Local fallback"],
                ["Draft plan", draftPlan?.title ?? "Not approved yet"],
                ["Exercises", draftPlan ? `${draftPlan.exercises.length} pending` : "Ask in chat"],
              ].map(([a, b]) => (
                <div
                  key={a}
                  className="flex justify-between border-b pb-3 last:border-0"
                >
                  <span className="text-slate-400">{a}</span>
                  <span className="font-bold">{b}</span>
                </div>
              ))}
            </div>
            <button
              className="btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!draftPlan}
              onClick={() => send("approve")}
            >
              {draftPlan ? "Approve in chat" : "No draft yet"}
            </button>
          </div>
          <div className="card border-amber-200 bg-amber-50">
            <p className="flex gap-2 text-sm font-extrabold text-amber-800">
              <ShieldCheckIcon /> Safety note
            </p>
            <p className="mt-2 text-xs leading-5 text-amber-700">
              This platform provides general therapeutic exercise guidance and
              does not replace consultation with a doctor or physical therapist.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function ChatPlanPreview({ plan, onApprove }) {
  return (
    <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50/70 p-3 text-ink">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-teal-700">
        {"\u0645\u0639\u0627\u064A\u0646\u0629 \u0627\u0644\u062E\u0637\u0629"}
      </p>
      <h4 className="mt-1 font-extrabold">{plan.title}</h4>
      <p className="mt-1 text-xs text-slate-500">
        {"\u0627\u0644\u062A\u0631\u0643\u064A\u0632"}: {plan.focus} آ· {"\u0627\u0644\u0623\u0644\u0645"} {plan.painLevel}/10 آ· {plan.dailyTimeMinutes} min/day
      </p>
      <div className="mt-3 space-y-2">
        {plan.exercises.map((exercise, index) => (
          <div key={`${exercise.name}-${index}`} className="rounded-xl bg-white/80 p-3">
            <p className="text-sm font-extrabold">{index + 1}. {exercise.name}</p>
            <p className="mt-1 text-xs text-slate-500">
              {exercise.area} آ· {exercise.duration} آ· {exercise.sets} set آ· {exercise.reps} reps
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-600">{plan.safety}</p>
      <button onClick={onApprove} className="btn-primary mt-3 w-full">
        {"\u0645\u0648\u0627\u0641\u0642\u0629 \u0648\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0627\u0644\u062A\u0645\u0627\u0631\u064A\u0646"}
      </button>
    </div>
  );
}
const ShieldCheckIcon = () => <Lock size={17} />;

export function Gamification() {
  const badges = [
    [Flame, "12-day streak", "Earned"],
    [Zap, "Quick starter", "Earned"],
    [Trophy, "Level three", "Earned"],
    [HeartPulse, "Mobility hero", "Next"],
    [Award, "Consistency pro", "Locked"],
    [Star, "Quest master", "Locked"],
  ];
  return (
    <>
      <PageHeader
        eyebrow="Quest & rewards"
        title="Your recovery, leveled up"
        description="Every completed exercise moves you closer to stronger habits and your next reward."
      />
      <StageJourney />
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_.42fr]">
        <div className="card relative overflow-hidden bg-gradient-to-br from-ink to-teal-700 p-8 text-white">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-teal-300/20 blur-3xl" />
          <span className="pill bg-white/10 text-teal-100">
            <Gamepad2 size={15} /> Current quest
          </span>
          <h2 className="mt-8 text-4xl font-extrabold">Stage 3</h2>
          <p className="mt-2 text-white/50">Mobility Builder آ· 82 points</p>
          <div className="mt-8">
            <div className="mb-3 flex justify-between text-xs font-bold">
              <span>18 points to Stage 4</span>
              <span>82%</span>
            </div>
            <Progress value={82} color="bg-teal-300" />
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              ["12", "Day streak"],
              ["38", "Exercises"],
              ["5 ILS", "Earned"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-2xl bg-white/10 p-4">
                <p className="text-xl font-extrabold">{v}</p>
                <p className="mt-1 text-xs text-white/50">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="card flex flex-col items-center justify-center text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-amber-50 text-amber-500">
            <Gift size={30} />
          </span>
          <p className="mt-5 text-xs font-extrabold uppercase tracking-widest text-slate-400">
            Next reward
          </p>
          <h3 className="mt-2 text-xl font-extrabold">5 ILS refund</h3>
          <p className="mt-2 text-sm text-slate-500">Unlock at 100 points</p>
        </div>
      </div>
      <h2 className="mb-5 mt-8 text-xl font-extrabold">Badge collection</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {badges.map(([Icon, t, s], i) => (
          <div
            key={t}
            className={`card flex items-center gap-4 ${s === "Locked" ? "opacity-50 grayscale" : ""}`}
          >
            <span
              className={`grid h-14 w-14 place-items-center rounded-2xl ${i % 2 ? "bg-violet-50 text-violet-600" : "bg-amber-50 text-amber-600"}`}
            >
              <Icon />
            </span>
            <div>
              <p className="font-extrabold">{t}</p>
              <p className="mt-1 text-xs font-bold text-slate-400">{s}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function StageJourney() {
  const stages = [
    { number: 1, points: "15 pts", reward: "5 ILS", state: "complete" },
    { number: 2, points: "40 pts", reward: "Badge", state: "complete" },
    { number: 3, points: "75 pts", reward: "Current", state: "current" },
    { number: 4, points: "100 pts", reward: "5 ILS", state: "locked" },
    { number: 5, points: "150 pts", reward: "Mystery reward", state: "locked" },
  ];

  return (
    <section className="card overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b bg-gradient-to-r from-teal-50 via-white to-violet-50 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-teal-600">
            Recovery stages
          </p>
          <h2 className="mt-2 text-2xl font-extrabold">
            Your path to the next milestone
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Complete exercises and move through every stage.
          </p>
        </div>
        <span className="pill h-fit bg-white text-teal-700 shadow-card">
          <Trophy size={15} /> 2 stages completed
        </span>
      </div>
      <div className="no-scrollbar overflow-x-auto px-6 py-10">
        <div className="mx-auto flex min-w-[760px] max-w-5xl items-start">
          {stages.map((stage, index) => (
            <div key={stage.number} className="flex min-w-0 flex-1 items-start">
              <div className="relative z-10 flex w-32 shrink-0 flex-col items-center text-center">
                {stage.state === "current" && (
                  <motion.span
                    animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.1, 0.35] }}
                    transition={{ duration: 2.2, repeat: Infinity }}
                    className="absolute top-0 h-24 w-24 rounded-full bg-teal-400"
                  />
                )}
                <motion.div
                  whileHover={{ scale: 1.07 }}
                  className={`relative grid h-24 w-24 place-items-center rounded-full border-[7px] shadow-lg transition ${
                    stage.state === "complete"
                      ? "border-teal-100 bg-teal-500 text-white shadow-teal-200/70"
                      : stage.state === "current"
                        ? "border-teal-100 bg-ink text-white shadow-teal-300/70"
                        : "border-slate-100 bg-slate-50 text-slate-300 shadow-slate-100"
                  }`}
                >
                  {stage.state === "complete" ? (
                    <Check size={30} strokeWidth={3} />
                  ) : stage.state === "locked" ? (
                    <Lock size={24} />
                  ) : (
                    <>
                      <span className="absolute top-3 text-[9px] font-extrabold uppercase tracking-widest text-teal-200">
                        Stage
                      </span>
                      <span className="mt-3 text-3xl font-extrabold">
                        {stage.number}
                      </span>
                    </>
                  )}
                  {stage.state === "current" && (
                    <span className="absolute -bottom-3 whitespace-nowrap rounded-full bg-amber-400 px-3 py-1 text-[9px] font-extrabold uppercase tracking-wide text-ink shadow-md">
                      You are here
                    </span>
                  )}
                </motion.div>
                <p
                  className={`mt-5 text-sm font-extrabold ${stage.state === "locked" ? "text-slate-400" : "text-ink"}`}
                >
                  Stage {stage.number}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-400">
                  {stage.points}
                </p>
                <span
                  className={`pill mt-3 ${
                    stage.state === "locked"
                      ? "bg-slate-100 text-slate-400"
                      : stage.state === "current"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-teal-50 text-teal-700"
                  }`}
                >
                  <Gift size={12} />
                  {stage.reward}
                </span>
              </div>
              {index < stages.length - 1 && (
                <div className="relative mt-11 h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width:
                        stage.state === "complete"
                          ? "100%"
                          : stage.state === "current"
                            ? "35%"
                            : "0%",
                    }}
                    transition={{ duration: 0.8, delay: index * 0.12 }}
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-300"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Refunds() {
  return (
    <>
      <PageHeader
        eyebrow="Refund wallet"
        title="Consistency pays back"
        description="Reach milestones through your care plan to reclaim part of your subscription."
        action={
          <button className="btn-primary">
            <WalletCards size={17} /> Claim available refund
          </button>
        }
      />
      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard
          icon={CircleDollarSign}
          label="Subscription amount"
          value="40 ILS"
        />
        <StatCard
          icon={Gift}
          label="Earned refund"
          value="5 ILS"
          note="Available to claim"
          tone="amber"
        />
        <StatCard
          icon={WalletCards}
          label="Remaining refundable"
          value="35 ILS"
          tone="purple"
        />
      </div>
      <div className="card mt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              Refund journey
            </p>
            <h3 className="mt-2 text-xl font-extrabold">
              12.5% of subscription recovered
            </h3>
          </div>
          <p className="text-2xl font-extrabold text-teal-600">5 / 40</p>
        </div>
        <div className="mt-6">
          <Progress value={12.5} />
        </div>
      </div>
      <div className="card mt-5 overflow-x-auto">
        <h3 className="mb-5 text-xl font-extrabold">Reward history</h3>
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="pb-4">Reward</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Level 1 milestone", "May 16, 2026", "5 ILS", "Approved"],
              ["Level 2 milestone", "June 8, 2026", "5 ILS", "Pending"],
            ].map((r) => (
              <tr key={r[0]} className="border-t">
                <td className="py-5 font-extrabold">{r[0]}</td>
                <td>{r[1]}</td>
                <td className="font-bold">{r[2]}</td>
                <td>
                  <Status>{r[3]}</Status>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function MessagesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Messages"
        title="Your care conversation"
        description="Stay connected with your doctor between reviews."
      />
      <div className="card grid min-h-[650px] overflow-hidden p-0 md:grid-cols-[280px_1fr]">
        <aside className="border-r bg-slate-50/60 p-4">
          <input className="field mb-4" placeholder="Search conversations" />
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white p-3 shadow-card ring-1 ring-teal-100"
          >
            <div className="flex items-center gap-3">
              <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-200 to-violet-100 font-extrabold text-violet-700 shadow-inner">
                A
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold">Dr. Aya</p>
                <p className="truncate text-xs text-slate-400">
                  Your plan looks good...
                </p>
              </div>
              <span className="grid h-5 w-5 place-items-center rounded-full bg-teal-500 text-[10px] font-extrabold text-white">2</span>
            </div>
          </motion.div>
        </aside>
        <section className="flex flex-col">
          <div className="flex items-center gap-3 border-b p-5">
            <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 font-extrabold text-violet-700">
              A
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
            </span>
            <div>
              <p className="font-extrabold">Dr. Aya</p>
              <p className="flex items-center gap-1 text-xs text-teal-600">
                <span className="h-2 w-2 rounded-full bg-teal-500 anim-pulse-glow" />
                Usually replies within a day
              </p>
            </div>
          </div>
          <div className="flex-1 space-y-4 bg-gradient-to-b from-slate-50/60 to-white p-5">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md rounded-3xl rounded-bl-md bg-white p-4 text-sm leading-6 shadow-card"
            >
              Hi Salma, your progress this week looks strong. How did the lower
              back mobility exercise feel?
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="ml-auto max-w-md rounded-3xl rounded-br-md bg-ink p-4 text-sm leading-6 text-white shadow-lg shadow-teal-900/10"
            >
              Much better. I feel less tight after work now.
            </motion.div>
          </div>
          <div className="border-t bg-white p-4">
            <div className="flex gap-2">
              <input className="field" placeholder="Write a message..." />
              <button className="btn-primary px-4">
                <Send size={18} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
