"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError, type AssignmentListItem } from "@/app/lib/api";

export default function TeacherAssignmentsPage() {
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
      <h1 style={{ marginBottom: "var(--space-lg)" }}>الواجبات والتصحيح</h1>
      {items.length === 0 && (
        <div className="card"><p>لا توجد واجبات بعد.</p></div>
      )}
      <div style={{ display: "grid", gap: "var(--space-md)" }}>
        {items.map((a) => (
          <Link
            key={a.id}
            href={`/teacher/assignments/${a.id}`}
            className="card"
            style={{ display: "block" }}
          >
            <h3 style={{ marginBottom: 4 }}>{a.title}</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
              المدة: {a.timerMinutes} دقيقة · الحالة: {a.status}
              {a.lesson ? ` · الدرس: ${a.lesson.title}` : ""}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
