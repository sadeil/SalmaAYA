import {
  exercises as seedExercises,
  messages as seedMessages,
  patients as seedPatients,
  progressData,
} from "../data/appData";

const clone = (value) => JSON.parse(JSON.stringify(value));

const state = {
  exercises: clone(seedExercises),
  messages: clone(seedMessages),
  patients: clone(seedPatients),
  conversations: [],
  sessions: [],
  patientProfile: {
    id: "patient_salma",
    name: "Salma",
    problem: "Lower back pain",
    painLevel: 4,
    dailyTimeMinutes: 25,
  },
  chatCareState: {
    draftPlan: null,
    intake: {
      currentProblem: null,
      location: null,
      painLevel: null,
      symptoms: null,
      duration: null,
      dailyTimeMinutes: null,
      goal: null,
      difficulty: null,
    },
  },
};

function response(payload) {
  return clone(payload);
}

function tokenFor(user) {
  return btoa(JSON.stringify({ user, demo: true, issuedAt: Date.now() }));
}

function parseBody(options) {
  if (!options?.body) return {};
  try {
    return JSON.parse(options.body);
  } catch {
    return {};
  }
}

const intakeQuestions = {
  currentProblem: "\u0645\u0631\u062D\u0628\u0627 \u0633\u0644\u0645\u0649. \u0633\u0623\u0637\u0631\u062D \u0639\u0644\u064A\u0643 \u0623\u0633\u0626\u0644\u0629 \u062B\u0645 \u0623\u062C\u0647\u0632 \u062E\u0637\u0629 \u062A\u0645\u0627\u0631\u064A\u0646.\n\n\u0645\u0627 \u0627\u0644\u0645\u0634\u0643\u0644\u0629 \u0627\u0644\u064A\u0648\u0645\u061F \u0627\u0644\u0638\u0647\u0631\u060C \u0627\u0644\u0631\u0642\u0628\u0629\u060C \u0627\u0644\u0643\u062A\u0641\u060C \u0623\u0648 \u0627\u0644\u0631\u0643\u0628\u0629\u061F",
  location: "\u0623\u064A\u0646 \u062A\u0634\u0639\u0631\u064A\u0646 \u0628\u0627\u0644\u0623\u0644\u0645 \u0628\u0627\u0644\u062A\u062D\u062F\u064A\u062F\u061F",
  painLevel: "\u0645\u0627 \u062F\u0631\u062C\u0629 \u0627\u0644\u0623\u0644\u0645 \u0645\u0646 0 \u0625\u0644\u0649 10\u061F",
  symptoms: "\u0647\u0644 \u064A\u0648\u062C\u062F \u062A\u0646\u0645\u064A\u0644\u060C \u0648\u062E\u0632\u060C \u0636\u0639\u0641\u060C \u062A\u0648\u0631\u0645\u060C \u0623\u0648 \u0623\u0644\u0645 \u062D\u0627\u062F\u061F \u0625\u0630\u0627 \u0644\u0627 \u064A\u0648\u062C\u062F\u060C \u0627\u0643\u062A\u0628\u064A: \u0644\u0627 \u064A\u0648\u062C\u062F.",
  duration: "\u0645\u0646\u0630 \u0645\u062A\u0649 \u0628\u062F\u0623\u062A \u0627\u0644\u0645\u0634\u0643\u0644\u0629\u061F",
  dailyTimeMinutes: "\u0643\u0645 \u062F\u0642\u064A\u0642\u0629 \u062A\u0633\u062A\u0637\u064A\u0639\u064A\u0646 \u0627\u0644\u062A\u0645\u0631\u0646 \u0627\u0644\u064A\u0648\u0645\u061F",
  goal: "\u0645\u0627 \u0647\u062F\u0641\u0643\u061F \u062A\u062E\u0641\u064A\u0641 \u0627\u0644\u0623\u0644\u0645 \u0623\u0648 \u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u062D\u0631\u0643\u0629\u061F",
  difficulty: "\u0645\u0627 \u0627\u0644\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u061F \u0633\u0647\u0644\u060C \u0645\u062A\u0648\u0633\u0637\u060C \u0623\u0648 \u0645\u062A\u0642\u062F\u0645\u061F",
};

