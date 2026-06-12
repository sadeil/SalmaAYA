import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        {eyebrow && <p className="mb-2 text-xs font-extrabold uppercase tracking-[.2em] text-teal-600">{eyebrow}</p>}
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, note, icon: Icon, tone = "teal" }) {
  const tones = {
    teal: "bg-teal-50 text-teal-600",
    purple: "bg-violet-50 text-violet-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600"
  };
  return (
    <motion.div whileHover={{ y: -4 }} className="card">
      <div className="mb-5 flex items-start justify-between">
        <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tones[tone]}`}><Icon size={20} /></span>
        <ArrowUpRight size={18} className="text-slate-300" />
      </div>
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-500">{label}</p>
      {note && <p className="mt-3 text-xs font-bold text-teal-600">{note}</p>}
    </motion.div>
  );
}

export function Progress({ value, color = "bg-teal-500" }) {
  return <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} className={`h-full rounded-full ${color}`} /></div>;
}

export function Status({ children }) {
  const style = children === "Approved" || children === "Completed"
    ? "bg-teal-50 text-teal-700"
    : children === "Needs review" || children === "Pending"
      ? "bg-amber-50 text-amber-700"
      : "bg-violet-50 text-violet-700";
  return <span className={`pill ${style}`}>{children}</span>;
}

export function EmptyState({ icon: Icon, title, description }) {
  return <div className="card grid min-h-60 place-items-center text-center"><div><span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-600"><Icon /></span><h3 className="font-extrabold">{title}</h3><p className="mt-2 text-sm text-slate-500">{description}</p></div></div>;
}
