import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

// =====================================================================
// Page header — adds a soft spotlight that follows the cursor and a
// gradient stripe under the title. API unchanged.
// =====================================================================
export function PageHeader({ eyebrow, title, description, action }) {
  const { t } = useLanguage();
  const ref = useRef(null);

  const onMouseMove = (event) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    node.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.45, 0, 0.18, 1] }}
      data-spotlight
      className="card relative mb-8 flex flex-col justify-between gap-4 overflow-hidden p-5 md:flex-row md:items-end md:p-7"
    >
      <div className="pointer-events-none absolute -end-10 -top-16 h-44 w-44 rounded-full bg-teal-200/60 blur-3xl motion-glow" />
      <div className="pointer-events-none absolute -start-20 bottom-0 h-36 w-36 rounded-full bg-violet-200/40 blur-3xl" />
      <div className="relative">
        {eyebrow && (
          <p className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.2em] text-teal-600">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-500 anim-pulse-glow" />
            {t(eyebrow)}
          </p>
        )}
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{t(title)}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{t(description)}</p>
        )}
      </div>
      <div className="relative">{action}</div>
    </motion.div>
  );
}

// =====================================================================
// CountUp — animates a number from 0 to `to` once it scrolls into view.
// Falls back to the static value when the user prefers reduced motion.
// Accepts a `suffix` and `prefix` so callers can pass "82 pts" / "5 ILS".
// =====================================================================
function parseNumeric(value) {
  if (typeof value === "number") return { num: value, prefix: "", suffix: "" };
  const str = String(value ?? "");
  const match = str.match(/^([^\d]*)([\d,.]+)([^]*)$/);
  if (!match) return { num: null, prefix: str, suffix: "" };
  const num = Number(match[2].replace(/,/g, ""));
  if (Number.isNaN(num)) return { num: null, prefix: str, suffix: "" };
  return { num, prefix: match[1], suffix: match[3] };
}

export function CountUp({ value, duration = 1100, className = "" }) {
  const { num, prefix, suffix } = parseNumeric(value);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(num == null ? value : 0);
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (num == null) return;
    if (!inView || reduced) {
      setDisplay(num);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const isFloat = !Number.isInteger(num);
      const current = isFloat ? Number((num * eased).toFixed(1)) : Math.round(num * eased);
      setDisplay(current);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [num, inView, duration, reduced]);

  return (
    <span ref={ref} className={className}>
      {num == null ? value : `${prefix}${display.toLocaleString()}${suffix}`}
    </span>
  );
}

// =====================================================================
// StatCard — adds: animated count-up, cursor-following highlight, lifting
// shadow, optional trend sparkline. Backwards compatible with the
// previous prop signature: { label, value, note, icon, tone }.
// New optional props: { trend, prefix, suffix }
// =====================================================================
const STAT_TONES = {
  teal: { bg: "bg-teal-50", text: "text-teal-600", glow: "rgba(32,168,138,.22)" },
  purple: { bg: "bg-violet-50", text: "text-violet-600", glow: "rgba(142,130,217,.22)" },
  blue: { bg: "bg-blue-50", text: "text-blue-600", glow: "rgba(59,130,246,.22)" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", glow: "rgba(245,158,11,.22)" },
  rose: { bg: "bg-rose-50", text: "text-rose-600", glow: "rgba(244,63,94,.22)" },
};

export function StatCard({ label, value, note, icon: Icon, tone = "teal", trend }) {
  const { t } = useLanguage();
  const ref = useRef(null);
  const palette = STAT_TONES[tone] ?? STAT_TONES.teal;

  const onMouseMove = (event) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    node.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      whileHover={{ y: -5 }}
      data-spotlight
      className="card group relative overflow-hidden"
    >
      <span
        className={`absolute -end-8 -top-8 h-24 w-24 rounded-full opacity-50 blur-2xl ${palette.bg}`}
      />
      <div className="mb-5 flex items-start justify-between">
        <span
          className={`relative grid h-11 w-11 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${palette.bg} ${palette.text}`}
          style={{ boxShadow: `0 8px 30px -10px ${palette.glow}` }}
        >
          <Icon size={20} />
        </span>
        <ArrowUpRight
          size={18}
          className="relative text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-teal-500"
        />
      </div>
      <p className="text-2xl font-extrabold">
        <CountUp value={value} />
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-500">{t(label)}</p>
      {(note || trend) && (
        <div className="mt-3 flex items-center justify-between gap-3">
          {note && <p className="text-xs font-bold text-teal-600">{t(note)}</p>}
          {trend && <Sparkline values={trend} stroke={palette.text} />}
        </div>
      )}
    </motion.div>
  );
}