const intakeOrder = Object.keys(intakeQuestions);

function questionFor(field) {
  const focus = String(state.chatCareState.intake.currentProblem || "");
  if (field === "location") {
    if (focus === "head") return "أين تشعرين بالألم في الرأس تحديدًا: الجبهة، خلف الرأس، أعلى الرأس، جهة واحدة، أم حول العينين؟";
    if (focus === "neck") return "أين الألم في الرقبة تحديدًا: الخلف، أحد الجانبين، أم يمتد إلى الكتف أو الذراع؟";
    if (focus === "shoulder") return "أي كتف يؤلمك؟ وهل الألم في الأمام، الأعلى، الخلف، أم يمتد إلى الذراع؟";
    if (focus === "knee") return "أي ركبة تؤلمك؟ وهل الألم أمام الركبة، خلفها، داخلها، أم خارجها؟";
    if (focus.includes("back")) return "أين الألم في الظهر تحديدًا: أعلى الظهر، منتصفه، أم أسفل الظهر؟ وهل هو في المنتصف أم جهة واحدة؟";
  }
  if (field === "symptoms" && focus === "head") {
    return "هل يصاحب ألم الرأس غثيان، حساسية للضوء، تشوش في النظر، دوخة، حرارة، تنميل أو ضعف؟";
  }
  return intakeQuestions[field];
}

function nextMissingField() {
  return intakeOrder.find((field) => state.chatCareState.intake[field] == null || state.chatCareState.intake[field] === "");
}

function intakeSnapshot() {
  return clone(state.chatCareState.intake);
}

function invalidAnswerMessage(field, text) {
  const normalized = normalizeAnswer(text);
  if (!normalized || /^(hi|hey|hello|هاي|مرحبا|اهلا|أهلا|سلام)$/.test(normalized)) {
    return questionFor(field);
  }
  if (field === "currentProblem" && !extractProblem(normalized)) {
    return "\u0644\u0645 \u0623\u0641\u0647\u0645 \u0627\u0644\u0645\u0634\u0643\u0644\u0629 \u0628\u0648\u0636\u0648\u062D. \u0627\u0643\u062A\u0628\u064A \u0645\u062B\u0644\u0627: \u0623\u0644\u0645 \u0641\u064A \u0627\u0644\u0638\u0647\u0631\u060C \u0627\u0644\u0631\u0642\u0628\u0629\u060C \u0627\u0644\u0643\u062A\u0641\u060C \u0623\u0648 \u0627\u0644\u0631\u0643\u0628\u0629.";
  }
  if (field === "location" && (/^(no|none|لا|لا اشعر|لا يوجد)$/.test(normalized) || normalized.length < 3)) {
    return `أحتاج تحديد المكان بشكل أدق.\n\n${questionFor("location")}`;
  }
  if (field === "painLevel" && extractPainLevel(normalized) == null) {
    return "\u0627\u0643\u062A\u0628\u064A \u0631\u0642\u0645\u0627 \u0645\u0646 0 \u0625\u0644\u0649 10 \u0644\u062F\u0631\u062C\u0629 \u0627\u0644\u0623\u0644\u0645. \u0645\u062B\u0644\u0627: 4.";
  }
  if (field === "duration" && normalized.length < 3) {
    return "\u0645\u0646\u0630 \u0645\u062A\u0649\u061F \u0645\u062B\u0644\u0627: \u0627\u0644\u064A\u0648\u0645\u060C \u0645\u0646\u0630 \u0623\u0633\u0628\u0648\u0639\u060C \u0623\u0648 \u0645\u0646\u0630 \u0634\u0647\u0631.";
  }
  if (field === "dailyTimeMinutes" && extractDailyMinutes(normalized) == null) {
    return "\u0627\u0643\u062A\u0628\u064A \u0639\u062F\u062F \u0627\u0644\u062F\u0642\u0627\u0626\u0642 \u0627\u0644\u0645\u062A\u0627\u062D\u0629. \u0645\u062B\u0644\u0627: 20 \u062F\u0642\u064A\u0642\u0629.";
  }
  if (field === "goal" && !extractGoal(normalized)) {
    return "\u0645\u0627 \u0647\u062F\u0641\u0643\u061F \u0645\u062B\u0644\u0627: \u062A\u062E\u0641\u064A\u0641 \u0627\u0644\u0623\u0644\u0645 \u0623\u0648 \u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u062D\u0631\u0643\u0629.";
  }
  if (field === "difficulty" && !extractDifficulty(normalized)) {
    return "\u0627\u062E\u062A\u0627\u0631\u064A \u0645\u0633\u062A\u0648\u0649\u0627 \u0648\u0627\u062D\u062F\u0627: \u0633\u0647\u0644\u060C \u0645\u062A\u0648\u0633\u0637\u060C \u0623\u0648 \u0645\u062A\u0642\u062F\u0645.";
  }
  return "";
}

