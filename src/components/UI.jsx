import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

export function PageHeader({ eyebrow, title, description, action }) {
  const { t } = useLanguage();
  return (
    <div className="relative mb-8 flex flex-col justify-between gap-4 overflow-hidden rounded-[2rem] border border-white/80 bg-white/65 p-5 shadow-card backdrop-blur-sm md:flex-row md:items-end md:p-7">
      <div className="pointer-events-none absolute -end-10 -top-16 h-40 w-40 rounded-full bg-teal-100/60 blur-3xl" />
      <div>
        {eyebrow && <p className="mb-2 text-xs font-extrabold uppercase tracking-[.2em] text-teal-600">{t(eyebrow)}</p>}
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{t(title)}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{t(description)}</p>}
      </div>
      <div className="relative">{action}</div>
    </div>
  );
}

export function StatCard({ label, value, note, icon: Icon, tone = "teal" }) {
  const { t } = useLanguage();
  const tones = {
    teal: "bg-teal-50 text-teal-600",
    purple: "bg-violet-50 text-violet-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600"
  };
  return (
    <motion.div whileHover={{ y: -5 }} className="card group relative overflow-hidden">
      <span className={`absolute -end-8 -top-8 h-24 w-24 rounded-full opacity-50 blur-2xl ${tones[tone].split(" ")[0]}`} />
      <div className="mb-5 flex items-start justify-between">
        <span className={`relative grid h-11 w-11 place-items-center rounded-2xl transition-transform group-hover:scale-110 ${tones[tone]}`}><Icon size={20} /></span>
        <ArrowUpRight size={18} className="relative text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-teal-500" />
      </div>
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-500">{t(label)}</p>
      {note && <p className="mt-3 text-xs font-bold text-teal-600">{t(note)}</p>}
    </motion.div>
  );
}

export function Progress({ value, color = "bg-teal-500" }) {
  return <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} className={`h-full rounded-full ${color}`} /></div>;
}

export function Status({ children }) {
  const { t } = useLanguage();
  const style = children === "Approved" || children === "Completed"
    ? "bg-teal-50 text-teal-700"
    : children === "Needs review" || children === "Pending"
      ? "bg-amber-50 text-amber-700"
      : "bg-violet-50 text-violet-700";
  return <span className={`pill ${style}`}><span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />{t(children)}</span>;
}

export function EmptyState({ icon: Icon, title, description }) {
  const { t } = useLanguage();
  return <div className="card grid min-h-60 place-items-center text-center"><div><span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-600"><Icon /></span><h3 className="font-extrabold">{t(title)}</h3><p className="mt-2 text-sm text-slate-500">{t(description)}</p></div></div>;
}
