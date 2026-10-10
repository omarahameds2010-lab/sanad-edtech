export type Lang = "ar" | "en";

export interface Dict {
  header: { courses: string; teachers: string; how: string; sanad: string; faq: string; login: string; menuOpen: string; menuClose: string };
  hero: {
    eyebrow: string;
    titleA: string;
    titleB: string;
    lead: string;
    ctaCourses: string;
    ctaTeachers: string;
    footnote: string;
  };
  journey: {
    eyebrow: string;
    nodes: { id: string; label: string; title: string; body: string; cta: string; href: string }[];
  };
  values: { title: string; cards: { title: string; body: string }[] };
  teacherSpaces: {
    eyebrow: string;
    title: string;
    lead: string;
    all: string;
    previewNote: string;
    enter: string;
    teachers: { slug: string; subject: string; name: string; focus: string; tagline: string; motif: "orbit" | "grid" | "ink"; accent: string; accentSoft: string }[];
  };
  subjects: {
    eyebrow: string;
    title: string;
    lead: string;
    cta: string;
    list: { name: string; tagline: string; accent: string; accentSoft: string; letter: string }[];
  };
  how: {
    eyebrow: string;
    title: string;
    noteTitle: string;
    noteBody: string;
    steps: { index: string; title: string; body: string }[];
  };
  lab: {
    eyebrow: string;
    title: string;
    leadPrefix: string;
    leadStrong: string;
    leadSuffix: string;
    step1: string;
    question: string;
    step2: string;
    illustrative: string;
    answerTitle: string;
    scoreTitle: string;
    tapHint: string;
    gapTitle: string;
    nextTitle: string;
    step3: string;
    placeholder: string;
    loginHintA: string;
    loginHintB: string;
    loginHintC: string;
    disclaimer: string;
    samples: {
      id: string;
      label: string;
      answer: { id: string; text: string }[];
      criteria: { id: string; title: string; max: number; score: number; status: "supported" | "partial" | "missing"; statusLabel: string; note: string; evidenceIds: string[] }[];
      total: number;
      gap: string;
      next: string;
    }[];
  };
  integrity: {
    eyebrow: string;
    title: string;
    lead: string;
    examDefault: string;
    examUnit: string;
    assignDefault: string;
    assignUnit: string;
    reviewTitle: string;
    reviewBody: string;
    recordTitle: string;
    recordBody: string;
  };
  forTeachers: {
    eyebrow: string;
    title: string;
    points: string[];
    cta: string;
    panelA: string;
    panelB: string;
  };
  faq: { eyebrow: string; title: string; contact: string; list: { q: string; a: string }[] };
  cta: { title: string; body: string; courses: string; login: string };
  login: {
    title: string;
    subtitle: string;
    phone: string;
    password: string;
    show: string;
    hide: string;
    submit: string;
    pending: string;
    back: string;
    invalid: string;
    offline: string;
    brandLines: { strong: string; rest: string }[];
  };
  footer: { courses: string; teachers: string; login: string; tagline: string };
}

