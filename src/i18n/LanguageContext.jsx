import { createContext, useContext, useEffect, useMemo, useState } from "react";

const translations = {
  "How it works": "كيف تعمل المنصة",
  "Features": "المميزات",
  "Safety": "السلامة",
  "Log in": "تسجيل الدخول",
  "Start your quest": "ابدأ رحلتك",
  "Overview": "نظرة عامة",
  "Today's plan": "خطة اليوم",
  "AI assistant": "المساعد الذكي",
  "Quest & rewards": "الرحلة والمكافآت",
  "Refund wallet": "محفظة الاسترداد",
  "Doctor messages": "رسائل الطبيب",
  "My patients": "مرضاي",
  "Messages": "الرسائل",
  "Accounts": "الحسابات",
  "Refund requests": "طلبات الاسترداد",
  "Physiotherapist": "أخصائي علاج طبيعي",
  "Platform manager": "مدير المنصة",
  "Patient · Level 3": "مريض · المستوى 3",
  "Keep showing up": "استمر في التقدم",
  "Small movements build lasting recovery.": "الحركات البسيطة تصنع تعافيًا مستدامًا.",
  "Sign out": "تسجيل الخروج",
  "General therapeutic exercise guidance. RemedyQuest does not replace professional medical advice.": "إرشادات عامة للتمارين العلاجية. لا تغني RemedyQuest عن الاستشارة الطبية المتخصصة.",
  "A smarter path to feeling better": "طريق أذكى نحو شعور أفضل",
  "Your recovery is a": "تعافيك هو",
  "quest worth winning.": "رحلة تستحق النجاح.",
  "RemedyQuest combines AI-guided therapeutic exercise, trusted doctor follow-up, and motivating rewards to help you move better every day.": "تجمع RemedyQuest بين التمارين العلاجية الموجهة بالذكاء الاصطناعي، ومتابعة الطبيب، والمكافآت التحفيزية لمساعدتك على الحركة بشكل أفضل كل يوم.",
  "Start as a patient": "ابدأ كمريض",
  "Doctor login": "دخول الطبيب",
  "Doctor reviewed": "مراجعة من الطبيب",
  "Adaptive plans": "خطط متكيفة",
  "Privacy minded": "خصوصية آمنة",
  "GOOD MORNING, MAYA": "صباح الخير، مايا",
  "Ready for today's quest?": "هل أنت مستعدة لرحلة اليوم؟",
  "Day 12": "اليوم 12",
  "25 min": "25 دقيقة",
  "Gentle back mobility": "تمارين لطيفة لحركة الظهر",
  "5 exercises · Low impact": "5 تمارين · جهد خفيف",
  "Continue session": "متابعة الجلسة",
  "points": "نقطة",
  "day streak": "أيام متتالية",
  "earned": "مكتسب",
  "WEEKLY PROGRESS": "التقدم الأسبوعي",
  "Made for momentum": "مصممة للاستمرارية",
  "Care that meets you where you are": "رعاية تناسب احتياجاتك",
  "From the first conversation to every completed session, your path stays personal, supervised, and motivating.": "من أول محادثة وحتى كل جلسة مكتملة، تبقى رحلتك شخصية وتحت المتابعة ومحفزة.",
  "Tell us how you feel": "أخبرنا كيف تشعر",
  "Have a thoughtful AI-guided conversation about your pain, movement, and schedule.": "أجرِ محادثة ذكية حول الألم والحركة والوقت المتاح.",
  "Get your care plan": "احصل على خطتك العلاجية",
  "Receive a personalized exercise path reviewed by a qualified doctor.": "احصل على خطة تمارين شخصية يراجعها طبيب مؤهل.",
  "Move, track, earn": "تحرك، تابع، واكسب",
  "Build consistency, see progress, and unlock rewards as you recover.": "حافظ على الالتزام، تابع تقدمك، وافتح المكافآت أثناء التعافي.",
  "One connected platform": "منصة واحدة متكاملة",
  "Everything recovery needs to keep moving": "كل ما يحتاجه التعافي للاستمرار",
  "AI health assistant": "مساعد صحي ذكي",
  "Personalized daily plans": "خطط يومية مخصصة",
  "Doctor-reviewed care": "رعاية يراجعها الطبيب",
  "Recovery that rewards": "تعافٍ يمنحك مكافآت",
  "Refund motivation": "تحفيز بالاسترداد",
  "Visible progress": "تقدم واضح",
  "Safety comes first": "السلامة أولًا",
  "Technology supports care. It never replaces it.": "التقنية تدعم الرعاية ولا تستبدلها.",
  "Begin safely": "ابدأ بأمان",
  "Welcome back": "مرحبًا بعودتك",
  "Continue your journey toward better movement.": "تابع رحلتك نحو حركة أفضل.",
  "patient": "مريض",
  "doctor": "طبيب",
  "Email address": "البريد الإلكتروني",
  "Password": "كلمة المرور",
  "Remember me": "تذكرني",
  "Forgot password?": "نسيت كلمة المرور؟",
  "Log in securely": "تسجيل دخول آمن",
  "New to RemedyQuest?": "جديد في RemedyQuest؟",
  "Create account": "إنشاء حساب",
  "Create your account": "أنشئ حسابك",
  "A few details and your care journey can begin.": "بعض التفاصيل ثم تبدأ رحلتك العلاجية.",
  "Full name": "الاسم الكامل",
  "Username": "اسم المستخدم",
  "Age": "العمر",
  "Gender": "الجنس",
  "Prefer not to say": "أفضل عدم الإفصاح",
  "Female": "أنثى",
  "Male": "ذكر",
  "Main physical problem": "المشكلة الجسدية الرئيسية",
  "Daily available time": "الوقت اليومي المتاح",
  "Specialty": "التخصص",
  "Medical license number": "رقم الترخيص الطبي",
  "Payment gateway placeholder · 40 ILS": "بوابة دفع تجريبية · 40 شيكل",
  "Create patient account": "إنشاء حساب مريض",
  "Create doctor account": "إنشاء حساب طبيب",
  "Already registered?": "لديك حساب بالفعل؟",
  "Personalized care that keeps you going": "رعاية شخصية تساعدك على الاستمرار",
  "Small steps. Visible progress. Stronger you.": "خطوات صغيرة. تقدم واضح. أنت أقوى.",
  "Adaptive therapeutic exercise": "تمارين علاجية متكيفة",
  "Professional doctor follow-up": "متابعة طبية متخصصة",
  "Safety-led guidance": "إرشادات تضع السلامة أولًا",
  "Back to home": "العودة للرئيسية",
  "Good morning, Maya": "صباح الخير، مايا",
  "Your body has shown up for you today. Let's return the favor.": "جسدك يدعمك اليوم، فلنمنحه الرعاية التي يستحقها.",
  "Start today's exercises": "ابدأ تمارين اليوم",
  "Current points": "النقاط الحالية",
  "Current level": "المستوى الحالي",
  "Day streak": "الأيام المتتالية",
  "Refund earned": "الاسترداد المكتسب",
  "Today's care plan": "خطة رعاية اليوم",
  "How are you feeling today?": "كيف تشعر اليوم؟",
  "Tell your AI assistant about any changes before starting your plan.": "أخبر المساعد الذكي بأي تغييرات قبل بدء خطتك.",
  "Chat with AI": "تحدث مع المساعد الذكي",
  "Health focus": "التركيز الصحي",
  "Lower back tension": "شد أسفل الظهر",
  "Recovery confidence": "الثقة بالتعافي",
  "Movement score": "درجة الحركة",
  "Your week in motion": "حركتك خلال الأسبوع",
  "Daily plan": "الخطة اليومية",
  "Today's movement quest": "رحلة الحركة لليوم",
  "Move gently and stop if an exercise causes sharp or unusual pain.": "تحرك بلطف وتوقف إذا سبب التمرين ألمًا حادًا أو غير معتاد.",
  "Duration": "المدة",
  "Sets": "الجولات",
  "Reps": "التكرارات",
  "Completed": "مكتمل",
  "Not completed": "غير مكتمل",
  "Complete exercise": "إكمال التمرين",
  "Mark incomplete": "تحديد كغير مكتمل",
  "Let's understand how you feel": "دعنا نفهم كيف تشعر",
  "Online": "متصل",
  "AI placeholder": "ذكاء اصطناعي تجريبي",
  "Intake summary": "ملخص التقييم",
  "Suggested care path": "الخطة العلاجية المقترحة",
  "Problem": "المشكلة",
  "Pain level": "درجة الألم",
  "Daily time": "الوقت اليومي",
  "Plan": "الخطة",
  "Exercises": "التمارين",
  "Send for doctor review": "إرسال لمراجعة الطبيب",
  "Safety note": "ملاحظة سلامة",
  "Your recovery, leveled up": "ارتقِ بمستوى تعافيك",
  "Current quest": "الرحلة الحالية",
  "Level 3": "المستوى 3",
  "Next reward": "المكافأة التالية",
  "Badge collection": "مجموعة الشارات",
  "Recovery stages": "مراحل التعافي",
  "Your path to the next milestone": "مسارك نحو المرحلة التالية",
  "Complete exercises and move through every stage.": "أكمل التمارين وتقدم عبر كل مرحلة.",
  "2 stages completed": "مرحلتان مكتملتان",
  "Stage": "المرحلة",
  "Stage 1": "المرحلة 1",
  "Stage 2": "المرحلة 2",
  "Stage 3": "المرحلة 3",
  "Stage 4": "المرحلة 4",
  "Stage 5": "المرحلة 5",
  "You are here": "أنت هنا",
  "Current": "الحالية",
  "Badge": "شارة",
  "Mystery reward": "مكافأة مفاجئة",
  "18 points to Stage 4": "18 نقطة للوصول إلى المرحلة 4",
  "Consistency pays back": "التزامك يعود عليك",
  "Claim available refund": "طلب الاسترداد المتاح",
  "Subscription amount": "قيمة الاشتراك",
  "Earned refund": "الاسترداد المكتسب",
  "Remaining refundable": "المبلغ المتبقي للاسترداد",
  "Refund journey": "رحلة الاسترداد",
  "Reward history": "سجل المكافآت",
  "Reward": "المكافأة",
  "Date": "التاريخ",
  "Amount": "المبلغ",
  "Status": "الحالة",
  "Pending": "قيد الانتظار",
  "Approved": "مقبول",
  "Your care conversation": "محادثتك العلاجية",
  "Search conversations": "البحث في المحادثات",
  "Write a message...": "اكتب رسالة...",
  "Clinical overview": "نظرة سريرية عامة",
  "Good morning, Dr. Adam": "صباح الخير، د. آدم",
  "Review patient plans": "مراجعة خطط المرضى",
  "Total patients": "إجمالي المرضى",
  "Active patients": "المرضى النشطون",
  "Plans need review": "خطط تحتاج مراجعة",
  "Consultation requests": "طلبات الاستشارة",
  "Plans needing attention": "خطط تحتاج اهتمامًا",
  "View all": "عرض الكل",
  "AI suggested plans": "خطط مقترحة بالذكاء الاصطناعي",
  "Patient commitment": "التزام المرضى",
  "Plans approved": "الخطط المعتمدة",
  "Avg. response": "متوسط الرد",
  "Patient": "المريض",
  "Pain": "الألم",
  "Commitment": "الالتزام",
  "Level": "المستوى",
  "Needs review": "يحتاج مراجعة",
  "Patient management": "إدارة المرضى",
  "Your patients": "مرضاك",
  "Search patients": "البحث عن المرضى",
  "Patient profile": "ملف المريض",
  "Send note": "إرسال ملاحظة",
  "Approve plan": "اعتماد الخطة",
  "Plan approved": "تم اعتماد الخطة",
  "Modify plan": "تعديل الخطة",
  "Doctor notes": "ملاحظات الطبيب",
  "Save and send note": "حفظ وإرسال الملاحظة",
  "Progress snapshot": "ملخص التقدم",
  "Need an in-person visit?": "هل تحتاج زيارة حضورية؟",
  "Recommend visit": "التوصية بزيارة",
  "Platform administration": "إدارة المنصة",
  "RemedyQuest control center": "مركز تحكم RemedyQuest",
  "Total users": "إجمالي المستخدمين",
  "Verified doctors": "الأطباء الموثقون",
  "Payments": "المدفوعات",
  "Platform status": "حالة المنصة",
  "Exercise plans": "خطط التمارين",
  "Refunded total": "إجمالي المسترد",
  "Avg. commitment": "متوسط الالتزام",
  "Action": "الإجراء",
  "Milestone": "المرحلة"
};

