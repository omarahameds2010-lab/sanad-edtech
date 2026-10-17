import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { Reveal } from "../../components/landing/interactive";

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
    title: "مسار يفتح بالدخول",
    body: "دخولك الواجب يفتح الاختبار، ودخولك الاختبار يفتح الدرس التالي — من غير شرط درجة.",
  },
  {
    title: "وقت عادل ومحسوب",
    body: "مؤقت الواجب ٣٠٠ دقيقة، ومؤقت الاختبار ٧٠ دقيقة — محسوبين من الخادم، فمش هيتصفّروا بتحديث الصفحة.",
  },
  {
    title: "تقييم تفهمه مش بس رقم",
    body: "SANAD يقترح تقييمًا منظمًا للإجابات المفتوحة — والدرجة النهائية دايمًا باعتماد المعلم.",
  },
];

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
          <div className="ts-hero-glow" aria-hidden />
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

          <div
            style={{
              position: "relative",
              display: "flex",
              gap: 24,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div className="ts-avatar" aria-hidden>
              ع
            </div>
            <div style={{ flex: "1 1 280px", minWidth: 0 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span className="ts-chip">{SPACE.subject}</span>
                <span className="ts-chip ts-chip-quiet">{SPACE.stage}</span>
                <span className="ts-chip ts-chip-quiet">٣ كورسات</span>
              </div>
              <h1
                className="lp-text-gradient"
                style={{
                  margin: "14px 0 0",
                  fontSize: "clamp(30px, 5vw, 44px)",
                  fontWeight: 800,
                  lineHeight: 1.5,
                }}
              >
                {SPACE.name}
              </h1>
              <p className="ts-tagline">«{SPACE.tagline}»</p>
            </div>
          </div>

          <p
            style={{
              position: "relative",
              color: "#a7adba",
              lineHeight: 1.95,
              maxWidth: 640,
              margin: "20px 0 0",
            }}
          >
            {SPACE.bio}
          </p>

          <div
            style={{
              position: "relative",
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 18,
            }}
          >
            {SPACE.focus.split(" · ").map((tag) => (
              <span
                key={tag}
                className="lp-tag"
                style={
                  {
                    "--tag-accent": "#34d399",
                    "--tag-accent-soft": "rgba(52, 211, 153, 0.14)",
                  } as CSSProperties
                }
              >
                {tag}
              </span>
            ))}
          </div>

          <div
            style={{
              position: "relative",
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 28,
            }}
          >
            <Link
              href="/courses/arabic-1-prep"
              className="lp-btn lp-btn-primary"
            >
              ابدأ من الأول الإعدادي
            </Link>
            <a href="#courses" className="ts-btn-dark">
              استعرض كورسات المساحة
            </a>
          </div>
        </section>
      </Reveal>

      <section
        id="courses"
        aria-label="كورسات المساحة"
        style={{ marginTop: 64, scrollMarginTop: 24 }}
      >
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
            marginTop: 32,
          }}
        >
          {SPACE.courses.map((course, index) => (
            <Reveal key={course.slug} delay={index * 90}>
              <article className="ts-course-card">
                <span className="ts-course-digit" aria-hidden>
                  {course.numeral}
                </span>
                <span
                  style={{
                    color: "var(--color-action-strong)",
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  الصف {course.grade}
                </span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 19,
                    color: "var(--ink-700)",
                    lineHeight: 1.6,
                  }}
                >
                  {course.title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: "var(--text-muted)",
                    fontSize: 14.5,
                    lineHeight: 1.85,
                  }}
                >
                  {course.desc}
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["نحو", "بلاغة", "نصوص"].map((topic) => (
                    <span key={topic} className="ts-pill">
                      {topic}
                    </span>
                  ))}
                </div>
                {course.full && (
                  <span
                    className="ts-pill ts-pill-accent"
                    style={{ alignSelf: "flex-start" }}
                  >
                    المسار الكامل: درس ← واجب ← اختبار
                  </span>
                )}
                <Link
                  href={`/courses/${course.slug}`}
                  className="lp-cta"
                  style={{
                    marginTop: "auto",
                    paddingTop: 8,
                    color: "var(--color-action-strong)",
                  }}
                >
                  استعرض الكورس
                  <span className="lp-arrow" aria-hidden>
                    ←
                  </span>
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal>
        <section
          aria-label="لماذا التعلم هنا"
          style={{
            marginTop: 56,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {FEATURES.map((feature) => (
            <div key={feature.title} className="ts-feature">
              <h3 style={{ margin: "0 0 8px", fontSize: 16.5 }}>
                {feature.title}
              </h3>
              <p
                style={{
                  margin: 0,
                  color: "var(--text-muted)",
                  fontSize: 13.5,
                  lineHeight: 1.8,
                }}
              >
                {feature.body}
              </p>
            </div>
          ))}
        </section>
      </Reveal>

      <Reveal>
        <section
          style={{
            marginTop: 56,
            textAlign: "center",
            background: "var(--paper-100)",
            border: "1px solid var(--paper-200)",
            borderRadius: 24,
            padding: "40px 24px",
          }}
        >
          <h2 className="lp-h2" style={{ fontSize: 24 }}>
            جاهز تبدأ؟
          </h2>
          <p
            className="lp-lead"
            style={{ margin: "0 auto 22px", maxWidth: 520 }}
          >
            سجّل دخولك وادخل كورس الأول الإعدادي — والمسار هيوديك خطوة بخطوة.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link href="/login" className="lp-btn lp-btn-primary">
              تسجيل الدخول
            </Link>
            <Link href="/courses" className="lp-btn lp-btn-ghost">
              تصفح كل الكورسات
            </Link>
          </div>
        </section>
      </Reveal>

      <p className="ts-footer-note">
        الأستاذ صالح حسين · مساحة تعليمية على منصة سند
      </p>
    </main>
  );
}
