import Link from "next/link";
import { notFound } from "next/navigation";
import {
  GlowCard,
  Magnetic,
  Parallax,
  Reveal,
} from "../../components/landing/interactive";

/** The one real space of the demo: الأستاذ صالح حسين — جوكر اللغة العربية. */
const SPACE = {
  slug: "saleh-hussein",
  name: "الأستاذ صالح حسين",
  tagline: "جوكر اللغة العربية",
  subject: "اللغة العربية",
  stage: "المرحلة الإعدادية",
  bio: "نحو وبلاغة ونصوص للمرحلة الإعدادية — شرح يوصّل القاعدة من غير حفظ أعمى، وتدريب مستمر يراجع معاك نقاط التحسين قبل الامتحان.",
  focus: "نحو · بلاغة · نصوص",
  courses: [
    {
      slug: "arabic-1-prep",
      numeral: "١",
      grade: "الأول الإعدادي",
      title: "اللغة العربية — الأول الإعدادي",
      desc: "تأسيس قوي من أقسام الكلمة للجملة والمفعول المطلق — بأمثلة من الامتحانات وتدريبات مصححة.",
      full: true,
    },
    {
      slug: "arabic-2-prep",
      numeral: "٢",
      grade: "الثاني الإعدادي",
      title: "اللغة العربية — الثاني الإعدادي",
      desc: "توسّع في النحو والصرف مع تحليل النصوص وتذوّقها، وتدريب على صيغ أسئلة الامتحان.",
      full: false,
    },
    {
      slug: "arabic-3-prep",
      numeral: "٣",
      grade: "الثالث الإعدادي",
      title: "اللغة العربية — الثالث الإعدادي",
      desc: "مراجعة مركّزة ومهارات إجابة: من القاعدة إلى الدرجة — مع تدريب مستمر قبل الشهادة.",
      full: false,
    },
  ],
};

const FEATURES = [
  {
    icon: "unlock",
    title: "مسار يفتح بالدخول",
    body: "دخولك الواجب يفتح الاختبار، ودخولك الاختبار يفتح الدرس التالي — من غير شرط درجة.",
  },
  {
    icon: "clock",
    title: "وقت عادل ومحسوب",
    body: "مؤقت الواجب ٣٠٠ دقيقة، ومؤقت الاختبار ٧٠ دقيقة — محسوبين من الخادم، فمش هيتصفّروا بتحديث الصفحة.",
  },
  {
    icon: "brain",
    title: "تقييم تفهمه مش بس رقم",
    body: "SANAD يقترح تقييمًا منظمًا للإجابات المفتوحة — والدرجة النهائية دايمًا باعتماد المعلم.",
  },
];

/** 32px, stroke 1.5 — the triad's editorial marks. */
function FeatureIcon({ name }: { name: string }) {
  switch (name) {
    case "unlock":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.2" />
          <path d="M8.5 10.5V8a3.8 3.8 0 0 1 7.4-1.1" />
          <path d="M12 14.2v2.2" />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M11.7 4.6C10.6 3.3 8.7 3 7.3 4c-1.1.8-1.6 2.2-1.3 3.5-1.2.6-2 1.9-2 3.3 0 1.3.7 2.5 1.7 3.1-.1.4-.2.9-.2 1.3 0 2 1.6 3.6 3.6 3.6 1 0 1.9-.4 2.6-1" />
          <path d="M12.3 4.6c1.1-1.3 3-1.6 4.4-.6 1.1.8 1.6 2.2 1.3 3.5 1.2.6 2 1.9 2 3.3 0 1.3-.7 2.5-1.7 3.1.1.4.2.9.2 1.3 0 2-1.6 3.6-3.6 3.6-1 0-1.9-.4-2.6-1" />
          <path d="M12 4.4v15.2" />
        </svg>
      );
  }
}

export function generateStaticParams() {
  return [{ slug: SPACE.slug }];
}

export async function generateMetadata() {
  return {
    title: `${SPACE.name} — ${SPACE.tagline}`,
    description: SPACE.bio,
  };
}

