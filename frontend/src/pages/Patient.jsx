import { useEffect, useMemo, useRef, useState } from "react";
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
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Flame,
  Gamepad2,
  Gift,
  HeartPulse,
  History,
  Lock,
  MessageCircle,
  Pause,
  Play,
  Rabbit,
  RotateCcw,
  Square,
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
import { PageHeader, Progress, StatCard, Status } from "../components/UI";
import { usePatientData } from "../components/PatientData";
import { GuidedCameraPane } from "../components/GuidedCameraPane";
import { getExerciseById } from "../exercises";
import { useLanguage } from "../i18n/LanguageContext";
import { api } from "../services/api";
import { useSession } from "../services/session";
import { EXERCISE_TEMPLATES } from "../../../shared/remedyCore.mjs";

// Maps each exercise template from the daily plan to the rule file that knows
// how to analyze that movement on camera. Exercises that don't have a matching
// rule simply don't expose the camera toggle — we'd rather be honest about
// what we can actually score than fake feedback.
const exerciseCameraRuleByPlanId = {
  1: "neckStretch",     // Neck release
  2: "armRaise",        // Shoulder rolls (shares the shoulder/elbow geometry)
  5: "backStretch",     // Posture reset
};

// The care-plan chat is Arabic, so exercises it creates carry Arabic names.
// In the English UI show the matching template's English name instead.
const ARABIC_TEXT = /[\u0600-\u06FF]/;
function exerciseText(exercise, isArabic) {
  const template = EXERCISE_TEMPLATES[exercise.templateId];
  if (!isArabic && template && ARABIC_TEXT.test(exercise.name)) return { name: template.name, area: template.area };
  return { name: exercise.name, area: exercise.area };
}

function todayLabel(isArabic) {
  return new Intl.DateTimeFormat(isArabic ? "ar-PS" : "en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
}

function greeting(name, isArabic) {
  const hour = new Date().getHours();
  const first = String(name || "").split(/\s+/)[0];
  if (isArabic) return hour < 12 ? `صباح الخير، ${first}` : `مساء الخير، ${first}`;
  if (hour < 12) return `Good morning, ${first}`;
  if (hour < 18) return `Good afternoon, ${first}`;
  return `Good evening, ${first}`;
}

// Bilingual helper for strings with numbers or names in them; static copy
// goes through the translation table instead.
function useText() {
  const { isArabic } = useLanguage();
  return (en, ar) => (isArabic ? ar : en);
}

function PageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="skeleton h-40" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((key) => <div key={key} className="skeleton h-40" />)}
      </div>
      <div className="skeleton h-72" />
    </div>
  );
}

