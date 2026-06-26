import { loadJsonDatabase, saveJsonDatabase } from "../config/database.mjs";

const defaultData = {
  progressData: [
    { day: "Mon", score: 45 },
    { day: "Tue", score: 62 },
    { day: "Wed", score: 55 },
    { day: "Thu", score: 78 },
    { day: "Fri", score: 72 },
    { day: "Sat", score: 88 },
    { day: "Sun", score: 92 },
  ],
  exercises: [
    { id: 1, name: "Neck release", area: "Neck & shoulders", duration: "4 min", sets: 2, reps: 8, done: true, color: "bg-teal-100 text-teal-700" },
    { id: 2, name: "Shoulder rolls", area: "Upper back", duration: "3 min", sets: 2, reps: 10, done: true, color: "bg-blue-100 text-blue-700" },
    { id: 3, name: "Cat-cow stretch", area: "Spine mobility", duration: "6 min", sets: 3, reps: 8, done: false, color: "bg-violet-100 text-violet-700" },
    { id: 4, name: "Lower back mobility", area: "Lower back", duration: "7 min", sets: 2, reps: 12, done: false, color: "bg-amber-100 text-amber-700" },
    { id: 5, name: "Posture reset", area: "Full posture", duration: "5 min", sets: 3, reps: 10, done: false, color: "bg-rose-100 text-rose-700" },
  ],
  patients: [
    { id: 1, name: "Maya Khalil", initials: "MK", problem: "Lower back pain", pain: 4, time: "25 min", level: 3, points: 82, commitment: 92, status: "Approved" },
    { id: 2, name: "Omar Saleh", initials: "OS", problem: "Neck stiffness", pain: 6, time: "20 min", level: 2, points: 54, commitment: 76, status: "Needs review" },
    { id: 3, name: "Lina Nasser", initials: "LN", problem: "Shoulder mobility", pain: 3, time: "30 min", level: 4, points: 118, commitment: 88, status: "Modified" },
    { id: 4, name: "Yousef Hamdan", initials: "YH", problem: "Posture correction", pain: 5, time: "15 min", level: 1, points: 24, commitment: 64, status: "Needs review" },
  ],
  messages: [
    { from: "ai", text: "Hi Maya. I am your RemedyQuest assistant. What is bothering you today?" },
    { from: "user", text: "My lower back feels tight after sitting at work." },
    { from: "ai", text: "I can help shape a gentle mobility plan. How strong is the discomfort from 1 to 10?" },
    { from: "user", text: "Around 4, mostly by the end of the day." },
    { from: "ai", text: "Thanks. Based on your answers, I suggest a 25-minute low-impact mobility plan. A doctor will review it before it becomes active." },
  ],
  patientProfile: {
    id: "patient_maya",
    name: "Maya Khalil",
    initials: "MK",
    problem: "Lower back pain",
    painLevel: 4,
    dailyTimeMinutes: 25,
    level: 3,
    points: 82,
    commitmentPercent: 92,
    status: "Approved",
  },
  chatCareState: {
    intake: {
      currentProblem: null,
      painLevel: null,
      dailyTimeMinutes: null,
    },
    draftPlan: null,
  },
  formCheckSessions: [],
};

const db = normalizeDatabase(loadJsonDatabase(defaultData));

export const progressData = db.progressData;
export const exercises = db.exercises;
export const patients = db.patients;
export const messages = db.messages;
export const patientProfile = db.patientProfile;
export const chatCareState = db.chatCareState;
export const formCheckSessions = db.formCheckSessions;

let nextSessionId = nextId(formCheckSessions);
let nextExerciseId = nextId(exercises);

export function nextExercisePlanId() {
  const id = nextExerciseId;
  nextExerciseId += 1;
  return id;
}

export function nextFormCheckSessionId() {
  const id = nextSessionId;
  nextSessionId += 1;
  return id;
}

export function saveAppStore() {
  saveJsonDatabase(db);
}

function normalizeDatabase(data) {
  return {
    progressData: Array.isArray(data.progressData) ? data.progressData : defaultData.progressData,
    exercises: Array.isArray(data.exercises) ? data.exercises : defaultData.exercises,
    patients: Array.isArray(data.patients) ? data.patients : defaultData.patients,
    messages: Array.isArray(data.messages) ? data.messages : defaultData.messages,
    patientProfile: data.patientProfile && typeof data.patientProfile === "object"
      ? data.patientProfile
      : defaultData.patientProfile,
    chatCareState: data.chatCareState && typeof data.chatCareState === "object"
      ? {
          intake: {
            currentProblem: data.chatCareState.intake?.currentProblem ?? null,
            painLevel: data.chatCareState.intake?.painLevel ?? null,
            dailyTimeMinutes: data.chatCareState.intake?.dailyTimeMinutes ?? null,
          },
          draftPlan: data.chatCareState.draftPlan ?? null,
        }
      : defaultData.chatCareState,
    formCheckSessions: Array.isArray(data.formCheckSessions) ? data.formCheckSessions : [],
  };
}

function nextId(items) {
  const max = items.reduce((highest, item) => Math.max(highest, Number(item.id) || 0), 0);
  return max + 1;
}
