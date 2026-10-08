"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError, type ExamListItem } from "@/app/lib/api";

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
      <div className="card">
        <p>
          سجّل الدخول أولًا لعرض اختباراتك.{" "}
          <Link href="/login">تسجيل الدخول</Link>
        </p>
      </div>
    );
  }

  if (error) return <div className="card"><p>{error}</p></div>;
  if (exams === null) return <div className="card"><p>جاري التحميل…</p></div>;

  return (
    <div>
      <h1 style={{ marginBottom: "var(--space-lg)" }}>اختباراتي</h1>
      {exams.length === 0 && (
        <div className="card"><p>لا توجد اختبارات منشورة حاليًا.</p></div>
      )}
      <div style={{ display: "grid", gap: "var(--space-md)" }}>
        {exams.map((exam) => (
          <Link
            key={exam.id}
            href={`/student/exams/${exam.id}`}
            className="card"
            style={{ display: "block" }}
          >
            <h3 style={{ marginBottom: 4 }}>{exam.title}</h3>
            {exam.description && (
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                {exam.description}
              </p>
            )}
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
              المدة: {exam.timerMinutes} دقيقة
              {exam.lesson ? ` · الدرس: ${exam.lesson.title}` : ""}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
