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
  ,"patient space": "مساحة المريض"
  ,"doctor space": "مساحة الطبيب"
  ,"admin space": "مساحة المدير"
  ,"Dr. Adam Noor": "د. آدم نور"
  ,"Salma Admin": "سلمى - المديرة"
  ,"Maya Khalil": "مايا خليل"
  ,"Omar Saleh": "عمر صالح"
  ,"Lina Nasser": "لينا ناصر"
  ,"Yousef Hamdan": "يوسف حمدان"
  ,"Friday, 12 June": "الجمعة، 12 يونيو"
  ,"82 pts": "82 نقطة"
  ,"+10 this week": "+10 هذا الأسبوع"
  ,"18 pts to Level 4": "18 نقطة للمرحلة 4"
  ,"12 days": "12 يومًا"
  ,"Personal best": "أفضل إنجاز شخصي"
  ,"12.5% returned": "تم استرداد 12.5%"
  ,"5 exercises · 25 minutes · Low impact": "5 تمارين · 25 دقيقة · جهد خفيف"
  ,"2 of 5 complete": "اكتمل تمرينان من 5"
  ,"Your reported discomfort is down from 6 to 4 this month.": "انخفض مستوى الألم الذي أبلغت عنه من 6 إلى 4 هذا الشهر."
  ,"Move slowly through a comfortable range, breathe steadily, and keep your posture relaxed.": "تحرك ببطء ضمن نطاق مريح، وتنفس بثبات، وحافظ على استرخاء وضعية جسمك."
  ,"Your answers help prepare a suggested plan for doctor review.": "تساعد إجاباتك في إعداد خطة مقترحة لمراجعة الطبيب."
  ,"Describe how you feel...": "صف كيف تشعر..."
  ,"This platform provides general therapeutic exercise guidance and does not replace consultation with a doctor or physical therapist.": "تقدم هذه المنصة إرشادات عامة للتمارين العلاجية ولا تغني عن استشارة الطبيب أو أخصائي العلاج الطبيعي."
  ,"Every completed exercise moves you closer to stronger habits and your next reward.": "كل تمرين مكتمل يقربك من عادات أقوى ومكافأتك التالية."
  ,"Mobility Builder · 82 points": "باني المرونة · 82 نقطة"
  ,"Unlock at 100 points": "تُفتح عند 100 نقطة"
  ,"Earned": "مكتسبة"
  ,"Next": "التالية"
  ,"Locked": "مقفلة"
  ,"12-day streak": "التزام لمدة 12 يومًا"
  ,"Quick starter": "بداية سريعة"
  ,"Level three": "المرحلة الثالثة"
  ,"Mobility hero": "بطل المرونة"
  ,"Consistency pro": "محترف الالتزام"
  ,"Quest master": "خبير الرحلة"
  ,"Available to claim": "متاح للاسترداد"
  ,"12.5% of subscription recovered": "تم استرداد 12.5% من الاشتراك"
  ,"Level 1 milestone": "إنجاز المرحلة 1"
  ,"Level 2 milestone": "إنجاز المرحلة 2"
  ,"Stay connected with your doctor between reviews.": "ابقَ على تواصل مع طبيبك بين مواعيد المراجعة."
  ,"Usually replies within a day": "يرد عادة خلال يوم"
  ,"Your plan looks good...": "خطتك تبدو جيدة..."
  ,"Hi Maya, your progress this week looks strong. How did the lower back mobility exercise feel?": "مرحبًا مايا، تقدمك هذا الأسبوع ممتاز. كيف كان شعورك أثناء تمرين حركة أسفل الظهر؟"
  ,"Much better. I feel less tight after work now.": "أفضل بكثير. أشعر بشد أقل بعد العمل الآن."
  ,"Review suggested plans, respond to patients, and keep recovery on track.": "راجع الخطط المقترحة، واستجب للمرضى، وحافظ على مسار التعافي."
  ,"+4 this month": "+4 هذا الشهر"
  ,"75% active": "75% نشطون"
  ,"3 high priority": "3 بأولوية عالية"
  ,"7 plans are waiting for your clinical review before patients can begin.": "هناك 7 خطط تنتظر مراجعتك السريرية قبل أن يبدأ المرضى."
  ,"Lower back mobility": "حركة أسفل الظهر"
  ,"Neck tension release": "تخفيف شد الرقبة"
  ,"Posture correction": "تصحيح وضعية الجسم"
  ,"Across active plans": "عبر الخطط النشطة"
  ,"This month": "هذا الشهر"
  ,"To patient messages": "للرد على رسائل المرضى"
  ,"Lower back pain": "ألم أسفل الظهر"
  ,"Neck stiffness": "تيبس الرقبة"
  ,"Shoulder mobility": "حركة الكتف"
  ,"Modified": "معدلة"
  ,"Review care plans, progress, and patient commitment in one place.": "راجع خطط الرعاية والتقدم والتزام المرضى في مكان واحد."
  ,"Age 28 · Pain level 4/10": "العمر 28 · درجة الألم 4/10"
  ,"AI suggested": "اقتراح ذكي"
  ,"Gentle lower back mobility": "حركة لطيفة لأسفل الظهر"
  ,"Low-impact mobility focused on reducing tension related to prolonged sitting. Avoid loaded spinal flexion.": "تمارين حركة خفيفة لتقليل الشد الناتج عن الجلوس الطويل، مع تجنب ثني العمود الفقري تحت حمل."
  ,"Add exercise": "إضافة تمرين"
  ,"Add clinical notes or guidance...": "أضف ملاحظات أو إرشادات سريرية..."
  ,"Weekly commitment": "الالتزام الأسبوعي"
  ,"Plan completion": "إكمال الخطة"
  ,"Mobility confidence": "الثقة بالحركة"
  ,"Recommend a real medical evaluation when symptoms need closer assessment.": "أوصِ بتقييم طبي حضوري عندما تحتاج الأعراض إلى فحص أدق."
  ,"Monitor the health of the platform, payments, users, and reward requests.": "تابع أداء المنصة والمدفوعات والمستخدمين وطلبات المكافآت."
  ,"8 pending": "8 قيد الانتظار"
  ,"All core frontend prototype systems are operational.": "جميع أنظمة النموذج الأولي للواجهة تعمل."
  ,"Authentication UI": "واجهة المصادقة"
  ,"Payment gateway": "بوابة الدفع"
  ,"Refund processing": "معالجة الاسترداد"
  ,"Ready": "جاهز"
  ,"Placeholder": "تجريبي"
  ,"61 awaiting review": "61 بانتظار المراجعة"
  ,"Neck release": "إرخاء الرقبة"
  ,"Neck & shoulders": "الرقبة والكتفان"
  ,"Shoulder rolls": "تدوير الكتفين"
  ,"Upper back": "أعلى الظهر"
  ,"Cat-cow stretch": "تمرين القطة والبقرة"
  ,"Spine mobility": "مرونة العمود الفقري"
  ,"Lower back": "أسفل الظهر"
  ,"Posture reset": "إعادة ضبط الوضعية"
  ,"Full posture": "وضعية الجسم كاملة"
  ,"4 min": "4 دقائق"
  ,"3 min": "3 دقائق"
  ,"6 min": "6 دقائق"
  ,"7 min": "7 دقائق"
  ,"5 min": "5 دقائق"
  ,"Mon": "الإثنين"
  ,"Tue": "الثلاثاء"
  ,"Wed": "الأربعاء"
  ,"Thu": "الخميس"
  ,"Fri": "الجمعة"
  ,"Sat": "السبت"
  ,"Sun": "الأحد"
  ,"A calm guided intake turns your answers into a suggested care path.": "تقييم هادئ وموجّه يحول إجاباتك إلى مسار رعاية مقترح."
  ,"Therapeutic sessions shaped around your needs and available time.": "جلسات علاجية مصممة وفق احتياجاتك ووقتك المتاح."
  ,"Your clinician can approve, improve, and follow up on every plan.": "يمكن لطبيبك اعتماد كل خطة وتحسينها ومتابعتها."
  ,"Earn points, protect your streak, and unlock meaningful milestones.": "اكسب النقاط وحافظ على التزامك وافتح مراحل ذات قيمة."
  ,"Consistent progress can unlock a partial subscription refund.": "يمكن للتقدم المستمر أن يفتح استردادًا جزئيًا للاشتراك."
  ,"Clear trends show how your consistency and mobility improve over time.": "توضح المؤشرات كيف يتحسن التزامك وحركتك مع الوقت."
  ,"RemedyQuest provides general therapeutic exercise guidance and supports doctor follow-up. It does not replace an examination by a doctor or physical therapist.": "تقدم RemedyQuest إرشادات عامة للتمارين العلاجية وتدعم متابعة الطبيب، ولا تغني عن الفحص لدى طبيب أو أخصائي علاج طبيعي."
  ,"Card or banking information is never stored in RemedyQuest. Payment will be processed by a provider such as Stripe or PayPal.": "لا يتم تخزين بيانات البطاقة أو المعلومات البنكية داخل RemedyQuest، وستتم معالجة الدفع عبر مزود مثل Stripe أو PayPal."
  ,"I agree to the terms and understand that RemedyQuest does not replace professional medical advice.": "أوافق على الشروط وأفهم أن RemedyQuest لا تغني عن الاستشارة الطبية المتخصصة."
  ,"you@example.com": "you@example.com"
  ,"Your full name": "اسمك الكامل"
  ,"At least 8 characters": "8 أحرف على الأقل"
  ,"License number": "رقم الترخيص"
  ,"Physiotherapy": "العلاج الطبيعي"
  ,"Joint pain": "ألم المفاصل"
  ,"15 minutes": "15 دقيقة"
  ,"20 minutes": "20 دقيقة"
  ,"25 minutes": "25 دقيقة"
  ,"30 minutes": "30 دقيقة"
  ,"40 minutes": "40 دقيقة"
  ,"RemedyQuest Health-Tech Platform": "منصة RemedyQuest للتقنيات الصحية"
  ,"Hi Maya. I am your RemedyQuest assistant. What is bothering you today?": "مرحبًا مايا، أنا مساعد RemedyQuest. ما المشكلة التي تزعجك اليوم؟"
  ,"My lower back feels tight after sitting at work.": "أشعر بشد في أسفل ظهري بعد الجلوس في العمل."
  ,"I can help shape a gentle mobility plan. How strong is the discomfort from 1 to 10?": "يمكنني مساعدتك في إعداد خطة حركة لطيفة. ما شدة الألم من 1 إلى 10؟"
  ,"Around 4, mostly by the end of the day.": "حوالي 4، وغالبًا في نهاية اليوم."
  ,"Thanks. Based on your answers, I suggest a 25-minute low-impact mobility plan. A doctor will review it before it becomes active.": "شكرًا. بناءً على إجاباتك، أقترح خطة حركة خفيفة لمدة 25 دقيقة، وسيراجعها الطبيب قبل تفعيلها."
  ,"Remy · Health Assistant": "ريمي · المساعد الصحي"
  ,"Gentle mobility": "تمارين حركة لطيفة"
  ,"5 daily": "5 يوميًا"
  ,"5 ILS refund": "استرداد 5 شيكل"
  ,"40 ILS": "40 شيكل"
  ,"35 ILS": "35 شيكل"
  ,"5 ILS": "5 شيكل"
  ,"10 ILS": "10 شيكل"
  ,"15 pts": "15 نقطة"
  ,"40 pts": "40 نقطة"
  ,"75 pts": "75 نقطة"
  ,"100 pts": "100 نقطة"
  ,"150 pts": "150 نقطة"
  ,"2 of 5 exercises complete": "اكتمل تمرينان من 5"
  ,"+5 points each": "+5 نقاط لكل تمرين"
  ,"3 patients": "3 مرضى"
  ,"2 patients": "مريضان"
  ,"+12.4% this month": "+12.4% هذا الشهر"
  ,"Level 1": "المرحلة 1"
  ,"Level 2": "المرحلة 2"
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
    <button data-no-translate type="button" onClick={toggleLanguage} aria-label="Switch language" className="language-toggle group inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-2.5 py-2 text-xs font-extrabold text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-card">
      <span className="grid h-7 min-w-7 place-items-center rounded-xl bg-ink px-1.5 text-[10px] text-white transition group-hover:bg-teal-600">{language === "en" ? "ع" : "EN"}</span>
      {!compact && <span className="pe-1">{language === "en" ? "العربية" : "English"}</span>}
    </button>
  );
}
