"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError, type AssignmentListItem } from "@/app/lib/api";

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
      <div className="card">
        <p>
          سجّل الدخول أولًا. <Link href="/login">تسجيل الدخول</Link>
        </p>
      </div>
    );
  }

  if (error) return <div className="card"><p>{error}</p></div>;
  if (items === null) return <div className="card"><p>جاري التحميل…</p></div>;

  return (
    <div>
      <h1 style={{ marginBottom: "var(--space-lg)" }}>واجباتي</h1>
      {items.length === 0 && (
        <div className="card"><p>لا توجد واجبات متاحة حاليًا.</p></div>
      )}
      <div style={{ display: "grid", gap: "var(--space-md)" }}>
        {items.map((a) => {
          const lessonId = a.lesson?.id ?? a.lessonId;
          return (
            <div key={a.id} className="card">
              <h3 style={{ marginBottom: 4 }}>{a.title}</h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                الحالة: {a.status} · المدة: {a.timerMinutes} دقيقة
                {a.lesson ? ` · الدرس: ${a.lesson.title}` : ""}
              </p>
              {lessonId && (
                <Link href={`/student/lessons/${lessonId}`}>
                  فتح صفحة الدرس
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
