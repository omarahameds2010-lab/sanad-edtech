"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError, type EnrollmentItem } from "@/app/lib/api";

const statusLabels: Record<string, string> = {
  ACTIVE: "نشط",
  EXPIRED: "منتهي",
  CANCELLED: "ملغي",
};

export default function StudentCoursesPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<EnrollmentItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .getMyEnrollments(token)
      .then(setItems)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "تعذر تحميل الكورسات"),
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
      <h1 style={{ marginBottom: "var(--space-lg)" }}>كورساتي</h1>
      {items.length === 0 && (
        <div className="card"><p>لست مسجلًا في أي كورس بعد.</p></div>
      )}
      <div style={{ display: "grid", gap: "var(--space-md)" }}>
        {items.map((en) => (
          <div key={en.id} className="card">
            <h3 style={{ marginBottom: 4 }}>{en.course.title}</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
              الحالة: {statusLabels[en.status] ?? en.status}
              {" · "}
              مسجل منذ: {new Date(en.startsAt).toLocaleDateString("ar-EG")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
