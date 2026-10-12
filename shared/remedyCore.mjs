// RemedyQuest core: accounts, per-patient data, rewards and the care-plan
// chat. It is pure JavaScript with no Node or browser APIs so the same rules
// run in the Node backend (JSON file database) and in the GitHub Pages demo
// (browser localStorage). Environment-specific work — password hashing,
// random tokens, the optional OpenRouter call — is injected through `deps`.

export const DB_VERSION = 2;

export const DEMO_ACCOUNTS = {
  patient: { email: "salma@remedyquest.app", password: "Salma@2026", name: "Salma" },
  doctor: { email: "aya@remedyquest.app", password: "Aya@2026", name: "Dr. Aya" },
};

// Level n starts at LEVEL_THRESHOLDS[n - 1] points.
export const LEVEL_THRESHOLDS = [0, 40, 75, 100, 150];
const STAGE_REWARDS = ["Start", "Badge", "5 ILS", "5 ILS", "Mystery reward"];
const REFUND_LEVELS = [3, 4];
const REFUND_PER_LEVEL_ILS = 5;
const SUBSCRIPTION_ILS = 40;
const POINTS_PER_EXERCISE = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

// Exercise templates drive the guided demonstration and camera rules on the
// frontend. Chat-generated exercises map onto one of these.
export const EXERCISE_TEMPLATES = {
  1: { name: "Neck release", area: "Neck & shoulders", duration: "4 min", sets: 2, reps: 8, color: "bg-teal-100 text-teal-700" },
  2: { name: "Shoulder rolls", area: "Upper back", duration: "3 min", sets: 2, reps: 10, color: "bg-blue-100 text-blue-700" },
  3: { name: "Cat-cow stretch", area: "Spine mobility", duration: "6 min", sets: 3, reps: 8, color: "bg-violet-100 text-violet-700" },
  4: { name: "Lower back mobility", area: "Lower back", duration: "7 min", sets: 2, reps: 12, color: "bg-amber-100 text-amber-700" },
  5: { name: "Posture reset", area: "Full posture", duration: "5 min", sets: 3, reps: 10, color: "bg-rose-100 text-rose-700" },
};

const DEMO_DOCTOR_PATIENTS = [
  { id: 1, name: "Salma", initials: "S", problem: "Lower back pain", pain: 4, time: "25 min", level: 3, points: 82, commitment: 92, status: "Approved" },
  { id: 2, name: "Omar Saleh", initials: "OS", problem: "Neck stiffness", pain: 6, time: "20 min", level: 2, points: 54, commitment: 76, status: "Needs review" },
  { id: 3, name: "Lina Nasser", initials: "LN", problem: "Shoulder mobility", pain: 3, time: "30 min", level: 4, points: 118, commitment: 88, status: "Modified" },
  { id: 4, name: "Yousef Hamdan", initials: "YH", problem: "Posture correction", pain: 5, time: "15 min", level: 1, points: 24, commitment: 64, status: "Needs review" },
];

const DEMO_PROGRESS = [45, 62, 55, 78, 72, 88, 92];

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const clone = (value) => JSON.parse(JSON.stringify(value));

// ---------------------------------------------------------------------------
// Database shape, seeding and migration
// ---------------------------------------------------------------------------

export function emptyDatabase() {
  return {
    version: DB_VERSION,
    users: [],
    tokens: {},
    patients: {},
    doctorPatients: clone(DEMO_DOCTOR_PATIENTS),
    nextUserId: 1,
  };
}

// Accepts whatever was on disk and returns a current-shape database. The
// old single-patient prototype file is not carried over: the demo accounts
// are re-seeded with the clean prototype data instead.
export function migrateDatabase(raw) {
  if (raw && raw.version === DB_VERSION) {
    const db = { ...emptyDatabase(), ...raw };
    for (const record of Object.values(db.patients)) normalizeRecord(record);
    return db;
  }
  return emptyDatabase();
}

// Creates the two demo accounts if they don't exist yet. Async because
// password hashing is async in the browser.
export async function ensureDemoAccounts(db, deps) {
  let changed = false;
  if (!findUserByEmail(db, DEMO_ACCOUNTS.patient.email)) {
    const user = addUser(db, {
      name: DEMO_ACCOUNTS.patient.name,
      email: DEMO_ACCOUNTS.patient.email,
      role: "patient",
      passwordHash: await deps.hashPassword(DEMO_ACCOUNTS.patient.password),
      demo: true,
    });
    db.patients[user.id] = demoPatientRecord();
    changed = true;
  }
  if (!findUserByEmail(db, DEMO_ACCOUNTS.doctor.email)) {
    addUser(db, {
      name: DEMO_ACCOUNTS.doctor.name,
      email: DEMO_ACCOUNTS.doctor.email,
      role: "doctor",
      passwordHash: await deps.hashPassword(DEMO_ACCOUNTS.doctor.password),
      demo: true,
    });
    changed = true;
  }
  return changed;
}

function addUser(db, { name, email, role, passwordHash, demo = false, profile = {} }) {
  const user = {
    id: `u${db.nextUserId}`,
    name,
    email: normalizeEmail(email),
    role,
    passwordHash,
    demo,
    profile,
    createdAt: new Date().toISOString(),
  };
  db.nextUserId += 1;
  db.users.push(user);
  return user;
}

function newPatientRecord(profile = {}) {
  return normalizeRecord({
    profile: {
      problem: profile.problem || null,
      dailyTimeMinutes: profile.dailyTimeMinutes || null,
      painLevel: null,
      age: profile.age || null,
      gender: profile.gender || null,
    },
    points: 0,
    streak: 0,
    lastActiveDay: null,
    exercisesCompleted: 0,
    activity: {},
    exercises: [],
    chat: null,
    formCheckSessions: [],
    careMessages: [],
    rewardHistory: [],
  });
}

