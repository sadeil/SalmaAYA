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
  sessions: [],
  patientProfile: {
    id: "patient_maya",
    name: "Maya Khalil",
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
  currentProblem: "What is the main problem today: back, neck, shoulder, knee, posture, stiffness, or something else?",
  location: "Where exactly do you feel it? For example: lower back, right shoulder, left knee, or both sides.",
  painLevel: "What is the pain or discomfort level right now from 0 to 10?",
  symptoms: "Do you have numbness, tingling, weakness, swelling, fever, or sharp pain? If none, say none.",
  duration: "How long has this been going on: today, a few days, weeks, or longer?",
  dailyTimeMinutes: "How many minutes can you comfortably exercise today?",
  goal: "What is your main goal: reduce pain, improve mobility, stretch, strengthen, or improve posture?",
  difficulty: "What level should I start with: easy, medium, or challenging?",
};

const intakeOrder = Object.keys(intakeQuestions);

function nextMissingField() {
  return intakeOrder.find((field) => state.chatCareState.intake[field] == null || state.chatCareState.intake[field] === "");
}

function updateIntakeFromAnswer(field, text) {
  const intake = state.chatCareState.intake;
  const normalized = text.toLowerCase();
  const pain = extractPainLevel(normalized);
  const minutes = extractDailyMinutes(normalized);

  if (field === "currentProblem") intake.currentProblem = extractProblem(normalized) || text;
  if (field === "location") intake.location = text;
  if (field === "painLevel") intake.painLevel = pain ?? text;
  if (field === "symptoms") intake.symptoms = text;
  if (field === "duration") intake.duration = text;
  if (field === "dailyTimeMinutes") intake.dailyTimeMinutes = minutes ?? text;
  if (field === "goal") intake.goal = extractGoal(normalized) || text;
  if (field === "difficulty") intake.difficulty = extractDifficulty(normalized) || "easy";

  if (pain != null) intake.painLevel = pain;
  if (minutes != null) intake.dailyTimeMinutes = minutes;
  if (!intake.currentProblem) intake.currentProblem = extractProblem(normalized);
}

