"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError, type TeacherLessonDetail } from "@/app/lib/api";
import {
  LESSON_STATUS_LABELS,
  LESSON_TYPE_LABELS,
} from "@/app/lib/teacher-content";
import {
  AssignmentLessonEditor,
  ExamLessonEditor,
  VideoLessonEditor,
} from "@/app/components/editor";

interface Notice {
  ok: boolean;
  text: string;
}

export default function TeacherLessonPage() {
  const params = useParams();
  const lessonId = String(params.id);
  const { token } = useAuth();

  const [lesson, setLesson] = useState<TeacherLessonDetail | null>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [sectionTitle, setSectionTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);
  const [busyPublish, setBusyPublish] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const l = await api.getTeacherLesson(token, lessonId);
      setLesson(l);
      setTitle(l.title);
      setDescription(l.description ?? "");
      const [c, sections] = await Promise.all([
        api.getTeacherCourse(token, l.section.courseId),
        api.listSections(token, l.section.courseId),
      ]);
      setCourseTitle(c.title);
      setSectionTitle(
        sections.find((s) => s.id === l.sectionId)?.title ?? "الوحدة",
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذر تحميل الدرس");
    }
  }, [token, lessonId]);

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

  async function saveMeta() {
    if (!token || !lesson) return;
    if (title.trim() === "") {
      setNotice({ ok: false, text: "عنوان الدرس مطلوب." });
      return;
    }
    setSavingMeta(true);
    setNotice(null);
    try {
      const updated = await api.updateTeacherLesson(token, lesson.id, {
        title: title.trim(),
        description: description.trim() === "" ? undefined : description.trim(),
      });
      setLesson((prev) =>
        prev
          ? {
              ...prev,
              title: updated.title,
              description: updated.description ?? null,
            }
          : prev,
      );
      setNotice({ ok: true, text: "اتحفظت بيانات الدرس ✓" });
    } catch (e) {
      setNotice({
        ok: false,
        text: e instanceof ApiError ? e.message : "تعذر حفظ بيانات الدرس",
      });
    } finally {
      setSavingMeta(false);
    }
  }

  async function togglePublish() {
    if (!token || !lesson) return;
    setBusyPublish(true);
    setNotice(null);
    try {
      const updated =
        lesson.status === "PUBLISHED"
          ? await api.unpublishLesson(token, lesson.id)
          : await api.publishLesson(token, lesson.id);
      setLesson((prev) => (prev ? { ...prev, status: updated.status } : prev));
      setNotice({
        ok: true,
        text:
          updated.status === "PUBLISHED"
            ? "الدرس اتنشر — الطالب هيشوفه في صفحته ✓"
            : "الدرس اتشال من النشر.",
      });
    } catch (e) {
      setNotice({
        ok: false,
        text: e instanceof ApiError ? e.message : "تعذر تغيير حالة النشر",
      });
    } finally {
      setBusyPublish(false);
    }
  }

  return (
    <section>
      {lesson && (
        <Link
          href={`/teacher/courses/${lesson.section.courseId}`}
          className="pub-back"
        >
          → رجوع لمساحة الكورس
        </Link>
      )}

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

      {lesson && (
        <article className="tc-panel">
          <div className="pub-course-head">
            <div>
              <p className="pub-eyebrow" style={{ margin: 0 }}>
                {courseTitle} › {sectionTitle}
              </p>
              <h1
                className="pub-course-title"
                style={{ fontSize: 24, marginTop: 8 }}
              >
                {lesson.title}
              </h1>
              <div className="pub-course-chips">
                <span className="pub-chip">
                  {LESSON_TYPE_LABELS[lesson.type] ?? lesson.type}
                </span>
                <span
                  className={
                    lesson.status === "PUBLISHED"
                      ? "pub-chip pub-chip-on"
                      : "pub-chip pub-chip-draft"
                  }
                >
                  {LESSON_STATUS_LABELS[lesson.status] ?? lesson.status}
                </span>
              </div>
            </div>
            <div className="pub-course-links">
              <button
                type="button"
                className={
                  lesson.status === "PUBLISHED"
                    ? "pub-btn pub-btn-warn"
                    : "pub-btn pub-btn-primary"
                }
                disabled={busyPublish}
                onClick={() => void togglePublish()}
              >
                {busyPublish
                  ? "لحظة…"
                  : lesson.status === "PUBLISHED"
                    ? "إلغاء نشر الدرس"
                    : "نشر الدرس"}
              </button>
              <button
                type="button"
                className="pub-btn"
                onClick={() => void load()}
              >
                تحديث
              </button>
            </div>
          </div>
          {lesson.status !== "PUBLISHED" && (
            <p className="pub-note">
              الدرس مش منشور — انشره علشان يظهر للطالب في المنهج وفي صفحات
              الواجبات والاختبارات.
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

      {lesson && (
        <article className="tc-panel pub-course">
          <h2 className="pub-course-title">بيانات الدرس</h2>
          <div className="pub-form" style={{ marginTop: "var(--space-4)" }}>
            <div>
              <span className="pub-label">عنوان الدرس</span>
              <input
                className="sc-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <span className="pub-label">وصف الدرس (اختياري)</span>
              <textarea
                className="sc-input"
                style={{ minHeight: 84, resize: "vertical" }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="اشرح للطالب ما سيتعلمه في الدرس"
              />
            </div>
            <button
              type="button"
              className="pub-btn pub-btn-primary"
              style={{ justifySelf: "start" }}
              disabled={savingMeta}
              onClick={() => void saveMeta()}
            >
              {savingMeta ? "جاري الحفظ…" : "حفظ بيانات الدرس"}
            </button>
          </div>
        </article>
      )}

      {lesson && lesson.type === "VIDEO" && (
        <article className="tc-panel pub-course">
          <h2 className="pub-course-title">محتوى الفيديو</h2>
          <p className="pub-sub" style={{ marginBottom: "var(--space-4)" }}>
            اربط فيديو يوتيوب (غير مدرج) أو ارفع فيديو — وبعد الحفظ الطالب يشوفه
            في صفحة الدرس.
          </p>
          <VideoLessonEditor
            lessonId={lesson.id}
            initialData={{
              title: lesson.title,
              description: lesson.description ?? undefined,
              videoId: lesson.videoId ?? undefined,
              duration: lesson.duration ?? undefined,
            }}
          />
        </article>
      )}

      {lesson && lesson.type === "EXAM" && (
        <article className="tc-panel pub-course">
          <h2 className="pub-course-title">الامتحان</h2>
          {lesson.exam ? (
            <>
              <p className="pub-sub" style={{ marginBottom: "var(--space-4)" }}>
                الامتحان مربوط بالدرس ده: «{lesson.exam.title}» —{" "}
                {lesson.exam.timerMinutes} دقيقة.
              </p>
              <div className="pub-course-links">
                <Link
                  className="pub-btn pub-btn-primary"
                  href={`/teacher/exams/${lesson.exam.id}`}
                >
                  فتح صفحة الامتحان والتصحيح
                </Link>
              </div>
              <p className="pub-note">
                لما الدرس يبقى منشور، الطالب يشوف الامتحان في صفحة الاختبارات —
                ودخوله الامتحان يفتح الدرس اللي بعده في المنهج.
              </p>
            </>
          ) : (
            <>
              <p className="pub-sub" style={{ marginBottom: "var(--space-4)" }}>
                ارفع أسئلة الامتحان ودرجاته من هنا، وبعد «حفظ ونشر الاختبار»
                هيتفتح لك رابط التصحيح.
              </p>
              <ExamLessonEditor
                lessonId={lesson.id}
                initialData={{ title: lesson.title }}
              />
            </>
          )}
        </article>
      )}

      {lesson && lesson.type === "ASSIGNMENT" && (
        <article className="tc-panel pub-course">
          <h2 className="pub-course-title">الواجب</h2>
          {lesson.assignment ? (
            <>
              <p className="pub-sub" style={{ marginBottom: "var(--space-4)" }}>
                الواجب مربوط بالدرس ده: «{lesson.assignment.title}» —{" "}
                {lesson.assignment.timerMinutes} دقيقة.
              </p>
              <div className="pub-course-links">
                <Link
                  className="pub-btn pub-btn-primary"
                  href={`/teacher/assignments/${lesson.assignment.id}`}
                >
                  فتح صفحة تصحيح الواجب
                </Link>
              </div>
              <p className="pub-note">
                لما الدرس يبقى منشور، الطالب يشوف الواجب في صفحة الواجبات —
                وتسليمه الواجب يفتح الامتحان المرتبط في المنهج.
              </p>
            </>
          ) : (
            <>
              <p className="pub-sub" style={{ marginBottom: "var(--space-4)" }}>
                حدّد تعليمات الواجب والمدة وعدد المحاولات من هنا، وبعد «حفظ ونشر
                الواجب» هيتفتح لك رابط التصحيح.
              </p>
              <AssignmentLessonEditor
                lessonId={lesson.id}
                initialData={{ title: lesson.title }}
              />
            </>
          )}
        </article>
      )}

      {lesson && !["VIDEO", "EXAM", "ASSIGNMENT"].includes(lesson.type) && (
        <p className="pub-note">
          نوع الدرس ده لسه مش واخد محرر مخصص — أنواع الرفع المتاحة دلوقتي: درس
          فيديو، امتحان، واجب.
        </p>
      )}
    </section>
  );
}
