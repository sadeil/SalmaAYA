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
    draftPlan: chatCareState.draftPlan,
    ai: aiProviderStatus(),
  });
}

async function buildAssistantResponse(text) {
  const normalized = normalizeText(text);

  if (chatCareState.draftPlan && isApproval(normalized)) {
    const planTitle = chatCareState.draftPlan.title;
    const added = addDraftExercises(chatCareState.draftPlan);
    chatCareState.draftPlan = null;
    saveAppStore();
    return {
      from: "ai",
      text: `Approved. I added ${added.length} exercises from "${planTitle}" to your Exercises page. Start gently and stop if pain increases.`,
      planApplied: true,
      exercises: added,
    };
  }

  if (chatCareState.draftPlan && isRejection(normalized)) {
    chatCareState.draftPlan = null;
    return {
      from: "ai",
      text: "No problem. I did not add anything. Tell me what you want changed: area, pain level, available time, or exercise difficulty.",
    };
  }

  updateIntakeFromText(text);
  const missing = missingIntakeFields();
  if (missing) return { from: "ai", text: missing };

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

function updateIntakeFromText(text) {
  const lower = normalizeText(text);
  const intake = chatCareState.intake;
  const pain = extractPainLevel(lower);
  const minutes = extractDailyMinutes(lower);

  if (mentionsProblem(lower)) {
    intake.currentProblem = extractProblem(lower);
  }
  if (pain != null) {
    intake.painLevel = pain;
  }
  if (minutes != null) {
    intake.dailyTimeMinutes = minutes;
  }
}

function missingIntakeFields() {
  const intake = chatCareState.intake;
  if (!intake.currentProblem) {
    return `I know your profile says ${patientProfile.problem} with about ${patientProfile.dailyTimeMinutes} minutes available. What is the current problem today: neck, shoulders, back, or something else?`;
  }
  if (intake.painLevel == null) {
    return "What is the pain or discomfort level right now from 0 to 10?";
  }
  if (!intake.dailyTimeMinutes) {
    intake.dailyTimeMinutes = patientProfile.dailyTimeMinutes;
  }
  return null;
}

function createDraftPlan() {
  const intake = chatCareState.intake;
  const focus = intake.currentProblem;
  const easy = intake.painLevel <= 5;
  const dailyTime = intake.dailyTimeMinutes || patientProfile.dailyTimeMinutes;
  const plan = pickExercises(focus, easy);
  return {
    title: `${capitalize(focus)} rehab pathway`,
    focus,
    painLevel: intake.painLevel,
    dailyTimeMinutes: dailyTime,
    safety: "Use slow, pain-free motion. Stop if pain becomes sharp, numb, or unusual.",
    exercises: plan,
  };
}

function pickExercises(focus, easy) {
  if (focus.includes("neck") || focus.includes("رقبة")) {
    return [
      exerciseDraft("Neck mobility", "Neck & shoulders", 4, 1, 5, "bg-teal-100 text-teal-700"),
      exerciseDraft("Shoulder raise", "Neck & shoulders", 4, 1, 5, "bg-blue-100 text-blue-700"),
      exerciseDraft("Posture reset", "Full posture", 5, 1, 5, "bg-rose-100 text-rose-700"),
    ];
  }
  if (focus.includes("shoulder") || focus.includes("كتف") || focus.includes("اكتاف")) {
    return [
      exerciseDraft("Shoulder raise", "Shoulders", 4, 1, 5, "bg-blue-100 text-blue-700"),
      exerciseDraft("Neck mobility", "Neck & shoulders", 4, 1, 5, "bg-teal-100 text-teal-700"),
      exerciseDraft("Posture reset", "Full posture", 5, 1, 5, "bg-rose-100 text-rose-700"),
    ];
  }
  if (focus.includes("back") || focus.includes("ظهر")) {
    return [
      exerciseDraft("Posture reset", "Full posture", 5, 1, 5, "bg-rose-100 text-rose-700"),
      exerciseDraft("Cat-cow stretch", "Spine mobility", 6, easy ? 1 : 2, 5, "bg-violet-100 text-violet-700"),
      exerciseDraft("Lower back mobility", "Lower back", 6, easy ? 1 : 2, 5, "bg-amber-100 text-amber-700"),
    ];
  }
  return [
    exerciseDraft("Neck mobility", "Neck & shoulders", 4, 1, 5, "bg-teal-100 text-teal-700"),
    exerciseDraft("Shoulder raise", "Shoulders", 4, 1, 5, "bg-blue-100 text-blue-700"),
    exerciseDraft("Posture reset", "Full posture", 5, 1, 5, "bg-rose-100 text-rose-700"),
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
    .map((exercise, index) => `${index + 1}. ${exercise.name}: ${exercise.sets} set, ${exercise.reps} reps, ${exercise.duration}`)
    .join("\n");
  return `Plan preview for ${plan.focus}, pain ${plan.painLevel}/10:\n${lines}\n\nReply "approve" to add this to your Exercises page, or "change" to adjust it.`;
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
            content: "Write a concise patient-facing rehab plan preview for the RemedyQuest chatbot. Do not diagnose. Mention the exact exercises provided. Ask the user to approve before saving. Keep it under 110 words.",
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

function capitalize(value) {
  return value ? value[0].toUpperCase() + value.slice(1) : "Rehab";
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