export default async function TeacherSpacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug !== SPACE.slug) notFound();

  return (
    <main className="ts-page">
      <Reveal>
        <section className="ts-hero" aria-label={`مساحة ${SPACE.name}`}>
          <Parallax className="ts-hero-aurora" speed={0.1} />
          <div className="ts-hero-grain" aria-hidden />
          <svg
            className="ts-hero-motif"
            viewBox="0 0 520 300"
            fill="none"
            aria-hidden
          >
            <path
              d="M28 236 C 120 118, 208 268, 300 148 S 468 38, 512 148"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M60 278 C 150 188, 240 300, 330 208 S 468 150, 508 214"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.7"
            />
            <path
              d="M120 96 C 180 38, 262 38, 302 92"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.8"
            />
            <circle cx="318" cy="106" r="4" fill="currentColor" />
            <circle cx="341" cy="122" r="3" fill="currentColor" opacity="0.7" />
            <circle
              cx="150"
              cy="148"
              r="3.5"
              fill="currentColor"
              opacity="0.8"
            />
          </svg>

          <div className="ts-hero-id">
            <div className="ts-avatar" aria-hidden>
              ع
            </div>
            <div className="ts-hero-name">
              <div className="ts-chips">
                <span className="ts-chip">{SPACE.subject}</span>
                <span className="ts-chip">{SPACE.stage}</span>
                <span className="ts-chip">٣ كورسات</span>
              </div>
              <h1 className="ts-name">{SPACE.name}</h1>
              <p className="ts-tagline">«{SPACE.tagline}»</p>
            </div>
          </div>

          <p className="ts-bio">{SPACE.bio}</p>

          <div className="ts-tags">
            {SPACE.focus.split(" · ").map((tag) => (
              <span key={tag} className="ts-chip">
                {tag}
              </span>
            ))}
          </div>

          <div className="ts-hero-ctas">
            <Magnetic maxPx={2}>
              <Link
                href="/courses/arabic-1-prep"
                className="ts-btn ts-btn-primary"
              >
                ابدأ من الأول الإعدادي
              </Link>
            </Magnetic>
            <a href="#courses" className="ts-btn ts-btn-secondary">
              استعرض كورسات المساحة
            </a>
          </div>
        </section>
      </Reveal>

      <section id="courses" className="ts-courses" aria-label="كورسات المساحة">
        <Reveal>
          <p className="lp-eyebrow">كورسات المساحة</p>
          <h2 className="lp-h2" style={{ fontSize: 28 }}>
            ثلاث سنوات دراسية — وطريقة واحدة واضحة
          </h2>
          <p className="lp-lead">
            اختر سنتك: كل كورس مبني على نفس الطريقة — شرح يوصّل القاعدة، وتدريب
            يكشف اللي محتاج تحسين، واختبار يثبّت.
          </p>
        </Reveal>
        <div className="ts-bento">
          {SPACE.courses.map((course, index) => (
            <Reveal key={course.slug} delay={index * 100}>
              <GlowCard className="ts-course-card">
                <span className="ts-course-digit" aria-hidden>
                  {course.numeral}
                </span>
                <span className="ts-course-grade">الصف {course.grade}</span>
                <h3 className="ts-course-title">{course.title}</h3>
                <p className="ts-course-desc">{course.desc}</p>
                <div className="ts-course-tags">
                  {["نحو", "بلاغة", "نصوص"].map((topic) => (
                    <span key={topic} className="ts-tag">
                      {topic}
                    </span>
                  ))}
                </div>
                {course.full && (
                  <span className="ts-tag ts-tag-accent">
                    المسار الكامل: درس ← واجب ← اختبار
                  </span>
                )}
                <Link
                  href={`/courses/${course.slug}`}
                  className="lp-cta ts-course-link"
                >
                  استعرض الكورس
                  <span className="lp-arrow" aria-hidden>
                    ←
                  </span>
                </Link>
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal>
        <section className="ts-triad" aria-label="لماذا التعلم هنا">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="ts-triad-item">
              <FeatureIcon name={feature.icon} />
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </div>
          ))}
        </section>
      </Reveal>

      <Reveal>
        <section className="ts-final" aria-label="ابدأ رحلتك">
          <h2>جاهز تبدأ رحلتك؟</h2>
          <p>
            سجّل دخولك وادخل كورس الأول الإعدادي — والمسار هيوديك خطوة بخطوة.
          </p>
          <div className="ts-final-ctas">
            <Magnetic maxPx={2}>
              <Link href="/login" className="ts-btn ts-btn-primary">
                تسجيل الدخول
              </Link>
            </Magnetic>
            <Link href="/courses" className="ts-btn ts-btn-secondary">
              تصفح الكورسات
            </Link>
          </div>
        </section>
      </Reveal>

      <p className="ts-footer-note">
        الأستاذ صالح حسين · مساحة تعليمية على منصة سند
      </p>

      <div className="ts-mobile-cta">
        <Link href="/login" className="ts-btn ts-btn-primary">
          تسجيل الدخول
        </Link>
      </div>
    </main>
  );
}
