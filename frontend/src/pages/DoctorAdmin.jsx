import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  Check,
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  Braces,
  Clock3,
  Database,
  FilePenLine,
  MessageCircle,
  RefreshCw,
  Rows3,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { patients as fallbackPatients } from "../data/appData";
import { CountUp, PageHeader, Progress, Sparkline, StatCard, Status } from "../components/UI";
import { api } from "../services/api";

function usePatients() {
  const [patients, setPatients] = useState(fallbackPatients);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.patients()
      .then((items) => active && setPatients(items))
      .catch((apiError) => active && setError(apiError.message));
    return () => {
      active = false;
    };
  }, []);

  return { error, patients, setPatients };
}

export function DoctorDashboard() {
  const { error, patients } = usePatients();
  const reviewCount = patients.filter((patient) => patient.status === "Needs review").length;
  const activeCount = patients.filter((patient) => patient.commitment >= 70).length;

  return (
    <>
      <PageHeader
        eyebrow="Clinical overview"
        title="Good morning, Dr. Aya"
        description="Review suggested plans, respond to patients, and keep recovery on track."
        action={<Link to="/doctor/patients" className="btn-primary">Review patient plans <ArrowRight size={16} /></Link>}
      />
      {error && <p className="mb-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">Backend warning: {error}</p>}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total patients" value={String(patients.length)} note="+4 this month" trend={[8, 10, 11, 12, 14, 16, patients.length]} />
        <StatCard icon={UserCheck} label="Active patients" value={String(activeCount)} note={`${Math.round((activeCount / Math.max(1, patients.length)) * 100)}% active`} tone="blue" trend={[2, 3, 3, 4, 5, 5, activeCount]} />
        <StatCard icon={ClipboardCheck} label="Plans need review" value={String(reviewCount)} note="Clinical queue" tone="amber" trend={[1, 2, 1, 2, 3, 2, reviewCount]} />
        <StatCard icon={MessageCircle} label="Consultation requests" value="5" tone="purple" trend={[1, 2, 4, 3, 5, 4, 5]} />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_.45fr]">
        <div className="card overflow-x-auto">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xl font-extrabold">Plans needing attention</h3>
            <Link className="text-xs font-extrabold text-teal-600" to="/doctor/patients">View all</Link>
          </div>
          <PatientTable patients={patients.slice(0, 3)} />
        </div>
        <div className="card">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-600"><Bot /></span>
          <h3 className="mt-5 text-xl font-extrabold">Care plan suggestions</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{reviewCount} plans are waiting for clinical review before patients can begin.</p>
          <div className="mt-6 space-y-3">
            {[
              ["Lower back mobility", "3 patients"],
              ["Neck tension release", "2 patients"],
              ["Posture correction", "2 patients"],
            ].map(([name, count]) => (
              <div key={name} className="flex justify-between rounded-2xl bg-slate-50 p-3 text-sm">
                <span className="font-bold">{name}</span>
                <span className="text-slate-400">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {[
          ["Patient commitment", "82%", "Across active plans", [70, 72, 74, 78, 80, 82, 82]],
          ["Plans approved", "24", "This month", [3, 4, 6, 9, 14, 18, 24]],
          ["Avg. response", "5h", "To patient messages", [12, 10, 8, 9, 7, 6, 5]],
        ].map(([label, value, note, trend]) => (
          <div key={label} className="card flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-500">{label}</p>
              <p className="mt-4 text-3xl font-extrabold">
                <CountUp value={value} />
              </p>
              <p className="mt-2 text-xs font-bold text-teal-600">{note}</p>
            </div>
            <Sparkline values={trend} width={64} height={32} />
          </div>
        ))}
      </div>
    </>
  );
}

function PatientTable({ patients }) {
  return (
    <table className="w-full min-w-[760px] text-left text-sm">
      <thead className="sticky top-0 z-10 bg-white text-xs uppercase tracking-wider text-slate-400">
        <tr>
          <th className="pb-4">Patient</th>
          <th>Problem</th>
          <th>Pain</th>
          <th>Commitment</th>
          <th>Level</th>
          <th>Status</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {patients.map((patient, index) => (
          <motion.tr
            key={patient.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="group border-t transition hover:bg-slate-50"
          >
            <td className="py-4">
              <div className="flex items-center gap-3">
                <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-teal-100 to-teal-50 text-xs font-extrabold text-teal-700 shadow-inner">
                  {patient.initials}
                </span>
                <div>
                  <p className="font-extrabold">{patient.name}</p>
                  <p className="text-xs text-slate-400">{patient.time}/day</p>
                </div>
              </div>
            </td>
            <td>{patient.problem}</td>
            <td>
              <span className={`font-extrabold ${patient.pain >= 7 ? "text-rose-600" : patient.pain >= 4 ? "text-amber-600" : "text-teal-600"}`}>
                {patient.pain}
              </span>
              <span className="text-slate-400">/10</span>
            </td>
            <td>
              <div className="flex w-32 items-center gap-2">
                <div className="flex-1">
                  <div className="mb-1 text-xs font-bold">{patient.commitment}%</div>
                  <Progress value={patient.commitment} />
                </div>
              </div>
            </td>
            <td className="font-bold">Lvl {patient.level}</td>
            <td><Status>{patient.status}</Status></td>
            <td>
              <Link
                to={`/doctor/patients/${patient.id}`}
                className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500 transition group-hover:bg-teal-50 group-hover:text-teal-600"
              >
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  );
}

export function DoctorPatients() {
  const { error, patients } = usePatients();
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => patients.filter((patient) => `${patient.name} ${patient.problem}`.toLowerCase().includes(query.toLowerCase())),
    [patients, query],
  );

  return (
    <>
      <PageHeader
        eyebrow="Patient management"
        title="Your patients"
        description="Review care plans, progress, and patient commitment in one place."
        action={<div className="relative"><Search className="absolute left-3 top-3.5 text-slate-400" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} className="field pl-10" placeholder="Search patients" /></div>}
      />
      {error && <p className="mb-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">Backend warning: {error}</p>}
      <div className="card overflow-x-auto"><PatientTable patients={filtered} /></div>
    </>
  );
}

export function PatientProfile() {
  const [approved, setApproved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const approvePlan = async () => {
    setSaving(true);
    setMessage("");
    try {
      await api.approvePlan(1);
      setApproved(true);
      setMessage("Plan approval saved to backend.");
    } catch (apiError) {
      setMessage(apiError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Patient profile"
        title="Salma"
        description="Lower back pain آ· 25 minutes daily آ· Joined May 2026"
        action={<div className="flex gap-2"><Link to="/doctor/messages" className="btn-soft"><MessageCircle size={16} /> Send note</Link><button disabled={saving || approved} onClick={approvePlan} className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"><Check size={16} /> {approved ? "Plan approved" : saving ? "Approving..." : "Approve plan"}</button></div>}
      />
      {message && <p className="mb-5 rounded-2xl bg-teal-50 px-4 py-3 text-sm font-bold text-teal-700">{message}</p>}
      <div className="grid gap-5 xl:grid-cols-[1fr_.38fr]">
        <div className="space-y-5">
          <div className="card">
            <div className="flex items-center gap-4">
              <span className="relative grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-teal-200 to-teal-100 text-lg font-extrabold text-teal-700 shadow-inner">
                S
                <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white bg-emerald-400" />
              </span>
              <div className="flex-1">
                <h3 className="text-xl font-extrabold">Salma</h3>
                <p className="text-sm text-slate-500">Age 28 آ· Pain level 4/10</p>
              </div>
              <Status>{approved ? "Approved" : "Needs review"}</Status>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Problem", "Lower back tension"],
                ["Daily time", "25 minutes"],
                ["Commitment", "92%"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-slate-50 p-4 transition hover:bg-white hover:shadow-sm">
                  <p className="text-xs font-bold text-slate-400">{label}</p>
                  <p className="mt-2 text-sm font-extrabold">{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="flex justify-between">
              <div>
                <span className="pill bg-violet-50 text-violet-700"><Bot size={14} /> Suggested</span>
                <h3 className="mt-4 text-xl font-extrabold">Gentle lower back mobility</h3>
              </div>
              <button className="btn-soft h-fit"><FilePenLine size={16} /> Modify plan</button>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">Low-impact mobility focused on reducing tension related to prolonged sitting. Avoid loaded spinal flexion.</p>
            <div className="mt-6 space-y-3">
              {["Cat-cow stretch آ· 3 x 8", "Lower back mobility آ· 2 x 12", "Hamstring stretch آ· 2 x 30 sec", "Posture reset آ· 3 x 10"].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border p-3">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-teal-50 text-xs font-extrabold text-teal-700">{index + 1}</span>
                  <p className="text-sm font-bold">{item}</p>
                  <button aria-label={`Remove ${item}`} className="ml-auto text-slate-300"><X size={16} /></button>
                </div>
              ))}
            </div>
            <button className="btn-soft mt-4 w-full">+ Add exercise</button>
          </div>
          <div className="card">
            <h3 className="text-xl font-extrabold">Doctor notes</h3>
            <textarea className="field mt-4 min-h-28" placeholder="Add clinical notes or guidance..." />
            <button onClick={() => setMessage("Doctor note saved locally for this review session.")} className="btn-primary mt-3">Save and send note</button>
          </div>
        </div>
        <aside className="space-y-5">
          <div className="card">
            <h3 className="font-extrabold">Progress snapshot</h3>
            <div className="mt-5 space-y-5">
              {[
                ["Weekly commitment", 92],
                ["Plan completion", 76],
                ["Mobility confidence", 72],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="mb-2 flex justify-between text-xs font-bold"><span>{label}</span><span>{value}%</span></div>
                  <Progress value={value} />
                </div>
              ))}
            </div>
          </div>
          <div className="card border-rose-100 bg-rose-50">
            <AlertTriangle className="text-rose-500" />
            <h3 className="mt-4 font-extrabold text-rose-800">Need an in-person visit?</h3>
            <p className="mt-2 text-xs leading-5 text-rose-700">Recommend a real medical evaluation when symptoms need closer assessment.</p>
            <button onClick={() => setMessage("In-person visit recommendation recorded.")} className="btn-soft mt-4 w-full border-rose-200 text-rose-700">Recommend visit</button>
          </div>
        </aside>
      </div>
    </>
  );
}

export function AdminDashboard() {
  const [database, setDatabase] = useState(null);
  const [databaseError, setDatabaseError] = useState("");
  const [databaseLoading, setDatabaseLoading] = useState(true);
  const [databaseRefreshKey, setDatabaseRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    setDatabaseLoading(true);
    setDatabaseError("");
    api.adminDatabase()
      .then((snapshot) => {
        if (active) setDatabase(snapshot);
      })
      .catch((apiError) => {
        if (active) setDatabaseError(apiError.message);
      })
      .finally(() => {
        if (active) setDatabaseLoading(false);
      });
    return () => {
      active = false;
    };
  }, [databaseRefreshKey]);

  return (
    <>
      <PageHeader eyebrow="Platform administration" title="RemedyQuest control center" description="Monitor the health of the platform, payments, users, and reward requests." />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total users" value="1,284" note="+12.4% this month" trend={[800, 880, 950, 1020, 1100, 1190, 1284]} />
        <StatCard icon={Stethoscope} label="Verified doctors" value="42" tone="purple" trend={[20, 22, 26, 30, 35, 38, 42]} />
        <StatCard icon={UserRound} label="Active patients" value="986" tone="blue" trend={[610, 680, 730, 800, 860, 920, 986]} />
        <StatCard icon={CreditCard} label="Payments" value="38.4K ILS" tone="amber" trend={[18, 22, 26, 29, 32, 35, 38]} />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_.45fr]">
        <div className="card overflow-x-auto">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xl font-extrabold">Refund requests</h3>
            <span className="pill bg-amber-50 text-amber-700"><Sparkles size={13} /> 8 pending</span>
          </div>
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-white text-xs uppercase tracking-wider text-slate-400">
              <tr><th className="pb-4">Patient</th><th>Milestone</th><th>Amount</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {[
                ["Salma", "Level 2", "5 ILS"],
                ["Omar Saleh", "Level 1", "5 ILS"],
                ["Lina Nasser", "Level 3", "10 ILS"],
              ].map(([patient, milestone, amount], index) => (
                <motion.tr
                  key={patient}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group border-t transition hover:bg-slate-50"
                >
                  <td className="py-5 font-extrabold">{patient}</td>
                  <td>{milestone}</td>
                  <td className="font-bold">{amount}</td>
                  <td><Status>Pending</Status></td>
                  <td>
                    <div className="flex gap-2">
                      <button aria-label="Approve" className="grid h-8 w-8 place-items-center rounded-lg bg-teal-50 text-teal-600 transition hover:bg-teal-100">
                        <Check size={14} />
                      </button>
                      <button aria-label="Reject" className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-500 transition hover:bg-rose-100">
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card relative overflow-hidden bg-gradient-to-br from-ink to-teal-700 text-white">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-teal-300/25 blur-3xl anim-float" />
          <ShieldCheck />
          <h3 className="relative mt-5 text-xl font-extrabold">Platform status</h3>
          <p className="relative mt-2 text-sm text-white/55">Core application services are reachable through the backend API.</p>
          <div className="relative mt-6 space-y-3">
            {[
              ["Authentication API", "Operational"],
              ["Exercise plans", "Operational"],
              ["Doctor reviews", "Operational"],
              ["Refund ledger", "Operational"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-xl bg-white/10 p-3 text-xs backdrop-blur">
                <span>{label}</span>
                <span className="flex items-center gap-1.5 font-bold text-teal-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-300 anim-pulse-glow" />
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <StatCard icon={ClipboardCheck} label="Exercise plans" value="742" note="61 awaiting review" trend={[500, 540, 600, 640, 680, 710, 742]} />
        <StatCard icon={CircleDollarSign} label="Refunded total" value="3,145 ILS" tone="amber" trend={[600, 900, 1300, 1900, 2200, 2700, 3145]} />
        <StatCard icon={Activity} label="Avg. commitment" value="78%" tone="blue" trend={[64, 68, 70, 72, 74, 76, 78]} />
      </div>
      <DatabaseViewer
        snapshot={database}
        error={databaseError}
        loading={databaseLoading}
        onRefresh={() => setDatabaseRefreshKey((value) => value + 1)}
      />
    </>
  );
}

function DatabaseViewer({ snapshot, error, loading, onRefresh }) {
  const tables = useMemo(() => snapshot?.tables || {}, [snapshot]);
  const tableNames = useMemo(() => Object.keys(tables), [tables]);
  const [selectedTable, setSelectedTable] = useState("");
  const [query, setQuery] = useState("");
  const [inspectedValue, setInspectedValue] = useState(null);

  useEffect(() => {
    if (!selectedTable && tableNames.length) setSelectedTable(tableNames[0]);
    if (selectedTable && !tableNames.includes(selectedTable)) setSelectedTable(tableNames[0] || "");
  }, [selectedTable, tableNames]);

  const rows = useMemo(() => databaseRows(tables[selectedTable]), [selectedTable, tables]);
  const columns = useMemo(() => databaseColumns(rows), [rows]);
  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return rows;
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(normalizedQuery));
  }, [query, rows]);
  const totalRecords = Object.values(tables).reduce((total, value) => total + databaseTableCount(value), 0);

  return (
    <section data-no-translate className="mt-5 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-card">
      <div className="border-b border-slate-200 bg-slate-950 px-5 py-5 text-white sm:px-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal-400/15 text-teal-300">
              <Database size={22} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-extrabold">Database viewer</h3>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-extrabold text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Live database
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-slate-300">READ ONLY</span>
              </div>
              <p className="mt-1.5 text-sm text-slate-400">Inspect persisted application records and nested JSON values.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-extrabold text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {loading ? "Refreshing..." : "Refresh snapshot"}
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DatabaseMetric label="Connection" value={snapshot?.status?.connected ? "Connected" : "Unavailable"} tone="emerald" />
          <DatabaseMetric label="Adapter" value={snapshot?.status?.adapter || "json-file"} />
          <DatabaseMetric label="Loaded tables:" value={String(tableNames.length)} />
          <DatabaseMetric label="Total records" value={String(totalRecords)} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1.5"><Clock3 size={12} /> Snapshot: {formatDatabaseTime(snapshot?.status?.updatedAt)}</span>
          <span className="min-w-0 truncate">File: {snapshot?.status?.path || "database/data/app-db.json"}</span>
          {snapshot?.status?.sizeBytes != null && <span>{formatBytes(snapshot.status.sizeBytes)}</span>}
        </div>
      </div>

      {error && <p className="m-5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">Database error: {error}</p>}

      {!snapshot && !error ? (
        <div className="grid min-h-72 place-items-center p-8 text-center">
          <div>
            <RefreshCw className="mx-auto animate-spin text-teal-500" />
            <p className="mt-3 text-sm font-bold text-slate-500">Loading database schema and records...</p>
          </div>
        </div>
      ) : (
        <div className="grid min-h-[560px] lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200 bg-slate-50/80 p-3 lg:border-b-0 lg:border-r">
            <div className="px-3 pb-2 pt-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Tables</div>
            <div className="space-y-1">
              {tableNames.map((name) => (
                <button
                  type="button"
                  key={name}
                  onClick={() => {
                    setSelectedTable(name);
                    setQuery("");
                    setInspectedValue(null);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    selectedTable === name ? "bg-white text-teal-700 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:bg-white"
                  }`}
                >
                  <Rows3 size={15} className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-xs font-extrabold">{formatTableName(name)}</span>
                  <span className="rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-extrabold text-slate-500">
                    {databaseTableCount(tables[name])}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <div className="min-w-0">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-ink">{formatTableName(selectedTable)}</h4>
                  <span className="rounded-md bg-teal-50 px-2 py-1 text-[10px] font-extrabold uppercase text-teal-700">table</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{filteredRows.length} of {rows.length} rows · {columns.length} columns</p>
              </div>
              <label className="relative block sm:w-72">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs font-bold outline-none transition focus:border-teal-400 focus:bg-white"
                  placeholder={`Search ${formatTableName(selectedTable)}...`}
                />
              </label>
            </div>

            <div className="max-h-[480px] overflow-auto">
              {filteredRows.length ? (
                <table className="w-full min-w-max border-collapse text-left text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 shadow-[0_1px_0_#e2e8f0]">
                    <tr>
                      <th className="w-12 px-4 py-3 font-extrabold">#</th>
                      {columns.map((column) => <th key={column} className="max-w-64 px-4 py-3 font-extrabold">{formatTableName(column)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-slate-100 transition hover:bg-teal-50/30">
                        <td className="px-4 py-3 font-mono text-[10px] text-slate-400">{rowIndex + 1}</td>
                        {columns.map((column) => (
                          <td key={column} className="max-w-64 px-4 py-3 align-top text-slate-600">
                            <DatabaseCell value={row[column]} onInspect={setInspectedValue} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="grid min-h-64 place-items-center p-8 text-center">
                  <div>
                    <Search className="mx-auto text-slate-300" />
                    <p className="mt-3 text-sm font-extrabold text-slate-500">No matching records</p>
                    <p className="mt-1 text-xs text-slate-400">Try a different search value.</p>
                  </div>
                </div>
              )}
            </div>

            {inspectedValue && (
              <div className="border-t border-slate-200 bg-slate-950 p-4 text-slate-100">
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-xs font-extrabold"><Braces size={14} className="text-teal-300" /> JSON inspector</span>
                  <button type="button" onClick={() => setInspectedValue(null)} className="text-slate-400 transition hover:text-white"><X size={15} /></button>
                </div>
                <pre className="max-h-56 overflow-auto text-[11px] leading-5 text-slate-300">{JSON.stringify(inspectedValue, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function DatabaseMetric({ label, value, tone = "slate" }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
      <p className="text-[10px] font-extrabold tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 truncate text-sm font-extrabold ${tone === "emerald" ? "text-emerald-300" : "text-slate-200"}`}>{value}</p>
    </div>
  );
}

function DatabaseCell({ value, onInspect }) {
  if (value == null) return <span className="font-mono text-[10px] italic text-slate-300">NULL</span>;
  if (typeof value === "boolean") return <span className={`pill ${value ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{String(value)}</span>;
  if (typeof value === "object") {
    const itemCount = Array.isArray(value) ? value.length : Object.keys(value).length;
    return (
      <button type="button" onClick={() => onInspect(value)} className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2 py-1 font-mono text-[10px] font-bold text-violet-700 hover:bg-violet-100">
        <Braces size={11} /> {Array.isArray(value) ? `Array(${itemCount})` : `Object(${itemCount})`}
      </button>
    );
  }
  if (typeof value === "number") return <span className="font-mono font-bold text-blue-600">{value}</span>;
  return <span className="block max-w-64 truncate" title={String(value)}>{String(value)}</span>;
}

function databaseRows(value) {
  if (Array.isArray(value)) return value.map((item) => (item && typeof item === "object" ? item : { value: item }));
  if (value && typeof value === "object") return [value];
  return value == null ? [] : [{ value }];
}

function databaseColumns(rows) {
  return [...new Set(rows.flatMap((row) => Object.keys(row)))];
}

function formatDatabaseTime(value) {
  if (!value) return "just now";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatBytes(value) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTableName(name) {
  return name.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

function databaseTableCount(value) {
  if (Array.isArray(value)) return value.length;
  return value ? 1 : 0;
}
