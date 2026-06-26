import { useEffect, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Activity, ArrowRight, BadgeDollarSign, Bot, CalendarCheck, CheckCircle2,
  HeartPulse, Play, ShieldCheck, Sparkles, Stethoscope, Trophy, Zap,
} from "lucide-react";
import { Footer, PublicNav } from "../components/Layout";
import { CountUp, SectionTitle } from "../components/UI";

// Feature grid copy — same content as before but now wrapped in a scroll
// reveal and tilt-on-hover container.
const features = [
  [Bot, "AI health assistant", "A calm guided intake turns your answers into a suggested care path.", "bg-teal-50 text-teal-700"],
  [CalendarCheck, "Personalized daily plans", "Therapeutic sessions shaped around your needs and available time.", "bg-blue-50 text-blue-700"],
  [Stethoscope, "Doctor-reviewed care", "Your clinician can approve, improve, and follow up on every plan.", "bg-violet-50 text-violet-700"],
  [Trophy, "Recovery that rewards", "Earn points, protect your streak, and unlock meaningful milestones.", "bg-amber-50 text-amber-700"],
  [BadgeDollarSign, "Refund motivation", "Consistent progress can unlock a partial subscription refund.", "bg-rose-50 text-rose-700"],
  [Activity, "Visible progress", "Clear trends show how your consistency and mobility improve over time.", "bg-cyan-50 text-cyan-700"],
];

const heroMetrics = [
  ["92%", "plan completion"],
  ["12", "day streak"],
  ["5 ILS", "ready refund"],
];

const liveSignals = [
  ["Pain trend", "Down 33%", "text-teal-600"],
  ["Doctor review", "Approved", "text-violet-600"],
  ["Next session", "25 min", "text-amber-600"],
];

const trustedLogos = [
  "Beit Care Clinic",
  "Mobility Health",
  "Galilee Rehab",
  "Cedar Physio",
  "Tel-Aviv Spine Co.",
  "Northern Wellness",
];

