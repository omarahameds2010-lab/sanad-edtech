"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError, type PublicCourseCard } from "@/app/lib/api";

function formatPrice(price: number | string, currency: string): string {
  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0) return "مجاني";
  return `${n.toFixed(2)} ${currency}`;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<PublicCourseCard[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      api
        .listPublicCourses(search.trim() === "" ? undefined : search.trim())
        .then((r) => {
          if (!cancelled) {
            setCourses(r.courses);
            setError(null);
          }
        })
        .catch((e) => {
          if (!cancelled)
            setError(e instanceof ApiError ? e.message : "تعذر تحميل الكورسات");
        });
    }, search === "" ? 0 : 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search]);

  return (
    <main>
      <h1>الكورسات</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "var(--space-md)" }}>
        استكشف المساحات التعليمية المتاحة.
      </p>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث عن كورس…"
        style={{ width: "100%", maxWidth: 480, marginBottom: "var(--space-lg)" }}
      />

      {error && (
        <div className="card"><p>{error}</p></div>
      )}

      {courses === null && !error && (
        <div className="card"><p>جاري التحميل…</p></div>
      )}

      {courses !== null && courses.length === 0 && (
        <div className="card"><p>لا توجد كورسات منشورة حاليًا.</p></div>
      )}

      {courses !== null && courses.length > 0 && (
        <div style={{ display: "grid", gap: "var(--space-md)" }}>
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              className="card"
              style={{ display: "block" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                <h2 style={{ margin: 0 }}>{course.title}</h2>
                <strong style={{ whiteSpace: "nowrap" }}>
                  {formatPrice(course.price, course.currency)}
                </strong>
              </div>
              {course.shortDescription && (
                <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
                  {course.shortDescription}
                </p>
              )}
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                {course.teacher.name ? `المدرس: ${course.teacher.name} · ` : ""}
                {course.level ?? ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
