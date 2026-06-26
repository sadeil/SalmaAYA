import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  Check,
  CreditCard,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
} from "lucide-react";
import Brand from "../components/Brand";
import { LanguageToggle, useLanguage } from "../i18n/LanguageContext";
import { api } from "../services/api";

// =====================================================================
// Input — adds an animated focus ring + optional trailing icon slot.
// Same DOM contract (name, placeholder, type) so the existing submit
// handlers and the smoke test that types into placeholders all keep
// working unchanged.
// =====================================================================
const Input = ({ label, trailing, ...props }) => {
  const { t } = useLanguage();
  return (
    <label data-no-translate className="group block">
      <span className="label transition-colors group-focus-within:text-teal-600">
        {t(label)}
      </span>
      <div className="relative">
        <input
          className="field pr-12"
          {...props}
          placeholder={t(props.placeholder)}
        />
        {trailing && (
          <div className="absolute inset-y-0 end-3 flex items-center text-slate-400">
            {trailing}
          </div>
        )}
      </div>
    </label>
  );
};

// Password input with reveal toggle.
const PasswordInput = (props) => {
  const [show, setShow] = useState(false);
  return (
    <Input
      {...props}
      type={show ? "text" : "password"}
      trailing={
        <button
          type="button"
          aria-label={show ? "Hide password" : "Show password"}
          onClick={() => setShow((value) => !value)}
          className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-ink"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      }
    />
  );
};

// =====================================================================
// Segmented role picker — uses framer-motion's layoutId to slide the
// selected pill between options. Replaces the bg-white-on-selected look
// with a layout-animated card.
// =====================================================================
function RoleSegmented({ value, onChange }) {
  const { t } = useLanguage();
  return (
    <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
      {[
        ["patient", UserRound],
        ["doctor", Stethoscope],
      ].map(([itemRole, Icon]) => {
        const active = value === itemRole;
        return (
          <button
            key={itemRole}
            type="button"
            onClick={() => onChange(itemRole)}
            aria-pressed={active}
            className={`relative flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold capitalize transition ${active ? "text-ink" : "text-slate-400 hover:text-slate-600"}`}
          >
            {active && (
              <motion.span
                layoutId="role-pill"
                className="absolute inset-0 rounded-xl bg-white shadow-sm"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              <Icon size={17} />
              {t(itemRole)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Login() {
  const [params] = useSearchParams();
  const [role, setRole] = useState(params.get("role") || "patient");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);

    try {
      const session = await api.login({
        email: form.get("email"),
        password: form.get("password"),
        role,
      });
      localStorage.setItem("rq-session", JSON.stringify(session));
      navigate(`/${session.user.role}`);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Continue your journey toward better movement.">
      <RoleSegmented value={role} onChange={setRole} />
      <form onSubmit={submit} className="space-y-4">
        <Input name="email" label="Email address" type="email" placeholder="you@example.com" required />
        <PasswordInput name="password" label="Password" placeholder="••••••••" required />
        <div className="flex justify-between text-xs font-bold">
          <label className="flex items-center gap-2 text-slate-500">
            <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
            {t("Remember me")}
          </label>
          <button type="button" className="text-teal-600 transition hover:underline">{t("Forgot password?")}</button>
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700"
          >
            {t(error)}
          </motion.p>
        )}
        <button
          disabled={loading}
          className="btn-primary w-full py-4 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <span className="spinner" />}
          {loading ? t("Signing in...") : t("Log in securely")}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        {t("New to RemedyQuest?")}{" "}
        <Link to="/register" className="font-extrabold text-teal-600 link-underline">
          {t("Create account")}
        </Link>
      </p>
    </AuthShell>
  );
}

export function Register() {
  const [role, setRole] = useState("patient");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);

    try {
      const session = await api.register({
        age: form.get("age"),
        email: form.get("email"),
        gender: form.get("gender"),
        licenseNumber: form.get("licenseNumber"),
        name: form.get("name"),
        password: form.get("password"),
        problem: form.get("problem"),
        role,
        specialty: form.get("specialty"),
        time: form.get("time"),
        username: form.get("username"),
      });
      localStorage.setItem("rq-session", JSON.stringify(session));
      navigate(`/${session.user.role}`);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="A few details and your care journey can begin." wide>
      <RoleSegmented value={role} onChange={setRole} />
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <Input name="name" label="Full name" placeholder="Your full name" required />
        <Input name="email" label="Email address" type="email" placeholder="you@example.com" required />
        {role === "patient" ? (
          <>
            <Input name="username" key="patient-username" label="Username" placeholder="maya.moves" />
            <Input name="age" key="patient-age" label="Age" type="number" placeholder="28" />
            <label>
              <span className="label">{t("Gender")}</span>
              <select name="gender" className="field">
                <option>{t("Prefer not to say")}</option>
                <option>{t("Female")}</option>
                <option>{t("Male")}</option>
              </select>
            </label>
            <label>
              <span className="label">{t("Main physical problem")}</span>
              <select name="problem" className="field">
                <option>{t("Lower back pain")}</option>
                <option>{t("Neck stiffness")}</option>
                <option>{t("Joint pain")}</option>
                <option>{t("Posture correction")}</option>
              </select>
            </label>
            <label>
              <span className="label">{t("Daily available time")}</span>
              <select name="time" className="field">
                <option>{t("15 minutes")}</option>
                <option>{t("20 minutes")}</option>
                <option>{t("25 minutes")}</option>
                <option>{t("30 minutes")}</option>
                <option>{t("40 minutes")}</option>
              </select>
            </label>
          </>
        ) : (
          <>
            <Input name="specialty" key="doctor-specialty" label="Specialty" placeholder="Physiotherapy" />
            <Input name="licenseNumber" key="doctor-license" label="Medical license number" placeholder="License number" />
          </>
        )}
        <PasswordInput name="password" label="Password" placeholder="At least 8 characters" required />
        {role === "patient" && (
          <div className="col-span-full flex items-start gap-4 rounded-3xl border border-teal-100 bg-teal-50/70 p-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-teal-600 shadow-card">
              <CreditCard size={17} />
            </span>
            <div>
              <p className="text-sm font-extrabold">{t("Subscription starts after approval")} · 40 ILS</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {t("Payment collection is intentionally deferred until a doctor approves the care plan, so the current deployment does not collect or store card details.")}
              </p>
            </div>
          </div>
        )}
        <label className="col-span-full flex items-start gap-3 text-xs leading-5 text-slate-500">
          <input className="mt-1 h-3.5 w-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500" type="checkbox" required />
          {t("I agree to the terms and understand that RemedyQuest does not replace professional medical advice.")}
        </label>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-full rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700"
          >
            {t(error)}
          </motion.p>
        )}
        <button
          disabled={loading}
          className="btn-primary col-span-full py-4 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <span className="spinner" />}
          {loading ? t("Creating account...") : t(`Create ${role} account`)}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        {t("Already registered?")}{" "}
        <Link to="/login" className="font-extrabold text-teal-600 link-underline">
          {t("Log in")}
        </Link>
      </p>
    </AuthShell>
  );
}

// =====================================================================
// Right-hand visual panel — adds animated entrances and a soft floating
// trust badge. Same copy, same layout.
// =====================================================================
function AuthShell({ children, title, subtitle, wide = false }) {
  const { t } = useLanguage();
  return (
    <div className="relative min-h-screen bg-mist p-4 lg:grid lg:grid-cols-[.8fr_1.2fr] lg:p-0">
      <div className="absolute end-4 top-4 z-20"><LanguageToggle /></div>
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-ink via-ink to-teal-700 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -right-20 top-20 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl anim-float" />
        <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-violet-400/15 blur-3xl" />
        <Brand light />
        <div className="relative my-auto max-w-lg">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="pill bg-white/10 text-teal-100"
          >
            <Sparkles size={14} /> {t("Personalized care that keeps you going")}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-6 text-5xl font-extrabold leading-tight tracking-tight"
          >
            {t("Small steps. Visible progress. Stronger you.")}
          </motion.h2>
          <div className="mt-10 space-y-4">
            {[
              [Activity, "Adaptive therapeutic exercise"],
              [Stethoscope, "Professional doctor follow-up"],
              [ShieldCheck, "Safety-led guidance"],
            ].map(([Icon, text], index) => (
              <motion.p
                key={text}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + index * 0.07 }}
                className="flex items-center gap-3 text-sm font-semibold text-white/75"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
                  <Icon size={17} />
                </span>
                {t(text)}
                <Check size={16} className="ms-auto text-teal-300" />
              </motion.p>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/30">{t("RemedyQuest Health-Tech Platform")}</p>
      </div>
      <main className="flex items-center justify-center px-2 py-16 md:px-8">
        <div className={`w-full ${wide ? "max-w-3xl" : "max-w-md"}`}>
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 transition hover:text-teal-600">
            <ArrowLeft size={15} /> {t("Back to home")}
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.45, 0, 0.18, 1] }}
            className="card p-6 md:p-8"
          >
            <div className="mb-7">
              <span className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-600">
                <LockKeyhole size={20} />
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight">{t(title)}</h1>
              <p className="mt-2 text-sm text-slate-500">{t(subtitle)}</p>
            </div>
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
