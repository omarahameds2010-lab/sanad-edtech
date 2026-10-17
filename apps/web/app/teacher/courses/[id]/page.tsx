"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/app/lib/auth";
import {
  api,
  ApiError,
  type TeacherCourse,
  type TeacherSection,
} from "@/app/lib/api";
import {
  COURSE_STATUS_LABELS,
  LESSON_STATUS_LABELS,
  LESSON_TYPE_LABELS,
  gradeLabel,
  isPrepGrade,
} from "@/app/lib/teacher-content";
import ConfirmDialog from "@/app/student/components/ConfirmDialog";

const LESSON_TYPE_OPTIONS = [
  { value: "EXAM", label: "امتحان" },
  { value: "ASSIGNMENT", label: "واجب" },
  { value: "VIDEO", label: "درس فيديو" },
];

interface Notice {
  ok: boolean;
  text: string;
}

export default function CourseWorkspacePage() {
  const params = useParams();
  const courseId = String(params.id);
  const { token } = useAuth();

  const [course, setCourse] = useState<TeacherCourse | null>(null);
  const [sections, setSections] = useState<TeacherSection[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const [busyCourse, setBusyCourse] = useState(false);
  const [busyLessonId, setBusyLessonId] = useState<string | null>(null);

  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [addingSection, setAddingSection] = useState(false);

  const [lessonForSection, setLessonForSection] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonType, setLessonType] = useState("EXAM");
  const [creatingLesson, setCreatingLesson] = useState(false);
  const [lessonError, setLessonError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const [c, s] = await Promise.all([
        api.getTeacherCourse(token, courseId),
        api.listSections(token, courseId),
      ]);
      setCourse(c);
      setSections(s);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذر تحميل مساحة الكورس");
    }
  }, [token, courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!token) {
    return (
      <div className="pub-note">
        سجّل الدخول أولًا. <Link href="/login">تسجيل الدخول</Link>
      </div>
    );
  }

  const backHref =
    course?.grade && isPrepGrade(course.grade)
      ? `/teacher/publish/${course.grade}`
      : "/teacher/publish";

  async function toggleCoursePublish() {
    if (!token || !course) return;
    setBusyCourse(true);
    setNotice(null);
    try {
      const updated =
        course.status === "PUBLISHED"
          ? await api.unpublishCourse(token, course.id)
          : await api.publishCourse(token, course.id);
      setCourse((prev) => (prev ? { ...prev, status: updated.status } : prev));
      setNotice({
        ok: true,
        text:
          updated.status === "PUBLISHED"
            ? "الكورس اتنشر — الطالب هيشوف دروسه المنشورة ✓"
            : "الكورس اتشال من النشر.",
      });
    } catch (e) {
      setNotice({
        ok: false,
        text:
          e instanceof ApiError
            ? `تعذر تغيير حالة النشر: ${e.message} (لازم الكورس يكون له وصف مختصر ودرس منشور واحد على الأقل قبل النشر)`
            : "تعذر تغيير حالة النشر",
      });
    } finally {
      setBusyCourse(false);
    }
  }

  async function addSection(e: React.FormEvent) {
    e.preventDefault();
    if (!token || newSectionTitle.trim() === "") return;
    setAddingSection(true);
    try {
      const created = await api.createSection(token, courseId, {
        title: newSectionTitle.trim(),
      });
      setSections((prev) => [...(prev ?? []), created]);
      setNewSectionTitle("");
      setNotice({ ok: true, text: "اتضافت الوحدة ✓" });
    } catch (e) {
      setNotice({
        ok: false,
        text: e instanceof ApiError ? e.message : "تعذر إضافة الوحدة",
      });
    } finally {
      setAddingSection(false);
    }
  }

  async function submitLesson() {
    if (!token || !lessonForSection) return;
    if (lessonTitle.trim() === "") {
      setLessonError("اكتب عنوان الدرس الأول.");
      return;
    }
    setCreatingLesson(true);
    setLessonError(null);
    try {
      await api.createLesson(token, lessonForSection, {
        title: lessonTitle.trim(),
        type: lessonType,
      });
      setLessonForSection(null);
      setLessonTitle("");
      await load();
      setNotice({
        ok: true,
        text: "اتضاف الدرس — افتحه من «تحرير الدرس» وارفع محتواه، وبعدها انشره علشان الطالب يشوفه.",
      });
    } catch (e) {
      setLessonError(e instanceof ApiError ? e.message : "تعذر إضافة الدرس");
    } finally {
      setCreatingLesson(false);
    }
  }

  async function toggleLesson(lessonId: string, status: string) {
    if (!token) return;
    setBusyLessonId(lessonId);
    setNotice(null);
    try {
      if (status === "PUBLISHED") {
        await api.unpublishLesson(token, lessonId);
      } else {
        await api.publishLesson(token, lessonId);
      }
      await load();
    } catch (e) {
      setNotice({
        ok: false,
        text: e instanceof ApiError ? e.message : "تعذر تغيير حالة الدرس",
      });
    } finally {
      setBusyLessonId(null);
    }
  }

  async function confirmDeleteLesson() {
    if (!token || !deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteLesson(token, deleteTarget.id);
      setDeleteTarget(null);
      await load();
      setNotice({ ok: true, text: "اتحذف الدرس من المنهج." });
    } catch (e) {
      setNotice({
        ok: false,
        text: e instanceof ApiError ? e.message : "تعذر حذف الدرس",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section>
      <Link href={backHref} className="pub-back">
        → صفحة الصف
      </Link>

      {error && (
        <div className="pub-note">
          <p className="pub-error" style={{ marginTop: 0 }}>
            {error}
          </p>
          <button type="button" className="pub-btn" onClick={() => void load()}>
            حاول تاني
          </button>
        </div>
      )}

      {course && (
        <article className="tc-panel">
          <div className="pub-course-head">
            <div>
              <p className="pub-eyebrow" style={{ margin: 0 }}>
                مساحة الكورس
              </p>
              <h1
                className="pub-course-title"
                style={{ fontSize: 24, marginTop: 8 }}
              >
                {course.title}
              </h1>
              <div className="pub-course-chips">
                <span
                  className={
                    course.status === "PUBLISHED"
                      ? "pub-chip pub-chip-on"
                      : "pub-chip pub-chip-draft"
                  }
                >
                  {COURSE_STATUS_LABELS[course.status] ?? course.status}
                </span>
                <span className="pub-chip pub-chip-muted">
                  {gradeLabel(course.grade)}
                </span>
                <span className="pub-chip pub-chip-muted" dir="ltr">
                  {course.slug}
                </span>
              </div>
            </div>
            <div className="pub-course-links">
              <button
                type="button"
                className={
                  course.status === "PUBLISHED"
                    ? "pub-btn pub-btn-warn"
                    : "pub-btn pub-btn-primary"
                }
                disabled={busyCourse}
                onClick={() => void toggleCoursePublish()}
              >
                {busyCourse
                  ? "لحظة…"
                  : course.status === "PUBLISHED"
                    ? "إلغاء نشر الكورس"
                    : "نشر الكورس"}
              </button>
            </div>
          </div>
          {course.status !== "PUBLISHED" && (
            <p className="pub-note">
              الكورس مش منشور — الطالب مش هيشوفه غير بعد ما تنشره، والنشر بيحتاج
              درس واحد منشور على الأقل.
            </p>
          )}
        </article>
      )}

      {notice && (
        <p className={notice.ok ? "pub-note pub-note-ok" : "pub-note"}>
          <span style={notice.ok ? {} : { color: "#fca5a5" }}>
            {notice.text}
          </span>
        </p>
      )}

      {sections === null && !error && (
        <p className="pub-note">جاري تحميل المنهج…</p>
      )}

      {sections !== null && (
        <article className="tc-panel pub-course">
          <div className="pub-course-head">
            <h2 className="pub-course-title">المنهج</h2>
            <div className="pub-course-links">
              <span className="pub-chip pub-chip-muted">
                {sections.length} وحدة
              </span>
            </div>
          </div>

          {sections.length === 0 && (
            <p className="pub-empty">
              مفيش وحدات بعد — أضف أول وحدة من تحت، وبعدها ضيف الدروس جواها.
            </p>
          )}

          {sections.map((s) => (
            <div key={s.id} className="pub-sec">
              <div className="pub-course-head">
                <h3 className="pub-sec-title" style={{ margin: 0 }}>
                  {s.title}
                </h3>
                <button
                  type="button"
                  className="pub-btn"
                  onClick={() => {
                    setLessonForSection(s.id);
                    setLessonTitle("");
                    setLessonType("EXAM");
                    setLessonError(null);
                  }}
                >
                  + إضافة درس
                </button>
              </div>
              <div style={{ marginTop: 12 }}>
                {(s.lessons ?? []).length === 0 ? (
                  <p className="pub-empty" style={{ marginTop: 0 }}>
                    مفيش دروس في الوحدة دي بعد.
                  </p>
                ) : (
                  (s.lessons ?? []).map((l) => (
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
                          className="pub-btn pub-btn-primary"
                          href={`/teacher/lessons/${l.id}`}
                        >
                          تحرير الدرس
                        </Link>
                        <button
                          type="button"
                          className="pub-btn"
                          disabled={busyLessonId === l.id}
                          onClick={() => void toggleLesson(l.id, l.status)}
                        >
                          {busyLessonId === l.id
                            ? "…"
                            : l.status === "PUBLISHED"
                              ? "إلغاء النشر"
                              : "نشر"}
                        </button>
                        <button
                          type="button"
                          className="pub-btn pub-btn-warn"
                          onClick={() =>
                            setDeleteTarget({ id: l.id, title: l.title })
                          }
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}

          <form className="pub-inline-form" onSubmit={addSection}>
            <input
              className="sc-input"
              style={{ maxWidth: 340 }}
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              placeholder="عنوان الوحدة الجديدة…"
            />
            <button
              type="submit"
              className="pub-btn pub-btn-primary"
              disabled={addingSection || newSectionTitle.trim() === ""}
            >
              {addingSection ? "لحظة…" : "+ إضافة وحدة"}
            </button>
          </form>
        </article>
      )}

      {lessonForSection && (
        <div
          className="sc-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="إضافة درس"
          onClick={(e) => {
            if (e.target === e.currentTarget && !creatingLesson) {
              setLessonForSection(null);
              setLessonError(null);
            }
          }}
        >
          <div className="sc-modal">
            <p className="sc-eyebrow" style={{ margin: 0 }}>
              درس جديد
            </p>
            <h3
              className="sc-title"
              style={{ fontSize: 24, marginTop: "var(--space-3)" }}
            >
              إضافة درس للوحدة
            </h3>
            <div className="pub-form" style={{ marginTop: "var(--space-4)" }}>
              <div>
                <span className="pub-label">عنوان الدرس</span>
                <input
                  className="sc-input"
                  autoFocus
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder={
                    lessonType === "EXAM"
                      ? "مثال: امتحان الوحدة الأولى"
                      : lessonType === "ASSIGNMENT"
                        ? "مثال: واجب مراجعة القواعد"
                        : "مثال: شرح المفعول به"
                  }
                />
              </div>
              <div>
                <span className="pub-label">نوع الدرس</span>
                <div className="pub-type-row">
                  {LESSON_TYPE_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      className="pub-type-opt"
                      aria-pressed={lessonType === o.value}
                      onClick={() => setLessonType(o.value)}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              {(lessonType === "EXAM" || lessonType === "ASSIGNMENT") && (
                <p className="pub-note" style={{ marginTop: 0 }}>
                  بعد الإضافة، افتح الدرس من «تحرير الدرس» وحدّد{" "}
                  {lessonType === "EXAM"
                    ? "الأسئلة والدرجات"
                    : "التعليمات والمدة"}
                  ، وبعدها انشر الدرس علشان الطالب يشوفه.
                </p>
              )}
              {lessonError && (
                <p className="pub-error" style={{ marginTop: 0 }}>
                  {lessonError}
                </p>
              )}
            </div>
            <div className="pub-modal-actions">
              <button
                type="button"
                className="sc-btn sc-btn-primary"
                disabled={creatingLesson}
                onClick={() => void submitLesson()}
              >
                {creatingLesson ? "لحظة…" : "أضف الدرس"}
              </button>
              <button
                type="button"
                className="sc-btn sc-btn-ghost"
                disabled={creatingLesson}
                onClick={() => {
                  setLessonForSection(null);
                  setLessonError(null);
                }}
              >
                رجع تاني
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        eyebrow="حذف درس"
        title="متأكد إنك هتحذف الدرس؟"
        body={
          deleteTarget
            ? `«${deleteTarget.title}» هيتشال من المنهج نهائيًا. لو محتاجه مخفي بس، استخدم «إلغاء النشر» بدل الحذف.`
            : ""
        }
        confirmLabel="أيوه، احذفه"
        cancelLabel="رجعه مكانه"
        busy={deleting}
        onConfirm={() => void confirmDeleteLesson()}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}
