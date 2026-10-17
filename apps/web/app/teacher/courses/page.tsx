"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError, type TeacherCourse } from "@/app/lib/api";
import {
  COURSE_STATUS_LABELS,
  gradeLabel,
  isPrepGrade,
} from "@/app/lib/teacher-content";

export default function TeacherCoursesPage() {
  const { token } = useAuth();
  const [courses, setCourses] = useState<TeacherCourse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    api
      .listTeacherCourses(token)
      .then((list) => {
        if (alive) setCourses(list);
      })
      .catch((e) => {
        if (alive)
          setError(e instanceof ApiError ? e.message : "تعذر تحميل الكورسات");
      });
    return () => {
      alive = false;
    };
  }, [token]);

  if (!token) {
    return (
      <div className="pub-note">
        سجّل الدخول أولًا. <Link href="/login">تسجيل الدخول</Link>
      </div>
    );
  }

  const active = (courses ?? []).filter((c) => c.status !== "ARCHIVED");

  return (
    <section>
      <header className="pub-head">
        <p className="pub-eyebrow">الكورسات</p>
        <h1 className="pub-title">كل كورساتك</h1>
        <p className="pub-sub">
          نفس الكورسات موجودة مقسّمة على الصفوف في{" "}
          <Link href="/teacher/publish">مساحة النشر</Link>.
        </p>
        <p style={{ marginTop: "var(--space-4)" }}>
          <Link className="pub-btn pub-btn-primary" href="/teacher/courses/new">
            + كورس جديد
          </Link>
        </p>
      </header>

      {error && <p className="pub-error">{error}</p>}
      {courses === null && !error && <p className="pub-note">جاري التحميل…</p>}

      <div className="pub-grid">
        {active.map((c) => (
          <article key={c.id} className="tc-panel pub-grade">
            <span
              className={
                c.status === "PUBLISHED"
                  ? "pub-chip pub-chip-on"
                  : "pub-chip pub-chip-draft"
              }
            >
              {COURSE_STATUS_LABELS[c.status] ?? c.status}
            </span>
            <h2 className="pub-grade-title">{c.title}</h2>
            <p className="pub-grade-meta">
              {gradeLabel(c.grade)}
              {c.price && Number(c.price) > 0
                ? ` · ${Number(c.price).toLocaleString("ar-EG")} ${c.currency ?? "EGP"}`
                : " · مجاني"}
            </p>
            <div className="pub-course-links" style={{ marginTop: "auto" }}>
              <Link
                className="pub-btn pub-btn-primary"
                href={`/teacher/courses/${c.id}`}
              >
                مساحة الكورس
              </Link>
              {c.grade && isPrepGrade(c.grade) && (
                <Link className="pub-btn" href={`/teacher/publish/${c.grade}`}>
                  صفحة الصف
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>

      {courses !== null && active.length === 0 && !error && (
        <p className="pub-note">
          مفيش كورسات بعد — ابدأ بـ«كورس جديد» واختار الصف.
        </p>
      )}
    </section>
  );
}