function createDraftPlan() {
  const intake = state.chatCareState.intake;
  const focus = String(intake.currentProblem || "back");
  const easy = Number(intake.painLevel) <= 5 && intake.difficulty !== "challenging";
  const dailyTimeMinutes = Number(intake.dailyTimeMinutes) || 20;
  const exercises = focus.includes("neck")
    ? [
        draftExercise("Neck mobility", "Neck & shoulders", 4, 1, 5, "bg-teal-100 text-teal-700"),
        draftExercise("Shoulder raise", "Neck & shoulders", 4, 1, 5, "bg-blue-100 text-blue-700"),
        draftExercise("Posture reset", "Full posture", 5, 1, 5, "bg-rose-100 text-rose-700"),
      ]
    : focus.includes("shoulder")
      ? [
          draftExercise("Shoulder raise", "Shoulders", 4, 1, 5, "bg-blue-100 text-blue-700"),
          draftExercise("Neck mobility", "Neck & shoulders", 4, 1, 5, "bg-teal-100 text-teal-700"),
          draftExercise("Posture reset", "Full posture", 5, 1, 5, "bg-rose-100 text-rose-700"),
        ]
    : [
        draftExercise("Posture reset", "Full posture", 5, 1, 5, "bg-rose-100 text-rose-700"),
        draftExercise("Cat-cow stretch", "Spine mobility", 6, easy ? 1 : 2, 5, "bg-violet-100 text-violet-700"),
        draftExercise("Lower back mobility", "Lower back", 6, easy ? 1 : 2, 5, "bg-amber-100 text-amber-700"),
      ];

  return {
    title: `${capitalize(focus)} ${intake.goal || "mobility"} plan`,
    focus,
    location: intake.location,
    painLevel: Number(intake.painLevel) || 0,
    dailyTimeMinutes,
    goal: intake.goal,
    difficulty: intake.difficulty,
    safety: hasRedFlags(intake.symptoms)
      ? "Because you mentioned possible warning symptoms, keep this very gentle and contact a clinician before pushing effort."
      : "Use slow, pain-free motion. Stop if pain becomes sharp, numb, or unusual.",
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
    .map((exercise, index) => `${index + 1}. ${exercise.name}: ${exercise.sets} set, ${exercise.reps} reps, ${exercise.duration}`)
    .join("\n");
  return `Plan preview for ${plan.location || plan.focus}, pain ${plan.painLevel}/10, goal: ${plan.goal || "mobility"}:\n${lines}\n\nReply "approve" to add this to your Exercises page, or "change" to adjust it.`;
}

function extractProblem(text) {
  if (text.includes("neck")) return "neck";
  if (text.includes("shoulder")) return "shoulder";
  if (text.includes("lower back")) return "lower back";
  if (text.includes("back")) return "back";
  if (text.includes("knee")) return "knee";
  if (text.includes("posture")) return "posture";
  return null;
}

function extractPainLevel(text) {
  const match = text.match(/\b(10|[0-9])\s*(?:\/\s*10|out of 10|from 10|pain)?\b/);
  return match ? Math.max(0, Math.min(Number(match[1]), 10)) : null;
}

function extractDailyMinutes(text) {
  const match = text.match(/\b([1-9][0-9]?)\s*(?:min|mins|minute|minutes)\b/);
  return match ? Math.max(5, Math.min(Number(match[1]), 45)) : null;
}

function extractGoal(text) {
  if (text.includes("pain")) return "reduce pain";
  if (text.includes("mobil")) return "improve mobility";
  if (text.includes("stretch")) return "stretch";
  if (text.includes("strength")) return "strengthen";
  if (text.includes("posture")) return "improve posture";
  return null;
}

function extractDifficulty(text) {
  if (text.includes("easy") || text.includes("gentle")) return "easy";
  if (text.includes("medium") || text.includes("moderate")) return "medium";
  if (text.includes("challenging") || text.includes("hard")) return "challenging";
  return null;
}

function hasRedFlags(text) {
  return /\b(numb|numbness|tingling|weak|weakness|swelling|fever|sharp|chest|dizzy|dizziness)\b/i.test(String(text || ""));
}

function capitalize(value) {
  const text = String(value || "Rehab");
  return text[0].toUpperCase() + text.slice(1);
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
      id: role === "doctor" ? "doctor_adam" : "patient_maya",
      name: role === "doctor" ? "Dr. Adam Noor" : "Maya Khalil",
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
      ai: { enabled: false, provider: "Static demo", model: "browser-demo" },
    });
  }
  if (method === "POST" && path === "/patient/messages") {
    const outgoing = { from: "user", text: String(body.text || "").trim() };
    state.messages.push(outgoing);

    let assistant;
    if (/\b(start over|restart|new plan)\b/i.test(outgoing.text)) {
      state.chatCareState.intake = Object.fromEntries(intakeOrder.map((field) => [field, null]));
      state.chatCareState.draftPlan = null;
      assistant = { from: "ai", text: intakeQuestions.currentProblem };
    } else if (state.chatCareState.draftPlan && /\b(approve|yes|ok|add|confirm|save)\b/i.test(outgoing.text)) {
      const added = state.chatCareState.draftPlan.exercises.map((exercise) => ({
        id: state.exercises.length + 1,
        ...exercise,
      }));
      state.exercises.push(...added);
      assistant = {
        from: "ai",
        text: `Approved. I added ${added.length} exercises from "${state.chatCareState.draftPlan.title}" to your Exercises page. Start gently and stop if pain increases.`,
        planApplied: true,
        exercises: added,
      };
      state.chatCareState.draftPlan = null;
    } else if (state.chatCareState.draftPlan && /\b(change|edit|different|no)\b/i.test(outgoing.text)) {
      state.chatCareState.draftPlan = null;
      assistant = { from: "ai", text: "No problem. Tell me what you want to change, or type \"start over\" to begin the intake again." };
    } else {
      const expectedField = nextMissingField();
      updateIntakeFromAnswer(expectedField, outgoing.text);
      const missingField = nextMissingField();
      if (missingField) {
        assistant = { from: "ai", text: intakeQuestions[missingField], intake: state.chatCareState.intake };
      } else {
        const plan = createDraftPlan();
        state.chatCareState.draftPlan = plan;
        assistant = { from: "ai", text: planPreviewText(plan), plan, needsConfirmation: true };
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
