"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError, type AssignmentListItem } from "@/app/lib/api";

/** Assignment lifecycle → student-facing Arabic. Unknown values pass through. */
const STATUS_LABELS: Record<string, string> = {
  PUBLISHED: "متاح",
  DRAFT: "مسودة",
  CLOSED: "مغلق",
  ARCHIVED: "مؤرشف",
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
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontWeight: 700,
  color: "#ffffff",
};

const quietLinkStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "rgba(244, 244, 246, 0.72)",
  textDecoration: "underline",
  textUnderlineOffset: 4,
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

export default function StudentAssignmentsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<AssignmentListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .listAssignments(token)
      .then((r) => setItems(r.assignments))
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "تعذر تحميل الواجبات"),
      );
  }, [token]);

  if (!token) {
    return (
      <Notice
        text={
          <>
            سجّل الدخول أولًا. <Link href="/login">تسجيل الدخول</Link>
          </>
        }
      />
    );
  }

  if (error) return <Notice text={error} />;
  if (items === null) return <Notice text="جاري التحميل…" />;

  return (
    <div className="sc-canvas">
      <div className="lp-container" style={{ maxWidth: 1280 }}>
        <header style={{ marginBottom: "var(--space-8)" }}>
          <p className="sc-eyebrow">التسليم</p>
          <h1 className="sc-title">واجباتي</h1>
          <p className="sc-meta">
            اكتب إجابتك وسلّم قبل ما ينتهي المؤقت — الوقت محسوب من الخادم.
          </p>
        </header>

        {items.length === 0 && (
          <QuietPanel text="لا توجد واجبات متاحة حاليًا." />
        )}

        <div style={{ display: "grid", gap: "var(--space-6)" }}>
          {items.map((a) => {
            const lessonId = a.lesson?.id ?? a.lessonId;
            return (
              <article key={a.id} className="sc-panel">
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
                      واجب
                    </p>
                    <span style={pillStyle}>
                      {STATUS_LABELS[a.status] ?? a.status}
                    </span>
                  </div>

                  <h3
                    className="sc-title"
                    style={{ fontSize: 26, marginTop: "var(--space-3)" }}
                  >
                    {a.title}
                  </h3>
                  <p
                    className="sc-meta"
                    style={{ marginTop: "var(--space-2)" }}
                  >
                    المدة: {a.timerMinutes} دقيقة
                    {a.lesson ? ` · الدرس: ${a.lesson.title}` : ""}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-6)",
                      flexWrap: "wrap",
                      marginTop: "var(--space-6)",
                    }}
                  >
                    <Link
                      href={`/student/assignments/${a.id}`}
                      className="lp-cta"
                      style={ctaStyle}
                    >
                      فتح الواجب
                      <span className="lp-arrow" aria-hidden>
                        ←
                      </span>
                    </Link>
                    {lessonId && (
                      <Link
                        href={`/student/lessons/${lessonId}`}
                        style={quietLinkStyle}
                      >
                        صفحة الدرس
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
