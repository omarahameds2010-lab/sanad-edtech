"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError, type StudentFile } from "@/app/lib/api";

export default function TeacherStudentFilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { token } = useAuth();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [file, setFile] = useState<StudentFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setStudentId(p.id));
  }, [params]);

  useEffect(() => {
    if (!studentId || !token) return;
    let cancelled = false;
    api
      .getStudentFile(token, studentId)
      .then((d) => {
        if (!cancelled) setFile(d);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof ApiError ? e.message : "تعذر تحميل ملف الطالب");
      });
    return () => {
      cancelled = true;
    };
  }, [studentId, token]);

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
  if (!file)
    return (
      <div className="card">
        <p>جاري التحميل…</p>
      </div>
    );

  const gradedExams = file.examAttempts.filter((a) => a.score !== null);
  const avgScore =
    gradedExams.length === 0
      ? null
      : Math.round(
          gradedExams.reduce((s, a) => s + (a.score ?? 0), 0) /
            gradedExams.length,
        );

  return (
    <div style={{ maxWidth: 900 }}>
      <nav
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          marginBottom: "var(--space-sm)",
        }}
      >
        <Link href="/teacher/students">الطلاب</Link> › {file.user.name}
      </nav>
      <h1 style={{ marginBottom: "var(--space-md)" }}>{file.user.name}</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "var(--space-sm)",
          marginBottom: "var(--space-lg)",
        }}
      >
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>
            {file.enrollments.length}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            كورسات مسجل بها
          </div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>
            {file.examAttempts.length}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            محاولات اختبارات
          </div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#10b981" }}>
            {avgScore === null ? "—" : `${avgScore}%`}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            متوسط الدرجات
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: 16, marginBottom: "var(--space-sm)" }}>
        الكورسات
      </h2>
      <div className="card" style={{ marginBottom: "var(--space-lg)" }}>
        {file.enrollments.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
            غير مسجل في أي كورس.
          </p>
        ) : (
          file.enrollments.map((en) => (
            <div
              key={en.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <span style={{ fontWeight: 600 }}>{en.course.title}</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {en.status}
              </span>
            </div>
          ))
        )}
      </div>

      <h2 style={{ fontSize: 16, marginBottom: "var(--space-sm)" }}>
        محاولات الاختبارات
      </h2>
      <div
        className="card"
        style={{ marginBottom: "var(--space-lg)", overflow: "hidden" }}
      >
        {file.examAttempts.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
            لا توجد محاولات بعد.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  textAlign: "right",
                  borderBottom: "1px solid var(--border-subtle)",
                  background: "var(--bg-surface)",
                }}
              >
                <th style={{ padding: "var(--space-md)" }}>الاختبار</th>
                <th style={{ padding: "var(--space-md)" }}>الحالة</th>
                <th style={{ padding: "var(--space-md)" }}>الدرجة</th>
              </tr>
            </thead>
            <tbody>
              {file.examAttempts.map((a) => (
                <tr
                  key={a.id}
                  style={{ borderBottom: "1px solid var(--border-subtle)" }}
                >
                  <td style={{ padding: "var(--space-md)" }}>
                    <Link href={`/teacher/exams/${a.exam.id}`}>
                      {a.exam.title}
                    </Link>
                  </td>
                  <td style={{ padding: "var(--space-md)", fontSize: 13 }}>
                    {a.status}
                  </td>
                  <td style={{ padding: "var(--space-md)", fontWeight: 600 }}>
                    {a.score !== null && a.score !== undefined
                      ? `${a.score}/100`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h2 style={{ fontSize: 16, marginBottom: "var(--space-sm)" }}>
        تسليمات الواجبات
      </h2>
      <div className="card" style={{ overflow: "hidden" }}>
        {file.submissions.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
            لا توجد تسليمات بعد.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  textAlign: "right",
                  borderBottom: "1px solid var(--border-subtle)",
                  background: "var(--bg-surface)",
                }}
              >
                <th style={{ padding: "var(--space-md)" }}>الواجب</th>
                <th style={{ padding: "var(--space-md)" }}>الحالة</th>
                <th style={{ padding: "var(--space-md)" }}>الدرجة</th>
              </tr>
            </thead>
            <tbody>
              {file.submissions.map((s) => (
                <tr
                  key={s.id}
                  style={{ borderBottom: "1px solid var(--border-subtle)" }}
                >
                  <td style={{ padding: "var(--space-md)" }}>
                    <Link href={`/teacher/assignments/${s.assignment.id}`}>
                      {s.assignment.title}
                    </Link>
                  </td>
                  <td style={{ padding: "var(--space-md)", fontSize: 13 }}>
                    {s.status}
                  </td>
                  <td style={{ padding: "var(--space-md)", fontWeight: 600 }}>
                    {s.score !== null && s.score !== undefined
                      ? `${s.score}/100`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
