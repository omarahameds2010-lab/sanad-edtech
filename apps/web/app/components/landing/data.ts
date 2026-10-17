export interface TeacherEntry {
  slug: string;
  subject: string;
  teacherName: string;
  focusAreas: string;
  accent: string;
  accentSoft: string;
  motif: "orbit" | "grid" | "ink";
  tagline: string;
}

export const teachers: TeacherEntry[] = [
  {
    slug: "saleh-hussein",
    subject: "اللغة العربية",
    teacherName: "الأستاذ صالح حسين",
    focusAreas: "نحو · بلاغة · نصوص",
    accent: "#047857",
    accentSoft: "#ecfdf5",
    motif: "ink",
    tagline:
      "«جوكر اللغة العربية»: شرح يوصل القاعدة، وتدريب يكشف نقاط التحسين قبل الامتحان.",
  },
];

export interface SubjectEntry {
  name: string;
  tagline: string;
  accent: string;
  accentSoft: string;
  letter: string;
}

export const subjects: SubjectEntry[] = [
  {
    name: "الرياضيات",
    tagline: "افهم العلاقات، وتدرّب على الحل، وتتبّع خطواتك.",
    accent: "#4F46E5",
    accentSoft: "#eef2ff",
    letter: "π",
  },
  {
    name: "الفيزياء",
    tagline: "اربط المفاهيم بالقوانين، واختبر فهمك بالمسائل.",
    accent: "#0891B2",
    accentSoft: "#ecfeff",
    letter: "λ",
  },
  {
    name: "اللغة العربية",
    tagline: "تدرّب على النحو والبلاغة والأدب، وراجع مواضع التحسين في إجاباتك.",
    accent: "#047857",
    accentSoft: "#ecfdf5",
    letter: "ع",
  },
  {
    name: "اللغة الإنجليزية",
    tagline: "طوّر فهمك للقواعد والتعبير، وتدرّب على تطبيق ما تتعلمه.",
    accent: "#B45309",
    accentSoft: "#fffbeb",
    letter: "A",
  },
  {
    name: "الكيمياء",
    tagline: "نظّم مفاهيمك، وافهم العلاقات بين التفاعلات والقوانين.",
    accent: "#0F766E",
    accentSoft: "#f0fdfa",
    letter: "⚛",
  },
  {
    name: "علوم الحاسب",
    tagline: "طوّر فهمك للمنطق والبرمجة وحل المشكلات.",
    accent: "#4D7C0F",
    accentSoft: "#f7fee7",
    letter: "{;}",
  },
];

export interface StepEntry {
  index: string;
  title: string;
  body: string;
}

export const studentSteps: StepEntry[] = [
  {
    index: "٠١",
    title: "اختر كورسك",
    body: "اشترك في الكورس الذي يناسبك، وادخل إلى الدروس والواجبات والاختبارات المتاحة ضمنه.",
  },
  {
    index: "٠٢",
    title: "ادرس وتدرّب",
    body: "ابدأ الدرس، ثم انتقل إلى الواجب والاختبار وفق المسار التعليمي المحدد.",
  },
  {
    index: "٠٣",
    title: "أجب في الوقت المحدد",
    body: "مدة الواجب ٣٠٠ دقيقة، ومدة الاختبار ٧٠ دقيقة. الخادم يحتفظ بالوقت المرجعي للمحاولة.",
  },
  {
    index: "٠٤",
    title: "راجع تقييمك وتقدّم",
    body: "استفد من الملاحظات وراجع ما تحتاج إلى تحسينه مع مدرسك — ودخولك يفتح خطوتك التالية.",
  },
];

export interface FaqEntry {
  q: string;
  a: string;
}