export function PatientDashboard() {
  const { isArabic } = useLanguage();
  const L = useText();
  const session = useSession();
  const { overview, error } = usePatientData();
  const name = overview?.user.name ?? session?.user.name ?? "";

  if (!overview) return error ? <p className="card text-sm font-bold text-rose-700">{error}</p> : <PageSkeleton />;

  const { stats, plan, exercises, profile, progress } = overview;
  const hasPlan = plan.total > 0;

  return (
    <>
      <PageHeader
        eyebrow={todayLabel(isArabic)}
        title={greeting(name, isArabic)}
        description={overview.isNew ? "Welcome to RemedyQuest. Let's set up your first care plan together." : "Your body has shown up for you today. Let's return the favor."}
        action={
          <Link to={hasPlan ? "/patient/exercises" : "/patient/chat"} className="btn-primary">
            {hasPlan ? <Play size={16} /> : <Bot size={16} />}
            {hasPlan ? "Start today's exercises" : "Build my plan"}
          </Link>
        }
      />

      {overview.isNew && <WelcomeSteps />}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Star}
          label="Current points"
          value={L(`${stats.points} pts`, `${stats.points} نقطة`)}
          note={stats.weekPoints ? L(`+${stats.weekPoints} this week`, `+${stats.weekPoints} هذا الأسبوع`) : L("+5 per exercise", "+5 لكل تمرين")}
          trend={stats.points ? stats.pointsTrend : undefined}
        />
        <StatCard
          icon={Trophy}
          label="Current level"
          value={L(`Level ${stats.level}`, `المستوى ${stats.level}`)}
          note={stats.nextLevelPoints == null ? L("Top level reached", "وصلت لأعلى مستوى") : L(`${stats.pointsToNext} pts to Level ${stats.level + 1}`, `${stats.pointsToNext} نقطة للمستوى ${stats.level + 1}`)}
          tone="purple"
        />
        <StatCard
          icon={Flame}
          label="Day streak"
          value={L(`${stats.streak} ${stats.streak === 1 ? "day" : "days"}`, `${stats.streak} ${stats.streak === 1 ? "يوم" : "أيام"}`)}
          note={stats.streak ? L("Keep it going", "حافظ على الاستمرار") : L("Exercise today to start", "تمرّن اليوم لتبدأ")}
          tone="amber"
        />
        <StatCard
          icon={CircleDollarSign}
          label="Refund earned"
          value={L(`${stats.refundIls} ILS`, `${stats.refundIls} شيكل`)}
          note={stats.refundIls ? L(`${overview.rewards.percent}% returned`, `تم استرداد ${overview.rewards.percent}%`) : L("Unlocks at Level 3", "يُفتح عند المستوى 3")}
          tone="blue"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_.6fr]">
        <div className="card p-6">
          {hasPlan ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="pill bg-teal-50 text-teal-700">
                    <HeartPulse size={14} /> Today's care plan
                  </span>
                  <h2 className="mt-4 text-2xl font-extrabold">{L("Your movement plan", "خطة الحركة الخاصة بك")}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {L(`${plan.total} exercises · ${plan.minutes} minutes`, `${plan.total} تمارين · ${plan.minutes} دقيقة`)}
                  </p>
                </div>
                <div className="text-end">
                  <p className="text-2xl font-extrabold">{plan.percent}%</p>
                  <p className="text-xs font-bold text-slate-400">
                    {L(`${plan.completed} of ${plan.total} complete`, `اكتمل ${plan.completed} من ${plan.total}`)}
                  </p>
                </div>
              </div>
              <div className="mt-7">
                <Progress value={plan.percent} />
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {exercises.slice(0, 4).map((e, i) => (
                  <Link
                    key={e.id}
                    to="/patient/exercises"
                    className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 transition hover:border-teal-200 hover:shadow-card"
                  >
                    <span className={`grid h-10 w-10 place-items-center rounded-xl transition-transform group-hover:scale-110 ${e.color}`}>
                      {e.done ? <Check size={17} /> : <span className="text-xs font-extrabold">{i + 1}</span>}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold">{exerciseText(e, isArabic).name}</p>
                      <p className="truncate text-xs text-slate-400">{e.duration} · {exerciseText(e, isArabic).area}</p>
                    </div>
                    {!e.done && (
                      <ArrowRight size={14} className="ms-auto text-slate-300 transition group-hover:translate-x-1 group-hover:text-teal-600" />
                    )}
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No care plan yet"
              text="Answer a few short questions with your AI assistant and it will suggest a gentle plan for you to approve."
              action={<Link to="/patient/chat" className="btn-primary"><Bot size={16} /> Start with the assistant</Link>}
            />
          )}
        </div>
        <div className="card lux-dark relative flex flex-col overflow-hidden text-white">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-teal-300/25 blur-3xl anim-float" />
          <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white/10 backdrop-blur">
            <Bot />
          </span>
          <h3 className="relative mt-6 text-2xl font-extrabold">How are you feeling today?</h3>
          <p className="relative mt-3 text-sm leading-6 text-white/65">
            Tell your AI assistant about any changes before starting your plan.
          </p>
          <Link
            to="/patient/chat"
            className="group relative mt-6 flex items-center justify-between rounded-2xl bg-white/10 p-4 text-sm font-extrabold transition hover:bg-white/15 xl:mt-auto"
          >
            Chat with AI
            <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_.4fr]">
        <ProgressChart data={progress} weekPoints={stats.weekPoints} />
        <div className="card">
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-slate-400">Health focus</p>
          <h3 className="mt-3 text-xl font-extrabold">{profile.problem ? L(profile.problem, translateProblem(profile.problem)) : L("Not set yet", "لم يُحدد بعد")}</h3>
          <div className="mt-5 space-y-3 text-sm">
            {[
              ["Pain level", profile.painLevel != null ? `${profile.painLevel}/10` : "—"],
              ["Daily time", profile.dailyTimeMinutes ? L(`${profile.dailyTimeMinutes} min`, `${profile.dailyTimeMinutes} دقيقة`) : "—"],
              ["Exercises done", String(stats.exercisesCompleted)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-slate-100 pb-3 last:border-0">
                <span className="text-slate-400">{label}</span>
                <span className="font-extrabold" data-no-translate>{value}</span>
              </div>
            ))}
          </div>
          {profile.painLevel == null && (
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Share how you feel with the assistant to personalise your plan.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

const PROBLEM_AR = {
  "Lower back pain": "ألم أسفل الظهر",
  "Neck stiffness": "تيبس الرقبة",
  "Shoulder pain": "ألم الكتف",
  "Joint pain": "ألم المفاصل",
  "Posture correction": "تصحيح الوضعية",
};

function translateProblem(problem) {
  return PROBLEM_AR[problem] ?? problem;
}

function WelcomeSteps() {
  const steps = [
    [Bot, "Tell the assistant how you feel", "A short chat about your pain, movement and time.", "/patient/chat"],
    [CheckCircle2, "Approve your care plan", "Review the suggested exercises and add them to your day.", "/patient/chat"],
    [Trophy, "Move, earn and level up", "Each completed exercise earns 5 points toward rewards.", "/patient/exercises"],
  ];
  return (
    <section className="card mb-5 overflow-hidden p-0">
      <div className="border-b border-slate-100 bg-gradient-to-r from-[#f7f1e4]/70 via-white to-teal-50/60 px-6 py-5">
        <p className="lux-eyebrow">Getting started</p>
        <h2 className="mt-2 text-2xl font-extrabold">Three steps to your first plan</h2>
      </div>
      <ol className="grid gap-px bg-slate-100 md:grid-cols-3">
        {steps.map(([Icon, title, text, to], index) => (
          <li key={title} className="bg-white">
            <Link to={to} className="group flex h-full gap-4 p-6 transition hover:bg-slate-50/70">
              <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-700">
                <Icon size={19} />
                <span className="absolute -end-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-[10px] font-extrabold text-white">{index + 1}</span>
              </span>
              <span>
                <span className="block font-extrabold">{title}</span>
                <span className="mt-1 block text-sm leading-6 text-slate-500">{text}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-teal-50 to-[#f7f1e4] text-teal-700 shadow-inner">
        <Icon size={26} />
      </span>
      <h3 className="mt-5 text-xl font-extrabold">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
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

function ProgressChart({ data, weekPoints }) {
  const L = useText();
  const empty = !data.some((day) => day.score > 0);
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
          {L(`${weekPoints} pts this week`, `${weekPoints} نقطة هذا الأسبوع`)}
        </span>
      </div>
      <div className="relative h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="score" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#20a88a" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#20a88a" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="scoreStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#20a88a" />
                <stop offset="100%" stopColor="#c9a45c" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8eeee" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
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
        {empty && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <p className="rounded-2xl bg-white/90 px-4 py-2 text-sm font-bold text-slate-500 shadow-sm">
              Complete an exercise to see your progress here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ExerciseSchedule() {
  const { overview, error, setOverview } = usePatientData();
  const [activeExercise, setActiveExercise] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [toast, setToast] = useState("");
  const { isArabic } = useLanguage();
  const L = useText();

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!overview) return error ? <p className="card text-sm font-bold text-rose-700">{error}</p> : <PageSkeleton />;

  const items = overview.exercises;
  const done = items.filter((x) => x.done).length;
  const percent = items.length ? Math.round((done / items.length) * 100) : 0;

  const setDone = async (id, value) => {
    setSaveError("");
    try {
      const result = await api.setExerciseDone(id, value);
      setOverview(result.overview);
      if (result.awarded) setToast(L(`+${result.awarded} points earned`, `+${result.awarded} نقاط`));
    } catch (apiError) {
      setSaveError(apiError.message);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Daily plan"
        title="Today's movement quest"
        description="Move gently and stop if an exercise causes sharp or unusual pain."
        action={items.length > 0 && (
          <span className="pill bg-teal-50 text-teal-700">
            <Clock3 size={15} /> {L(`${overview.plan.minutes} minutes`, `${overview.plan.minutes} دقيقة`)}
          </span>
        )}
      />
      {items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={CalendarDays}
            title="Your plan is empty"
            text="Your exercises appear here after you approve a plan with the AI assistant. It only takes a couple of minutes."
            action={<Link to="/patient/chat" className="btn-primary"><Bot size={16} /> Build my plan</Link>}
          />
        </div>
      ) : (
        <>
          <div className="card mb-5 flex flex-col gap-4 md:flex-row md:items-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-600">
              <Target />
            </span>
            <div className="flex-1">
              <div className="mb-2 flex justify-between text-sm font-extrabold">
                <span>{L(`${done} of ${items.length} exercises complete`, `اكتمل ${done} من ${items.length} تمارين`)}</span>
                <span>{percent}%</span>
              </div>
              <Progress value={percent} />
            </div>
            <span className="pill bg-amber-50 text-amber-700">+5 points each</span>
          </div>
          {saveError && <p className="mb-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{saveError}</p>}
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
                <div className={`absolute inset-x-0 top-0 h-1 ${e.done ? "bg-teal-400" : "bg-gradient-to-r from-teal-400 via-[#c9a45c] to-amber-300"}`} />
                <div className="flex items-start justify-between">
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${e.color}`}
                  >
                    {e.done ? <CheckCircle2 /> : <Activity />}
                  </span>
                  <Status>{e.done ? "Completed" : "Not completed"}</Status>
                </div>
                <h3 className="mt-5 text-xl font-extrabold">{exerciseText(e, isArabic).name}</h3>
                <p className="mt-1 text-sm text-slate-500">{exerciseText(e, isArabic).area}</p>
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
                      <p className="text-[10px] font-bold uppercase text-slate-400">{l}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs leading-5 text-slate-500">
                  Move slowly through a comfortable range, breathe steadily, and
                  keep your posture relaxed.
                </p>
                <div className="mt-5 flex gap-2">
                  <button onClick={() => setActiveExercise(e)} className="btn-primary flex-1">
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
        </>
      )}
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
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            role="status"
            className="fixed bottom-6 start-1/2 z-[90] flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-extrabold text-white shadow-2xl ring-1 ring-[#c9a45c]/40 rtl:translate-x-1/2"
          >
            <Star size={16} className="text-[#e6cf9b]" /> {toast}
          </motion.div>
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
  const { isArabic } = useLanguage();
  const templateId = exercise.templateId ?? exercise.id;
  const guide = exerciseGuides[templateId] ?? exerciseGuides[5];
  const [playing, setPlaying] = useState(true);
  // Reps completed in the current set (starts at 0, like a real counter).
  const [reps, setReps] = useState(0);
  const [set, setSet] = useState(1);
  const [phase, setPhase] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraStats, setCameraStats] = useState({ total: 0, correct: 0 });
  const totalReps = Number(exercise.reps);
  const totalSets = Number(exercise.sets);
  const progress = (((set - 1) * totalReps + reps) / (totalSets * totalReps)) * 100;
  const isLastRep = set === totalSets && reps === totalReps - 1;

  // Resolve the rule file for this plan exercise (or null if we don't support
  // it on camera yet). We look it up by the plan-side id, not by name, so
  // the UI stays in sync if a coach renames an exercise.
  const cameraRule = exerciseCameraRuleByPlanId[templateId]
    ? getExerciseById(exerciseCameraRuleByPlanId[templateId])
    : null;

  useEffect(() => {
    // Pause the SVG animation when the camera is on — it's hidden anyway.
    if (cameraMode) return undefined;
    if (!playing) return undefined;
    const timer = window.setInterval(
      () => setPhase((current) => (current + 1) % guide.phases.length),
      1800 / speed,
    );
    return () => window.clearInterval(timer);
  }, [guide.phases.length, playing, speed, cameraMode]);

  // Functional updates so several camera reps in quick succession all count.
  const repStateRef = useRef({ set: 1, reps: 0, done: false });
  const nextRep = () => {
    const current = repStateRef.current;
    if (current.done) return;
    if (current.reps + 1 < totalReps) {
      current.reps += 1;
    } else if (current.set < totalSets) {
      current.set += 1;
      current.reps = 0;
    } else {
      current.reps = totalReps;
      current.done = true;
      setReps(current.reps);
      onComplete();
      return;
    }
    setSet(current.set);
    setReps(current.reps);
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
          <h2 className="mt-2 pe-10 text-3xl font-extrabold">{exerciseText(exercise, isArabic).name}</h2>
          <p className="mt-2 text-sm text-slate-500">{exerciseText(exercise, isArabic).area} · {exercise.duration}</p>
          <div className="my-7">
            <div className="mb-2 flex justify-between text-xs font-extrabold">
              <span>{isArabic ? `الجولة ${set} من ${totalSets}` : `Set ${set} of ${totalSets}`}</span>
              <span>{isArabic ? `التكرار ${reps} من ${totalReps}` : `Rep ${reps} of ${totalReps}`}</span>
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
                    ? "Use your webcam — we count reps and flag form issues in real time."
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
              aria-label={isLastRep ? "Finish exercise" : "Complete this rep"}
              onClick={nextRep}
              className="btn-primary w-full py-4"
            >
              <Check size={17} />
              <span key={isLastRep ? "finish" : "rep"}>
                {isLastRep ? "Finish exercise" : "Complete this rep"}
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
  const { refresh } = usePatientData();
  const [messages, setMessages] = useState([]);
  const [profile, setProfile] = useState(null);
  const [intake, setIntake] = useState({});
  const [draftPlan, setDraftPlan] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [aiStatus, setAiStatus] = useState({ enabled: false, provider: "Local fallback" });
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);
  const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId) ?? null;
  const displayedMessages = selectedConversation?.messages ?? messages;
  const visibleIntake = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index]?.intake) return { ...intake, ...messages[index].intake };
    }
    return intake;
  }, [intake, messages]);
  const quickReplies = useMemo(
    () => getChatQuickReplies(visibleIntake, draftPlan),
    [visibleIntake, draftPlan],
  );

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
          setConversations(payload.conversations ?? []);
          setAiStatus(payload.ai ?? { enabled: false, provider: "Local fallback" });
        }
      })
      .catch((apiError) => active && setError(apiError.message));
    return () => {
      active = false;
    };
  }, []);

  // Auto-scroll to the latest message whenever the list changes — but only
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
      if (payload.messages?.some((message) => message.planApplied)) refresh();
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

  const endCurrentConversation = async () => {
    if (!messages.some((message) => message.from === "user")) return;
    setError("");
    setEnding(true);
    try {
      const payload = await api.endPatientConversation();
      setConversations(payload.conversations ?? []);
      setMessages(payload.messages ?? []);
      setIntake(payload.intake ?? {});
      setDraftPlan(null);
      setSelectedConversationId(null);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setEnding(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="المساعدة الصحية الذكية"
        title="دعينا نفهم حالتك اليوم"
        description="تساعد إجاباتك في إعداد خطة تمارين مقترحة لمراجعتها قبل اعتمادها."
      />
      <div className="grid items-start gap-5 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        <ChatHistory
          conversations={conversations}
          selectedId={selectedConversationId}
          onSelect={setSelectedConversationId}
          onNew={() => setSelectedConversationId(null)}
        />
        <div className="card flex min-h-[650px] flex-col p-0 overflow-hidden">
          <div className="flex items-center gap-3 border-b p-5">
            <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-100 to-teal-50 text-teal-600 shadow-inner">
              <Bot />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
            </span>
            <div>
              <p className="text-sm font-extrabold">{"\u0627\u0644\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0635\u062D\u064A"}</p>
              <p className="flex items-center gap-1 text-xs text-teal-600">
                <span className="h-2 w-2 rounded-full bg-teal-500 anim-pulse-glow" /> متصل الآن
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {selectedConversation && <span className="pill bg-slate-100 text-slate-600">محادثة منتهية</span>}
              <span className="pill bg-violet-50 text-violet-700">
                <Sparkles size={13} /> {aiStatus.enabled ? "الذكاء الاصطناعي مفعّل" : "الوضع المحلي"}
              </span>
            </div>
          </div>
          <div ref={scrollRef} className="no-scrollbar flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-slate-50/60 to-white p-5">
            {displayedMessages.map((m, i) => (
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
            {selectedConversation ? (
              <button className="btn-primary w-full" onClick={() => setSelectedConversationId(null)}>
                العودة إلى المحادثة الحالية
              </button>
            ) : (
              <>
                {quickReplies.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2" dir="rtl">
                    {quickReplies.map((reply) => (
                      <button
                        type="button"
                        key={reply}
                        disabled={sending}
                        onClick={() => send(reply)}
                        className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 transition hover:border-teal-400 hover:bg-teal-100 disabled:opacity-50"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
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
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    اضغطي <span className="kbd">Enter</span> للإرسال
                  </p>
                  <button
                    type="button"
                    onClick={endCurrentConversation}
                    disabled={ending || !messages.some((message) => message.from === "user")}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-xs font-extrabold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Square size={13} fill="currentColor" />
                    {ending ? "جارٍ الحفظ..." : "إنهاء المحادثة"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="space-y-5">
          <div className="card">
            <span className="pill bg-teal-50 text-teal-700">
              <CheckCircle2 size={14} /> ملخص الإجابات
            </span>
            <h3 className="mt-5 text-lg font-extrabold">الخطة المقترحة</h3>
            <div className="mt-5 space-y-4 text-sm">
              {[
                ["الملف", profile?.problem ? translateProblem(profile.problem) : "لم يُحدد"],
                ["المشكلة", visibleIntake.currentProblem ?? "لم تتم الإجابة"],
                ["المكان", visibleIntake.location ?? "لم تتم الإجابة"],
                ["درجة الألم", visibleIntake.painLevel != null ? `${visibleIntake.painLevel} \u0645\u0646 10` : "لم تتم الإجابة"],
                ["الأعراض", visibleIntake.symptoms ?? "لم تتم الإجابة"],
                ["المدة", visibleIntake.duration ?? "لم تتم الإجابة"],
                ["الوقت اليومي", visibleIntake.dailyTimeMinutes ? `${visibleIntake.dailyTimeMinutes} دقيقة` : "لم تتم الإجابة"],
                ["الهدف", visibleIntake.goal ?? "لم تتم الإجابة"],
                ["المستوى", visibleIntake.difficulty ?? "لم تتم الإجابة"],
                ["وضع المساعد", aiStatus.enabled ? "متصل" : "محلي"],
                ["مسودة الخطة", draftPlan?.title ?? "لا توجد مسودة"],
                ["التمارين", draftPlan ? `${draftPlan.exercises.length} بانتظار الموافقة` : "أكملي المحادثة"],
              ].map(([a, b]) => (
                <div
                  key={a}
                  className="flex justify-between border-b pb-3 last:border-0"
                >
                  <span className="text-slate-400">{a}</span>
                  <span className="font-bold" data-no-translate>
                    {b}
                  </span>
                </div>
              ))}
            </div>
            <button
              className="btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!draftPlan}
              onClick={() => send("approve")}
            >
              {draftPlan ? "الموافقة على الخطة" : "لا توجد مسودة بعد"}
            </button>
          </div>
          <div className="card border-amber-200 bg-amber-50">
            <p className="flex gap-2 text-sm font-extrabold text-amber-800">
              <ShieldCheckIcon /> تنبيه للسلامة
            </p>
            <p className="mt-2 text-xs leading-5 text-amber-700">
              يقدم هذا التطبيق إرشادات عامة للتمارين، ولا يغني عن استشارة الطبيب
              أو أخصائي العلاج الطبيعي.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function getChatQuickReplies(intake, draftPlan) {
  if (draftPlan) return ["موافقة", "تغيير"];
  if (!intake.currentProblem) return ["الرأس", "الرقبة", "الكتف", "الظهر", "الركبة"];
  if (!intake.location) {
    if (intake.currentProblem === "head") return ["الجبهة", "خلف الرأس", "أعلى الرأس", "جهة واحدة", "حول العينين"];
    if (intake.currentProblem === "neck") return ["خلف الرقبة", "الجانب الأيمن", "الجانب الأيسر", "يمتد إلى الكتف"];
    if (intake.currentProblem === "shoulder") return ["الكتف الأيمن", "الكتف الأيسر", "أمام الكتف", "خلف الكتف"];
    if (intake.currentProblem === "knee") return ["أمام الركبة", "خلف الركبة", "داخل الركبة", "خارج الركبة"];
    return ["أعلى الظهر", "منتصف الظهر", "أسفل الظهر", "جهة واحدة"];
  }
  if (intake.painLevel == null) return ["2", "4", "6", "8"];
  if (!intake.symptoms) return ["لا يوجد", "تنميل أو وخز", "ضعف", "تورم", "دوخة"];
  if (!intake.duration) return ["منذ اليوم", "منذ أسبوع", "منذ شهر", "أكثر من 3 أشهر"];
  if (!intake.dailyTimeMinutes) return ["10", "15", "20", "30"];
  if (!intake.goal) return ["تخفيف الألم", "تحسين الحركة", "زيادة القوة", "تحسين الوضعية"];
  if (!intake.difficulty) return ["سهل", "متوسط", "متقدم"];
  return [];
}

function ChatHistory({ conversations, selectedId, onSelect, onNew }) {
  const formatDate = (value) => {
    if (!value) return "";
    return new Intl.DateTimeFormat("ar-PS", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  };

  return (
    <aside className="card p-4" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="pill bg-teal-50 text-teal-700">
            <History size={14} /> سجل المحادثات
          </span>
          <p className="mt-2 text-xs text-slate-400">{conversations.length} محادثة محفوظة</p>
        </div>
        <button
          type="button"
          onClick={onNew}
          className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-white transition hover:bg-teal-800"
          title="المحادثة الحالية"
          aria-label="المحادثة الحالية"
        >
          <Bot size={17} />
        </button>
      </div>

      <button
        type="button"
        onClick={onNew}
        className={`mt-4 w-full rounded-2xl border p-3 text-right transition ${
          selectedId == null ? "border-teal-300 bg-teal-50" : "border-slate-100 hover:border-teal-200"
        }`}
      >
        <p className="text-sm font-extrabold text-ink">المحادثة الحالية</p>
        <p className="mt-1 text-xs text-emerald-600">نشطة الآن</p>
      </button>

      <div className="mt-3 max-h-[505px] space-y-2 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center">
            <History className="mx-auto text-slate-300" size={24} />
            <p className="mt-3 text-sm font-bold text-slate-500">لا توجد محادثات منتهية</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">ستظهر هنا بعد الضغط على إنهاء المحادثة.</p>
          </div>
        ) : conversations.map((conversation) => (
          <button
            type="button"
            key={conversation.id}
            onClick={() => onSelect(conversation.id)}
            className={`w-full rounded-2xl border p-3 text-right transition ${
              selectedId === conversation.id
                ? "border-teal-300 bg-teal-50"
                : "border-slate-100 bg-white hover:border-teal-200 hover:bg-slate-50"
            }`}
          >
            <p className="truncate text-sm font-extrabold text-ink">{conversation.title}</p>
            <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={12} /> {formatDate(conversation.endedAt)}
              </span>
              <span>{conversation.messageCount} رسائل</span>
            </div>
          </button>
        ))}
      </div>
    </aside>
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
        {"\u0627\u0644\u062A\u0631\u0643\u064A\u0632"}: {plan.focus} · {"\u0627\u0644\u0623\u0644\u0645"} {plan.painLevel}/10 · {plan.dailyTimeMinutes} دقيقة يوميًا
      </p>
      <div className="mt-3 space-y-2">
        {plan.exercises.map((exercise, index) => (
          <div key={`${exercise.name}-${index}`} className="rounded-xl bg-white/80 p-3">
            <p className="text-sm font-extrabold">{index + 1}. {exercise.name}</p>
            <p className="mt-1 text-xs text-slate-500">
              {exercise.area} · {exercise.duration} · {exercise.sets} جولة · {exercise.reps} تكرارات
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

const BADGE_ICONS = { streak: Flame, starter: Zap, level3: Trophy, hero: HeartPulse, consistency: Award, master: Star };

export function Gamification() {
  const { overview, error } = usePatientData();
  const L = useText();
  if (!overview) return error ? <p className="card text-sm font-bold text-rose-700">{error}</p> : <PageSkeleton />;
  const { stats, stages, badges, rewards } = overview;
  const stageNames = ["Getting started", "First steps", "Mobility Builder", "Strength Seeker", "Quest Master"];

  return (
    <>
      <PageHeader
        eyebrow="Quest & rewards"
        title="Your recovery, leveled up"
        description="Every completed exercise moves you closer to stronger habits and your next reward."
      />
      <StageJourney stages={stages} levelProgress={stats.levelProgress} />
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_.42fr]">
        <div className="card lux-dark relative overflow-hidden p-8 text-white">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-teal-300/20 blur-3xl" />
          <span className="pill border border-[#c9a45c]/30 bg-white/5 text-[#e6cf9b]">
            <Gamepad2 size={15} /> Current quest
          </span>
          <h2 className="mt-8 text-4xl font-extrabold">{L(`Stage ${stats.level}`, `المرحلة ${stats.level}`)}</h2>
          <p className="mt-2 text-white/50">
            {L(`${stageNames[stats.level - 1]} · ${stats.points} points`, `${stats.points} نقطة`)}
          </p>
          <div className="mt-8">
            <div className="mb-3 flex justify-between text-xs font-bold">
              <span>
                {stats.nextLevelPoints == null
                  ? L("All stages complete", "اكتملت كل المراحل")
                  : L(`${stats.pointsToNext} points to Stage ${stats.level + 1}`, `${stats.pointsToNext} نقطة للمرحلة ${stats.level + 1}`)}
              </span>
              <span>{stats.levelProgress}%</span>
            </div>
            <Progress value={stats.levelProgress} color="bg-teal-300" />
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              [String(stats.streak), "Day streak"],
              [String(stats.exercisesCompleted), "Exercises"],
              [L(`${stats.refundIls} ILS`, `${stats.refundIls} شيكل`), "Earned"],
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
          <p className="mt-5 text-xs font-extrabold uppercase tracking-widest text-slate-400">Next reward</p>
          {rewards.nextRefundLevel ? (
            <>
              <h3 className="mt-2 text-xl font-extrabold">{L("5 ILS refund", "استرداد 5 شيكل")}</h3>
              <p className="mt-2 text-sm text-slate-500">
                {L(`Unlock at ${stages[rewards.nextRefundLevel - 1].points} points`, `يُفتح عند ${stages[rewards.nextRefundLevel - 1].points} نقطة`)}
              </p>
            </>
          ) : (
            <>
              <h3 className="mt-2 text-xl font-extrabold">Mystery reward</h3>
              <p className="mt-2 text-sm text-slate-500">{L("Unlock at 150 points", "يُفتح عند 150 نقطة")}</p>
            </>
          )}
        </div>
      </div>
      <h2 className="mb-5 mt-8 text-xl font-extrabold">Badge collection</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {badges.map((badge, i) => {
          const Icon = BADGE_ICONS[badge.key] ?? Star;
          return (
            <div key={badge.key} className={`card flex items-center gap-4 ${badge.earned ? "" : "opacity-50 grayscale"}`}>
              <span className={`grid h-14 w-14 place-items-center rounded-2xl ${i % 2 ? "bg-violet-50 text-violet-600" : "bg-amber-50 text-amber-600"}`}>
                <Icon />
              </span>
              <div>
                <p className="font-extrabold">{badge.key === "streak" && badge.earned ? L(badge.label, `سلسلة ${stats.streak} أيام`) : badge.label}</p>
                <p className="mt-1 text-xs font-bold text-slate-400">{badge.earned ? "Earned" : "Locked"}</p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function StageJourney({ stages, levelProgress }) {
  const L = useText();
  const completedCount = stages.filter((stage) => stage.state === "complete").length;
  const rewardLabel = (stage) => {
    if (stage.state === "current") return "Current";
    if (stage.reward === "5 ILS") return L("5 ILS", "5 شيكل");
    return stage.reward;
  };

  return (
    <section className="card overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b bg-gradient-to-r from-teal-50 via-white to-[#f7f1e4]/70 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="lux-eyebrow">Recovery stages</p>
          <h2 className="mt-2 text-2xl font-extrabold">Your path to the next milestone</h2>
          <p className="mt-1 text-sm text-slate-500">Complete exercises and move through every stage.</p>
        </div>
        <span className="pill h-fit bg-white text-teal-700 shadow-card">
          <Trophy size={15} /> {L(`${completedCount} ${completedCount === 1 ? "stage" : "stages"} completed`, `${completedCount} مراحل مكتملة`)}
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
                        ? "border-[#ead9b4] bg-ink text-white shadow-teal-300/70"
                        : "border-slate-100 bg-slate-50 text-slate-300 shadow-slate-100"
                  }`}
                >
                  {stage.state === "complete" ? (
                    <Check size={30} strokeWidth={3} />
                  ) : stage.state === "locked" ? (
                    <Lock size={24} />
                  ) : (
                    <>
                      <span className="absolute top-3 text-[9px] font-extrabold uppercase tracking-widest text-[#e6cf9b]">Stage</span>
                      <span className="mt-3 text-3xl font-extrabold">{stage.number}</span>
                    </>
                  )}
                  {stage.state === "current" && (
                    <span className="absolute -bottom-3 whitespace-nowrap rounded-full bg-amber-400 px-3 py-1 text-[9px] font-extrabold uppercase tracking-wide text-ink shadow-md">
                      You are here
                    </span>
                  )}
                </motion.div>
                <p className={`mt-5 text-sm font-extrabold ${stage.state === "locked" ? "text-slate-400" : "text-ink"}`}>
                  {L(`Stage ${stage.number}`, `المرحلة ${stage.number}`)}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-400">{L(`${stage.points} pts`, `${stage.points} نقطة`)}</p>
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
                  {rewardLabel(stage)}
                </span>
              </div>
              {index < stages.length - 1 && (
                <div className="relative mt-11 h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: stage.state === "complete" ? "100%" : stage.state === "current" ? `${levelProgress}%` : "0%",
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
  const { overview, error } = usePatientData();
  const { isArabic } = useLanguage();
  const L = useText();
  if (!overview) return error ? <p className="card text-sm font-bold text-rose-700">{error}</p> : <PageSkeleton />;
  const { rewards } = overview;
  const formatDate = (value) => new Intl.DateTimeFormat(isArabic ? "ar-PS" : "en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
  const ils = (value) => L(`${value} ILS`, `${value} شيكل`);

  return (
    <>
      <PageHeader
        eyebrow="Refund wallet"
        title="Consistency pays back"
        description="Reach milestones through your care plan to reclaim part of your subscription."
        action={
          <button className="btn-primary disabled:cursor-not-allowed disabled:opacity-50" disabled={!rewards.refundIls}>
            <WalletCards size={17} /> {rewards.refundIls ? "Claim available refund" : "No refund to claim yet"}
          </button>
        }
      />
      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard icon={CircleDollarSign} label="Subscription amount" value={ils(rewards.subscriptionIls)} />
        <StatCard
          icon={Gift}
          label="Earned refund"
          value={ils(rewards.refundIls)}
          note={rewards.refundIls ? "Available to claim" : "Unlocks at Level 3"}
          tone="amber"
        />
        <StatCard icon={WalletCards} label="Remaining refundable" value={ils(rewards.remainingIls)} tone="purple" />
      </div>
      <div className="card mt-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Refund journey</p>
            <h3 className="mt-2 text-xl font-extrabold">
              {L(`${rewards.percent}% of subscription recovered`, `تم استرداد ${rewards.percent}% من الاشتراك`)}
            </h3>
          </div>
          <p className="shrink-0 whitespace-nowrap text-2xl font-extrabold text-teal-600" dir="ltr">{rewards.refundIls} / {rewards.subscriptionIls}</p>
        </div>
        <div className="mt-6">
          <Progress value={rewards.percent} />
        </div>
      </div>
      <div className="card mt-5">
        <h3 className="mb-5 text-xl font-extrabold">Reward history</h3>
        {rewards.history.length === 0 ? (
          <EmptyState
            icon={Gift}
            title="No rewards yet"
            text="Reach Level 3 to earn your first 5 ILS refund. Every completed exercise brings you closer."
            action={<Link to="/patient/exercises" className="btn-soft">Go to my exercises</Link>}
          />
        ) : (
          <>
          <ul className="space-y-3 sm:hidden">
            {rewards.history.map((reward) => (
              <li key={reward.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 p-4">
                <div>
                  <p className="font-extrabold">{L(reward.label, reward.label.replace(/^Level (\d+) milestone$/, "إنجاز المستوى $1"))}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(reward.date)} · {ils(reward.amount)}</p>
                </div>
                <Status>{reward.status}</Status>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[560px] text-start text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="pb-4 text-start">Reward</th>
                <th className="text-start">Date</th>
                <th className="text-start">Amount</th>
                <th className="text-start">Status</th>
              </tr>
            </thead>
            <tbody>
              {rewards.history.map((reward) => (
                <tr key={reward.id} className="border-t">
                  <td className="py-5 font-extrabold">{L(reward.label, reward.label.replace(/^Level (\d+) milestone$/, "إنجاز المستوى $1"))}</td>
                  <td>{formatDate(reward.date)}</td>
                  <td className="font-bold">{ils(reward.amount)}</td>
                  <td><Status>{reward.status}</Status></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          </>
        )}
      </div>
    </>
  );
}

// Doctors keep the prototype conversation for now; patients talk to their
// assigned doctor through the API and start with an empty thread.
const doctorDemoMessages = [
  { id: "doctor-welcome", sender: "doctor", text: "Hi Salma, your progress this week looks strong. How did the lower back mobility exercise feel?" },
  { id: "patient-reply", sender: "patient", text: "Much better. I feel less tight after work now." },
];

export function MessagesPage() {
  const session = useSession();
  const isDoctor = session?.user.role === "doctor";
  const [messages, setMessages] = useState(isDoctor ? doctorDemoMessages : null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const messageListRef = useRef(null);
  const contactName = isDoctor ? "Salma" : "Dr. Aya";
  const mine = isDoctor ? "doctor" : "patient";

  useEffect(() => {
    if (isDoctor) return undefined;
    let active = true;
    api.careMessages()
      .then((list) => active && setMessages(list))
      .catch((apiError) => {
        if (!active) return;
        setMessages([]);
        setError(apiError.message);
      });
    return () => {
      active = false;
    };
  }, [isDoctor]);

  useEffect(() => {
    messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function sendMessage(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    setError("");
    if (isDoctor) {
      setMessages((current) => [...current, { id: `doctor-${Date.now()}`, sender: "doctor", text }]);
      return;
    }
    try {
      const saved = await api.sendCareMessage(text);
      setMessages((current) => [...(current ?? []), saved]);
    } catch (apiError) {
      setDraft(text);
      setError(apiError.message);
    }
  }

  const last = messages?.at(-1);

  return (
    <>
      <PageHeader
        eyebrow="Messages"
        title="Your care conversation"
        description="Stay connected with your doctor between reviews."
      />
      <div className="card grid min-h-[650px] grid-rows-[auto_1fr] overflow-hidden p-0 md:grid-cols-[280px_1fr] md:grid-rows-1">
        <aside className="border-b bg-slate-50/60 p-4 md:border-b-0 md:border-r">
          <div className="rounded-2xl bg-white p-3 shadow-card ring-1 ring-teal-100">
            <div className="flex items-center gap-3">
              <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#f1e2bd] to-[#f7f1e4] font-extrabold text-[#8a6b2f] shadow-inner">
                {contactName.replace(/^Dr\.\s*/, "")[0]}
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold" data-no-translate>{contactName}</p>
                <p className="truncate text-xs text-slate-400" data-no-translate>
                  {last ? last.text : "—"}
                </p>
              </div>
            </div>
          </div>
        </aside>
        <section className="flex flex-col">
          <div className="flex items-center gap-3 border-b p-5">
            <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-[#f7f1e4] font-extrabold text-[#8a6b2f]">
              {contactName.replace(/^Dr\.\s*/, "")[0]}
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
            </span>
            <div>
              <p className="font-extrabold" data-no-translate>{contactName}</p>
              <p className="flex items-center gap-1 text-xs text-teal-600">
                <span className="h-2 w-2 rounded-full bg-teal-500 anim-pulse-glow" />
                Usually replies within a day
              </p>
            </div>
          </div>
          <div
            ref={messageListRef}
            aria-live="polite"
            className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-slate-50/60 to-white p-5"
          >
            {messages === null && <div className="skeleton h-16 w-2/3" />}
            {messages?.length === 0 && (
              <EmptyState
                icon={MessageCircle}
                title="No messages yet"
                text="Say hello to your doctor or ask a question about your plan. They usually reply within a day."
              />
            )}
            {messages?.map((message, index) => {
              const fromMe = message.sender === mine;
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.2) }}
                  data-no-translate
                  className={
                    fromMe
                      ? "ms-auto max-w-md whitespace-pre-wrap rounded-3xl rounded-ee-md bg-ink p-4 text-sm leading-6 text-white shadow-lg shadow-teal-900/10"
                      : "max-w-md whitespace-pre-wrap rounded-3xl rounded-es-md bg-white p-4 text-sm leading-6 shadow-card"
                  }
                >
                  {message.text}
                </motion.div>
              );
            })}
          </div>
          <div className="border-t bg-white p-4">
            {error && <p className="mb-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
            <form className="flex gap-2" onSubmit={sendMessage}>
              <input
                className="field"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Write a message..."
                aria-label="Message"
              />
              <button
                type="submit"
                className="btn-primary px-4 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!draft.trim()}
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </section>
      </div>
    </>
  );
}