function updateIntakeFromAnswer(field, text) {
  const intake = state.chatCareState.intake;
  const normalized = normalizeAnswer(text);
  const pain = extractPainLevel(normalized);
  const minutes = extractDailyMinutes(normalized);

  if (field === "currentProblem") intake.currentProblem = extractProblem(normalized) || text;
  if (field === "location") intake.location = text;
  if (field === "painLevel") intake.painLevel = pain ?? text;
  if (field === "symptoms") intake.symptoms = text;
  if (field === "duration") intake.duration = text;
  if (field === "dailyTimeMinutes") intake.dailyTimeMinutes = minutes ?? text;
  if (field === "goal") intake.goal = extractGoal(normalized) || text;
  if (field === "difficulty") intake.difficulty = extractDifficulty(normalized) || "\u0633\u0647\u0644";

  if (pain != null) intake.painLevel = pain;
  if (minutes != null) intake.dailyTimeMinutes = minutes;
  if (!intake.currentProblem) intake.currentProblem = extractProblem(normalized);
}

function createDraftPlan() {
  const intake = state.chatCareState.intake;
  const focus = String(intake.currentProblem || "back");
  const easy = Number(intake.painLevel) <= 5 && intake.difficulty !== "\u0645\u062A\u0642\u062F\u0645";
  const dailyTimeMinutes = Number(intake.dailyTimeMinutes) || 20;
  const exercises = focus.includes("neck")
    ? [
        draftExercise("\u062A\u0645\u0631\u064A\u0646 \u0627\u0644\u0631\u0642\u0628\u0629", "\u0627\u0644\u0631\u0642\u0628\u0629 \u0648\u0627\u0644\u0643\u062A\u0641", 4, 1, 5, "bg-teal-100 text-teal-700"),
        draftExercise("\u062A\u0645\u0631\u064A\u0646 \u0627\u0644\u0643\u062A\u0641", "\u0627\u0644\u0631\u0642\u0628\u0629 \u0648\u0627\u0644\u0643\u062A\u0641", 4, 1, 5, "bg-blue-100 text-blue-700"),
        draftExercise("\u062A\u0635\u062D\u064A\u062D \u0627\u0644\u0648\u0636\u0639\u064A\u0629", "\u0627\u0644\u062C\u0633\u0645", 5, 1, 5, "bg-rose-100 text-rose-700"),
      ]
    : focus.includes("shoulder")
      ? [
          draftExercise("\u062A\u0645\u0631\u064A\u0646 \u0627\u0644\u0643\u062A\u0641", "\u0627\u0644\u0643\u062A\u0641", 4, 1, 5, "bg-blue-100 text-blue-700"),
          draftExercise("\u062A\u0645\u0631\u064A\u0646 \u0627\u0644\u0631\u0642\u0628\u0629", "\u0627\u0644\u0631\u0642\u0628\u0629 \u0648\u0627\u0644\u0643\u062A\u0641", 4, 1, 5, "bg-teal-100 text-teal-700"),
          draftExercise("\u062A\u0635\u062D\u064A\u062D \u0627\u0644\u0648\u0636\u0639\u064A\u0629", "\u0627\u0644\u062C\u0633\u0645", 5, 1, 5, "bg-rose-100 text-rose-700"),
        ]
    : [
        draftExercise("\u062A\u0635\u062D\u064A\u062D \u0627\u0644\u0648\u0636\u0639\u064A\u0629", "\u0627\u0644\u062C\u0633\u0645", 5, 1, 5, "bg-rose-100 text-rose-700"),
        draftExercise("\u062A\u0645\u0631\u064A\u0646 \u0627\u0644\u0638\u0647\u0631", "\u0645\u0631\u0648\u0646\u0629 \u0627\u0644\u0638\u0647\u0631", 6, easy ? 1 : 2, 5, "bg-violet-100 text-violet-700"),
        draftExercise("\u062A\u062D\u0631\u064A\u0643 \u0623\u0633\u0641\u0644 \u0627\u0644\u0638\u0647\u0631", "\u0623\u0633\u0641\u0644 \u0627\u0644\u0638\u0647\u0631", 6, easy ? 1 : 2, 5, "bg-amber-100 text-amber-700"),
      ];

  return {
    title: `${arabicFocus(focus)} - ${intake.goal || "\u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u062D\u0631\u0643\u0629"}`,
    focus,
    location: intake.location,
    painLevel: Number(intake.painLevel) || 0,
    dailyTimeMinutes,
    goal: intake.goal,
    difficulty: intake.difficulty,
    safety: hasRedFlags(intake.symptoms)
      ? "\u0627\u062C\u0639\u0644\u064A \u0627\u0644\u062A\u0645\u0627\u0631\u064A\u0646 \u062E\u0641\u064A\u0641\u0629 \u062C\u062F\u0627 \u0648\u062A\u0648\u0627\u0635\u0644\u064A \u0645\u0639 \u0637\u0628\u064A\u0628 \u0625\u0630\u0627 \u0632\u0627\u062F\u062A \u0627\u0644\u0623\u0639\u0631\u0627\u0636."
      : "\u062A\u062D\u0631\u0643\u064A \u0628\u0628\u0637\u0621 \u0648\u062A\u0648\u0642\u0641\u064A \u0625\u0630\u0627 \u0632\u0627\u062F \u0627\u0644\u0623\u0644\u0645.",
    exercises,
  };
}

