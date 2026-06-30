import {
  chatCareState,
  chatConversations,
  exercises,
  messages,
  nextChatConversationId,
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
  const missingField = nextMissingField();
  const lastMessage = messages.at(-1);
  if (
    missingField
    && lastMessage?.from === "ai"
    && lastMessage.text === intakeQuestions[missingField]
  ) {
    lastMessage.text = questionFor(missingField);
    saveAppStore();
  }
  return sendJson(response, 200, {
    messages,
    profile: patientProfile,
    intake: chatCareState.intake,
    draftPlan: chatCareState.draftPlan,
    conversations: chatConversations,
    ai: aiProviderStatus(),
  });
}

export function endConversation(_request, response) {
  if (!messages.some((message) => message.from === "user")) {
    return sendJson(response, 400, { code: "EMPTY_CONVERSATION", message: "لا توجد محادثة لحفظها." });
  }

  const endedAt = new Date().toISOString();
  const problem = chatCareState.intake.currentProblem;
  const location = chatCareState.intake.location;
  const firstUserMessage = messages.find((message) => message.from === "user")?.text;
  const conversation = {
    id: nextChatConversationId(),
    title: location
      ? `محادثة حول ${location}`
      : problem
        ? `محادثة حول ${arabicFocus(problem)}`
        : firstUserMessage?.slice(0, 48) || "محادثة صحية",
    status: "completed",
    startedAt: messages[0]?.createdAt ?? endedAt,
    endedAt,
    messageCount: messages.length,
    messages: JSON.parse(JSON.stringify(messages)),
    intake: intakeSnapshot(),
  };

  chatConversations.unshift(conversation);
  messages.splice(0, messages.length, { from: "ai", text: intakeQuestions.currentProblem, createdAt: endedAt });
  resetIntake();
  chatCareState.draftPlan = null;
  saveAppStore();

  return sendJson(response, 201, {
    conversation,
    conversations: chatConversations,
    messages,
    intake: intakeSnapshot(),
    draftPlan: null,
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
  currentProblem: "مرحبًا سلمى. سأطرح أسئلة قصيرة تتغيّر حسب إجاباتك لأفهم الحالة بدقة قبل اقتراح أي تمارين.\n\nما المنطقة التي تزعجك اليوم: الرأس، الرقبة، الكتف، الظهر، أم الركبة؟",
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
  const focus = String(chatCareState.intake.currentProblem || "");
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
  return intakeQuestions[field];
}

function followUpAfter(field, answer, nextField) {
  const shortAnswer = String(answer).trim().slice(0, 70);
  const acknowledgements = {
    currentProblem: `فهمت، المشكلة في ${arabicFocus(chatCareState.intake.currentProblem)}.`,
    location: `شكرًا، حدّدتِ المكان: ${shortAnswer}.`,
    painLevel: `تم تسجيل شدة الألم ${chatCareState.intake.painLevel} من 10.`,
    symptoms: /^(لا|لا يوجد|none|no)$/i.test(shortAnswer) ? "جيد، لم تسجّلي أعراضًا مصاحبة." : "شكرًا، سجّلت الأعراض المصاحبة.",
    duration: `فهمت، بدأت المشكلة ${shortAnswer}.`,
    dailyTimeMinutes: `مناسب، لديك ${chatCareState.intake.dailyTimeMinutes} دقيقة يوميًا.`,
    goal: `تم تسجيل هدفك: ${chatCareState.intake.goal}.`,
  };
  return `${acknowledgements[field] || "شكرًا، تم تسجيل إجابتك."}\n\n${questionFor(nextField)}`;
}

const CARE_PLAN_SYSTEM_PROMPT = `
أنتِ المساعدة الصحية في تطبيق RemedyQuest، وتخاطبين المريضة سلمى بالعربية فقط.

مهمتك هي عرض خطة التمارين الموجودة في رسالة المستخدم بصياغة واضحة ومطمئنة. التزمي بالقواعد التالية بدقة:
1. لا تشخّصي الحالة، ولا تدّعي أن الخطة علاج طبي، ولا تضيفي أي تمرين أو معلومة غير موجودة في JSON.
2. اذكري اسم كل تمرين كما ورد حرفيًا، مع عدد الجولات والتكرارات والمدة.
3. اذكري تنبيه السلامة الموجود في الحقل safety دون تغيير معناه.
4. لا تقولي إن الخطة حُفظت أو اعتُمدت؛ فهي ما زالت مسودة.
5. اختمي حرفيًا بهذه الجملة: اكتبي "موافقة" لإضافة الخطة إلى تمارينك، أو "تغيير" لتعديلها.
6. لا تستخدمي Markdown أو الجداول، ولا تتجاوزي 130 كلمة.

أعيدي نص الرد فقط، من دون مقدمة تقنية أو شرح لعملك.
`.trim();

async function buildAssistantResponse(text) {
  const normalized = normalizeText(text);

  if (/\b(start over|restart|new plan)\b/i.test(normalized) || /(\u0645\u0646 \u062C\u062F\u064A\u062F|\u062E\u0637\u0629 \u062C\u062F\u064A\u062F\u0629)/.test(text)) {
    resetIntake();
    chatCareState.draftPlan = null;
    return { from: "ai", text: intakeQuestions.currentProblem, intake: intakeSnapshot() };
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
      intake: intakeSnapshot(),
    };
  }

  if (chatCareState.draftPlan && isRejection(normalized)) {
    chatCareState.draftPlan = null;
    return {
      from: "ai",
      text: "\u0644\u0627 \u0645\u0634\u0643\u0644\u0629. \u0627\u0643\u062A\u0628\u064A \u0645\u0627 \u0627\u0644\u0630\u064A \u062A\u0631\u064A\u062F\u064A\u0646 \u062A\u063A\u064A\u064A\u0631\u0647\u060C \u0623\u0648 \u0627\u0643\u062A\u0628\u064A \"\u0645\u0646 \u062C\u062F\u064A\u062F\".",
      intake: intakeSnapshot(),
    };
  }

  const expectedField = nextMissingField();
  const invalidMessage = invalidAnswerMessage(expectedField, text);
  if (invalidMessage) {
    return { from: "ai", text: invalidMessage, intake: intakeSnapshot() };
  }

  updateIntakeFromAnswer(expectedField, text);
  const missingField = nextMissingField();
  if (missingField) {
    return { from: "ai", text: followUpAfter(expectedField, text, missingField), intake: intakeSnapshot() };
  }

  const draft = createDraftPlan();
  chatCareState.draftPlan = draft;
  const aiText = await optionalOpenRouterSummary(draft);
  return {
    from: "ai",
    text: aiText ?? planPreviewText(draft),
    plan: draft,
    needsConfirmation: true,
    intake: intakeSnapshot(),
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

function intakeSnapshot() {
  return JSON.parse(JSON.stringify(chatCareState.intake));
}

function invalidAnswerMessage(field, text) {
  const normalized = normalizeText(text);
  if (!normalized || /^(hi|hey|hello|هاي|مرحبا|اهلا|أهلا|سلام)$/.test(normalized)) {
    return questionFor(field);
  }
  if (field === "currentProblem" && !extractProblem(normalized)) {
    return "لم أفهم المنطقة بوضوح. اكتبي مثلًا: ألم في الرأس، الرقبة، الكتف، الظهر، أو الركبة.";
  }
  if (field === "location" && (/^(no|none|لا|لا اشعر|لا يوجد)$/.test(normalized) || normalized.length < 3)) {
    return `أحتاج تحديد المكان بشكل أدق.\n\n${questionFor("location")}`;
  }
  if (field === "painLevel" && extractPainLevel(normalized, true) == null) {
    return "\u0627\u0643\u062A\u0628\u064A \u0631\u0642\u0645\u0627 \u0645\u0646 0 \u0625\u0644\u0649 10 \u0644\u062F\u0631\u062C\u0629 \u0627\u0644\u0623\u0644\u0645. \u0645\u062B\u0644\u0627: 4.";
  }
  if (field === "duration" && normalized.length < 3) {
    return "\u0645\u0646\u0630 \u0645\u062A\u0649\u061F \u0645\u062B\u0644\u0627: \u0627\u0644\u064A\u0648\u0645\u060C \u0645\u0646\u0630 \u0623\u0633\u0628\u0648\u0639\u060C \u0623\u0648 \u0645\u0646\u0630 \u0634\u0647\u0631.";
  }
  if (field === "dailyTimeMinutes" && extractDailyMinutes(normalized, true) == null) {
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
  const lower = normalizeText(text);
  const intake = chatCareState.intake;
  const pain = extractPainLevel(lower, field === "painLevel");
  const minutes = extractDailyMinutes(lower, field === "dailyTimeMinutes");

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
  if (focus.includes("head")) {
    return [
      exerciseDraft("\u062A\u0645\u0631\u064A\u0646 \u0627\u0644\u0631\u0642\u0628\u0629", "\u0627\u0644\u0631\u0642\u0628\u0629 \u0648\u0627\u0644\u0643\u062A\u0641", 4, 1, 5, "bg-teal-100 text-teal-700"),
      exerciseDraft("\u062A\u0635\u062D\u064A\u062D \u0627\u0644\u0648\u0636\u0639\u064A\u0629", "\u0627\u0644\u062C\u0633\u0645", 5, 1, 5, "bg-rose-100 text-rose-700"),
    ];
  }
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
            content: CARE_PLAN_SYSTEM_PROMPT,
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
  if (text.includes("head") || text.includes("headache") || text.includes("رأس") || text.includes("راس") || text.includes("صداع")) return "head";
  if (text.includes("neck") || text.includes("رقبة")) return "neck";
  if (text.includes("shoulder") || text.includes("كتف") || text.includes("اكتاف")) return "shoulder";
  if (text.includes("lower back") || text.includes("اسفل الظهر")) return "lower back";
  if (text.includes("back") || text.includes("ظهر")) return "back";
  if (text.includes("posture")) return "posture";
  if (text.includes("knee")) return "knee";
  return text.slice(0, 80);
}

function extractGoal(text) {
  if (text.includes("pain") || text.includes("\u0623\u0644\u0645") || text.includes("\u0627\u0644\u0645")) return "\u062A\u062E\u0641\u064A\u0641 \u0627\u0644\u0623\u0644\u0645";
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
  return /\b(numb|numbness|tingling|weak|weakness|swelling|fever|sharp|chest|dizzy|dizziness|vision|speech|sudden)\b/i.test(String(text || ""))
    || /(تنميل|وخز|ضعف|تورم|حرارة|تشوش|نظر|كلام|مفاجئ|إغماء|اغماء|تحكم بالبول|الأمعاء)/.test(String(text || ""));
}

function arabicFocus(value) {
  const focus = String(value || "");
  if (focus.includes("head")) return "\u0627\u0644\u0631\u0623\u0633";
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

function extractPainLevel(text, allowBareNumber = false) {
  const painPatterns = [
    /\b(10|[0-9])\s*\/\s*10\b/,
    /\b(10|[0-9])\s*(?:out of|from)\s*10\b/,
    /\b(10|[0-9])\s*\u0645\u0646\s*10\b/,
    /\b(?:pain|discomfort|ache|وجع|الم|ألم)\D{0,12}(10|[0-9])\b/,
    /\b(10|[0-9])\D{0,12}(?:pain|discomfort|ache|وجع|الم|ألم)\b/,
  ];
  for (const pattern of painPatterns) {
    const match = text.match(pattern);
    if (match) return clampNumber(match[1], 0, 10);
  }
  if (allowBareNumber && /^(10|[0-9])$/.test(text.trim())) {
    return clampNumber(text.trim(), 0, 10);
  }
  return null;
}

function extractDailyMinutes(text, allowBareNumber = false) {
  const match = text.match(/(?:^|\s)([1-9][0-9]?)\s*(?:min|mins|minute|minutes|دقيقة|دقائق|دقايق)(?=\s|$|[.,،])/);
  if (match) return clampNumber(match[1], 5, 45);
  if (allowBareNumber && /^[1-9][0-9]?$/.test(text.trim())) {
    return clampNumber(text.trim(), 5, 45);
  }
  return null;
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(Number(value), max));
}
