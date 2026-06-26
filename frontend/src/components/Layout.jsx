import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell, Bot, CalendarDays, Camera, ChevronDown, CircleDollarSign, Gamepad2, Home,
  LayoutDashboard, LogOut, Menu, MessageCircle, ShieldCheck, Sparkles, Stethoscope,
  UserRound, Users, X
} from "lucide-react";
import Brand from "./Brand";
import { LanguageToggle, useLanguage } from "../i18n/LanguageContext";

const patientLinks = [
  ["/patient", "Overview", LayoutDashboard],
  ["/patient/exercises", "Today's plan", CalendarDays],
  ["/patient/form-checker", "Form coach", Camera],
  ["/patient/chat", "AI assistant", Bot],
  ["/patient/rewards", "Quest & rewards", Gamepad2],
  ["/patient/refunds", "Refund wallet", CircleDollarSign],
  ["/patient/messages", "Doctor messages", MessageCircle],
];
const doctorLinks = [
  ["/doctor", "Overview", LayoutDashboard],
  ["/doctor/patients", "My patients", Users],
  ["/doctor/messages", "Messages", MessageCircle],
];
const adminLinks = [
  ["/admin", "Overview", LayoutDashboard],
  ["/admin", "Accounts", Users],
  ["/admin", "Refund requests", CircleDollarSign],
];

// =====================================================================
// Public navigation — gains a hairline that becomes more opaque as the
// user scrolls (depth cue) and an animated brand glow.
// =====================================================================
export function PublicNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <nav
        className={`mx-auto flex max-w-7xl items-center justify-between rounded-[1.4rem] border bg-white/85 px-5 py-3 backdrop-blur-xl transition ${scrolled ? "border-white shadow-soft" : "border-white/80 shadow-card"}`}
      >
        <Brand />
        <div className="hidden items-center gap-8 text-sm font-bold text-slate-600 md:flex">
          <a className="link-underline transition hover:text-teal-600" href="/#how">{t("How it works")}</a>
          <a className="link-underline transition hover:text-teal-600" href="/#features">{t("Features")}</a>
          <a className="link-underline transition hover:text-teal-600" href="/#safety">{t("Safety")}</a>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <LanguageToggle />
          <Link to="/login" className="btn-soft py-2.5">{t("Log in")}</Link>
          <Link to="/register" className="btn-primary py-2.5">{t("Start your quest")}</Link>
        </div>
        <button onClick={() => setOpen(!open)} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 md:hidden">
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-auto mt-2 max-w-7xl rounded-3xl border border-white bg-white/95 p-4 shadow-soft backdrop-blur-xl md:hidden"
          >
            <LanguageToggle />
            <Link to="/login" className="btn-soft mb-2 mt-3 w-full">{t("Log in")}</Link>
            <Link to="/register" className="btn-primary w-full">{t("Start your quest")}</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// =====================================================================
// Sidebar nav item — owns the sliding active rail via framer-motion's
// layoutId. The rail morphs from one item to another instead of just
// switching backgrounds, which is the single biggest "this feels
// expensive" detail in a dashboard.
// =====================================================================
function SidebarLink({ to, label, Icon, end, onClose }) {
  const { t } = useLanguage();
  return (
    <NavLink end={end} to={to} onClick={onClose} className="block">
      {({ isActive }) => (
        <span
          className={`group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${isActive ? "text-white" : "text-white/60 hover:text-white"}`}
        >
          {isActive && (
            <motion.span
              layoutId="sidebar-active-rail"
              className="absolute inset-0 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 shadow-lg shadow-black/20"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            />
          )}
          <span className="relative flex items-center gap-3">
            <Icon size={18} className="transition-transform group-hover:scale-110" />
            {t(label)}
          </span>
        </span>
      )}
    </NavLink>
  );
}

