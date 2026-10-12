import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { DashboardLayout } from "../components/Layout";
import { homePathFor, useSession } from "../services/session";

const Landing = lazy(() => import("../pages/Landing"));
const ExerciseCamera = lazy(() => import("../pages/ExerciseCamera"));
const namedPage = (importer, name) => lazy(() => importer().then(module => ({ default: module[name] })));
const importAuth = () => import("../pages/Auth");
const importPatient = () => import("../pages/Patient");
const importDoctorAdmin = () => import("../pages/DoctorAdmin");
const Login = namedPage(importAuth, "Login");
const Register = namedPage(importAuth, "Register");
const PatientDashboard = namedPage(importPatient, "PatientDashboard");
const ExerciseSchedule = namedPage(importPatient, "ExerciseSchedule");
const AIChat = namedPage(importPatient, "AIChat");
const Gamification = namedPage(importPatient, "Gamification");
const Refunds = namedPage(importPatient, "Refunds");
const MessagesPage = namedPage(importPatient, "MessagesPage");
const DoctorDashboard = namedPage(importDoctorAdmin, "DoctorDashboard");
const DoctorPatients = namedPage(importDoctorAdmin, "DoctorPatients");
const PatientProfile = namedPage(importDoctorAdmin, "PatientProfile");
const AdminDashboard = namedPage(importDoctorAdmin, "AdminDashboard");
function PageLoader() {
  return <div className="grid min-h-[50vh] place-items-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600" /></div>;
}

// Signed-out visitors go to the login page (and come back afterwards);
// signed-in users who open another role's area go to their own home.
function RequireRole({ roles, children }) {
  const session = useSession();
  const location = useLocation();
  if (!session) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (!roles.includes(session.user.role)) return <Navigate to={homePathFor(session.user)} replace />;
  return children;
}

// The login and register pages are pointless once signed in.
function GuestOnly({ children }) {
  const session = useSession();
  return session ? <Navigate to={homePathFor(session.user)} replace /> : children;
}

export default function App() {
  return <Suspense fallback={<PageLoader />}><Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
    <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
    <Route element={<RequireRole roles={["patient"]}><DashboardLayout role="patient" /></RequireRole>}>
      <Route path="/patient" element={<PatientDashboard />} />
      <Route path="/patient/exercises" element={<ExerciseSchedule />} />
      <Route path="/patient/form-checker" element={<ExerciseCamera />} />
      <Route path="/patient/chat" element={<AIChat />} />
      <Route path="/patient/rewards" element={<Gamification />} />
      <Route path="/patient/refunds" element={<Refunds />} />
      <Route path="/patient/messages" element={<MessagesPage />} />
    </Route>
    <Route element={<RequireRole roles={["doctor"]}><DashboardLayout role="doctor" /></RequireRole>}>
      <Route path="/doctor" element={<DoctorDashboard />} />
      <Route path="/doctor/patients" element={<DoctorPatients />} />
      <Route path="/doctor/patients/:id" element={<PatientProfile />} />
      <Route path="/doctor/messages" element={<MessagesPage />} />
    </Route>
    <Route element={<RequireRole roles={["admin", "doctor"]}><DashboardLayout role="admin" /></RequireRole>}>
      <Route path="/admin" element={<AdminDashboard />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense>;
}
