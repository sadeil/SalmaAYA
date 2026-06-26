import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "../components/Layout";

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

export default function App() {
  return <Suspense fallback={<PageLoader />}><Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route element={<DashboardLayout role="patient" />}>
      <Route path="/patient" element={<PatientDashboard />} />
      <Route path="/patient/exercises" element={<ExerciseSchedule />} />
      <Route path="/patient/form-checker" element={<ExerciseCamera />} />
      <Route path="/patient/chat" element={<AIChat />} />
      <Route path="/patient/rewards" element={<Gamification />} />
      <Route path="/patient/refunds" element={<Refunds />} />
      <Route path="/patient/messages" element={<MessagesPage />} />
    </Route>
    <Route element={<DashboardLayout role="doctor" />}>
      <Route path="/doctor" element={<DoctorDashboard />} />
      <Route path="/doctor/patients" element={<DoctorPatients />} />
      <Route path="/doctor/patients/:id" element={<PatientProfile />} />
      <Route path="/doctor/messages" element={<MessagesPage />} />
    </Route>
    <Route element={<DashboardLayout role="admin" />}>
      <Route path="/admin" element={<AdminDashboard />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense>;
}