function draftExercise(name, area, minutes, sets, reps, color) {
  return {
    name,
    area,
    duration: `${minutes} min`,
    sets,
    reps,
    done: false,
    color,
  };
}

function planPreviewText(plan) {
  const lines = plan.exercises
    .map((exercise, index) => `${index + 1}. ${exercise.name}: ${exercise.sets} \u062C\u0648\u0644\u0629\u060C ${exercise.reps} \u062A\u0643\u0631\u0627\u0631\u0627\u062A\u060C ${exercise.duration}`)
    .join("\n");
  return `\u0647\u0630\u0647 \u062E\u0637\u0629 \u0645\u0642\u062A\u0631\u062D\u0629 \u0644\u0640 ${plan.location || arabicFocus(plan.focus)}. \u062F\u0631\u062C\u0629 \u0627\u0644\u0623\u0644\u0645 ${plan.painLevel}/10.\n${lines}\n\n\u0627\u0643\u062A\u0628\u064A "\u0645\u0648\u0627\u0641\u0642\u0629" \u0644\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u062E\u0637\u0629 \u0623\u0648 "\u062A\u063A\u064A\u064A\u0631" \u0644\u062A\u0639\u062F\u064A\u0644\u0647\u0627.`;
}

function extractProblem(text) {
  if (text.includes("head") || text.includes("\u0631\u0623\u0633") || text.includes("\u0631\u0627\u0633") || text.includes("\u0635\u062F\u0627\u0639")) return "head";
  if (text.includes("neck") || text.includes("\u0631\u0642\u0628\u0629")) return "neck";
  if (text.includes("shoulder") || text.includes("\u0643\u062A\u0641")) return "shoulder";
  if (text.includes("lower back") || text.includes("\u0623\u0633\u0641\u0644 \u0627\u0644\u0638\u0647\u0631") || text.includes("\u0627\u0633\u0641\u0644 \u0627\u0644\u0638\u0647\u0631")) return "lower back";
  if (text.includes("back") || text.includes("\u0638\u0647\u0631")) return "back";
  if (text.includes("knee") || text.includes("\u0631\u0643\u0628\u0629")) return "knee";
  if (text.includes("posture") || text.includes("\u0648\u0636\u0639\u064A\u0629")) return "posture";
  return null;
}

