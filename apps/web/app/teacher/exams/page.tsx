"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError, type ExamListItem } from "@/app/lib/api";

export default function TeacherExamsPage() {
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
          سجّل الدخول أولًا. <Link href="/login">تسجيل الدخول</Link>
        </p>
      </div>
    );
  }

  if (error)
    return (
      <div className="card">
        <p>{error}</p>
      </div>
    );
  if (exams === null)
    return (
      <div className="card">
        <p>جاري التحميل…</p>
      </div>
    );

  return (
    <div>
      <h1 style={{ marginBottom: "var(--space-lg)" }}>الاختبارات والتصحيح</h1>
      {exams.length === 0 && (
        <div className="card">
          <p>لا توجد اختبارات بعد.</p>
        </div>
      )}
      <div style={{ display: "grid", gap: "var(--space-md)" }}>
        {exams.map((exam) => (
          <Link
            key={exam.id}
            href={`/teacher/exams/${exam.id}`}
            className="card"
            style={{ display: "block" }}
          >
            <h3 style={{ marginBottom: 4 }}>{exam.title}</h3>
            <p
              style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}
            >
              المدة: {exam.timerMinutes} دقيقة · الحالة: {exam.status}
              {exam.lesson ? ` · الدرس: ${exam.lesson.title}` : ""}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