export const dict: Record<Lang, Dict> = {
  ar: {
    header: { courses: "الكورسات", teachers: "المدرسون", how: "كيف تعمل سند", sanad: "SANAD", faq: "الأسئلة الشائعة", login: "دخول", menuOpen: "فتح القائمة", menuClose: "إغلاق القائمة" },
    hero: {
      eyebrow: "منصة تعليمية لطلاب الثانوية العامة المصرية",
      titleA: "دروسك. واجباتك. اختباراتك.",
      titleB: "كلّها في مسار واحد.",
      lead: "تعلّم مع مدرسك، وقدّم إجاباتك في الوقت المحدد، وتابع رحلتك الدراسية من مكان واحد. ومع SANAD، يحصل المعلم على تقييم ذكي مقترح للإجابات المفتوحة، يراجعه قبل اعتماد الدرجة النهائية.",
      ctaCourses: "استكشف الكورسات",
      ctaTeachers: "تعرّف على المدرسين",
      footnote: "مساحة تعليمية واضحة · مؤقتات تُدار من الخادم · مراجعة بشرية للتقييم",
    },
    journey: {
      eyebrow: "خريطة التعلم — اضغط على أي مرحلة",
      nodes: [
        { id: "course", label: "الكورس", title: "اختر كورسك", body: "مساحة مدرس واحد تجمع كل شيء: الدروس والواجبات والاختبارات والتقييم — بهوية المدرس نفسه.", cta: "تصفح الكورسات", href: "/courses" },
        { id: "lesson", label: "الدرس", title: "ادرس الدرس", body: "شرح منظم بالعربية. تنتهي من الدرس فتجد الواجب بانتظارك — المسار يقودك دون حيرة.", cta: "ابدأ من الكورسات", href: "/courses" },
        { id: "assignment", label: "الواجب", title: "قدّم الواجب · ٣٠٠ دقيقة", body: "لحظة الدخول يبدأ مؤقت الخادم: ٣٠٠ دقيقة. ودخولك وحده يفتح لك الاختبار — لا شرط درجة.", cta: "سجّل الدخول للتجربة", href: "/login" },
        { id: "exam", label: "الاختبار", title: "اختبر نفسك · ٧٠ دقيقة", body: "ضغط الوقت الحقيقي: ٧٠ دقيقة بمؤقت لا يتصفّر بالتحديث. ودخولك يفتح الدرس التالي.", cta: "سجّل الدخول للتجربة", href: "/login" },
        { id: "evaluation", label: "التقييم", title: "افهم نتيجتك مع SANAD", body: "تقييم مقترح منظم: درجة لكل معيار وأدلة وفجوة معرفية وخطوة تالية — يعتمدها مدرسك.", cta: "جرّب معمل SANAD", href: "/#sanad" },
      ],
    },
    values: {
      title: "تعلّم بوضوح. وتقدّم خطوة بخطوة.",
      cards: [
        { title: "وقت محدد لكل مهمة", body: "مؤقت الواجب والاختبار يُحتسب من الخادم، حتى لا تؤدي إعادة تحميل الصفحة وحدها إلى إعادة الوقت من البداية." },
        { title: "مسار تعليمي منظّم", body: "اعرف ما عليك إنجازه، ومتى ينتقل بك المسار إلى الخطوة التالية، دون تعقيد غير ضروري." },
        { title: "تقييم قابل للمراجعة", body: "يساعد SANAD في تحليل الإجابات المفتوحة واقتراح الملاحظات. ويظل اعتماد الدرجة النهائية من اختصاص المعلم." },
      ],
    },
    teacherSpaces: {
      eyebrow: "مساحات المدرسين",
      title: "اختر مدرسك. وابدأ من مساحته التعليمية.",
      lead: "لكل مدرس أسلوبه في الشرح وطريقته في تنظيم المحتوى. بدّل بين المدرسين وشاهد كيف تتغير هوية البطاقة — بينما يبقى النظام الأساسي واحدا. هذه معاينة للهوية فقط؛ المحتوى الحقيقي داخل كل مساحة.",
      all: "اكتشف جميع المدرسين",
      previewNote: "معاينة للهوية فقط؛ المحتوى الحقيقي داخل كل مساحة.",
      enter: "استكشف المساحة التعليمية",
      teachers: [
        { slug: "ahmed-physics", subject: "الفيزياء", name: "دكتور أحمد", focus: "ميكانيكا · موجات · كهرباء", tagline: "اربط المفاهيم بالقوانين، واختبر فهمك بالمسائل.", motif: "orbit", accent: "#0891B2", accentSoft: "#ecfeff" },
        { slug: "mona-arabic", subject: "اللغة العربية", name: "أستاذة منى", focus: "بلاغة · نحو · أدب", tagline: "الحرف هو العمل الفني: بلاغة ونحو وأدب.", motif: "ink", accent: "#047857", accentSoft: "#ecfdf5" },
        { slug: "khaled-math", subject: "الرياضيات", name: "مهندس خالد", focus: "جبر · هندسة · تفاضل", tagline: "افهم العلاقات، وتدرّب على الحل خطوة بخطوة.", motif: "grid", accent: "#4F46E5", accentSoft: "#eef2ff" },
      ],
    },
    subjects: {
      eyebrow: "المواد الدراسية",
      title: "اختر المادة التي تريد أن تتقدّم فيها.",
      lead: "ست مواد دراسية، لكل منها محتواها وطريقتها في العرض، ضمن تجربة تعليمية واحدة.",
      cta: "استكشف المواد والكورسات",
      list: [
        { name: "الرياضيات", tagline: "افهم العلاقات، وتدرّب على الحل، وتتبّع خطواتك.", accent: "#4F46E5", accentSoft: "#eef2ff", letter: "π" },
        { name: "الفيزياء", tagline: "اربط المفاهيم بالقوانين، واختبر فهمك بالمسائل.", accent: "#0891B2", accentSoft: "#ecfeff", letter: "λ" },
        { name: "اللغة العربية", tagline: "تدرّب على النحو والبلاغة والأدب، وراجع مواضع التحسين في إجاباتك.", accent: "#047857", accentSoft: "#ecfdf5", letter: "ع" },
        { name: "اللغة الإنجليزية", tagline: "طوّر فهمك للقواعد والتعبير، وتدرّب على تطبيق ما تتعلمه.", accent: "#B45309", accentSoft: "#fffbeb", letter: "A" },
        { name: "الكيمياء", tagline: "نظّم مفاهيمك، وافهم العلاقات بين التفاعلات والقوانين.", accent: "#0F766E", accentSoft: "#f0fdfa", letter: "⚛" },
        { name: "علوم الحاسب", tagline: "طوّر فهمك للمنطق والبرمجة وحل المشكلات.", accent: "#4D7C0F", accentSoft: "#f7fee7", letter: "{;}" },
      ],
    },
    how: {
      eyebrow: "كيف تعمل المنصة",
      title: "من أول درس إلى الخطوة التالية.",
      noteTitle: "كيف يعمل مسار التقدّم؟",
      noteBody: "دخول الواجب يفتح الاختبار، ودخول الاختبار يفتح الدرس التالي. يعتمد هذا المسار على الدخول والممارسة، لا على اجتياز درجة محددة.",
      steps: [
        { index: "٠١", title: "اختر كورسك", body: "اشترك في الكورس الذي يناسبك، وادخل إلى الدروس والواجبات والاختبارات المتاحة ضمنه." },
        { index: "٠٢", title: "ادرس وتدرّب", body: "ابدأ الدرس، ثم انتقل إلى الواجب والاختبار وفق المسار التعليمي المحدد." },
        { index: "٠٣", title: "أجب في الوقت المحدد", body: "مدة الواجب ٣٠٠ دقيقة، ومدة الاختبار ٧٠ دقيقة. الخادم يحتفظ بالوقت المرجعي للمحاولة." },
        { index: "٠٤", title: "راجع تقييمك وتقدّم", body: "استفد من الملاحظات وراجع ما تحتاج إلى تحسينه مع مدرسك — ودخولك يفتح خطوتك التالية." },
      ],
    },
    lab: {
      eyebrow: "SANAD · التقييم الذكي للإجابات المفتوحة",
      title: "الدرجة وحدها لا تشرح أين تحتاج إلى التحسين.",
      leadPrefix: "SANAD يساعد المعلم على تحليل إجابات الطلاب باللغة العربية في ضوء السؤال ومعايير التصحيح. جرّب بنفسك أدناه على ",
      leadStrong: "مثال توضيحي",
      leadSuffix: " — وليس تقييما حيا. التقييم الحي يعمل داخل حسابك على إجاباتك الفعلية.",
      step1: "الخطوة الأولى: السؤال",
      question: "استخرج المفعول المطلق من الجملة وبيّن نوعه: «اجتهد الطالب اجتهادًا كبيرًا».",
      step2: "الخطوة الثانية: اختر إجابة لاستكشاف تقييمها",
      illustrative: "إجابة الطالب (مثال توضيحي)",
      answerTitle: "إجابة الطالب (مثال توضيحي)",
      scoreTitle: "الدرجة المقترحة",
      tapHint: "اضغط على أي معيار لإضاءة دليله داخل الإجابة.",
      gapTitle: "الفجوة المعرفية",
      nextTitle: "الخطوة التالية المقترحة",
      step3: "الخطوة الثالثة: جرّب إجابتك أنت",
      placeholder: "اكتب إجابتك هنا…",
      loginHintA: "التقييم الحي يعمل على إجاباتك داخل حسابك فقط — ",
      loginHintB: "سجّل الدخول",
      loginHintC: " وادخل أي واجب لتجربة SANAD الحقيقي.",
      disclaimer: "المثالان أعلاه توضيحيان لشرح شكل المخرجات. الدرجة والملاحظات المقترحة تخضع دائما لمراجعة المعلم قبل اعتماد الدرجة النهائية.",
      samples: [
        {
          id: "strong",
          label: "إجابة قوية",
          answer: [
            { id: "s1", text: "المفعول المطلق هو كلمة (اجتهادًا)، " },
            { id: "s2", text: "وهو منصوب وعلامة نصبه الفتحة، " },
            { id: "s3", text: "ونوعه مبيّن للنوع لأنه موصوف بكلمة (كبيرًا)." },
          ],
          criteria: [
            { id: "c1", title: "استخراج الكلمة الصحيحة", max: 30, score: 30, status: "supported", statusLabel: "دليل مؤيد", note: "استخرج (اجتهادًا) بدقة دون خلط بباقي عناصر الجملة.", evidenceIds: ["s1"] },
            { id: "c2", title: "الضبط الإعرابي", max: 30, score: 25, status: "partial", statusLabel: "دعم جزئي", note: "ذكر النصب والعلامة، لكنه لم يذكر أن المفعول المطلق مصدر منصوب دائمًا.", evidenceIds: ["s2"] },
            { id: "c3", title: "بيان النوع مع الدليل", max: 40, score: 27, status: "supported", statusLabel: "دليل مؤيد", note: "حدد النوع (مبيّن للنوع) واستشهد بالوصف (كبيرًا) كدليل.", evidenceIds: ["s3"] },
          ],
          total: 82,
          gap: "تعميق القاعدة: لماذا يلازم المفعول المطلق النصب.",
          next: "مراجعة درس المفعول المطلق وحل تدريبات إضافية.",
        },
        {
          id: "weak",
          label: "إجابة متعثرة",
          answer: [
            { id: "w1", text: "المفعول المطلق هو (الطالب) " },
            { id: "w2", text: "لأنه هو الذي اجتهد." },
          ],
          criteria: [
            { id: "c1", title: "استخراج الكلمة الصحيحة", max: 30, score: 0, status: "missing", statusLabel: "غير موجود في الإجابة", note: "(الطالب) فاعل وليس مفعولًا مطلقًا. لا يوجد دليل داعم في الإجابة.", evidenceIds: [] },
            { id: "c2", title: "الضبط الإعرابي", max: 30, score: 8, status: "partial", statusLabel: "دعم جزئي", note: "محاولة تعليل لكنها مبنية على استخراج خاطئ من الأساس.", evidenceIds: ["w2"] },
            { id: "c3", title: "بيان النوع مع الدليل", max: 40, score: 4, status: "missing", statusLabel: "غير موجود في الإجابة", note: "لم يذكر النوع ولا دليله إطلاقًا.", evidenceIds: [] },
          ],
          total: 12,
          gap: "الخلط بين الفاعل والمفعول المطلق: يحتاج إعادة تأسيس من تعريف المصدر.",
          next: "إعادة درس عناصر الجملة من البداية قبل المفعول المطلق.",
        },
      ],
    },
    integrity: {
      eyebrow: "نزاهة الاختبارات",
      title: "وقت الاختبار محسوب. ومسار التقييم واضح.",
      lead: "تجربة الاختبار لا ينبغي أن تعتمد على مؤقت يعمل داخل المتصفح وحده. لذلك تحتسب المنصة وقت المحاولة من الخادم، وفق قواعد الاختبار المحددة.",
      examDefault: "المدة الافتراضية للاختبار.",
      examUnit: "دقيقة",
      assignDefault: "المدة الافتراضية للواجب.",
      assignUnit: "دقيقة",
      reviewTitle: "تقييم قابل للمراجعة",
      reviewBody: "يستطيع المعلم مراجعة التقييم المقترح قبل اعتماد الدرجة النهائية.",
      recordTitle: "سجل للقرارات",
      recordBody: "يهدف سجل التقييم والمراجعات إلى توضيح كيفية الوصول إلى النتيجة ومن اعتمدها.",
    },
    forTeachers: {
      eyebrow: "للمدرسين",
      title: "ركّز على التدريس. واترك للمنصة تنظيم الرحلة.",
      points: [
        "نظّم الكورسات والدروس والواجبات والاختبارات داخل مساحة تحمل هويتك ومحتواك.",
        "راجع الإجابات المفتوحة على مستوى معايير التصحيح بدلًا من البدء من الصفر في كل مرة.",
        "اعتمد الدرجة النهائية بنفسك — التقييم المقترح مساعد، والقرار لك.",
      ],
      cta: "تعرّف على تجربة المدرس",
      panelA: "مساحتك تحمل هويتك.",
      panelB: "والنظام الأساسي واحد.",
    },
    faq: {
      eyebrow: "الأسئلة الشائعة",
      title: "كل ما يسأله أولياء الأمور",
      contact: "لديك سؤال آخر؟ قنوات التواصل الرسمية ستُعلن مع الإطلاق.",
      list: [
        { q: "هل سند مخصصة لطلاب الثانوية العامة المصرية؟", a: "تستهدف التجربة التعليمية طلاب الثانوية العامة المصرية، مع محتوى ومساحات تعليمية ينظمها المدرسون المشاركون في المنصة." },
        { q: "كيف يعمل مؤقت الاختبار؟", a: "تُحدّد مدة المحاولة، ويُحتسب الوقت المرجعي من الخادم. إعادة تحميل الصفحة لا تعيد المؤقت إلى البداية." },
        { q: "هل يستطيع SANAD اعتماد الدرجة النهائية؟", a: "لا. يقدم SANAD تقييمًا مقترحًا، بينما تظل مراجعة التقييم واعتماد الدرجة النهائية من اختصاص المعلم." },
        { q: "ماذا يحدث إذا انقطع الإنترنت أثناء المحاولة؟", a: "تُطبّق قواعد حفظ الإجابات واستعادة المحاولة بحسب ما يدعمه النظام. يجب توضيح سياسة الاستئناف والحفظ الفعلية الخاصة بكل نوع من المحاولات قبل بدء الاختبار." },
        { q: "كيف يتم الدفع؟", a: "تظهر وسائل الدفع المتاحة للكورس داخل صفحة الاشتراك قبل تأكيد العملية. تختلف الخيارات بحسب وسائل الدفع المفعّلة فعليًا." },
        { q: "كيف تتعامل سند مع بيانات الطلاب؟", a: "تستخدم المنصة ضوابط للوصول إلى بياناتها وفق صلاحيات المستخدم وسياق المساحة التعليمية. راجع سياسة الخصوصية لمعرفة تفاصيل استخدام البيانات والاحتفاظ بها." },
      ],
    },
    cta: { title: "خطوتك التالية تبدأ من هنا.", body: "اختر مدرسك، واستكشف الكورسات المتاحة، وابدأ رحلة تعليمية منظّمة تساعدك على معرفة ما أنجزته وما تحتاج إلى تعلّمه بعد ذلك.", courses: "استكشف الكورسات", login: "تسجيل الدخول" },
    login: {
      title: "تسجيل الدخول",
      subtitle: "ادخل برقم الموبايل وكلمة السر الخاصة بحسابك",
      phone: "رقم الموبايل",
      password: "كلمة السر",
      show: "إظهار كلمة السر",
      hide: "إخفاء كلمة السر",
      submit: "دخول",
      pending: "جاري الدخول…",
      back: "العودة للصفحة الرئيسية",
      invalid: "بيانات الدخول غير صحيحة",
      offline: "تعذر الاتصال بالخادم",
      brandLines: [
        { strong: "مسار واحد", rest: " من الدرس إلى التقييم." },
        { strong: "مؤقتات عادلة", rest: " تُدار من الخادم." },
        { strong: "وتقييم ذكي", rest: " يراجعه مدرسك البشري." },
      ],
    },
    footer: { courses: "الكورسات", teachers: "المدرسون", login: "دخول", tagline: "مساحة تعليمية واضحة لكل خطوة." },
  },

  en: {
    header: { courses: "Courses", teachers: "Teachers", how: "How Sanad works", sanad: "SANAD", faq: "FAQ", login: "Log in", menuOpen: "Open menu", menuClose: "Close menu" },
    hero: {
      eyebrow: "A learning platform for Egyptian Thanaweya Amma students",
      titleA: "Your lessons. Your assignments. Your exams.",
      titleB: "All in one path.",
      lead: "Learn with your teacher, submit your answers on time, and follow your study journey from one place. With SANAD, teachers get a smart suggested evaluation for open answers — reviewed before any final grade.",
      ctaCourses: "Explore courses",
      ctaTeachers: "Meet the teachers",
      footnote: "A clear learning space · Server-managed timers · Human-reviewed evaluation",
    },
    journey: {
      eyebrow: "Learning map — tap any stage",
      nodes: [
        { id: "course", label: "Course", title: "Pick your course", body: "One teacher's space holding everything: lessons, assignments, exams and evaluation — in that teacher's own identity.", cta: "Browse courses", href: "/courses" },
        { id: "lesson", label: "Lesson", title: "Study the lesson", body: "Structured Arabic explanations. Finish the lesson and the assignment is waiting — the path guides you.", cta: "Start from courses", href: "/courses" },
        { id: "assignment", label: "Assignment", title: "Submit · 300 minutes", body: "The server timer starts the moment you enter: 300 minutes. Entering alone unlocks the exam — no grade gate.", cta: "Log in to try", href: "/login" },
        { id: "exam", label: "Exam", title: "Test yourself · 70 minutes", body: "Real time pressure: 70 minutes on a timer that survives refresh. Entering unlocks the next lesson.", cta: "Log in to try", href: "/login" },
        { id: "evaluation", label: "Evaluation", title: "Understand your result with SANAD", body: "A structured suggested evaluation: per-criterion scores, evidence, knowledge gap and next step — approved by your teacher.", cta: "Try the SANAD lab", href: "/#sanad" },
      ],
    },
    values: {
      title: "Learn with clarity. Progress step by step.",
      cards: [
        { title: "A fixed time for every task", body: "Assignment and exam timers are computed on the server, so reloading the page alone never restarts your time." },
        { title: "An organized learning path", body: "Know what to do next and when the path moves you forward — with no unnecessary complexity." },
        { title: "Reviewable evaluation", body: "SANAD helps analyze open answers and suggest feedback. Approving the final grade stays the teacher's job." },
      ],
    },
    teacherSpaces: {
      eyebrow: "Teacher spaces",
      title: "Pick your teacher. Start from their space.",
      lead: "Every teacher has their own explanation style and way of organizing content. Switch between teachers and watch the card identity change — while the underlying system stays one. Identity preview only; real content lives inside each space.",
      all: "Discover all teachers",
      previewNote: "Identity preview only; real content lives inside each space.",
      enter: "Explore the teaching space",
      teachers: [
        { slug: "ahmed-physics", subject: "Physics", name: "Dr. Ahmed", focus: "Mechanics · Waves · Electricity", tagline: "Connect concepts to laws, and test your understanding with problems.", motif: "orbit", accent: "#0891B2", accentSoft: "#ecfeff" },
        { slug: "mona-arabic", subject: "Arabic", name: "Ms. Mona", focus: "Rhetoric · Grammar · Literature", tagline: "The letterform is the artwork: rhetoric, grammar and literature.", motif: "ink", accent: "#047857", accentSoft: "#ecfdf5" },
        { slug: "khaled-math", subject: "Mathematics", name: "Eng. Khaled", focus: "Algebra · Geometry · Calculus", tagline: "Understand relationships, and practice solving step by step.", motif: "grid", accent: "#4F46E5", accentSoft: "#eef2ff" },
      ],
    },
    subjects: {
      eyebrow: "Subjects",
      title: "Pick the subject you want to advance in.",
      lead: "Six school subjects, each with its own content and presentation style, inside one learning experience.",
      cta: "Explore subjects and courses",
      list: [
        { name: "Mathematics", tagline: "Understand relationships, practice solving, track your steps.", accent: "#4F46E5", accentSoft: "#eef2ff", letter: "π" },
        { name: "Physics", tagline: "Connect concepts to laws, and test yourself with problems.", accent: "#0891B2", accentSoft: "#ecfeff", letter: "λ" },
        { name: "Arabic", tagline: "Practice grammar, rhetoric and literature — and review your answers.", accent: "#047857", accentSoft: "#ecfdf5", letter: "ع" },
        { name: "English", tagline: "Grow your grammar and expression, and apply what you learn.", accent: "#B45309", accentSoft: "#fffbeb", letter: "A" },
        { name: "Chemistry", tagline: "Organize your concepts and understand reactions and laws.", accent: "#0F766E", accentSoft: "#f0fdfa", letter: "⚛" },
        { name: "Computer Science", tagline: "Grow your logic, programming and problem-solving.", accent: "#4D7C0F", accentSoft: "#f7fee7", letter: "{;}" },
      ],
    },
    how: {
      eyebrow: "How the platform works",
      title: "From your first lesson to the next step.",
      noteTitle: "How does the progress path work?",
      noteBody: "Entering an assignment unlocks the exam; entering the exam unlocks the next lesson. This path runs on entry and practice — not on passing a grade threshold.",
      steps: [
        { index: "01", title: "Pick your course", body: "Enroll in the course that fits you, and access its lessons, assignments and exams." },
        { index: "02", title: "Study and practice", body: "Start the lesson, then move to the assignment and exam along the set learning path." },
        { index: "03", title: "Answer on time", body: "Assignments run 300 minutes, exams 70. The server keeps the attempt's reference time." },
        { index: "04", title: "Review and advance", body: "Use the feedback, review what needs work with your teacher — and your entry unlocks your next step." },
      ],
    },
    lab: {
      eyebrow: "SANAD · Smart evaluation for open answers",
      title: "A score alone never explains what to fix.",
      leadPrefix: "SANAD helps teachers analyze student answers in Arabic against the question and rubrics. Try it below on an ",
      leadStrong: "illustrative example",
      leadSuffix: " — not a live evaluation. Live evaluation runs inside your account on your real answers.",
      step1: "Step one: the question",
      question: "Extract the absolute object (al-maf‘ul al-mutlaq) and state its type: «The student studied hard (ijtihādan kabīran)» — Arabic grammar demo, answers stay in Arabic.",
      step2: "Step two: pick an answer to explore its evaluation",
      illustrative: "Student answer (illustrative example)",
      answerTitle: "Student answer (illustrative example)",
      scoreTitle: "Suggested score",
      tapHint: "Tap any criterion to light its evidence inside the answer.",
      gapTitle: "Knowledge gap",
      nextTitle: "Suggested next step",
      step3: "Step three: try your own answer",
      placeholder: "Write your answer here…",
      loginHintA: "Live evaluation only runs on your answers inside your account — ",
      loginHintB: "log in",
      loginHintC: " and enter any assignment to try the real SANAD.",
      disclaimer: "Both examples above only illustrate the output shape. Suggested scores and notes are always reviewed by the teacher before any final grade.",
      samples: [
        {
          id: "strong",
          label: "Strong answer",
          answer: [
            { id: "s1", text: "المفعول المطلق هو كلمة (اجتهادًا)، " },
            { id: "s2", text: "وهو منصوب وعلامة نصبه الفتحة، " },
            { id: "s3", text: "ونوعه مبيّن للنوع لأنه موصوف بكلمة (كبيرًا)." },
          ],
          criteria: [
            { id: "c1", title: "Extracting the right word", max: 30, score: 30, status: "supported", statusLabel: "Supporting evidence", note: "Extracted (ijtihādan) precisely, without mixing sentence elements.", evidenceIds: ["s1"] },
            { id: "c2", title: "Grammatical inflection", max: 30, score: 25, status: "partial", statusLabel: "Partial support", note: "Mentioned the accusative case and mark, but not that the absolute object is always accusative.", evidenceIds: ["s2"] },
            { id: "c3", title: "Stating the type with proof", max: 40, score: 27, status: "supported", statusLabel: "Supporting evidence", note: "Named the type and cited the adjective (kabīran) as proof.", evidenceIds: ["s3"] },
          ],
          total: 82,
          gap: "Deepening the rule: why the absolute object is always accusative.",
          next: "Review the absolute-object lesson and solve extra drills.",
        },
        {
          id: "weak",
          label: "Struggling answer",
          answer: [
            { id: "w1", text: "المفعول المطلق هو (الطالب) " },
            { id: "w2", text: "لأنه هو الذي اجتهد." },
          ],
          criteria: [
            { id: "c1", title: "Extracting the right word", max: 30, score: 0, status: "missing", statusLabel: "Absent from the answer", note: "(The student) is the subject, not the absolute object. No supporting evidence.", evidenceIds: [] },
            { id: "c2", title: "Grammatical inflection", max: 30, score: 8, status: "partial", statusLabel: "Partial support", note: "An attempted justification, but built on a wrong extraction.", evidenceIds: ["w2"] },
            { id: "c3", title: "Stating the type with proof", max: 40, score: 4, status: "missing", statusLabel: "Absent from the answer", note: "Neither the type nor its proof was mentioned at all.", evidenceIds: [] },
          ],
          total: 12,
          gap: "Confusing subject with absolute object: needs rebuilding from the definition.",
          next: "Re-study sentence elements from the start before the absolute object.",
        },
      ],
    },
    integrity: {
      eyebrow: "Exam integrity",
      title: "Exam time is accounted for. And the evaluation path is clear.",
      lead: "An exam experience should never depend on a timer running in the browser alone. So the platform computes attempt time on the server, under the exam's set rules.",
      examDefault: "The default exam duration.",
      examUnit: "minutes",
      assignDefault: "The default assignment duration.",
      assignUnit: "minutes",
      reviewTitle: "Reviewable evaluation",
      reviewBody: "Teachers can review the suggested evaluation before approving the final grade.",
      recordTitle: "A record of decisions",
      recordBody: "The evaluation and review log aims to show how each result was reached — and who approved it.",
    },
    forTeachers: {
      eyebrow: "For teachers",
      title: "Focus on teaching. Leave the journey to the platform.",
      points: [
        "Organize courses, lessons, assignments and exams inside a space carrying your identity and content.",
        "Review open answers at rubric level instead of starting from zero every time.",
        "Approve the final grade yourself — the suggestion assists, the decision is yours.",
      ],
      cta: "Discover the teacher experience",
      panelA: "Your space carries your identity.",
      panelB: "And the core system is one.",
    },
    faq: {
      eyebrow: "FAQ",
      title: "Everything parents ask",
      contact: "Still curious? Official support channels will be announced at launch.",
      list: [
        { q: "Is Sanad built for Thanaweya Amma students?", a: "The learning experience targets Egyptian Thanaweya Amma students, with content and spaces organized by the platform's teachers." },
        { q: "How does the exam timer work?", a: "The attempt duration is set, and its reference time is computed on the server. Reloading the page never restarts the timer." },
        { q: "Can SANAD approve the final grade?", a: "No. SANAD offers a suggested evaluation; reviewing it and approving the final grade stays the teacher's job." },
        { q: "What if the internet drops mid-attempt?", a: "Answer-saving and attempt-recovery rules apply as supported by the system. The actual resume policy for each attempt type must be stated before the exam starts." },
        { q: "How do payments work?", a: "Available payment methods for each course appear on its enrollment page before confirming. Options vary by actually enabled methods." },
        { q: "How does Sanad handle student data?", a: "The platform controls access to its data by user permission and teaching-space context. See the privacy policy for usage and retention details." },
      ],
    },
    cta: { title: "Your next step starts here.", body: "Pick your teacher, explore the available courses, and start an organized learning journey that shows what you achieved and what to learn next.", courses: "Explore courses", login: "Log in" },
    login: {
      title: "Log in",
      subtitle: "Enter your account phone number and password",
      phone: "Phone number",
      password: "Password",
      show: "Show password",
      hide: "Hide password",
      submit: "Log in",
      pending: "Logging in…",
      back: "Back to home",
      invalid: "Invalid credentials",
      offline: "Could not reach the server",
      brandLines: [
        { strong: "One path", rest: " from lesson to evaluation." },
        { strong: "Fair timers", rest: " run by the server." },
        { strong: "And smart evaluation", rest: " reviewed by your human teacher." },
      ],
    },
    footer: { courses: "Courses", teachers: "Teachers", login: "Log in", tagline: "A clear learning space for every step." },
  },
};
