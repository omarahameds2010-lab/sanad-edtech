"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import {
  api,
  ApiError,
  type TeacherCourse,
  type TeacherSection,
} from "@/app/lib/api";
import { PREP_GRADES } from "@/app/lib/teacher-content";

interface GradeSummary {
  courses: number;
  lessons: number;
  published: number;
  exams: number;
  assignments: number;
}

export default function PublishHubPage() {
  const { token } = useAuth();
  const [courses, setCourses] = useState<TeacherCourse[] | null>(null);
  const [sectionsByCourse, setSectionsByCourse] = useState<
    Record<string, TeacherSection[]>
  >({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    (async () => {
      try {
        const list = await api.listTeacherCourses(token);
        if (!alive) return;
        setCourses(list);
        const entries = await Promise.all(
          list.map(
            async (c) => [c.id, await api.listSections(token, c.id)] as const,
          ),
        );
        if (!alive) return;
        setSectionsByCourse(Object.fromEntries(entries));
      } catch (e) {
        if (!alive) return;
        setError(e instanceof ApiError ? e.message : "تعذر تحميل مساحة النشر");
      }
    })();
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
  const summaries: Record<string, GradeSummary> = {};
  for (const g of PREP_GRADES) {
    summaries[g.key] = {
      courses: 0,
      lessons: 0,
      published: 0,
      exams: 0,
      assignments: 0,
    };
  }
  let ungraded = 0;
  for (const c of active) {
    const bucket = c.grade ? summaries[c.grade] : undefined;
    if (bucket) {
      bucket.courses += 1;
    } else {
      ungraded += 1;
    }
    for (const s of sectionsByCourse[c.id] ?? []) {
      for (const l of s.lessons ?? []) {
        if (!bucket) continue;
        bucket.lessons += 1;
        if (l.status === "PUBLISHED") bucket.published += 1;
        if (l.type === "EXAM") bucket.exams += 1;
        if (l.type === "ASSIGNMENT") bucket.assignments += 1;
      }
    }
  }

  return (
    <section>
      <header className="pub-head">
        <p className="pub-eyebrow">مساحة النشر</p>
        <h1 className="pub-title">انشر كورسك وامتحانك وواجبك</h1>
        <p className="pub-sub">
          كل صف دراسي له مساحة رفع مستقلة. من هنا ترفع الكورسات والدروس
          والامتحانات والواجبات — وبعد النشر، الطالب يشوف الدرس والواجب في صفحة
          الواجبات، والامتحان في صفحة الاختبارات.
        </p>
      </header>

      {error && <p className="pub-error">{error}</p>}

      <div className="pub-grid">
        {PREP_GRADES.map((g) => {
          const s = summaries[g.key];
          return (
            <Link
              key={g.key}
              href={`/teacher/publish/${g.key}`}
              className="tc-panel pub-grade"
            >
              <span className="pub-chip">{g.label}</span>
              <h2 className="pub-grade-title">مساحة الرفع</h2>
              <p className="pub-grade-meta">
                <b>{s.courses}</b> كورس · <b>{s.lessons}</b> درس · منشور{" "}
                <b>{s.published}</b>
              </p>
              <div className="pub-stats">
                <span className="pub-stat">
                  امتحانات <b>{s.exams}</b>
                </span>
                <span className="pub-stat">
                  واجبات <b>{s.assignments}</b>
                </span>
              </div>
              <span className="pub-cta">افتح مساحة الرفع ←</span>
            </Link>
          );
        })}
      </div>

      {ungraded > 0 && (
        <p className="pub-note">
          فيه {ungraded} كورس مش متصنف على صف — تلاقيه في{" "}
          <Link href="/teacher/courses">كل الكورسات</Link>.
        </p>
      )}
    </section>
  );
}