// =====================================================================
// Section that fades + rises into view the first time it intersects the
// viewport. Keeps copy intact; only adds motion.
// =====================================================================
function Reveal({ children, delay = 0, y = 18, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduced = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      initial={reduced ? false : { opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, ease: [0.45, 0, 0.18, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Landing() {
  const heroRef = useRef(null);
  const reduced = useReducedMotion();

  // Mouse-tracked spotlight on the hero — sets CSS variables that the
  // gradient overlay reads.
  useEffect(() => {
    if (reduced) return undefined;
    const node = heroRef.current;
    if (!node) return undefined;
    const onMove = (event) => {
      const rect = node.getBoundingClientRect();
      node.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      node.style.setProperty("--my", `${event.clientY - rect.top}px`);
    };
    node.addEventListener("pointermove", onMove);
    return () => node.removeEventListener("pointermove", onMove);
  }, [reduced]);

  return (
    <div className="overflow-hidden bg-white">
      <PublicNav />

      {/* ============= HERO ============= */}
      <section
        ref={heroRef}
        className="aurora-shell grid-fade relative min-h-screen px-6 pb-20 pt-36"
      >
        {/* Cursor-following spotlight */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(560px circle at var(--mx, 70%) var(--my, 20%), rgba(32,168,138,.14), transparent 55%)",
          }}
        />
        <div className="motion-glow absolute left-1/2 top-28 h-80 w-80 rounded-full bg-teal-200/40 blur-3xl" />
        <div className="motion-glow absolute right-0 top-1/2 h-80 w-80 rounded-full bg-violet-200/35 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
          <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.45, 0, 0.18, 1] }}>
            <motion.span
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="pill mb-6 bg-white/80 text-teal-700 shadow-card backdrop-blur"
            >
              <Sparkles size={14} /> A smarter path to feeling better
            </motion.span>
            <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.08] tracking-tight md:text-7xl">
              Your recovery is a{" "}
              <span className="gradient-text">quest worth winning.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-slate-500 md:text-lg">
              RemedyQuest combines AI-guided therapeutic exercise, trusted doctor follow-up, and motivating rewards to help you move better every day.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="btn-primary px-7 py-4">
                Start as a patient <ArrowRight size={17} />
              </Link>
              <Link to="/login?role=doctor" className="btn-soft px-7 py-4">
                <Play size={17} /> Doctor login
              </Link>
            </div>
            <div className="mt-9 grid max-w-xl grid-cols-3 gap-3">
              {heroMetrics.map(([value, label], index) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 + index * 0.08 }}
                  className="metric-chip"
                >
                  <p className="text-xl font-extrabold text-ink">
                    <CountUp value={value} />
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {label}
                  </p>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-teal-500" /> Doctor reviewed
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-teal-500" /> Adaptive plans
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-teal-500" /> Privacy minded
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative mx-auto w-full max-w-xl"
          >
            <div className="hero-device-glow rounded-[3rem] bg-ink p-5">
              <div className="soft-scan rounded-[2.2rem] bg-gradient-to-br from-[#ecfbf7] via-white to-[#f4f0ff] p-6">
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400">GOOD MORNING, MAYA</p>
                    <p className="mt-1 text-xl font-extrabold">Ready for today's quest?</p>
                  </div>
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-teal-600 shadow-card">
                    <HeartPulse />
                  </span>
                </div>
                <div className="rounded-[1.8rem] bg-white p-5 shadow-card">
                  <div className="flex justify-between">
                    <span className="pill bg-teal-50 text-teal-700">Day 12</span>
                    <span className="text-sm font-extrabold">25 min</span>
                  </div>
                  <p className="mt-6 text-lg font-extrabold">Gentle back mobility</p>
                  <p className="mt-1 text-sm text-slate-400">5 exercises · Low impact</p>
                  <div className="mt-5 h-2 rounded-full bg-slate-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "40%" }}
                      transition={{ delay: 0.8, duration: 1, ease: [0.45, 0, 0.18, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-teal-400 via-teal-500 to-emerald-400"
                    />
                  </div>
                  <button className="btn-primary mt-5 w-full">
                    Continue session <ArrowRight size={16} />
                  </button>
                </div>
                <div className="mt-4 rounded-[1.4rem] border border-white/80 bg-white/70 p-4 shadow-card backdrop-blur">
                  <p className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-400">
                    <Zap size={14} className="text-amber-500" /> Live recovery signals
                  </p>
                  <div className="space-y-2">
                    {liveSignals.map(([label, value, color]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2 text-sm"
                      >
                        <span className="font-bold text-slate-500">{label}</span>
                        <span className={`font-extrabold ${color}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[["82", "points"], ["12", "day streak"], ["5 ILS", "earned"]].map(([v, l]) => (
                    <div key={l} className="rounded-2xl bg-white/70 p-3 text-center">
                      <p className="font-extrabold">
                        <CountUp value={v} />
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        {l}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -left-5 top-1/3 hidden rounded-2xl bg-white p-4 shadow-soft sm:block"
            >
              <p className="text-xs font-bold text-slate-400">WEEKLY PROGRESS</p>
              <p className="mt-1 text-xl font-extrabold text-teal-600">
                +<CountUp value={18} />%
              </p>
            </motion.div>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.6 }}
              className="absolute -right-3 top-2/3 hidden rounded-2xl bg-white p-3 shadow-soft sm:flex sm:items-center sm:gap-2"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-50 text-teal-600">
                <Stethoscope size={17} />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Doctor
                </p>
                <p className="text-xs font-extrabold text-ink">Plan approved</p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Trusted partners marquee */}
        <div className="relative mx-auto mt-20 max-w-6xl">
          <p className="mb-4 text-center text-[10px] font-extrabold uppercase tracking-[.32em] text-slate-400">
            Trusted by therapy partners
          </p>
          <div className="mask-fade-l mask-fade-r relative overflow-hidden">
            <div className="flex w-max gap-12 anim-marquee">
              {[...trustedLogos, ...trustedLogos].map((label, index) => (
                <span
                  key={`${label}-${index}`}
                  className="whitespace-nowrap text-sm font-extrabold uppercase tracking-[.2em] text-slate-300"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============= HOW IT WORKS ============= */}
      <section id="how" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionTitle
              eyebrow="Made for momentum"
              title="Care that meets you where you are"
              description="From the first conversation to every completed session, your path stays personal, supervised, and motivating."
            />
          </Reveal>
          <div className="relative mt-14 grid gap-5 md:grid-cols-3">
            {/* Connecting line behind the cards on desktop */}
            <div className="absolute inset-x-12 top-16 hidden h-px md:block" style={{ background: "linear-gradient(90deg, transparent, rgba(32,168,138,.25), rgba(142,130,217,.25), transparent)" }} />
            {[
              ["01", "Tell us how you feel", "Have a thoughtful AI-guided conversation about your pain, movement, and schedule.", Bot],
              ["02", "Get your care plan", "Receive a personalized exercise path reviewed by a qualified doctor.", Stethoscope],
              ["03", "Move, track, earn", "Build consistency, see progress, and unlock rewards as you recover.", Trophy],
            ].map(([n, t, d, Icon], index) => (
              <Reveal key={n} delay={index * 0.08}>
                <div className="card relative p-7">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-teal-500">{n}</span>
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-teal-50 text-teal-600">
                      <Icon size={18} />
                    </span>
                  </div>
                  <h3 className="mt-8 text-xl font-extrabold">{t}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============= FEATURES ============= */}
      <section id="features" className="bg-mist px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionTitle
              eyebrow="One connected platform"
              title="Everything recovery needs to keep moving"
              align="left"
            />
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map(([Icon, t, d, c], index) => (
              <Reveal key={t} delay={index * 0.05}>
                <motion.div whileHover={{ y: -5 }} className="card group h-full p-7">
                  <span className={`grid h-12 w-12 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${c}`}>
                    <Icon />
                  </span>
                  <h3 className="mt-6 text-lg font-extrabold">{t}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">{d}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============= SAFETY CTA ============= */}
      <section id="safety" className="px-6 py-24">
        <Reveal>
          <div className="relative mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 overflow-hidden rounded-[3rem] bg-gradient-to-br from-ink to-teal-700 p-8 text-white md:flex-row md:p-14">
            <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl anim-float" />
            <div className="pointer-events-none absolute -bottom-32 -right-10 h-80 w-80 rounded-full bg-violet-400/15 blur-3xl" />
            <div className="relative max-w-xl">
              <span className="pill bg-white/10 text-teal-100">
                <ShieldCheck size={15} /> Safety comes first
              </span>
              <h2 className="mt-5 text-3xl font-extrabold md:text-4xl">
                Technology supports care. It never replaces it.
              </h2>
              <p className="mt-4 leading-7 text-white/60">
                RemedyQuest provides general therapeutic exercise guidance and supports doctor follow-up. It does not replace an examination by a doctor or physical therapist.
              </p>
            </div>
            <Link to="/register" className="btn-soft relative shrink-0 border-white/20 bg-white/10 text-white hover:border-white hover:text-white">
              Begin safely <ArrowRight size={17} />
            </Link>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
