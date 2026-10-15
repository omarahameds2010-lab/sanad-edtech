"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError, type TeacherStudent } from "@/app/lib/api";

export default function TeacherStudentsPage() {
  const { token } = useAuth();
  const [students, setStudents] = useState<TeacherStudent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token) return;
    api
      .listStudents(token)
      .then(setStudents)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "تعذر تحميل الطلاب"),
      );
  }, [token]);

  const filtered = useMemo(() => {
    if (!students) return [];
    const q = search.trim();
    if (q === "") return students;
    return students.filter(
      (s) =>
        s.name.includes(q) ||
        (s.phone ?? "").includes(q) ||
        s.enrollments.some((e) => e.course.title.includes(q)),
    );
  }, [students, search]);

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
  if (students === null)
    return (
      <div className="card">
        <p>جاري التحميل…</p>
      </div>
    );

  return (
    <>
      <h1>الطلاب</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "var(--space-sm)",
          marginBottom: "var(--space-lg)",
        }}
      >
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{students.length}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            الإجمالي
          </div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#10b981" }}>
            {students.filter((s) => s.status === "ACTIVE").length}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>نشط</div>
        </div>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث بالاسم أو الموبايل أو الكورس…"
        style={{
          width: "100%",
          maxWidth: 480,
          marginBottom: "var(--space-md)",
        }}
      />

      {filtered.length === 0 ? (
        <div className="card">
          <p>
            {students.length === 0
              ? "لا يوجد طلاب مسجلون في كورساتك بعد."
              : "لا نتائج مطابقة للبحث."}
          </p>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  textAlign: "right",
                  borderBottom: "1px solid var(--border-subtle)",
                  background: "var(--bg-surface)",
                }}
              >
                <th style={{ padding: "var(--space-md)" }}>الطالب</th>
                <th style={{ padding: "var(--space-md)" }}>الموبايل</th>
                <th style={{ padding: "var(--space-md)" }}>الكورسات</th>
                <th style={{ padding: "var(--space-md)" }}>ملف</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  style={{ borderBottom: "1px solid var(--border-subtle)" }}
                >
                  <td style={{ padding: "var(--space-md)", fontWeight: 600 }}>
                    {s.name}
                    {s.grade && (
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 400,
                          color: "var(--text-muted)",
                        }}
                      >
                        {s.grade}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "var(--space-md)" }} dir="ltr">
                    {s.phone ?? "—"}
                  </td>
                  <td style={{ padding: "var(--space-md)", fontSize: 13 }}>
                    {s.enrollments.length === 0
                      ? "—"
                      : s.enrollments.map((e) => e.course.title).join("، ")}
                  </td>
                  <td style={{ padding: "var(--space-md)" }}>
                    <Link
                      href={`/teacher/students/${s.id}`}
                      style={{ fontSize: 13 }}
                    >
                      فتح الملف
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
