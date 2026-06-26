import {
  chatCareState,
  exercises,
  messages,
  nextExercisePlanId,
  patientProfile,
  progressData,
  saveAppStore,
} from "../models/appStore.mjs";
import { readJson, sendJson } from "../utils/http.mjs";

export function dashboard(_request, response) {
  return sendJson(response, 200, {
    stats: { points: 82, level: 3, streak: 12, refundIls: 5 },
    progress: progressData,
    currentPlan: { title: "Gentle back mobility", completed: 2, total: 5 },
  });
}

export function exerciseList(_request, response) {
  return sendJson(response, 200, exercises);
}

export function messageList(_request, response) {
  return sendJson(response, 200, {
    messages,
    profile: patientProfile,
    intake: chatCareState.intake,
    draftPlan: chatCareState.draftPlan,
    ai: aiProviderStatus(),
  });
}

export async function createMessage(request, response) {
  const body = await readJson(request);
  if (!body.text?.trim()) {
    return sendJson(response, 400, { code: "VALIDATION_ERROR", message: "Message text is required" });
  }

  const saved = { from: "user", text: body.text.trim() };
  messages.push(saved);
  const assistant = await buildAssistantResponse(saved.text);
  messages.push(assistant);
  saveAppStore();
  return sendJson(response, 201, {
    messages: [assistant],
    profile: patientProfile,
    intake: chatCareState.intake,
    draftPlan: chatCareState.draftPlan,
    ai: aiProviderStatus(),
  });
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

async function buildAssistantResponse(text) {
  const normalized = normalizeText(text);

  if (/\b(start over|restart|new plan)\b/i.test(normalized) || /(\u0645\u0646 \u062C\u062F\u064A\u062F|\u062E\u0637\u0629 \u062C\u062F\u064A\u062F\u0629)/.test(text)) {
    resetIntake();
    chatCareState.draftPlan = null;
    return { from: "ai", text: intakeQuestions.currentProblem };
  }

  if (chatCareState.draftPlan && isApproval(normalized)) {
    const planTitle = chatCareState.draftPlan.title;
    const added = addDraftExercises(chatCareState.draftPlan);
    chatCareState.draftPlan = null;
    saveAppStore();
    return {
      from: "ai",
      text: `\u062A\u0645\u062A \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629. \u0623\u0636\u0641\u062A ${added.length} \u062A\u0645\u0627\u0631\u064A\u0646 \u0625\u0644\u0649 \u0635\u0641\u062D\u0629 \u0627\u0644\u062A\u0645\u0627\u0631\u064A\u0646.`,
      planApplied: true,
      exercises: added,
    };
  }

  if (chatCareState.draftPlan && isRejection(normalized)) {
    chatCareState.draftPlan = null;
    return {
      from: "ai",
      text: "\u0644\u0627 \u0645\u0634\u0643\u0644\u0629. \u0627\u0643\u062A\u0628\u064A \u0645\u0627 \u0627\u0644\u0630\u064A \u062A\u0631\u064A\u062F\u064A\u0646 \u062A\u063A\u064A\u064A\u0631\u0647\u060C \u0623\u0648 \u0627\u0643\u062A\u0628\u064A \"\u0645\u0646 \u062C\u062F\u064A\u062F\".",
    };
  }

  const expectedField = nextMissingField();
  updateIntakeFromAnswer(expectedField, text);
  const missingField = nextMissingField();
  if (missingField) {
    return { from: "ai", text: intakeQuestions[missingField], intake: chatCareState.intake };
  }

  const draft = createDraftPlan();
  chatCareState.draftPlan = draft;
  const aiText = await optionalOpenRouterSummary(draft);
  return {
    from: "ai",
    text: aiText ?? planPreviewText(draft),
    plan: draft,
    needsConfirmation: true,
  };
}

function nextMissingField() {
  return intakeOrder.find((field) => chatCareState.intake[field] == null || chatCareState.intake[field] === "");
}

function resetIntake() {
  for (const field of intakeOrder) {
    chatCareState.intake[field] = null;
  }
}

function updateIntakeFromAnswer(field, text) {
  const lower = normalizeText(text);
  const intake = chatCareState.intake;
  const pain = extractPainLevel(lower);
  const minutes = extractDailyMinutes(lower);

  if (field === "currentProblem") intake.currentProblem = extractProblem(lower) || text.slice(0, 80);
  if (field === "location") intake.location = text.slice(0, 120);
  if (field === "painLevel") intake.painLevel = pain ?? text.slice(0, 20);
  if (field === "symptoms") intake.symptoms = text.slice(0, 160);
  if (field === "duration") intake.duration = text.slice(0, 80);
  if (field === "dailyTimeMinutes") intake.dailyTimeMinutes = minutes ?? text.slice(0, 20);
  if (field === "goal") intake.goal = extractGoal(lower) || text.slice(0, 80);
  if (field === "difficulty") intake.difficulty = extractDifficulty(lower) || "\u0633\u0647\u0644";

  if (pain != null) intake.painLevel = pain;
  if (minutes != null) intake.dailyTimeMinutes = minutes;
  if (!intake.currentProblem && mentionsProblem(lower)) intake.currentProblem = extractProblem(lower);
}

function createDraftPlan() {
  const intake = chatCareState.intake;
  const focus = intake.currentProblem;
  const easy = Number(intake.painLevel) <= 5 && intake.difficulty !== "\u0645\u062A\u0642\u062F\u0645";
  const dailyTime = Number(intake.dailyTimeMinutes) || patientProfile.dailyTimeMinutes;
  const plan = pickExercises(focus, easy);
  return {
    title: `${arabicFocus(focus)} - ${intake.goal || "\u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u062D\u0631\u0643\u0629"}`,
    focus,
    location: intake.location,
    painLevel: Number(intake.painLevel) || 0,
    dailyTimeMinutes: dailyTime,
    goal: intake.goal,
    difficulty: intake.difficulty,
    safety: hasRedFlags(intake.symptoms)
      ? "\u0627\u062C\u0639\u0644\u064A \u0627\u0644\u062A\u0645\u0627\u0631\u064A\u0646 \u062E\u0641\u064A\u0641\u0629 \u062C\u062F\u0627 \u0648\u062A\u0648\u0627\u0635\u0644\u064A \u0645\u0639 \u0637\u0628\u064A\u0628 \u0625\u0630\u0627 \u0632\u0627\u062F\u062A \u0627\u0644\u0623\u0639\u0631\u0627\u0636."
      : "\u062A\u062D\u0631\u0643\u064A \u0628\u0628\u0637\u0621 \u0648\u062A\u0648\u0642\u0641\u064A \u0625\u0630\u0627 \u0632\u0627\u062F \u0627\u0644\u0623\u0644\u0645.",
    exercises: plan,
  };
}

function pickExercises(focus, easy) {
  if (focus.includes("neck") || focus.includes("رقبة")) {
    return [
      exerciseDraft("\u062A\u0645\u0631\u064A\u0646 \u0627\u0644\u0631\u0642\u0628\u0629", "\u0627\u0644\u0631\u0642\u0628\u0629 \u0648\u0627\u0644\u0643\u062A\u0641", 4, 1, 5, "bg-teal-100 text-teal-700"),
      exerciseDraft("\u062A\u0645\u0631\u064A\u0646 \u0627\u0644\u0643\u062A\u0641", "\u0627\u0644\u0631\u0642\u0628\u0629 \u0648\u0627\u0644\u0643\u062A\u0641", 4, 1, 5, "bg-blue-100 text-blue-700"),
      exerciseDraft("\u062A\u0635\u062D\u064A\u062D \u0627\u0644\u0648\u0636\u0639\u064A\u0629", "\u0627\u0644\u062C\u0633\u0645", 5, 1, 5, "bg-rose-100 text-rose-700"),
    ];
  }
  if (focus.includes("shoulder") || focus.includes("كتف") || focus.includes("اكتاف")) {
    return [
      exerciseDraft("\u062A\u0645\u0631\u064A\u0646 \u0627\u0644\u0643\u062A\u0641", "\u0627\u0644\u0643\u062A\u0641", 4, 1, 5, "bg-blue-100 text-blue-700"),
      exerciseDraft("\u062A\u0645\u0631\u064A\u0646 \u0627\u0644\u0631\u0642\u0628\u0629", "\u0627\u0644\u0631\u0642\u0628\u0629 \u0648\u0627\u0644\u0643\u062A\u0641", 4, 1, 5, "bg-teal-100 text-teal-700"),
      exerciseDraft("\u062A\u0635\u062D\u064A\u062D \u0627\u0644\u0648\u0636\u0639\u064A\u0629", "\u0627\u0644\u062C\u0633\u0645", 5, 1, 5, "bg-rose-100 text-rose-700"),
    ];
  }
  if (focus.includes("back") || focus.includes("ظهر")) {
    return [
      exerciseDraft("\u062A\u0635\u062D\u064A\u062D \u0627\u0644\u0648\u0636\u0639\u064A\u0629", "\u0627\u0644\u062C\u0633\u0645", 5, 1, 5, "bg-rose-100 text-rose-700"),
      exerciseDraft("\u062A\u0645\u0631\u064A\u0646 \u0627\u0644\u0638\u0647\u0631", "\u0645\u0631\u0648\u0646\u0629 \u0627\u0644\u0638\u0647\u0631", 6, easy ? 1 : 2, 5, "bg-violet-100 text-violet-700"),
      exerciseDraft("\u062A\u062D\u0631\u064A\u0643 \u0623\u0633\u0641\u0644 \u0627\u0644\u0638\u0647\u0631", "\u0623\u0633\u0641\u0644 \u0627\u0644\u0638\u0647\u0631", 6, easy ? 1 : 2, 5, "bg-amber-100 text-amber-700"),
    ];
  }
  return [
    exerciseDraft("\u062A\u0645\u0631\u064A\u0646 \u0627\u0644\u0631\u0642\u0628\u0629", "\u0627\u0644\u0631\u0642\u0628\u0629 \u0648\u0627\u0644\u0643\u062A\u0641", 4, 1, 5, "bg-teal-100 text-teal-700"),
    exerciseDraft("\u062A\u0645\u0631\u064A\u0646 \u0627\u0644\u0643\u062A\u0641", "\u0627\u0644\u0643\u062A\u0641", 4, 1, 5, "bg-blue-100 text-blue-700"),
    exerciseDraft("\u062A\u0635\u062D\u064A\u062D \u0627\u0644\u0648\u0636\u0639\u064A\u0629", "\u0627\u0644\u062C\u0633\u0645", 5, 1, 5, "bg-rose-100 text-rose-700"),
  ];
}

function exerciseDraft(name, area, minutes, sets, reps, color) {
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

function addDraftExercises(draft) {
  const added = draft.exercises.map((exercise) => ({
    id: nextExercisePlanId(),
    ...exercise,
  }));
  exercises.push(...added);
  saveAppStore();
  return added;
}

function planPreviewText(plan) {
  const lines = plan.exercises
    .map((exercise, index) => `${index + 1}. ${exercise.name}: ${exercise.sets} \u062C\u0648\u0644\u0629\u060C ${exercise.reps} \u062A\u0643\u0631\u0627\u0631\u0627\u062A\u060C ${exercise.duration}`)
    .join("\n");
  return `\u0647\u0630\u0647 \u062E\u0637\u0629 \u0645\u0642\u062A\u0631\u062D\u0629 \u0644\u0640 ${plan.location || arabicFocus(plan.focus)}. \u062F\u0631\u062C\u0629 \u0627\u0644\u0623\u0644\u0645 ${plan.painLevel}/10.\n${lines}\n\n\u0627\u0643\u062A\u0628\u064A "\u0645\u0648\u0627\u0641\u0642\u0629" \u0644\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u062E\u0637\u0629 \u0623\u0648 "\u062A\u063A\u064A\u064A\u0631" \u0644\u062A\u0639\u062F\u064A\u0644\u0647\u0627.`;
}

function aiProviderStatus() {
  const enabled = Boolean(process.env.OPENROUTER_API_KEY);
  return {
    enabled,
    provider: enabled ? "OpenRouter" : "Local fallback",
    model: enabled ? process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini" : "deterministic-care-path",
  };
}

async function optionalOpenRouterSummary(plan) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Write the response in Arabic for Salma. Do not diagnose. Mention the exact exercises provided. Ask her to type موافقة before saving. Keep it under 110 words.",
          },
          {
            role: "user",
            content: JSON.stringify(plan),
          },
        ],
      }),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
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
  if (text.includes("neck") || text.includes("رقبة")) return "neck";
  if (text.includes("shoulder") || text.includes("كتف") || text.includes("اكتاف")) return "shoulder";
  if (text.includes("lower back") || text.includes("اسفل الظهر")) return "lower back";
  if (text.includes("back") || text.includes("ظهر")) return "back";
  if (text.includes("posture")) return "posture";
  if (text.includes("knee")) return "knee";
  return text.slice(0, 80);
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