// =====================================================================
// Sparkline — tiny inline SVG trend line. Pass an array of numbers; the
// chart auto-scales. Defaults to a teal stroke. Used inside StatCard.
// =====================================================================
export function Sparkline({ values, stroke = "text-teal-500", width = 80, height = 24 }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / span) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={stroke}>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width} cy={height - ((values[values.length - 1] - min) / span) * height} r="2.5" fill="currentColor" />
    </svg>
  );
}

// =====================================================================
// Progress — same API but with a gradient + shine pass and a soft glow.
// =====================================================================
export function Progress({ value, color = "bg-teal-500" }) {
  const palette = color === "bg-teal-500"
    ? "from-teal-400 via-teal-500 to-emerald-400"
    : color === "bg-violet-500"
      ? "from-violet-400 via-violet-500 to-fuchsia-400"
      : color === "bg-amber-500"
        ? "from-amber-400 via-amber-500 to-orange-400"
        : "from-teal-400 via-teal-500 to-emerald-400";
  return (
    <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: 0.9, ease: [0.45, 0, 0.18, 1] }}
        className={`relative h-full rounded-full bg-gradient-to-r ${palette}`}
      >
        <span className="pointer-events-none absolute inset-y-0 -right-1 w-3 rounded-full bg-white/40 blur-sm" />
      </motion.div>
    </div>
  );
}

// =====================================================================
// Status pill — extended palette.
// =====================================================================
export function Status({ children }) {
  const { t } = useLanguage();
  const positive = ["Approved", "Completed", "Active", "Online"];
  const warn = ["Needs review", "Pending", "Paused"];
  const danger = ["Blocked", "Failed", "Rejected"];
  const style = positive.includes(children)
    ? "bg-teal-50 text-teal-700"
    : warn.includes(children)
      ? "bg-amber-50 text-amber-700"
      : danger.includes(children)
        ? "bg-rose-50 text-rose-700"
        : "bg-violet-50 text-violet-700";
  return (
    <span className={`pill ${style}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70 anim-pulse-glow" />
      {t(children)}
    </span>
  );
}

// =====================================================================
// EmptyState — floating icon, refined typography.
// =====================================================================
export function EmptyState({ icon: Icon, title, description, action }) {
  const { t } = useLanguage();
  return (
    <div className="card grid min-h-60 place-items-center text-center">
      <div>
        <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-600 anim-float">
          <Icon />
        </span>
        <h3 className="font-extrabold">{t(title)}</h3>
        <p className="mt-2 text-sm text-slate-500">{t(description)}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}

// =====================================================================
// Skeleton — shared shimmer placeholder.
// =====================================================================
export function Skeleton({ className = "h-4 w-full" }) {
  return <div className={`skeleton ${className}`} />;
}

// =====================================================================
// SectionTitle — eyebrow + title + description block, used by landing
// and any marketing-style section that needs consistent rhythm.
// =====================================================================
export function SectionTitle({ eyebrow, title, description, align = "center" }) {
  const { t } = useLanguage();
  const wrap = align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl";
  return (
    <div className={wrap}>
      {eyebrow && <p className="text-xs font-extrabold uppercase tracking-[.2em] text-teal-600">{t(eyebrow)}</p>}
      <h2 className="section-title mt-3">{t(title)}</h2>
      {description && <p className="mt-4 leading-7 text-slate-500">{t(description)}</p>}
    </div>
  );
}