function extractPainLevel(text) {
  const match = normalizeAnswer(text).match(/\b(10|[0-9])\s*(?:\/\s*10|out of 10|from 10|pain)?\b/);
  return match ? Math.max(0, Math.min(Number(match[1]), 10)) : null;
}

function extractDailyMinutes(text) {
  const match = normalizeAnswer(text).match(/(?:^|\s)([1-9][0-9]?)\s*(?:min|mins|minute|minutes|\u062F\u0642\u064A\u0642\u0629|\u062F\u0642\u0627\u0626\u0642|\u062F\u0642\u0627\u064A\u0642)(?=\s|$|[.,\u060C])/);
  return match ? Math.max(5, Math.min(Number(match[1]), 45)) : null;
}

function normalizeAnswer(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));
}

function extractGoal(text) {
  if (text.includes("pain") || text.includes("\u0623\u0644\u0645")) return "\u062A\u062E\u0641\u064A\u0641 \u0627\u0644\u0623\u0644\u0645";
  if (text.includes("mobil") || text.includes("\u062D\u0631\u0643\u0629")) return "\u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u062D\u0631\u0643\u0629";
  if (text.includes("stretch") || text.includes("\u062A\u0645\u062F\u062F")) return "\u062A\u0645\u062F\u062F";
  if (text.includes("strength") || text.includes("\u062A\u0642\u0648\u064A\u0629")) return "\u062A\u0642\u0648\u064A\u0629";
  if (text.includes("posture") || text.includes("\u0648\u0636\u0639\u064A\u0629")) return "\u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u0648\u0636\u0639\u064A\u0629";
  return null;
}

function extractDifficulty(text) {
  if (text.includes("easy") || text.includes("gentle") || text.includes("\u0633\u0647\u0644")) return "\u0633\u0647\u0644";
  if (text.includes("medium") || text.includes("moderate") || text.includes("\u0645\u062A\u0648\u0633\u0637")) return "\u0645\u062A\u0648\u0633\u0637";
  if (text.includes("challenging") || text.includes("hard") || text.includes("\u0645\u062A\u0642\u062F\u0645")) return "\u0645\u062A\u0642\u062F\u0645";
  return null;
}

function hasRedFlags(text) {
  return /\b(numb|numbness|tingling|weak|weakness|swelling|fever|sharp|chest|dizzy|dizziness)\b/i.test(String(text || ""))
    || /(\u062A\u0646\u0645\u064A\u0644|\u0648\u062E\u0632|\u0636\u0639\u0641|\u062A\u0648\u0631\u0645|\u062D\u0627\u062F)/.test(String(text || ""));
}

function arabicFocus(value) {
  const focus = String(value || "");
  if (focus.includes("neck")) return "\u0627\u0644\u0631\u0642\u0628\u0629";
  if (focus.includes("shoulder")) return "\u0627\u0644\u0643\u062A\u0641";
  if (focus.includes("knee")) return "\u0627\u0644\u0631\u0643\u0628\u0629";
  if (focus.includes("posture")) return "\u0627\u0644\u0648\u0636\u0639\u064A\u0629";
  return "\u0627\u0644\u0638\u0647\u0631";
}

