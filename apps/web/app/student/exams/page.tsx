"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError, type ExamListItem } from "@/app/lib/api";

/** Exam lifecycle → student-facing Arabic. Unknown values pass through. */
const STATUS_LABELS: Record<string, string> = {
  PUBLISHED: "متاح",
  SCHEDULED: "مجدول",
  ACTIVE: "جارٍ",
  CLOSED: "مغلق",
  ARCHIVED: "مؤرشف",
  DRAFT: "مسودة",
};

const pillStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "var(--tenant-accent-glow, #34d399)",
  background: "rgba(52, 211, 153, 0.1)",
  border: "1px solid rgba(52, 211, 153, 0.28)",
  borderRadius: 999,
  padding: "4px 12px",
  whiteSpace: "nowrap",
};

const ctaStyle: CSSProperties = {
  marginTop: "var(--space-6)",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontWeight: 700,
  color: "#ffffff",
};

function QuietPanel({ text }: { text: ReactNode }) {
  return (
    <article className="sc-panel">
      <div className="sc-body">
        <p className="sc-meta" style={{ margin: 0 }}>
          {text as any}
        </p>
      </div>
    </article>
  );
}

function Notice({ text }: { text: ReactNode }) {
  return (
    <div className="sc-canvas">
      <div className="lp-container" style={{ maxWidth: 1280 }}>
        <QuietPanel text={text} />
      </div>
    </div>
  );
}

export default function StudentExamsPage() {
  const { token } = useAuth();
  const [exams, setExams] = useState<ExamListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .listExams(token)
      .then((r) => setExams(r.exams))
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "تعذر تحميل الاختبارات"),
      );
  }, [token]);

  if (!token) {
    return (
      <Notice
        text={
          <>
            سجّل الدخول أولًا لعرض اختباراتك.{" "}
            <Link href="/login">تسجيل الدخول</Link>
          </>
        }
      />
    );
  }

  if (error) return <Notice text={error} />;
  if (exams === null) return <Notice text="جاري التحميل…" />;

  return (
    <div className="sc-canvas">
      <div className="lp-container" style={{ maxWidth: 1280 }}>
        <header style={{ marginBottom: "var(--space-8)" }}>
          <p className="sc-eyebrow">التقييم</p>
          <h1 className="sc-title">اختباراتي</h1>
          <p className="sc-meta">
            كل اختبار بمؤقته الخاص — محسوب من الخادم، فالتحديث مش بيرجّع الوقت
            للورا.
          </p>
        </header>

        {exams.length === 0 && (
          <QuietPanel text="لا توجد اختبارات منشورة حاليًا." />
        )}

        <div style={{ display: "grid", gap: "var(--space-6)" }}>
          {exams.map((exam) => (
            <Link
              key={exam.id}
              href={`/student/exams/${exam.id}`}
              className="sc-panel"
            >
              <div className="sc-body">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--space-4)",
                    flexWrap: "wrap",
                  }}
                >
                  <p className="sc-eyebrow" style={{ margin: 0 }}>
                    اختبار محدد بوقت
                  </p>
                  <span style={pillStyle}>
                    {STATUS_LABELS[exam.status] ?? exam.status}
                  </span>
                </div>

                <h3
                  className="sc-title"
                  style={{ fontSize: 26, marginTop: "var(--space-3)" }}
                >
                  {exam.title}
                </h3>
                {exam.description && (
                  <p className="sc-meta">{exam.description}</p>
                )}
                <p className="sc-meta" style={{ marginTop: "var(--space-2)" }}>
                  المدة: {exam.timerMinutes} دقيقة
                  {exam.lesson ? ` · الدرس: ${exam.lesson.title}` : ""}
                </p>

                <span className="lp-cta" style={ctaStyle}>
                  ابدأ الاختبار
                  <span className="lp-arrow" aria-hidden>
                    ←
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