function arabicFocus(value) {
  const focus = String(value || "");
  if (focus.includes("neck")) return "\u0627\u0644\u0631\u0642\u0628\u0629";
  if (focus.includes("shoulder")) return "\u0627\u0644\u0643\u062A\u0641";
  if (focus.includes("knee")) return "\u0627\u0644\u0631\u0643\u0628\u0629";
  if (focus.includes("posture")) return "\u0627\u0644\u0648\u0636\u0639\u064A\u0629";
  return "\u0627\u0644\u0638\u0647\u0631";
}

function normalizeText(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

function extractPainLevel(text) {
  const painPatterns = [
    /\b(10|[0-9])\s*\/\s*10\b/,
    /\b(10|[0-9])\s*(?:out of|from)\s*10\b/,
    /\b(?:pain|discomfort|ache|وجع|الم|ألم)\D{0,12}(10|[0-9])\b/,
    /\b(10|[0-9])\D{0,12}(?:pain|discomfort|ache|وجع|الم|ألم)\b/,
  ];
  for (const pattern of painPatterns) {
    const match = text.match(pattern);
    if (match) return clampNumber(match[1], 0, 10);
  }
  return null;
}

function extractDailyMinutes(text) {
  const match = text.match(/\b([1-9][0-9]?)\s*(?:min|mins|minute|minutes|دقيقة|دقايق)\b/);
  return match ? clampNumber(match[1], 5, 45) : null;
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(Number(value), max));
}