const LanguageContext = createContext(null);

function translateText(value) {
  const leading = value.match(/^\s*/)?.[0] || "";
  const trailing = value.match(/\s*$/)?.[0] || "";
  const core = value.trim();
  return translations[core] ? `${leading}${translations[core]}${trailing}` : value;
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem("rq-language") || "en");

  useEffect(() => {
    localStorage.setItem("rq-language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const value = useMemo(() => ({
    language,
    isArabic: language === "ar",
    toggleLanguage: () => setLanguage(current => current === "en" ? "ar" : "en"),
    t: text => language === "ar" ? translations[text] || text : text
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function AutoTranslate() {
  const { language } = useLanguage();

  useEffect(() => {
    let applying = false;
    const apply = root => {
      if (applying) return;
      applying = true;
      const nodes = [];
      if (root.nodeType === Node.TEXT_NODE) nodes.push(root);
      else if (root.nodeType === Node.ELEMENT_NODE || root.nodeType === Node.DOCUMENT_NODE) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) nodes.push(walker.currentNode);
      }
      nodes.forEach(node => {
        if (!node.parentElement || node.parentElement.closest("[data-no-translate]") || ["SCRIPT", "STYLE"].includes(node.parentElement.tagName)) return;
        if (!node.__rqEnglish) node.__rqEnglish = node.nodeValue;
        const desired = language === "ar" ? translateText(node.__rqEnglish) : node.__rqEnglish;
        if (node.nodeValue !== desired) node.nodeValue = desired;
      });
      const elements = root.querySelectorAll ? [root, ...root.querySelectorAll("[placeholder]")] : [];
      elements.forEach(element => {
        if (!element.getAttribute) return;
        const placeholder = element.getAttribute("placeholder");
        if (!placeholder) return;
        if (!element.dataset.rqEnglishPlaceholder) element.dataset.rqEnglishPlaceholder = placeholder;
        const desired = language === "ar" ? translations[element.dataset.rqEnglishPlaceholder] || element.dataset.rqEnglishPlaceholder : element.dataset.rqEnglishPlaceholder;
        if (placeholder !== desired) element.setAttribute("placeholder", desired);
      });
      applying = false;
    };
    apply(document.body);
    const observer = new MutationObserver(records => records.forEach(record => {
      record.addedNodes.forEach(apply);
      if (record.type === "characterData") apply(record.target);
    }));
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);

  return null;
}

export function LanguageToggle({ compact = false }) {
  const { language, toggleLanguage } = useLanguage();
  return (
    <button data-no-translate type="button" onClick={toggleLanguage} aria-label="Switch language" className="language-toggle btn-soft shrink-0 px-3 py-2.5">
      <span className="font-extrabold">{language === "en" ? "ع" : "EN"}</span>
      {!compact && <span>{language === "en" ? "العربية" : "English"}</span>}
    </button>
  );
}
