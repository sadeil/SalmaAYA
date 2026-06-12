import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Activity, ArrowRight, BadgeDollarSign, Bot, CalendarCheck, CheckCircle2, HeartPulse, Play, ShieldCheck, Sparkles, Stethoscope, Trophy } from "lucide-react";
import { Footer, PublicNav } from "../components/Layout";

const features = [
  [Bot, "AI health assistant", "A calm guided intake turns your answers into a suggested care path.", "bg-teal-50 text-teal-700"],
  [CalendarCheck, "Personalized daily plans", "Therapeutic sessions shaped around your needs and available time.", "bg-blue-50 text-blue-700"],
  [Stethoscope, "Doctor-reviewed care", "Your clinician can approve, improve, and follow up on every plan.", "bg-violet-50 text-violet-700"],
  [Trophy, "Recovery that rewards", "Earn points, protect your streak, and unlock meaningful milestones.", "bg-amber-50 text-amber-700"],
  [BadgeDollarSign, "Refund motivation", "Consistent progress can unlock a partial subscription refund.", "bg-rose-50 text-rose-700"],
  [Activity, "Visible progress", "Clear trends show how your consistency and mobility improve over time.", "bg-cyan-50 text-cyan-700"]
];

export default function Landing() {
  return <div className="overflow-hidden bg-white">
    <PublicNav />
    <section className="grid-fade relative min-h-screen px-6 pb-20 pt-36">
      <div className="absolute left-1/2 top-28 h-80 w-80 rounded-full bg-teal-200/30 blur-3xl" />
      <div className="absolute right-0 top-1/2 h-80 w-80 rounded-full bg-violet-200/30 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
        <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }}>
          <span className="pill mb-6 bg-teal-50 text-teal-700"><Sparkles size={14} /> A smarter path to feeling better</span>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.08] tracking-[-.055em] md:text-7xl">Your recovery is a <span className="gradient-text">quest worth winning.</span></h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-slate-500 md:text-lg">RemedyQuest combines AI-guided therapeutic exercise, trusted doctor follow-up, and motivating rewards to help you move better every day.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link to="/register" className="btn-primary px-7 py-4">Start as a patient <ArrowRight size={17} /></Link><Link to="/login?role=doctor" className="btn-soft px-7 py-4"><Play size={17} /> Doctor login</Link></div>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-slate-500"><span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-teal-500" /> Doctor reviewed</span><span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-teal-500" /> Adaptive plans</span><span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-teal-500" /> Privacy minded</span></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .15 }} className="relative mx-auto w-full max-w-xl">
          <div className="rounded-[3rem] bg-ink p-5 shadow-2xl shadow-teal-900/20">
            <div className="rounded-[2.2rem] bg-gradient-to-br from-[#ecfbf7] to-[#f4f0ff] p-6">
              <div className="mb-8 flex items-center justify-between"><div><p className="text-xs font-bold text-slate-400">GOOD MORNING, MAYA</p><p className="mt-1 text-xl font-extrabold">Ready for today's quest?</p></div><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-teal-600 shadow-card"><HeartPulse /></span></div>
              <div className="rounded-[1.8rem] bg-white p-5 shadow-card"><div className="flex justify-between"><span className="pill bg-teal-50 text-teal-700">Day 12</span><span className="text-sm font-extrabold">25 min</span></div><p className="mt-6 text-lg font-extrabold">Gentle back mobility</p><p className="mt-1 text-sm text-slate-400">5 exercises · Low impact</p><div className="mt-5 h-2 rounded-full bg-slate-100"><div className="h-full w-2/5 rounded-full bg-teal-500" /></div><button className="btn-primary mt-5 w-full">Continue session <ArrowRight size={16} /></button></div>
              <div className="mt-4 grid grid-cols-3 gap-3">{[["82", "points"], ["12", "day streak"], ["5 ILS", "earned"]].map(([v,l]) => <div key={l} className="rounded-2xl bg-white/70 p-3 text-center"><p className="font-extrabold">{v}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{l}</p></div>)}</div>
            </div>
          </div>
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute -left-5 top-1/3 hidden rounded-2xl bg-white p-4 shadow-soft sm:block"><p className="text-xs font-bold text-slate-400">WEEKLY PROGRESS</p><p className="mt-1 text-xl font-extrabold text-teal-600">+18%</p></motion.div>
        </motion.div>
      </div>
    </section>
    <section id="how" className="px-6 py-24"><div className="mx-auto max-w-7xl"><div className="mx-auto max-w-2xl text-center"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-teal-600">Made for momentum</p><h2 className="section-title mt-3">Care that meets you where you are</h2><p className="mt-4 leading-7 text-slate-500">From the first conversation to every completed session, your path stays personal, supervised, and motivating.</p></div><div className="mt-14 grid gap-5 md:grid-cols-3">{[["01", "Tell us how you feel", "Have a thoughtful AI-guided conversation about your pain, movement, and schedule."], ["02", "Get your care plan", "Receive a personalized exercise path reviewed by a qualified doctor."], ["03", "Move, track, earn", "Build consistency, see progress, and unlock rewards as you recover."]].map(([n,t,d]) => <div key={n} className="card p-7"><span className="text-sm font-extrabold text-teal-500">{n}</span><h3 className="mt-8 text-xl font-extrabold">{t}</h3><p className="mt-3 text-sm leading-7 text-slate-500">{d}</p></div>)}</div></div></section>
    <section id="features" className="bg-mist px-6 py-24"><div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-teal-600">One connected platform</p><h2 className="section-title mt-3">Everything recovery needs to keep moving</h2></div><div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{features.map(([Icon,t,d,c]) => <motion.div whileHover={{ y: -5 }} key={t} className="card p-7"><span className={`grid h-12 w-12 place-items-center rounded-2xl ${c}`}><Icon /></span><h3 className="mt-6 text-lg font-extrabold">{t}</h3><p className="mt-3 text-sm leading-7 text-slate-500">{d}</p></motion.div>)}</div></div></section>
    <section id="safety" className="px-6 py-24"><div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 rounded-[3rem] bg-gradient-to-br from-ink to-teal-700 p-8 text-white md:flex-row md:p-14"><div className="max-w-xl"><span className="pill bg-white/10 text-teal-100"><ShieldCheck size={15} /> Safety comes first</span><h2 className="mt-5 text-3xl font-extrabold md:text-4xl">Technology supports care. It never replaces it.</h2><p className="mt-4 leading-7 text-white/60">RemedyQuest provides general therapeutic exercise guidance and supports doctor follow-up. It does not replace an examination by a doctor or physical therapist.</p></div><Link to="/register" className="btn-soft shrink-0 border-white/20 bg-white/10 text-white hover:border-white hover:text-white">Begin safely <ArrowRight size={17} /></Link></div></section>
    <Footer />
  </div>;
}
