"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError, type CourseStructure } from "@/app/lib/api";

const lockLabels: Record<string, string> = {
  LOCKED: "مقفل",
  UNLOCKED: "متاح",
  AVAILABLE: "متاح",
  EXPIRED: "منتهي",
};

const typeLabels: Record<string, string> = {
  VIDEO: "فيديو",
  PDF: "ملف",
  QUIZ: "اختبار قصير",
  LIVE: "بث مباشر",
  ASSIGNMENT: "واجب",
  EXAM: "اختبار",
  RESOURCE: "مورد",
};

export default function StudentCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { token } = useAuth();
  const [courseId, setCourseId] = useState<string | null>(null);
  const [data, setData] = useState<CourseStructure | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setCourseId(p.id));
  }, [params]);

  useEffect(() => {
    if (!courseId || !token) return;
    let cancelled = false;
    api
      .getStudentCourseStructure(token, courseId)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof ApiError ? e.message : "تعذر تحميل الكورس");
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, token]);

  if (!token) {
    return (
      <div className="card">
        <p>
          سجّل الدخول أولًا. <Link href="/login">تسجيل الدخول</Link>
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <p style={{ color: "#ef4444" }}>{error}</p>
        <p style={{ marginTop: 8 }}>
          <Link href="/student/courses">العودة إلى كورساتي</Link>
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card">
        <p>جاري تحميل الكورس…</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860 }}>
      <nav style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: "var(--space-sm)" }}>
        <Link href="/student/courses">كورساتي</Link> › {data.course.title}
      </nav>

      <h1 style={{ marginBottom: 4 }}>{data.course.title}</h1>
      {data.course.shortDescription && (
        <p style={{ color: "var(--text-muted)", marginBottom: "var(--space-lg)" }}>
          {data.course.shortDescription}
        </p>
      )}

      {data.sections.length === 0 && (
        <div className="card"><p>لا توجد وحدات منشورة في هذا الكورس بعد.</p></div>
      )}

      {data.sections.map((section) => (
        <section key={section.id} style={{ marginBottom: "var(--space-lg)" }}>
          <h2 style={{ fontSize: 16, marginBottom: "var(--space-sm)" }}>
            {section.title}
          </h2>
          <div style={{ display: "grid", gap: 8 }}>
            {section.lessons.map((lesson) => {
              const locked = lesson.lockStatus === "LOCKED";
              return (
                <Link
                  key={lesson.id}
                  href={locked ? "#" : `/student/lessons/${lesson.id}`}
                  onClick={locked ? (e) => e.preventDefault() : undefined}
                  className="card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    opacity: locked ? 0.55 : 1,
                    cursor: locked ? "not-allowed" : "pointer",
                  }}
                  aria-disabled={locked}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: locked ? "#6b728020" : "#10b98120",
                      color: locked ? "#6b7280" : "#10b981",
                    }}
                  >
                    {lockLabels[lesson.lockStatus] ?? lesson.lockStatus}
                  </span>
                  <span style={{ flex: 1, fontWeight: 600 }}>{lesson.title}</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {typeLabels[lesson.type] ?? lesson.type}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
