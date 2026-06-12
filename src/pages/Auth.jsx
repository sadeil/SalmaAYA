import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Activity, ArrowLeft, Check, CreditCard, LockKeyhole, ShieldCheck, Sparkles, Stethoscope, UserRound } from "lucide-react";
import Brand from "../components/Brand";
import { LanguageToggle } from "../i18n/LanguageContext";

const Input = ({ label, ...props }) => <label><span className="label">{label}</span><input className="field" {...props} /></label>;

export function Login() {
  const [params] = useSearchParams();
  const [role, setRole] = useState(params.get("role") || "patient");
  const navigate = useNavigate();
  return <AuthShell title="Welcome back" subtitle="Continue your journey toward better movement.">
    <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">{[["patient", UserRound], ["doctor", Stethoscope]].map(([r,Icon]) => <button key={r} onClick={() => setRole(r)} className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold capitalize transition ${role === r ? "bg-white text-ink shadow-sm" : "text-slate-400"}`}><Icon size={17} />{r}</button>)}</div>
    <form onSubmit={e => { e.preventDefault(); navigate(`/${role}`); }} className="space-y-4"><Input label="Email address" type="email" placeholder="you@example.com" required /><Input label="Password" type="password" placeholder="••••••••" required /><div className="flex justify-between text-xs font-bold"><label className="flex gap-2 text-slate-500"><input type="checkbox" /> Remember me</label><button className="text-teal-600">Forgot password?</button></div><button className="btn-primary w-full py-4">Log in securely</button></form>
    <p className="mt-6 text-center text-sm text-slate-500">New to RemedyQuest? <Link to="/register" className="font-extrabold text-teal-600">Create account</Link></p>
  </AuthShell>;
}

export function Register() {
  const [role, setRole] = useState("patient");
  const navigate = useNavigate();
  return <AuthShell title="Create your account" subtitle="A few details and your care journey can begin." wide>
    <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">{[["patient", UserRound], ["doctor", Stethoscope]].map(([r,Icon]) => <button key={r} onClick={() => setRole(r)} className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold capitalize transition ${role === r ? "bg-white shadow-sm" : "text-slate-400"}`}><Icon size={17} />{r}</button>)}</div>
    <form onSubmit={e => { e.preventDefault(); navigate(`/${role}`); }} className="grid gap-4 md:grid-cols-2"><Input label="Full name" placeholder="Your full name" required /><Input label="Email address" type="email" placeholder="you@example.com" required />{role === "patient" ? <><Input label="Username" placeholder="maya.moves" /><Input label="Age" type="number" placeholder="28" /><label><span className="label">Gender</span><select className="field"><option>Prefer not to say</option><option>Female</option><option>Male</option></select></label><label><span className="label">Main physical problem</span><select className="field"><option>Lower back pain</option><option>Neck stiffness</option><option>Joint pain</option><option>Posture correction</option></select></label><label><span className="label">Daily available time</span><select className="field"><option>15 minutes</option><option>20 minutes</option><option>25 minutes</option><option>30 minutes</option><option>40 minutes</option></select></label></> : <><Input label="Specialty" placeholder="Physiotherapy" /><Input label="Medical license number" placeholder="License number" /></>}<Input label="Password" type="password" placeholder="At least 8 characters" required />
      {role === "patient" && <div className="card col-span-full flex gap-4 bg-teal-50/70 shadow-none"><CreditCard className="shrink-0 text-teal-600" /><div><p className="text-sm font-extrabold">Payment gateway placeholder · 40 ILS</p><p className="mt-1 text-xs leading-5 text-slate-500">Card or banking information is never stored in RemedyQuest. Payment will be processed by a provider such as Stripe or PayPal.</p></div></div>}
      <label className="col-span-full flex items-start gap-3 text-xs leading-5 text-slate-500"><input className="mt-1" type="checkbox" required /> I agree to the terms and understand that RemedyQuest does not replace professional medical advice.</label>
      <button className="btn-primary col-span-full py-4">Create {role} account</button></form>
    <p className="mt-6 text-center text-sm text-slate-500">Already registered? <Link to="/login" className="font-extrabold text-teal-600">Log in</Link></p>
  </AuthShell>;
}

function AuthShell({ children, title, subtitle, wide = false }) {
  return <div className="relative min-h-screen bg-mist p-4 lg:grid lg:grid-cols-[.8fr_1.2fr] lg:p-0"><div className="absolute end-4 top-4 z-20"><LanguageToggle /></div><div className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col"><div className="absolute -right-20 top-20 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" /><Brand light /><div className="relative my-auto max-w-lg"><span className="pill bg-white/10 text-teal-100"><Sparkles size={14} /> Personalized care that keeps you going</span><h2 className="mt-6 text-5xl font-extrabold leading-tight tracking-tight">Small steps. Visible progress. Stronger you.</h2><div className="mt-10 space-y-4">{[[Activity,"Adaptive therapeutic exercise"],[Stethoscope,"Professional doctor follow-up"],[ShieldCheck,"Safety-led guidance"]].map(([Icon,t]) => <p key={t} className="flex items-center gap-3 text-sm font-semibold text-white/70"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10"><Icon size={17} /></span>{t}<Check size={16} className="ml-auto text-teal-300" /></p>)}</div></div><p className="text-xs text-white/30">RemedyQuest Health-Tech Platform</p></div><main className="flex items-center justify-center px-2 py-16 md:px-8"><div className={`w-full ${wide ? "max-w-3xl" : "max-w-md"}`}><Link to="/" className="mb-8 inline-flex items-center gap-2 text-xs font-extrabold text-slate-500"><ArrowLeft size={15} /> Back to home</Link><div className="card p-6 md:p-8"><div className="mb-7"><span className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-600"><LockKeyhole size={20} /></span><h1 className="text-3xl font-extrabold tracking-tight">{title}</h1><p className="mt-2 text-sm text-slate-500">{subtitle}</p></div>{children}</div></div></main></div>;
}
