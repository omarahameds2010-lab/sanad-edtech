"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/app/lib/auth";
import {
  api,
  ApiError,
  type AssignmentListItem,
  type ExamListItem,
  type TeacherCourse,
  type TeacherSection,
} from "@/app/lib/api";
import {
  COURSE_STATUS_LABELS,
  LESSON_STATUS_LABELS,
  LESSON_TYPE_LABELS,
  PREP_GRADES,
  PUBLISH_TIP,
  gradeLabel,
  isPrepGrade,
} from "@/app/lib/teacher-content";

export default function GradePublishPage() {
  const params = useParams();
  const gradeKey = String(params.grade);
  const gradeMeta = PREP_GRADES.find((g) => g.key === gradeKey);

  const { token } = useAuth();
  const [courses, setCourses] = useState<TeacherCourse[] | null>(null);
  const [sectionsByCourse, setSectionsByCourse] = useState<
    Record<string, TeacherSection[]>
  >({});
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !isPrepGrade(gradeKey)) return;
    let alive = true;
    (async () => {
      try {
        const [all, examList, assignmentList] = await Promise.all([
          api.listTeacherCourses(token),
          api.listExams(token),
          api.listAssignments(token),
        ]);
        const mine = all.filter(
          (c) => c.grade === gradeKey && c.status !== "ARCHIVED",
        );
        if (!alive) return;
        setCourses(mine);
        setExams(examList.exams ?? []);
        setAssignments(assignmentList.assignments ?? []);
        const entries = await Promise.all(
          mine.map(
            async (c) => [c.id, await api.listSections(token, c.id)] as const,
          ),
        );
        if (!alive) return;
        setSectionsByCourse(Object.fromEntries(entries));
      } catch (e) {
        if (!alive) return;
        setError(e instanceof ApiError ? e.message : "تعذر تحميل محتوى الصف");
      }
    })();
    return () => {
      alive = false;
    };
  }, [token, gradeKey]);

  if (!gradeMeta) {
    return (
      <div className="pub-note">
        صف غير معروف. <Link href="/teacher/publish">ارجع لمساحة النشر</Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="pub-note">
        سجّل الدخول أولًا. <Link href="/login">تسجيل الدخول</Link>
      </div>
    );
  }

  const examByLesson = new Map(
    exams.filter((e) => e.lesson).map((e) => [e.lesson!.id, e]),
  );
  const assignmentByLesson = new Map(
    assignments.filter((a) => a.lessonId).map((a) => [a.lessonId, a]),
  );

  const totals = { lessons: 0, published: 0, exams: 0, assignments: 0 };
  for (const c of courses ?? []) {
    for (const s of sectionsByCourse[c.id] ?? []) {
      for (const l of s.lessons ?? []) {
        totals.lessons += 1;
        if (l.status === "PUBLISHED") totals.published += 1;
        if (l.type === "EXAM") totals.exams += 1;
        if (l.type === "ASSIGNMENT") totals.assignments += 1;
      }
    }
  }

  return (
    <section>
      <Link href="/teacher/publish" className="pub-back">
        → كل الصفوف
      </Link>

      <header className="pub-head">
        <p className="pub-eyebrow">مساحة النشر</p>
        <h1 className="pub-title">{gradeMeta.label}</h1>
        <p className="pub-sub">{PUBLISH_TIP}</p>
        <div className="pub-stats" style={{ marginTop: "var(--space-4)" }}>
          <span className="pub-stat">
            كورسات <b>{courses?.length ?? 0}</b>
          </span>
          <span className="pub-stat">
            دروس <b>{totals.lessons}</b>
          </span>
          <span className="pub-stat">
            منشور <b>{totals.published}</b>
          </span>
          <span className="pub-stat">
            امتحانات <b>{totals.exams}</b>
          </span>
          <span className="pub-stat">
            واجبات <b>{totals.assignments}</b>
          </span>
        </div>
        <p style={{ marginTop: "var(--space-4)" }}>
          <Link
            className="pub-btn pub-btn-primary"
            href={`/teacher/courses/new?grade=${gradeMeta.key}`}
          >
            + كورس جديد للصف
          </Link>
        </p>
      </header>

      {error && <p className="pub-error">{error}</p>}

      {(courses ?? []).map((c) => {
        const sections = sectionsByCourse[c.id] ?? [];
        return (
          <article key={c.id} className="tc-panel pub-course">
            <div className="pub-course-head">
              <div>
                <h2 className="pub-course-title">{c.title}</h2>
                <div className="pub-course-chips">
                  <span
                    className={
                      c.status === "PUBLISHED"
                        ? "pub-chip pub-chip-on"
                        : "pub-chip pub-chip-draft"
                    }
                  >
                    {COURSE_STATUS_LABELS[c.status] ?? c.status}
                  </span>
                  <span className="pub-chip pub-chip-muted">
                    {gradeLabel(c.grade)}
                  </span>
                </div>
              </div>
              <div className="pub-course-links">
                <Link className="pub-btn" href={`/teacher/courses/${c.id}`}>
                  مساحة الكورس
                </Link>
              </div>
            </div>

            {sections.length === 0 ? (
              <p className="pub-empty">
                مفيش منهج بعد — افتح مساحة الكورس وضيف أول وحدة ودروس.
              </p>
            ) : (
              sections.map((s) => (
                <div key={s.id} className="pub-sec">
                  <h3 className="pub-sec-title">{s.title}</h3>
                  {(s.lessons ?? []).length === 0 ? (
                    <p className="pub-empty">مفيش دروس في الوحدة دي بعد.</p>
                  ) : (
                    (s.lessons ?? []).map((l) => {
                      const exam =
                        l.type === "EXAM" ? examByLesson.get(l.id) : undefined;
                      const assignment =
                        l.type === "ASSIGNMENT"
                          ? assignmentByLesson.get(l.id)
                          : undefined;
                      return (
                        <div key={l.id} className="pub-lesson">
                          <span className="pub-chip">
                            {LESSON_TYPE_LABELS[l.type] ?? l.type}
                          </span>
                          <span className="pub-lesson-title">{l.title}</span>
                          <div className="pub-lesson-actions">
                            <span
                              className={
                                l.status === "PUBLISHED"
                                  ? "pub-chip pub-chip-on"
                                  : "pub-chip pub-chip-draft"
                              }
                            >
                              {LESSON_STATUS_LABELS[l.status] ?? l.status}
                            </span>
                            <Link
                              className="pub-btn"
                              href={`/teacher/lessons/${l.id}`}
                            >
                              تحرير الدرس
                            </Link>
                            {exam && (
                              <Link
                                className="pub-btn"
                                href={`/teacher/exams/${exam.id}`}
                              >
                                فتح الامتحان
                              </Link>
                            )}
                            {assignment && (
                              <Link
                                className="pub-btn"
                                href={`/teacher/assignments/${assignment.id}`}
                              >
                                تصحيح الواجب
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ))
            )}
          </article>
        );
      })}

      {courses !== null && courses.length === 0 && !error && (
        <p className="pub-note">
          مفيش كورسات للصف ده بعد — ابدأ بـ«كورس جديد للصف» من فوق.
        </p>
      )}
    </section>
  );
}