function adminDatabase() {
  const tables = {
    progressData,
    exercises: state.exercises,
    patients: state.patients,
    messages: state.messages,
    patientProfile: state.patientProfile,
    chatCareState: state.chatCareState,
    formCheckSessions: state.sessions,
  };

  return {
    status: {
      adapter: "static-demo",
      connected: true,
      mode: "GitHub Pages browser demo",
      path: "in-memory demo data",
      sizeBytes: new Blob([JSON.stringify(tables)]).size,
      updatedAt: new Date().toISOString(),
    },
    counts: Object.fromEntries(Object.entries(tables).map(([key, value]) => [key, Array.isArray(value) ? value.length : 1])),
    tables,
  };
}

export async function staticRequest(path, options = {}) {
  const method = options.method || "GET";
  const body = parseBody(options);

  if (method === "GET" && path === "/health") {
    return response({ status: "ok", service: "RemedyQuest static demo", database: adminDatabase().status });
  }
  if (method === "POST" && path === "/auth/login") {
    const role = body.role === "doctor" ? "doctor" : "patient";
    const user = {
      id: role === "doctor" ? "doctor_aya" : "patient_salma",
      name: role === "doctor" ? "Dr. Aya" : "Salma",
      role,
    };
    return response({ token: tokenFor(user), user });
  }
  if (method === "POST" && path === "/auth/register") {
    const user = { id: `${body.role || "patient"}_${Date.now()}`, name: body.name || "Demo User", role: body.role || "patient" };
    return response({ token: tokenFor(user), user });
  }
  if (method === "GET" && path === "/patient/dashboard") {
    return response({
      stats: { points: 82, level: 3, streak: 12, refundIls: 5 },
      progress: progressData,
      currentPlan: { title: "Gentle back mobility", completed: 2, total: 5 },
    });
  }
  if (method === "GET" && path === "/patient/exercises") return response(state.exercises);
  if (method === "GET" && path === "/patient/messages") {
    return response({
      messages: state.messages,
      profile: state.patientProfile,
      intake: state.chatCareState.intake,
      draftPlan: state.chatCareState.draftPlan,
      conversations: state.conversations,
      ai: { enabled: false, provider: "Static demo", model: "browser-demo" },
    });
  }
  if (method === "POST" && path === "/patient/conversations/end") {
    if (!state.messages.some((message) => message.from === "user")) {
      throw new Error("لا توجد محادثة لحفظها.");
    }
    const endedAt = new Date().toISOString();
    const conversation = {
      id: state.conversations.length + 1,
      title: state.chatCareState.intake.location
        ? `محادثة حول ${state.chatCareState.intake.location}`
        : "محادثة صحية",
      status: "completed",
      startedAt: endedAt,
      endedAt,
      messageCount: state.messages.length,
      messages: clone(state.messages),
      intake: intakeSnapshot(),
    };
    state.conversations.unshift(conversation);
    state.messages = [{ from: "ai", text: intakeQuestions.currentProblem, createdAt: endedAt }];
    state.chatCareState.intake = Object.fromEntries(intakeOrder.map((field) => [field, null]));
    state.chatCareState.draftPlan = null;
    return response({
      conversation,
      conversations: state.conversations,
      messages: state.messages,
      intake: state.chatCareState.intake,
      draftPlan: null,
    });
  }
  if (method === "POST" && path === "/patient/messages") {
    const outgoing = { from: "user", text: String(body.text || "").trim() };
    state.messages.push(outgoing);

    let assistant;
    if (/\b(start over|restart|new plan)\b/i.test(outgoing.text) || /(\u0645\u0646 \u062C\u062F\u064A\u062F|\u062E\u0637\u0629 \u062C\u062F\u064A\u062F\u0629)/.test(outgoing.text)) {
      state.chatCareState.intake = Object.fromEntries(intakeOrder.map((field) => [field, null]));
      state.chatCareState.draftPlan = null;
      assistant = { from: "ai", text: intakeQuestions.currentProblem, intake: intakeSnapshot() };
    } else if (state.chatCareState.draftPlan && (/\b(approve|yes|ok|add|confirm|save)\b/i.test(outgoing.text) || /(\u0645\u0648\u0627\u0641\u0642\u0629|\u0646\u0639\u0645|\u062A\u0645\u0627\u0645|\u0623\u0636\u0641|\u0627\u0636\u0641)/.test(outgoing.text))) {
      const added = state.chatCareState.draftPlan.exercises.map((exercise) => ({
        id: state.exercises.length + 1,
        ...exercise,
      }));
      state.exercises.push(...added);
      assistant = {
        from: "ai",
        text: `\u062A\u0645\u062A \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629. \u0623\u0636\u0641\u062A ${added.length} \u062A\u0645\u0627\u0631\u064A\u0646 \u0625\u0644\u0649 \u0635\u0641\u062D\u0629 \u0627\u0644\u062A\u0645\u0627\u0631\u064A\u0646.`,
        planApplied: true,
        exercises: added,
        intake: intakeSnapshot(),
      };
      state.chatCareState.draftPlan = null;
    } else if (state.chatCareState.draftPlan && (/\b(change|edit|different|no)\b/i.test(outgoing.text) || /(\u062A\u063A\u064A\u064A\u0631|\u062A\u0639\u062F\u064A\u0644|\u0644\u0627)/.test(outgoing.text))) {
      state.chatCareState.draftPlan = null;
      assistant = { from: "ai", text: "\u0644\u0627 \u0645\u0634\u0643\u0644\u0629. \u0627\u0643\u062A\u0628\u064A \u0645\u0627 \u0627\u0644\u0630\u064A \u062A\u0631\u064A\u062F\u064A\u0646 \u062A\u063A\u064A\u064A\u0631\u0647\u060C \u0623\u0648 \u0627\u0643\u062A\u0628\u064A \"\u0645\u0646 \u062C\u062F\u064A\u062F\".", intake: intakeSnapshot() };
    } else {
      const expectedField = nextMissingField();
      const invalidMessage = invalidAnswerMessage(expectedField, outgoing.text);
      if (invalidMessage) {
        assistant = { from: "ai", text: invalidMessage, intake: intakeSnapshot() };
      } else {
        updateIntakeFromAnswer(expectedField, outgoing.text);
        const missingField = nextMissingField();
        if (missingField) {
          assistant = { from: "ai", text: questionFor(missingField), intake: intakeSnapshot() };
        } else {
          const plan = createDraftPlan();
          state.chatCareState.draftPlan = plan;
          assistant = { from: "ai", text: planPreviewText(plan), plan, needsConfirmation: true, intake: intakeSnapshot() };
        }
      }
    }

    state.messages.push(assistant);
    return response({
      messages: [assistant],
      profile: state.patientProfile,
      intake: state.chatCareState.intake,
      draftPlan: state.chatCareState.draftPlan,
      ai: { enabled: false, provider: "Static demo", model: "browser-demo" },
    });
  }
  if (method === "POST" && path === "/patient/sessions") {
    const session = { id: state.sessions.length + 1, createdAt: new Date().toISOString(), ...body };
    state.sessions.push(session);
    return response(session);
  }
  if (method === "GET" && path === "/patient/sessions") return response(state.sessions);
  if (method === "GET" && path === "/doctor/patients") return response(state.patients);
  if (method === "PATCH" && /^\/doctor\/patients\/\d+\/plan$/.test(path)) {
    const id = Number(path.match(/\d+/)?.[0]);
    const patient = state.patients.find((item) => item.id === id);
    if (patient) patient.status = "Approved";
    return response(patient || { id, status: "Approved" });
  }
  if (method === "GET" && path === "/admin/dashboard") {
    return response({ users: 1284, doctors: 42, activePatients: 986, pendingRefunds: 8, revenueIls: 38400 });
  }
  if (method === "GET" && path === "/admin/database") return response(adminDatabase());

  throw new Error(`No static demo route for ${method} ${path}`);
}
