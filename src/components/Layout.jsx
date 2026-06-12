import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity, Bot, CalendarDays, ChevronDown, CircleDollarSign, Gamepad2, Home,
  LayoutDashboard, LogOut, Menu, MessageCircle, ShieldCheck, Sparkles, Stethoscope,
  UserRound, Users, X
} from "lucide-react";
import Brand from "./Brand";
import { LanguageToggle, useLanguage } from "../i18n/LanguageContext";

const patientLinks = [
  ["/patient", "Overview", LayoutDashboard], ["/patient/exercises", "Today's plan", CalendarDays],
  ["/patient/chat", "AI assistant", Bot], ["/patient/rewards", "Quest & rewards", Gamepad2],
  ["/patient/refunds", "Refund wallet", CircleDollarSign], ["/patient/messages", "Doctor messages", MessageCircle]
];
const doctorLinks = [
  ["/doctor", "Overview", LayoutDashboard], ["/doctor/patients", "My patients", Users],
  ["/doctor/messages", "Messages", MessageCircle]
];
const adminLinks = [["/admin", "Overview", LayoutDashboard], ["/admin", "Accounts", Users], ["/admin", "Refund requests", CircleDollarSign]];

export function PublicNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-[1.4rem] border border-white/80 bg-white/85 px-5 py-3 shadow-card backdrop-blur-xl">
        <Brand />
        <div className="hidden items-center gap-8 text-sm font-bold text-slate-600 md:flex">
          <a href="/#how">How it works</a><a href="/#features">Features</a><a href="/#safety">Safety</a>
        </div>
        <div className="hidden items-center gap-2 md:flex"><LanguageToggle /><Link to="/login" className="btn-soft py-2.5">Log in</Link><Link to="/register" className="btn-primary py-2.5">Start your quest</Link></div>
        <button onClick={() => setOpen(!open)} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 md:hidden">{open ? <X /> : <Menu />}</button>
      </nav>
      <AnimatePresence>{open && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto mt-2 max-w-7xl rounded-3xl bg-white p-4 shadow-soft md:hidden"><LanguageToggle /><Link to="/login" className="btn-soft mb-2 mt-3 w-full">Log in</Link><Link to="/register" className="btn-primary w-full">Start your quest</Link></motion.div>}</AnimatePresence>
    </header>
  );
}

export function DashboardLayout({ role = "patient" }) {
  const [open, setOpen] = useState(false);
  const { isArabic } = useLanguage();
  const links = role === "doctor" ? doctorLinks : role === "admin" ? adminLinks : patientLinks;
  const roleData = role === "doctor" ? ["Dr. Adam Noor", "Physiotherapist", Stethoscope] : role === "admin" ? ["Salma Admin", "Platform manager", ShieldCheck] : ["Maya Khalil", "Patient · Level 3", UserRound];
  const location = useLocation();
  return (
    <div className="min-h-screen bg-mist">
      <aside className={`rq-sidebar fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-ink p-5 text-white transition-transform lg:translate-x-0 ${open ? "translate-x-0" : isArabic ? "translate-x-full" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between"><Brand light /><button onClick={() => setOpen(false)} className="lg:hidden"><X /></button></div>
        <div className="my-7 rounded-3xl bg-white/8 p-4">
          <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-500 text-white">{roleData[2]({ size: 20 })}</span><div><p className="text-sm font-extrabold">{roleData[0]}</p><p className="text-xs text-white/50">{roleData[1]}</p></div></div>
        </div>
        <nav className="space-y-1">
          {links.map(([to, label, Icon], index) => <NavLink key={`${to}-${index}`} end={index === 0} to={to} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${isActive ? "bg-teal-500 text-white shadow-lg shadow-black/10" : "text-white/60 hover:bg-white/5 hover:text-white"}`}><Icon size={18} />{label}</NavLink>)}
        </nav>
        <div className="mt-auto rounded-3xl bg-gradient-to-br from-teal-500/30 to-violet-400/20 p-4"><Sparkles className="mb-3 text-teal-100" /><p className="text-sm font-extrabold">Keep showing up</p><p className="mt-1 text-xs leading-5 text-white/55">Small movements build lasting recovery.</p></div>
        <Link to="/" className="mt-3 flex items-center gap-3 px-4 py-3 text-sm font-bold text-white/50 hover:text-white"><LogOut size={18} /> Sign out</Link>
      </aside>
      <main className="rq-main lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/60 bg-mist/85 px-4 backdrop-blur-xl md:px-8">
          <button onClick={() => setOpen(true)} className="grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-card lg:hidden"><Menu /></button>
          <div className="hidden lg:block"><p className="text-xs font-bold uppercase tracking-[.18em] text-slate-400">{role} space</p><p className="text-sm font-extrabold capitalize">{links.find(([to]) => to === location.pathname)?.[1] || "RemedyQuest"}</p></div>
          <div className="header-actions ml-auto flex items-center gap-2"><LanguageToggle compact /><Link to="/" className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-slate-500 shadow-card"><Home size={18} /></Link><button className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-card"><span className="grid h-8 w-8 place-items-center rounded-xl bg-teal-100 text-xs font-extrabold text-teal-700">{roleData[0].split(" ").map(x => x[0]).join("").slice(0,2)}</span><ChevronDown size={15} /></button></div>
        </header>
        <div className="mx-auto max-w-[1500px] p-4 md:p-8"><Outlet /></div>
      </main>
      {open && <button aria-label="Close menu" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-ink/30 lg:hidden" />}
    </div>
  );
}

export function Footer() {
  return <footer className="bg-ink px-6 py-10 text-white"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center"><Brand light /><p className="max-w-md text-sm leading-6 text-white/50">General therapeutic exercise guidance. RemedyQuest does not replace professional medical advice.</p><p className="text-xs text-white/40">© 2026 RemedyQuest</p></div></footer>;
}
