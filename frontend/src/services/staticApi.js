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
    intake: {},
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

function createDraftPlan(text) {
  const normalized = text.toLowerCase();
  const focus = normalized.includes("neck")
    ? "neck"
    : normalized.includes("shoulder")
      ? "shoulder"
      : "back";
  const painMatch = normalized.match(/\b(10|[0-9])\s*(?:\/\s*10|out of 10|pain)?\b/);
  const minuteMatch = normalized.match(/\b([1-9][0-9]?)\s*(?:min|mins|minute|minutes)\b/);
  const painLevel = painMatch ? Number(painMatch[1]) : 4;
  const dailyTimeMinutes = minuteMatch ? Number(minuteMatch[1]) : 25;
  const exercises = focus === "neck"
    ? [
        draftExercise("Neck mobility", "Neck & shoulders", 4, 1, 5, "bg-teal-100 text-teal-700"),
        draftExercise("Shoulder raise", "Neck & shoulders", 4, 1, 5, "bg-blue-100 text-blue-700"),
        draftExercise("Posture reset", "Full posture", 5, 1, 5, "bg-rose-100 text-rose-700"),
      ]
    : [
        draftExercise("Posture reset", "Full posture", 5, 1, 5, "bg-rose-100 text-rose-700"),
        draftExercise("Cat-cow stretch", "Spine mobility", 6, 1, 5, "bg-violet-100 text-violet-700"),
        draftExercise("Lower back mobility", "Lower back", 6, 1, 5, "bg-amber-100 text-amber-700"),
      ];

  return {
    title: `${focus[0].toUpperCase()}${focus.slice(1)} rehab pathway`,
    focus,
    painLevel,
    dailyTimeMinutes,
    safety: "Use slow, pain-free motion. Stop if pain becomes sharp, numb, or unusual.",
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
  return `Plan preview for ${plan.focus}, pain ${plan.painLevel}/10:\n${lines}\n\nReply "approve" to add this to your Exercises page, or "change" to adjust it.`;
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
      draftPlan: state.chatCareState.draftPlan,
      ai: { enabled: false, provider: "Static demo", model: "browser-demo" },
    });
  }
  if (method === "POST" && path === "/patient/messages") {
    const outgoing = { from: "user", text: String(body.text || "").trim() };
    state.messages.push(outgoing);

    let assistant;
    if (state.chatCareState.draftPlan && /\b(approve|yes|ok|add|confirm|save)\b/i.test(outgoing.text)) {
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
    } else {
      const plan = createDraftPlan(outgoing.text);
      state.chatCareState.draftPlan = plan;
      assistant = { from: "ai", text: planPreviewText(plan), plan, needsConfirmation: true };
    }

    state.messages.push(assistant);
    return response({
      messages: [assistant],
      profile: state.patientProfile,
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