function demoPatientRecord() {
  const exercises = Object.entries(EXERCISE_TEMPLATES).map(([id, template]) => ({
    id: Number(id),
    templateId: Number(id),
    ...template,
    done: Number(id) <= 2,
  }));
  const record = newPatientRecord({ problem: "Lower back pain", dailyTimeMinutes: 25 });
  Object.assign(record, {
    demo: true,
    points: 82,
    streak: 12,
    exercisesCompleted: 38,
    demoProgress: DEMO_PROGRESS,
    exercises,
    careMessages: [
      { id: "doctor-welcome", sender: "doctor", text: "Hi Salma, your progress this week looks strong. How did the lower back mobility exercise feel?", createdAt: "2026-06-08T09:00:00.000Z" },
      { id: "patient-reply", sender: "patient", text: "Much better. I feel less tight after work now.", createdAt: "2026-06-08T10:15:00.000Z" },
    ],
    rewardHistory: [
      { id: "reward-level-3", label: "Level 3 milestone", date: "2026-06-08T00:00:00.000Z", amount: REFUND_PER_LEVEL_ILS, status: "Pending" },
    ],
  });
  record.profile.painLevel = 4;
  return normalizeRecord(record);
}

function normalizeRecord(record) {
  record.activity ??= {};
  record.exercises ??= [];
  record.formCheckSessions ??= [];
  record.careMessages ??= [];
  record.rewardHistory ??= [];
  record.profile ??= {};
  for (const exercise of record.exercises) exercise.templateId ??= inferTemplateId(exercise);
  return record;
}

export function inferTemplateId(exercise) {
  const name = String(exercise?.name ?? "");
  const area = String(exercise?.area ?? "");
  const text = `${name} ${area}`.toLowerCase();
  if (EXERCISE_TEMPLATES[exercise?.id] && EXERCISE_TEMPLATES[exercise.id].name === name) return Number(exercise.id);
  if (text.includes("posture") || text.includes("وضعية")) return 5;
  if (text.includes("neck") || text.includes("رقبة")) return 1;
  if (text.includes("shoulder") || text.includes("كتف")) return 2;
  if (text.includes("lower back") || text.includes("أسفل الظهر")) return 4;
  if (text.includes("cat") || text.includes("spine") || text.includes("ظهر")) return 3;
  return 5;
}

// ---------------------------------------------------------------------------
// Users and sessions
// ---------------------------------------------------------------------------

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

export function findUserByEmail(db, email) {
  const wanted = normalizeEmail(email);
  return db.users.find((user) => user.email === wanted) ?? null;
}

export function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, demo: Boolean(user.demo), guest: Boolean(user.guest) };
}

function userForToken(db, token) {
  if (!token) return null;
  const entry = db.tokens[token];
  if (!entry) return null;
  // Doctors who sign up get a session only — no stored account.
  if (entry.guest) return entry.guest;
  return db.users.find((user) => user.id === entry.userId) ?? null;
}

function requireUser(db, token, roles) {
  const user = userForToken(db, token);
  if (!user) throw new HttpError(401, "UNAUTHORIZED", "Please log in to continue.");
  if (roles && !roles.includes(user.role)) throw new HttpError(403, "FORBIDDEN", "This area is not available for your account.");
  return user;
}

function patientRecord(db, user) {
  db.patients[user.id] ??= newPatientRecord();
  const record = normalizeRecord(db.patients[user.id]);
  record.chat ??= freshChat(user.name);
  return record;
}

// ---------------------------------------------------------------------------
// Points, levels, streaks and rewards
// ---------------------------------------------------------------------------

export function dayKey(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function levelFor(points) {
  let level = 1;
  LEVEL_THRESHOLDS.forEach((threshold, index) => {
    if (points >= threshold) level = index + 1;
  });
  return level;
}

function currentStreak(record, now) {
  if (record.demo) return record.streak;
  if (!record.lastActiveDay) return 0;
  const today = dayKey(now);
  const yesterday = dayKey(now.getTime() - DAY_MS);
  return record.lastActiveDay === today || record.lastActiveDay === yesterday ? record.streak : 0;
}

function awardPoints(record, points, now) {
  const before = levelFor(record.points);
  const today = dayKey(now);
  record.points += points;
  record.activity[today] = (record.activity[today] || 0) + points;
  if (record.lastActiveDay !== today) {
    const continued = record.lastActiveDay === dayKey(now.getTime() - DAY_MS);
    record.streak = continued ? record.streak + 1 : 1;
    record.lastActiveDay = today;
  }
  const after = levelFor(record.points);
  for (let level = before + 1; level <= after; level += 1) {
    if (REFUND_LEVELS.includes(level)) {
      record.rewardHistory.push({
        id: `reward-level-${level}`,
        label: `Level ${level} milestone`,
        date: now.toISOString(),
        amount: REFUND_PER_LEVEL_ILS,
        status: "Pending",
      });
    }
  }
}

function weekProgress(record, now) {
  const days = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(now.getTime() - offset * DAY_MS);
    const label = date.toLocaleDateString("en-US", { weekday: "short" });
    const earned = record.activity[dayKey(date)] || 0;
    const base = record.demoProgress ? record.demoProgress[6 - offset] : 0;
    days.push({ day: label, score: base + earned });
  }
  return days;
}