export function DashboardLayout({ role = "patient" }) {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isArabic, t } = useLanguage();
  const location = useLocation();
  const links = role === "doctor" ? doctorLinks : role === "admin" ? adminLinks : patientLinks;
  const roleData = role === "doctor"
    ? ["Dr. Adam Noor", "Physiotherapist", Stethoscope]
    : role === "admin"
      ? ["Salma Admin", "Platform manager", ShieldCheck]
      : ["Maya Khalil", "Patient · Level 3", UserRound];
  const RoleIcon = roleData[2];

  // Close mobile sidebar and avatar menu on route change.
  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  // Click-outside for the avatar menu. The ref wraps the trigger + dropdown,
  // so any pointerdown outside that subtree closes the menu — without any
  // overlay that would block clicks on the dropdown's own links.
  const menuRef = useRef(null);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const onKey = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-mist">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-extrabold focus:text-teal-700 focus:shadow-card">
        Skip to content
      </a>

      <aside
        className={`rq-sidebar fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-ink p-5 text-white transition-transform lg:translate-x-0 ${open ? "translate-x-0" : isArabic ? "translate-x-full" : "-translate-x-full"}`}
      >
        <div className="pointer-events-none absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-violet-400/10 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <Brand light />
          <button onClick={() => setOpen(false)} className="lg:hidden">
            <X />
          </button>
        </div>

        <div className="relative my-7 rounded-3xl border border-white/10 bg-white/[.06] p-4 shadow-inner backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-lg shadow-black/20">
              <RoleIcon size={20} />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-ink bg-emerald-400" />
            </span>
            <div>
              <p className="text-sm font-extrabold">{t(roleData[0])}</p>
              <p className="text-xs text-white/55">{t(roleData[1])}</p>
            </div>
          </div>
        </div>

        <nav className="relative space-y-1">
          {links.map(([to, label, Icon], index) => (
            <SidebarLink
              key={`${to}-${index}`}
              to={to}
              label={label}
              Icon={Icon}
              end={index === 0}
              onClose={() => setOpen(false)}
            />
          ))}
        </nav>

        <div className="relative mt-auto rounded-3xl border border-white/10 bg-gradient-to-br from-teal-500/30 to-violet-400/20 p-4">
          <Sparkles className="mb-3 text-teal-100" />
          <p className="text-sm font-extrabold">{t("Keep showing up")}</p>
          <p className="mt-1 text-xs leading-5 text-white/60">
            {t("Small movements build lasting recovery.")}
          </p>
        </div>
        <Link
          to="/"
          className="relative mt-3 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-white/55 transition hover:bg-white/5 hover:text-white"
        >
          <LogOut size={18} /> {t("Sign out")}
        </Link>
      </aside>

      <main className="rq-main lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/80 bg-mist/80 px-4 shadow-[0_8px_30px_rgba(23,58,58,.03)] backdrop-blur-xl md:px-8">
          <button
            onClick={() => setOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-card lg:hidden"
            aria-label="Open menu"
          >
            <Menu />
          </button>
          <div className="hidden lg:block">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-slate-400">
              {t(`${role} space`)}
            </p>
            <p className="text-sm font-extrabold capitalize">
              {t(links.find(([to]) => to === location.pathname)?.[1] || "RemedyQuest")}
            </p>
          </div>
          <div className="header-actions ml-auto flex items-center gap-2">
            <LanguageToggle compact />
            <button
              aria-label="Notifications"
              className="relative grid h-11 w-11 place-items-center rounded-2xl bg-white text-slate-500 shadow-card transition hover:text-teal-600"
            >
              <Bell size={18} />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500 anim-pulse-glow" />
            </button>
            <Link
              to="/"
              className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-slate-500 shadow-card transition hover:text-teal-600"
              aria-label="Home"
            >
              <Home size={18} />
            </Link>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((value) => !value)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-card transition hover:shadow-soft"
              >
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-teal-200 to-teal-400 text-xs font-extrabold text-teal-900 shadow-inner">
                  {roleData[0].split(" ").map((part) => part[0]).join("").slice(0, 2)}
                </span>
                <ChevronDown
                  size={15}
                  className={`text-slate-400 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute end-0 mt-2 w-56 origin-top-right overflow-hidden rounded-2xl border border-white bg-white/95 shadow-soft backdrop-blur-xl"
                  >
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="text-sm font-extrabold">{t(roleData[0])}</p>
                      <p className="text-xs text-slate-500">{t(roleData[1])}</p>
                    </div>
                    <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-ink">
                      <Home size={15} /> {t("Back to home")}
                    </Link>
                    <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 border-t border-slate-100 px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50">
                      <LogOut size={15} /> {t("Sign out")}
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>
        <div id="main" className="mx-auto max-w-[1500px] p-4 md:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.45, 0, 0.18, 1] }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
      {open && (
        <button
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-ink/30 lg:hidden"
        />
      )}
    </div>
  );
}

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="relative overflow-hidden bg-ink px-6 py-12 text-white">
      <div className="absolute -bottom-24 end-10 h-56 w-56 rounded-full bg-teal-500/10 blur-3xl" />
      <div className="absolute -top-20 start-10 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="relative mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center">
        <Brand light />
        <p className="max-w-md text-sm leading-6 text-white/55">
          {t("General therapeutic exercise guidance. RemedyQuest does not replace professional medical advice.")}
        </p>
        <p className="text-xs text-white/40">© 2026 RemedyQuest</p>
      </div>
    </footer>
  );
}