export const faqs: FaqEntry[] = [
  {
    q: "هل سند مخصصة لطلاب الثانوية العامة المصرية؟",
    a: "تستهدف التجربة التعليمية طلاب الثانوية العامة المصرية، مع محتوى ومساحات تعليمية ينظمها المدرسون المشاركون في المنصة.",
  },
  {
    q: "كيف يعمل مؤقت الاختبار؟",
    a: "تُحدّد مدة المحاولة، ويُحتسب الوقت المرجعي من الخادم. إعادة تحميل الصفحة لا تعيد المؤقت إلى البداية.",
  },
  {
    q: "هل يستطيع SANAD اعتماد الدرجة النهائية؟",
    a: "لا. يقدم SANAD تقييمًا مقترحًا، بينما تظل مراجعة التقييم واعتماد الدرجة النهائية من اختصاص المعلم.",
  },
  {
    q: "ماذا يحدث إذا انقطع الإنترنت أثناء المحاولة؟",
    a: "تُطبّق قواعد حفظ الإجابات واستعادة المحاولة بحسب ما يدعمه النظام. يجب توضيح سياسة الاستئناف والحفظ الفعلية الخاصة بكل نوع من المحاولات قبل بدء الاختبار.",
  },
  {
    q: "كيف يتم الدفع؟",
    a: "تظهر وسائل الدفع المتاحة للكورس داخل صفحة الاشتراك قبل تأكيد العملية. تختلف الخيارات بحسب وسائل الدفع المفعّلة فعليًا.",
  },
  {
    q: "كيف تتعامل سند مع بيانات الطلاب؟",
    a: "تستخدم المنصة ضوابط للوصول إلى بياناتها وفق صلاحيات المستخدم وسياق المساحة التعليمية. راجع سياسة الخصوصية لمعرفة تفاصيل استخدام البيانات والاحتفاظ بها.",
  },
];

/* ---------- SANAD Lab: illustrative example (NOT a live evaluation) ---------- */

export type EvidenceStatus = "supported" | "partial" | "missing";

export interface LabSegment {
  id: string;
  text: string;
}

export interface LabCriterion {
  id: string;
  title: string;
  max: number;
  score: number;
  status: EvidenceStatus;
  note: string;
  evidenceIds: string[];
}

export interface LabSample {
  id: string;
  label: string;
  answer: LabSegment[];
  criteria: LabCriterion[];
  total: number;
  gap: string;
  next: string;
}

export const labQuestion =
  "استخرج المفعول المطلق من الجملة وبيّن نوعه: «اجتهد الطالب اجتهادًا كبيرًا».";

export const labSamples: LabSample[] = [
  {
    id: "strong",
    label: "إجابة قوية",
    answer: [
      { id: "s1", text: "المفعول المطلق هو كلمة (اجتهادًا)، " },
      { id: "s2", text: "وهو منصوب وعلامة نصبه الفتحة، " },
      { id: "s3", text: "ونوعه مبيّن للنوع لأنه موصوف بكلمة (كبيرًا)." },
    ],
    criteria: [
      {
        id: "c1",
        title: "استخراج الكلمة الصحيحة",
        max: 30,
        score: 30,
        status: "supported",
        note: "استخرج (اجتهادًا) بدقة دون خلط بباقي عناصر الجملة.",
        evidenceIds: ["s1"],
      },
      {
        id: "c2",
        title: "الضبط الإعرابي",
        max: 30,
        score: 25,
        status: "partial",
        note: "ذكر النصب والعلامة، لكنه لم يذكر أن المفعول المطلق مصدر منصوب دائمًا.",
        evidenceIds: ["s2"],
      },
      {
        id: "c3",
        title: "بيان النوع مع الدليل",
        max: 40,
        score: 27,
        status: "supported",
        note: "حدد النوع (مبيّن للنوع) واستشهد بالوصف (كبيرًا) كدليل.",
        evidenceIds: ["s3"],
      },
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
      {
        id: "c1",
        title: "استخراج الكلمة الصحيحة",
        max: 30,
        score: 0,
        status: "missing",
        note: "(الطالب) فاعل وليس مفعولًا مطلقًا. لا يوجد دليل داعم في الإجابة.",
        evidenceIds: [],
      },
      {
        id: "c2",
        title: "الضبط الإعرابي",
        max: 30,
        score: 8,
        status: "partial",
        note: "محاولة تعليل لكنها مبنية على استخراج خاطئ من الأساس.",
        evidenceIds: ["w2"],
      },
      {
        id: "c3",
        title: "بيان النوع مع الدليل",
        max: 40,
        score: 4,
        status: "missing",
        note: "لم يذكر النوع ولا دليله إطلاقًا.",
        evidenceIds: [],
      },
    ],
    total: 12,
    gap: "الخلط بين الفاعل والمفعول المطلق: يحتاج إعادة تأسيس من تعريف المصدر.",
    next: "إعادة درس عناصر الجملة من البداية قبل المفعول المطلق.",
  },
];