function minutesOf(duration) {
  const match = String(duration ?? "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export function patientOverview(user, record, now = new Date()) {
  const level = levelFor(record.points);
  const levelStart = LEVEL_THRESHOLDS[level - 1];
  const nextLevelPoints = LEVEL_THRESHOLDS[level] ?? null;
  const refundIls = REFUND_LEVELS.filter((refundLevel) => level >= refundLevel).length * REFUND_PER_LEVEL_ILS;
  const streak = currentStreak(record, now);
  const progress = weekProgress(record, now);
  const completed = record.exercises.filter((exercise) => exercise.done).length;
  const total = record.exercises.length;
  const stats = {
    points: record.points,
    level,
    nextLevelPoints,
    pointsToNext: nextLevelPoints == null ? 0 : nextLevelPoints - record.points,
    levelProgress: nextLevelPoints == null ? 100 : Math.round(((record.points - levelStart) / (nextLevelPoints - levelStart)) * 100),
    streak,
    refundIls,
    exercisesCompleted: record.exercisesCompleted,
    weekPoints: progress.reduce((sum, day) => sum + day.score, 0),
  };
  const badges = [
    { key: "streak", label: streak >= 3 ? `${streak}-day streak` : "3-day streak", earned: streak >= 3 },
    { key: "starter", label: "Quick starter", earned: record.exercisesCompleted >= 1 },
    { key: "level3", label: "Level three", earned: level >= 3 },
    { key: "hero", label: "Mobility hero", earned: record.exercisesCompleted >= 50 },
    { key: "consistency", label: "Consistency pro", earned: streak >= 30 },
    { key: "master", label: "Quest master", earned: level >= 5 },
  ];
  return {
    user: publicUser(user),
    isNew: total === 0 && record.points === 0,
    profile: record.profile,
    stats,
    progress,
    plan: {
      total,
      completed,
      percent: total ? Math.round((completed / total) * 100) : 0,
      minutes: record.exercises.reduce((sum, exercise) => sum + minutesOf(exercise.duration), 0),
    },
    exercises: record.exercises,
    stages: LEVEL_THRESHOLDS.map((points, index) => ({
      number: index + 1,
      points,
      reward: STAGE_REWARDS[index],
      state: level > index + 1 ? "complete" : level === index + 1 ? "current" : "locked",
    })),
    badges,
    rewards: {
      subscriptionIls: SUBSCRIPTION_ILS,
      refundIls,
      remainingIls: SUBSCRIPTION_ILS - refundIls,
      percent: Math.round((refundIls / SUBSCRIPTION_ILS) * 1000) / 10,
      nextRefundLevel: REFUND_LEVELS.find((refundLevel) => level < refundLevel) ?? null,
      history: record.rewardHistory,
    },
  };
}

// ---------------------------------------------------------------------------
// Form check sessions
// ---------------------------------------------------------------------------

function isValidDate(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

// Allow-list the session payload: clients should never slip in raw frames or
// large fields.
export function sanitizeSession(payload) {
  if (!payload || typeof payload !== "object") return null;
  const exerciseId = String(payload.exerciseId ?? "").trim().slice(0, 50);
  const exerciseName = String(payload.exerciseName ?? exerciseId).trim().slice(0, 80);
  if (!exerciseId) return null;
  const durationMs = Math.max(0, Math.min(Number(payload.durationMs) || 0, 4 * 60 * 60 * 1000));
  const totalReps = Math.max(0, Math.min(Math.floor(Number(payload.totalReps) || 0), 9999));
  const correctReps = Math.max(0, Math.min(Math.floor(Number(payload.correctReps) || 0), totalReps));
  const targetReps = Math.max(1, Math.min(Math.floor(Number(payload.targetReps) || 5), 9999));
  const completed = Boolean(payload.completed ?? totalReps >= targetReps);
  const mistakes = {};
  if (payload.mistakes && typeof payload.mistakes === "object") {
    for (const [key, value] of Object.entries(payload.mistakes)) {
      const cleanValue = Math.max(0, Math.min(Math.floor(Number(value) || 0), 9999));
      if (cleanValue > 0) mistakes[String(key).slice(0, 80)] = cleanValue;
    }
  }
  const endedAt = isValidDate(payload.endedAt) ? payload.endedAt : new Date().toISOString();
  const startedAt = isValidDate(payload.startedAt)
    ? payload.startedAt
    : new Date(Date.parse(endedAt) - durationMs).toISOString();
  return { exerciseId, exerciseName, durationMs, totalReps, correctReps, targetReps, completed, mistakes, startedAt, endedAt };
}

// ---------------------------------------------------------------------------
// Care-plan chat (Arabic intake → draft plan → approval)
// ---------------------------------------------------------------------------

const INTAKE_ORDER = ["currentProblem", "location", "painLevel", "symptoms", "duration", "dailyTimeMinutes", "goal", "difficulty"];

function emptyIntake() {
  return Object.fromEntries(INTAKE_ORDER.map((field) => [field, null]));
}

function firstName(name) {
  return String(name || "").replace(/^dr\.?\s+/i, "").trim().split(/\s+/)[0] || "";
}

function openingQuestion(name) {
  const who = firstName(name);
  return `مرحبًا${who ? ` ${who}` : ""}. سأطرح أسئلة قصيرة تتغيّر حسب إجاباتك لأفهم الحالة بدقة قبل اقتراح أي تمارين.\n\nما المنطقة التي تزعجك اليوم: الرأس، الرقبة، الكتف، الظهر، أم الركبة؟`;
}

function freshChat(name) {
  return {
    messages: [{ from: "ai", text: openingQuestion(name), createdAt: new Date().toISOString() }],
    intake: emptyIntake(),
    draftPlan: null,
    conversations: [],
  };
}

const INTAKE_QUESTIONS = {
  location: "أين تشعرين بالألم بالتحديد؟",
  painLevel: "ما درجة الألم من 0 إلى 10؟",
  symptoms: "هل يوجد تنميل، وخز، ضعف، تورم، أو ألم حاد؟ إذا لا يوجد، اكتبي: لا يوجد.",
  duration: "منذ متى بدأت المشكلة؟",
  dailyTimeMinutes: "كم دقيقة تستطيعين التمرن اليوم؟",
  goal: "ما هدفك؟ تخفيف الألم أو تحسين الحركة؟",
  difficulty: "ما المستوى المناسب؟ سهل، متوسط، أو متقدم؟",
};

function questionFor(chat, field, name) {
  if (field === "currentProblem") return openingQuestion(name);
  const focus = String(chat.intake.currentProblem || "");
  if (field === "location") {
    if (focus === "head") return "أين تشعرين بالألم في الرأس تحديدًا: الجبهة، خلف الرأس، أعلى الرأس، جهة واحدة، أم حول العينين؟";
    if (focus === "neck") return "أين الألم في الرقبة تحديدًا: الخلف، أحد الجانبين، أم يمتد إلى الكتف أو الذراع؟";
    if (focus === "shoulder") return "أي كتف يؤلمك؟ وهل الألم في الأمام، الأعلى، الخلف، أم يمتد إلى الذراع؟";
    if (focus === "knee") return "أي ركبة تؤلمك؟ وهل الألم أمام الركبة، خلفها، داخلها، أم خارجها؟";
    if (focus.includes("back")) return "أين الألم في الظهر تحديدًا: أعلى الظهر، منتصفه، أم أسفل الظهر؟ وهل هو في المنتصف أم جهة واحدة؟";
  }
  if (field === "symptoms") {
    if (focus === "head") return "هل يصاحب ألم الرأس غثيان، حساسية للضوء، تشوش في النظر، دوخة، حرارة، تنميل أو ضعف؟ اكتبي «لا يوجد» إن لم يظهر شيء منها.";
    if (focus === "neck") return "هل يوجد تنميل أو وخز أو ضعف في الذراع، دوخة، صداع، أو صعوبة واضحة في تحريك الرقبة؟";
    if (focus === "shoulder") return "هل يوجد ضعف في الذراع، تنميل، تورم، طقطقة مؤلمة، أو صعوبة في رفع اليد؟";
    if (focus === "knee") return "هل يوجد تورم، سخونة، قفل في الركبة، عدم ثبات، أو صوت مصحوب بألم؟";
    if (focus.includes("back")) return "هل يمتد الألم إلى الساق؟ وهل يوجد تنميل، وخز، ضعف، أو تغير في التحكم بالبول أو الأمعاء؟";
  }
  return INTAKE_QUESTIONS[field];
}

function followUpAfter(chat, field, answer, nextField, name) {
  const shortAnswer = String(answer).trim().slice(0, 70);
  const acknowledgements = {
    currentProblem: `فهمت، المشكلة في ${arabicFocus(chat.intake.currentProblem)}.`,
    location: `شكرًا، حدّدتِ المكان: ${shortAnswer}.`,
    painLevel: `تم تسجيل شدة الألم ${chat.intake.painLevel} من 10.`,
    symptoms: /^(لا|لا يوجد|none|no)$/i.test(shortAnswer) ? "جيد، لم تسجّلي أعراضًا مصاحبة." : "شكرًا، سجّلت الأعراض المصاحبة.",
    duration: `فهمت، بدأت المشكلة ${shortAnswer}.`,
    dailyTimeMinutes: `مناسب، لديك ${chat.intake.dailyTimeMinutes} دقيقة يوميًا.`,
    goal: `تم تسجيل هدفك: ${chat.intake.goal}.`,
  };
  return `${acknowledgements[field] || "شكرًا، تم تسجيل إجابتك."}\n\n${questionFor(chat, nextField, name)}`;
}

export const CARE_PLAN_SYSTEM_PROMPT = `
أنتِ المساعدة الصحية في تطبيق RemedyQuest، وتخاطبين المريض أو المريضة بالعربية فقط.

مهمتك هي عرض خطة التمارين الموجودة في رسالة المستخدم بصياغة واضحة ومطمئنة. التزمي بالقواعد التالية بدقة:
1. لا تشخّصي الحالة، ولا تدّعي أن الخطة علاج طبي، ولا تضيفي أي تمرين أو معلومة غير موجودة في JSON.
2. اذكري اسم كل تمرين كما ورد حرفيًا، مع عدد الجولات والتكرارات والمدة.
3. اذكري تنبيه السلامة الموجود في الحقل safety دون تغيير معناه.
4. لا تقولي إن الخطة حُفظت أو اعتُمدت؛ فهي ما زالت مسودة.
5. اختمي حرفيًا بهذه الجملة: اكتبي "موافقة" لإضافة الخطة إلى تمارينك، أو "تغيير" لتعديلها.
6. لا تستخدمي Markdown أو الجداول، ولا تتجاوزي 130 كلمة.

أعيدي نص الرد فقط، من دون مقدمة تقنية أو شرح لعملك.
`.trim();

async function buildAssistantResponse(record, user, text, deps, now) {
  const chat = record.chat;
  const normalized = normalizeText(text);
  const snapshot = () => clone(chat.intake);

  if (/\b(start over|restart|new plan)\b/i.test(normalized) || /(من جديد|خطة جديدة)/.test(text)) {
    chat.intake = emptyIntake();
    chat.draftPlan = null;
    return { from: "ai", text: openingQuestion(user.name), intake: snapshot() };
  }

  if (chat.draftPlan && isApproval(normalized)) {
    const added = addDraftExercises(record, chat.draftPlan);
    if (chat.draftPlan.painLevel != null) record.profile.painLevel = chat.draftPlan.painLevel;
    if (chat.draftPlan.dailyTimeMinutes) record.profile.dailyTimeMinutes = chat.draftPlan.dailyTimeMinutes;
    chat.draftPlan = null;
    return {
      from: "ai",
      text: `تمت الموافقة. أضفت ${added.length} تمارين إلى صفحة التمارين.`,
      planApplied: true,
      exercises: added,
      intake: snapshot(),
    };
  }

  if (chat.draftPlan && isRejection(normalized)) {
    chat.draftPlan = null;
    return { from: "ai", text: "لا مشكلة. اكتبي ما الذي تريدين تغييره، أو اكتبي \"من جديد\".", intake: snapshot() };
  }

  const expectedField = nextMissingField(chat);
  const invalidMessage = invalidAnswerMessage(chat, expectedField, text, user.name);
  if (invalidMessage) return { from: "ai", text: invalidMessage, intake: snapshot() };

  updateIntakeFromAnswer(chat, expectedField, text);
  const missingField = nextMissingField(chat);
  if (missingField) {
    return { from: "ai", text: followUpAfter(chat, expectedField, text, missingField, user.name), intake: snapshot() };
  }

  const draft = createDraftPlan(chat, record);
  chat.draftPlan = draft;
  const aiText = deps.summarizePlan ? await deps.summarizePlan(draft) : null;
  return {
    from: "ai",
    text: aiText ?? planPreviewText(draft),
    plan: draft,
    needsConfirmation: true,
    intake: clone(chat.intake),
    createdAt: now.toISOString(),
  };
}

function nextMissingField(chat) {
  return INTAKE_ORDER.find((field) => chat.intake[field] == null || chat.intake[field] === "");
}

function invalidAnswerMessage(chat, field, text, name) {
  const normalized = normalizeText(text);
  if (!normalized || /^(hi|hey|hello|هاي|مرحبا|اهلا|أهلا|سلام)$/.test(normalized)) {
    return questionFor(chat, field, name);
  }
  if (field === "currentProblem" && !extractProblem(normalized)) {
    return "لم أفهم المنطقة بوضوح. اكتبي مثلًا: ألم في الرأس، الرقبة، الكتف، الظهر، أو الركبة.";
  }
  if (field === "location" && (/^(no|none|لا|لا اشعر|لا يوجد)$/.test(normalized) || normalized.length < 3)) {
    return `أحتاج تحديد المكان بشكل أدق.\n\n${questionFor(chat, "location", name)}`;
  }
  if (field === "painLevel" && extractPainLevel(normalized, true) == null) {
    return "اكتبي رقما من 0 إلى 10 لدرجة الألم. مثلا: 4.";
  }
  if (field === "duration" && normalized.length < 3) {
    return "منذ متى؟ مثلا: اليوم، منذ أسبوع، أو منذ شهر.";
  }
  if (field === "dailyTimeMinutes" && extractDailyMinutes(normalized, true) == null) {
    return "اكتبي عدد الدقائق المتاحة. مثلا: 20 دقيقة.";
  }
  if (field === "goal" && !extractGoal(normalized)) {
    return "ما هدفك؟ مثلا: تخفيف الألم أو تحسين الحركة.";
  }
  if (field === "difficulty" && !extractDifficulty(normalized)) {
    return "اختاري مستوى واحدا: سهل، متوسط، أو متقدم.";
  }
  return "";
}

function updateIntakeFromAnswer(chat, field, text) {
  const lower = normalizeText(text);
  const intake = chat.intake;
  const pain = extractPainLevel(lower, field === "painLevel");
  const minutes = extractDailyMinutes(lower, field === "dailyTimeMinutes");

  if (field === "currentProblem") intake.currentProblem = extractProblem(lower) || text.slice(0, 80);
  if (field === "location") intake.location = text.slice(0, 120);
  if (field === "painLevel") intake.painLevel = pain ?? text.slice(0, 20);
  if (field === "symptoms") intake.symptoms = text.slice(0, 160);
  if (field === "duration") intake.duration = text.slice(0, 80);
  if (field === "dailyTimeMinutes") intake.dailyTimeMinutes = minutes ?? text.slice(0, 20);
  if (field === "goal") intake.goal = extractGoal(lower) || text.slice(0, 80);
  if (field === "difficulty") intake.difficulty = extractDifficulty(lower) || "سهل";

  if (pain != null) intake.painLevel = pain;
  if (minutes != null) intake.dailyTimeMinutes = minutes;
  if (!intake.currentProblem && mentionsProblem(lower)) intake.currentProblem = extractProblem(lower);
}

function createDraftPlan(chat, record) {
  const intake = chat.intake;
  const focus = String(intake.currentProblem || "back");
  const easy = Number(intake.painLevel) <= 5 && intake.difficulty !== "متقدم";
  const dailyTime = Number(intake.dailyTimeMinutes) || record.profile.dailyTimeMinutes || 20;
  return {
    title: `${arabicFocus(focus)} - ${intake.goal || "تحسين الحركة"}`,
    focus,
    location: intake.location,
    painLevel: Number(intake.painLevel) || 0,
    dailyTimeMinutes: dailyTime,
    goal: intake.goal,
    difficulty: intake.difficulty,
    safety: hasRedFlags(intake.symptoms)
      ? "اجعلي التمارين خفيفة جدا وتواصلي مع طبيب إذا زادت الأعراض."
      : "تحركي ببطء وتوقفي إذا زاد الألم.",
    exercises: pickExercises(focus, easy),
  };
}

function pickExercises(focus, easy) {
  const neck = exerciseDraft(1, "تمرين الرقبة", "الرقبة والكتف", 4, 1, 5, "bg-teal-100 text-teal-700");
  const shoulder = (area) => exerciseDraft(2, "تمرين الكتف", area, 4, 1, 5, "bg-blue-100 text-blue-700");
  const posture = exerciseDraft(5, "تصحيح الوضعية", "الجسم", 5, 1, 5, "bg-rose-100 text-rose-700");
  if (focus.includes("head")) return [neck, posture];
  if (focus.includes("neck") || focus.includes("رقبة")) return [neck, shoulder("الرقبة والكتف"), posture];
  if (focus.includes("shoulder") || focus.includes("كتف") || focus.includes("اكتاف")) return [shoulder("الكتف"), neck, posture];
  if (focus.includes("back") || focus.includes("ظهر")) {
    return [
      posture,
      exerciseDraft(3, "تمرين الظهر", "مرونة الظهر", 6, easy ? 1 : 2, 5, "bg-violet-100 text-violet-700"),
      exerciseDraft(4, "تحريك أسفل الظهر", "أسفل الظهر", 6, easy ? 1 : 2, 5, "bg-amber-100 text-amber-700"),
    ];
  }
  return [neck, shoulder("الكتف"), posture];
}

function exerciseDraft(templateId, name, area, minutes, sets, reps, color) {
  return { templateId, name, area, duration: `${minutes} min`, sets, reps, done: false, color };
}

function addDraftExercises(record, draft) {
  let nextId = record.exercises.reduce((max, exercise) => Math.max(max, Number(exercise.id) || 0), 0) + 1;
  const added = draft.exercises.map((exercise) => ({ id: nextId++, ...exercise }));
  record.exercises.push(...added);
  return added;
}

function planPreviewText(plan) {
  const lines = plan.exercises
    .map((exercise, index) => `${index + 1}. ${exercise.name}: ${exercise.sets} جولة، ${exercise.reps} تكرارات، ${exercise.duration}`)
    .join("\n");
  return `هذه خطة مقترحة لـ ${plan.location || arabicFocus(plan.focus)}. درجة الألم ${plan.painLevel}/10.\n${lines}\n\nاكتبي "موافقة" لإضافة الخطة أو "تغيير" لتعديلها.`;
}

function isApproval(text) {
  return /\b(approve|approved|yes|ok|okay|add|confirm|save|looks good)\b/i.test(text)
    || ["تمام", "موافق", "اضف", "أضف", "احفظ", "نعم"].some((term) => text.includes(term));
}

function isRejection(text) {
  return /\b(change|no|reject|different|edit|modify)\b/i.test(text)
    || ["لا", "غير", "غيّر", "عدل", "تعديل"].some((term) => text.includes(term));
}

function mentionsProblem(text) {
  return /\b(neck|shoulder|shoulders|back|lower back|posture|knee|pain|stiff|tight|ache|sore)\b/i.test(text)
    || ["رقبة", "كتف", "اكتاف", "ظهر", "اسفل الظهر", "ألم", "الم", "شد", "تيبس"].some((term) => text.includes(term));
}

function extractProblem(text) {
  if (text.includes("head") || text.includes("headache") || text.includes("رأس") || text.includes("راس") || text.includes("صداع")) return "head";
  if (text.includes("neck") || text.includes("رقبة")) return "neck";
  if (text.includes("shoulder") || text.includes("كتف") || text.includes("اكتاف")) return "shoulder";
  if (text.includes("lower back") || text.includes("اسفل الظهر") || text.includes("أسفل الظهر")) return "lower back";
  if (text.includes("back") || text.includes("ظهر")) return "back";
  if (text.includes("posture") || text.includes("وضعية")) return "posture";
  if (text.includes("knee") || text.includes("ركبة")) return "knee";
  return null;
}

function extractGoal(text) {
  if (text.includes("pain") || text.includes("ألم") || text.includes("الم")) return "تخفيف الألم";
  if (text.includes("mobil") || text.includes("حركة")) return "تحسين الحركة";
  if (text.includes("stretch") || text.includes("تمدد")) return "تمدد";
  if (text.includes("strength") || text.includes("تقوية") || text.includes("القوة")) return "تقوية";
  if (text.includes("posture") || text.includes("وضعية")) return "تحسين الوضعية";
  return null;
}

function extractDifficulty(text) {
  if (text.includes("easy") || text.includes("gentle") || text.includes("سهل")) return "سهل";
  if (text.includes("medium") || text.includes("moderate") || text.includes("متوسط")) return "متوسط";
  if (text.includes("challenging") || text.includes("hard") || text.includes("متقدم")) return "متقدم";
  return null;
}

function hasRedFlags(text) {
  return /\b(numb|numbness|tingling|weak|weakness|swelling|fever|sharp|chest|dizzy|dizziness|vision|speech|sudden)\b/i.test(String(text || ""))
    || /(تنميل|وخز|ضعف|تورم|حرارة|تشوش|نظر|كلام|مفاجئ|إغماء|اغماء|تحكم بالبول|الأمعاء)/.test(String(text || ""));
}

function arabicFocus(value) {
  const focus = String(value || "");
  if (focus.includes("head")) return "الرأس";
  if (focus.includes("neck")) return "الرقبة";
  if (focus.includes("shoulder")) return "الكتف";
  if (focus.includes("knee")) return "الركبة";
  if (focus.includes("posture")) return "الوضعية";
  return "الظهر";
}

function normalizeText(text) {
  return String(text ?? "")
    .trim()
    .toLowerCase()
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

function extractPainLevel(text, allowBareNumber = false) {
  const patterns = [
    /\b(10|[0-9])\s*\/\s*10\b/,
    /\b(10|[0-9])\s*(?:out of|from)\s*10\b/,
    /\b(10|[0-9])\s*من\s*10\b/,
    /\b(?:pain|discomfort|ache|وجع|الم|ألم)\D{0,12}(10|[0-9])\b/,
    /\b(10|[0-9])\D{0,12}(?:pain|discomfort|ache|وجع|الم|ألم)\b/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return clampNumber(match[1], 0, 10);
  }
  if (allowBareNumber && /^(10|[0-9])$/.test(text.trim())) return clampNumber(text.trim(), 0, 10);
  return null;
}

function extractDailyMinutes(text, allowBareNumber = false) {
  const match = text.match(/(?:^|\s)([1-9][0-9]?)\s*(?:min|mins|minute|minutes|دقيقة|دقائق|دقايق)(?=\s|$|[.,،])/);
  if (match) return clampNumber(match[1], 5, 45);
  if (allowBareNumber && /^[1-9][0-9]?$/.test(text.trim())) return clampNumber(text.trim(), 5, 45);
  return null;
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(Number(value), max));
}

function chatPayload(record, deps) {
  return {
    messages: record.chat.messages,
    profile: record.profile,
    intake: record.chat.intake,
    draftPlan: record.chat.draftPlan,
    conversations: record.chat.conversations,
    ai: deps.aiStatus ? deps.aiStatus() : { enabled: false, provider: "Local fallback", model: "deterministic-care-path" },
  };
}

// ---------------------------------------------------------------------------
// Request router shared by the backend and the static demo
// ---------------------------------------------------------------------------

const PASSWORD_MIN_LENGTH = 8;

function validateRegistration(body) {
  const name = String(body.name ?? "").trim().slice(0, 80);
  const email = normalizeEmail(body.email);
  const password = String(body.password ?? "");
  if (!name) throw new HttpError(400, "VALIDATION_ERROR", "Please enter your full name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "VALIDATION_ERROR", "Please enter a valid email address.");
  if (password.length < PASSWORD_MIN_LENGTH) throw new HttpError(400, "VALIDATION_ERROR", "Password must be at least 8 characters.");
  const minutes = Number(String(body.time ?? "").match(/\d+/)?.[0]) || null;
  return {
    name,
    email,
    password,
    profile: {
      problem: String(body.problem ?? "").trim().slice(0, 80) || null,
      dailyTimeMinutes: minutes,
      age: Number(body.age) || null,
      gender: String(body.gender ?? "").trim().slice(0, 30) || null,
    },
  };
}

// req: { method, path, body, token }. Returns { status, body, changed } where
// `changed` tells the caller to persist the database.
export async function handleRequest(db, req, deps) {
  const now = deps.now ? deps.now() : new Date();
  const { method, path } = req;
  const body = req.body ?? {};
  const route = `${method} ${path}`;
  const ok = (payload, status = 200, changed = false) => ({ status, body: payload, changed });

  try {
    if (route === "GET /health") return ok(deps.health ? deps.health(db) : { status: "ok" });

    if (route === "POST /auth/register" && body.role === "doctor") {
      // Doctor sign-up opens the doctor area for this session without
      // storing an account, so the same email can't be used to log in later.
      const input = validateRegistration(body);
      const guest = {
        id: `guest-doctor-${deps.newToken().slice(0, 12)}`,
        name: input.name,
        email: input.email,
        role: "doctor",
        guest: true,
        specialty: String(body.specialty ?? "").trim().slice(0, 80) || null,
      };
      const token = deps.newToken();
      db.tokens[token] = { guest, createdAt: now.toISOString() };
      return ok({ token, user: publicUser(guest) }, 201, true);
    }

    if (route === "POST /auth/register") {
      const input = validateRegistration(body);
      if (findUserByEmail(db, input.email)) {
        throw new HttpError(409, "EMAIL_TAKEN", "An account with this email already exists. Try logging in.");
      }
      const user = addUser(db, {
        name: input.name,
        email: input.email,
        role: "patient",
        passwordHash: await deps.hashPassword(input.password),
        profile: input.profile,
      });
      db.patients[user.id] = newPatientRecord(input.profile);
      const token = deps.newToken();
      db.tokens[token] = { userId: user.id, createdAt: now.toISOString() };
      return ok({ token, user: publicUser(user) }, 201, true);
    }

    if (route === "POST /auth/login") {
      const user = findUserByEmail(db, body.email);
      const valid = user && (await deps.verifyPassword(String(body.password ?? ""), user.passwordHash));
      if (!valid) throw new HttpError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
      const token = deps.newToken();
      db.tokens[token] = { userId: user.id, createdAt: now.toISOString() };
      return ok({ token, user: publicUser(user) }, 200, true);
    }

    if (route === "GET /auth/me") return ok({ user: publicUser(requireUser(db, req.token)) });

    if (route === "POST /auth/logout") {
      if (req.token && db.tokens[req.token]) {
        delete db.tokens[req.token];
        return ok({ ok: true }, 200, true);
      }
      return ok({ ok: true });
    }

    // ---- Patient ----
    if (path.startsWith("/patient/")) {
      const user = requireUser(db, req.token, ["patient"]);
      const hadRecord = Boolean(db.patients[user.id]?.chat);
      const record = patientRecord(db, user);
      const created = !hadRecord;

      if (route === "GET /patient/dashboard") return ok(patientOverview(user, record, now), 200, created);
      if (route === "GET /patient/exercises") return ok(record.exercises, 200, created);

      const statusMatch = route.match(/^POST \/patient\/exercises\/(\d+)\/status$/);
      if (statusMatch) {
        const exercise = record.exercises.find((item) => item.id === Number(statusMatch[1]));
        if (!exercise) throw new HttpError(404, "NOT_FOUND", "Exercise not found.");
        const done = Boolean(body.done);
        let awarded = 0;
        if (done) {
          const today = dayKey(now);
          if (exercise.lastAwardedDay !== today) {
            awardPoints(record, POINTS_PER_EXERCISE, now);
            record.exercisesCompleted += 1;
            exercise.lastAwardedDay = today;
            awarded = POINTS_PER_EXERCISE;
          }
          exercise.completedAt = now.toISOString();
        }
        exercise.done = done;
        return ok({ exercise, awarded, overview: patientOverview(user, record, now) }, 200, true);
      }

      if (route === "GET /patient/messages") return ok(chatPayload(record, deps), 200, created);

      if (route === "POST /patient/messages") {
        const text = String(body.text ?? "").trim();
        if (!text) throw new HttpError(400, "VALIDATION_ERROR", "Message text is required");
        record.chat.messages.push({ from: "user", text, createdAt: now.toISOString() });
        const assistant = await buildAssistantResponse(record, user, text, deps, now);
        assistant.createdAt ??= now.toISOString();
        record.chat.messages.push(assistant);
        return ok({ ...chatPayload(record, deps), messages: [assistant] }, 201, true);
      }

      if (route === "POST /patient/conversations/end") {
        const chat = record.chat;
        if (!chat.messages.some((message) => message.from === "user")) {
          throw new HttpError(400, "EMPTY_CONVERSATION", "لا توجد محادثة لحفظها.");
        }
        const endedAt = now.toISOString();
        const problem = chat.intake.currentProblem;
        const firstUserMessage = chat.messages.find((message) => message.from === "user")?.text;
        const conversation = {
          id: chat.conversations.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1,
          title: chat.intake.location
            ? `محادثة حول ${chat.intake.location}`
            : problem
              ? `محادثة حول ${arabicFocus(problem)}`
              : firstUserMessage?.slice(0, 48) || "محادثة صحية",
          status: "completed",
          startedAt: chat.messages[0]?.createdAt ?? endedAt,
          endedAt,
          messageCount: chat.messages.length,
          messages: clone(chat.messages),
          intake: clone(chat.intake),
        };
        chat.conversations.unshift(conversation);
        Object.assign(chat, { ...freshChat(user.name), conversations: chat.conversations });
        return ok({ conversation, ...chatPayload(record, deps) }, 201, true);
      }

      if (route === "POST /patient/sessions") {
        const clean = sanitizeSession(body);
        if (!clean) throw new HttpError(400, "VALIDATION_ERROR", "Invalid session payload.");
        const today = dayKey(now);
        const alreadyAwarded = record.formCheckSessions.some(
          (session) => session.completed && session.exerciseId === clean.exerciseId && dayKey(session.endedAt) === today,
        );
        const session = {
          id: record.formCheckSessions.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1,
          createdAt: now.toISOString(),
          ...clean,
        };
        record.formCheckSessions.push(session);
        if (clean.completed && !alreadyAwarded) {
          awardPoints(record, POINTS_PER_EXERCISE, now);
          record.exercisesCompleted += 1;
        }
        return ok(session, 201, true);
      }

      if (route === "GET /patient/sessions") {
        const recent = [...record.formCheckSessions].sort((a, b) => Date.parse(b.endedAt) - Date.parse(a.endedAt)).slice(0, 50);
        return ok(recent, 200, created);
      }

      if (route === "GET /patient/care-messages") return ok(record.careMessages, 200, created);

      if (route === "POST /patient/care-messages") {
        const text = String(body.text ?? "").trim().slice(0, 2000);
        if (!text) throw new HttpError(400, "VALIDATION_ERROR", "Message text is required");
        const message = { id: `m${Date.now().toString(36)}`, sender: "patient", text, createdAt: now.toISOString() };
        record.careMessages.push(message);
        return ok(message, 201, true);
      }
    }

    // ---- Doctor ----
    if (path.startsWith("/doctor/")) {
      requireUser(db, req.token, ["doctor"]);
      if (route === "GET /doctor/patients") return ok(db.doctorPatients);
      const planMatch = route.match(/^PATCH \/doctor\/patients\/(\d+)\/plan$/);
      if (planMatch) {
        const patient = db.doctorPatients.find((item) => item.id === Number(planMatch[1]));
        if (!patient) throw new HttpError(404, "NOT_FOUND", "Patient not found");
        patient.status = "Approved";
        return ok(patient, 200, true);
      }
    }

    // ---- Admin (doctor or admin accounts) ----
    if (path.startsWith("/admin/")) {
      const staff = requireUser(db, req.token, ["admin", "doctor"]);
      // Self-registered doctors are unverified: keep them out of the
      // platform-wide data.
      if (staff.guest) throw new HttpError(403, "FORBIDDEN", "This area is not available for your account.");
      if (route === "GET /admin/dashboard") {
        return ok({
          users: 1284,
          doctors: 42,
          activePatients: 986,
          pendingRefunds: 8,
          revenueIls: 38400,
          systems: [
            ["Authentication", "Operational"],
            ["Exercise plans", "Operational"],
            ["Doctor reviews", "Operational"],
            ["Refund ledger", "Operational"],
          ],
        });
      }
      if (route === "GET /admin/database") return ok(databaseSnapshot(db, deps));
    }

    throw new HttpError(404, "NOT_FOUND", `No API route for ${route}`);
  } catch (error) {
    if (error instanceof HttpError) {
      return { status: error.status, body: { code: error.code, message: error.message }, changed: false };
    }
    throw error;
  }
}

// Read-only view for the admin database viewer. Never exposes password
// hashes or session tokens.
function databaseSnapshot(db, deps) {
  const users = db.users.map((user) => ({ ...publicUser(user), createdAt: user.createdAt }));
  const records = Object.entries(db.patients).map(([userId, record]) => ({ userId, record }));
  const exercises = records.flatMap(({ userId, record }) => record.exercises.map((exercise) => ({ userId, ...exercise })));
  const messages = records.flatMap(({ userId, record }) => (record.chat?.messages ?? []).map((message) => ({ userId, ...message })));
  const formCheckSessions = records.flatMap(({ userId, record }) => record.formCheckSessions.map((session) => ({ userId, ...session })));
  const chatConversations = records.flatMap(({ userId, record }) => (record.chat?.conversations ?? []).map((conversation) => ({ userId, ...conversation })));
  const tables = {
    users,
    patients: db.doctorPatients,
    exercises,
    messages,
    chatConversations,
    formCheckSessions,
  };
  return {
    status: deps.databaseStatus ? deps.databaseStatus(db) : { connected: true },
    counts: Object.fromEntries(Object.entries(tables).map(([key, value]) => [key, value.length])),
    tables,
  };
}
