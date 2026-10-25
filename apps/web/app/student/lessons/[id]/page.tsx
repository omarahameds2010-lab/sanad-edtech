"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError, type StudentLesson } from "@/app/lib/api";
import {
  formatDuration,
  taskHref,
  taskStatus,
  typeLabel,
  typeIconKind,
  unlockReason,
  type CurriculumTask,
  type TaskStatus,
} from "@/app/student/courses/lib/curriculum";
import { useCurriculum } from "@/app/student/courses/lib/use-curriculum";
import { TaskGlyph } from "@/app/student/components/TaskGlyph";
import { TaskStatusCapsule } from "@/app/student/components/TaskStatusCapsule";
import { CinemaPlayer } from "./components/CinemaPlayer";
import { LessonSidebar } from "./components/LessonSidebar";
import { LessonTaskBrief } from "./components/LessonTaskBrief";

function lessonErrorLabel(message: string | null): string {
  if (!message) return "لم نجد هذه الحصة";
  if (message.includes("Not enrolled")) {
    return "أنت غير مشترك في هذا الكورس";
  }
  if (message.includes("Lesson not found")) return "لم نجد هذه الحصة";
  return message;
}

function StateShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="sc-canvas lc-page">
      <div className="lp-container" style={{ maxWidth: 1240 }}>
        {children}
      </div>
    </div>
  );
}

function LessonNote({
  label,
  children,
  meta,
}: {
  label: string;
  children: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <section className="lc-note">
      <div className="lc-note-head">
        <span className="lc-note-mark" aria-hidden="true" />
        <span className="lc-note-label">{label}</span>
      </div>
      <div className="lc-note-copy">{children}</div>
      {meta && <div className="lc-note-meta">{meta}</div>}
    </section>
  );
}

export default function StudentLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { token, ready } = useAuth();
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [courseReady, setCourseReady] = useState(false);
  const [data, setData] = useState<StudentLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setLessonId(p.id));
  }, [params]);

  // The course context rides in the query string so a lesson opened from the
  // curriculum can show the whole path, while a direct link degrades honestly.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = new URLSearchParams(window.location.search);
    setCourseId(query.get("course"));
    setCourseReady(true);
  }, [lessonId]);

  useEffect(() => {
    if (!lessonId || !token) {
      setLoading(true);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    api
      .getStudentLesson(token, lessonId)
      .then((lesson) => {
        if (!cancelled) setData(lesson);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(
            e instanceof ApiError ? e.message : "تعذر تحميل هذه الحصة",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lessonId, token]);

  const {
    structure,
    tasks,
    loading: curriculumLoading,
    error: curriculumError,
  } = useCurriculum(token, courseId);

  const currentTask = useMemo<CurriculumTask | null>(() => {
    if (!data) return null;

    const found = tasks.find((task) => task.lesson.id === data.lesson.id);
    const lockStatus = data.access.isLocked
      ? "LOCKED"
      : data.access.lockStatus || "UNLOCKED";

    const lesson = found
      ? {
          ...found.lesson,
          lockStatus,
          unlockType: data.access.unlockType || found.lesson.unlockType,
        }
      : {
          id: data.lesson.id,
          title: data.lesson.title,
          type: data.lesson.type,
          orderIndex: data.lesson.orderIndex,
          duration: data.lesson.duration,
          lockStatus,
          unlockType: data.access.unlockType,
          isFree: false,
        };

    return {
      lesson,
      sectionId: found?.sectionId ?? "",
      sectionTitle: found?.sectionTitle ?? "",
      sectionOrderIndex: found?.sectionOrderIndex ?? 0,
      details: {
        ...(found?.details ?? {}),
        studentLesson: data,
      },
    };
  }, [data, tasks]);

  const prerequisite = useMemo<CurriculumTask | null>(() => {
    if (!data?.access.isLocked) return null;
    const index = tasks.findIndex((task) => task.lesson.id === data.lesson.id);
    if (index <= 0) return null;

    const wantedType =
      data.access.unlockType === "ENTER_EXAM"
        ? "EXAM"
        : data.access.unlockType === "ENTER_ASSIGNMENT"
          ? "ASSIGNMENT"
          : null;
    if (!wantedType) return null;

    for (let i = index - 1; i >= 0; i -= 1) {
      if (tasks[i].lesson.type === wantedType) return tasks[i];
    }
    return null;
  }, [data, tasks]);

  if (!ready || (ready && token && (loading || !courseReady))) {
    return (
      <StateShell>
        <div className="lc-state-card">
          <span className="lc-spinner" aria-hidden="true" />
          <p>جارٍ تحميل الحصة…</p>
        </div>
      </StateShell>
    );
  }

  if (!token) {
    return (
      <StateShell>
        <div className="lc-state-card">
          <p className="lc-eyebrow">الحصة</p>
          <h1 className="lc-state-title">سجّل الدخول لعرض الحصة</h1>
          <p>الحصص وحالات التقدم مرتبطة بحسابك.</p>
          <Link href="/login" className="lc-outline-btn">
            تسجيل الدخول
          </Link>
        </div>
      </StateShell>
    );
  }

  if (error || !data) {
    const backHref = courseId
      ? `/student/courses/${courseId}`
      : "/student/courses";
    return (
      <StateShell>
        <div className="lc-state-card">
          <p className="lc-eyebrow">تعذر فتح الحصة</p>
          <h1 className="lc-state-title">{lessonErrorLabel(error)}</h1>
          <p>ارجع إلى مسار الكورس واختر الحصة مرة أخرى.</p>
          <Link href={backHref} className="lc-outline-btn">
            العودة إلى المسار
          </Link>
        </div>
      </StateShell>
    );
  }

  if (!currentTask) {
    return (
      <StateShell>
        <div className="lc-state-card">
          <span className="lc-spinner" aria-hidden="true" />
          <p>جارٍ تجهيز الحصة…</p>
        </div>
      </StateShell>
    );
  }

  const locked = data.access.isLocked;
  const baseStatus = taskStatus(currentTask);
  const isAssessment =
    data.lesson.type === "EXAM" ||
    data.lesson.type === "ASSIGNMENT" ||
    data.lesson.type === "QUIZ";
  const pageStatus: TaskStatus = locked
    ? baseStatus
    : isAssessment
      ? baseStatus
      : data.lesson.type === "VIDEO"
        ? { label: "متاحة الآن", tone: "emerald", pulse: false }
        : { label: "لا توجد مواد", tone: "muted", pulse: false };

  const sectionTitle = currentTask.sectionTitle || null;
  const courseTitle = structure?.course.title ?? null;
  const courseHref = courseId
    ? `/student/courses/${courseId}`
    : "/student/courses";
  const backLabel = courseId ? "العودة إلى مسار الكورس" : "العودة إلى كورساتي";

  const firstVideo =
    data.lesson.type === "VIDEO" ? data.videos[0] ?? null : null;
  const videoDuration =
    firstVideo?.duration && firstVideo.duration > 0
      ? firstVideo.duration
      : null;

  const prerequisiteHref =
    prerequisite && courseId ? taskHref(prerequisite, courseId) : null;
  const prerequisiteLabel =
    prerequisite?.lesson.type === "EXAM"
      ? "ادخل الاختبار لفتح الحصة"
      : prerequisite?.lesson.type === "ASSIGNMENT"
        ? "افتح الواجب لفتح الحصة"
        : "الذهاب إلى الخطوة السابقة";

  const youTubeVideo =
    data.videos.find(
      (video) => video.provider === "youtube" && video.providerVideoId,
    ) ?? null;
  const hasAnyVideo = data.videos.length > 0;

  const examView = currentTask.details?.examView ?? null;
  const examId = data.exam?.id ?? examView?.id ?? null;
  const examTimer =
    examView?.timerMinutes ??
    data.exam?.timerMinutes ??
    (data.lesson.duration ? Math.round(data.lesson.duration / 60) : null);
  const examHref = examId ? `/student/exams/${examId}` : null;
  const examCta = examView?.activeAttempt
    ? "أكمل الاختبار"
    : examView && examView.studentAttemptCount > 0
      ? examView.canAttempt
        ? "إعادة المحاولة"
        : "عرض الاختبار"
      : examView && examView.canAttempt === false
        ? "عرض الاختبار"
        : "ادخل الاختبار";
  const examTimerNote =
    !examView?.activeAttempt && (examView?.canAttempt ?? true);
  const examDescription = examView?.description ?? data.lesson.description;
  const examInstructions = examView?.instructions ?? null;

  const assignmentView = currentTask.details?.assignmentView ?? null;
  const assignmentId =
    data.assignment?.id ?? assignmentView?.id ?? null;
  const assignmentTimer =
    assignmentView?.timerMinutes ??
    (data.lesson.duration ? Math.round(data.lesson.duration / 60) : null);
  const assignmentHref = assignmentId
    ? `/student/assignments/${assignmentId}`
    : null;
  const assignmentHasAnswer = Boolean(
    assignmentView?.activeSubmission &&
      (Boolean(assignmentView.activeSubmission.content?.trim()) ||
        (Array.isArray(assignmentView.activeSubmission.attachments) &&
          assignmentView.activeSubmission.attachments.length > 0)),
  );
  const assignmentCta = assignmentView?.activeSubmission
    ? assignmentHasAnswer
      ? "عرض التسليم"
      : "متابعة الواجب"
    : assignmentView && assignmentView.studentAttemptCount > 0
      ? assignmentView.canAttempt
        ? "إعادة المحاولة"
        : "عرض الواجب"
      : assignmentView && assignmentView.canAttempt === false
        ? "عرض الواجب"
        : "افتح الواجب";
  const assignmentTimerNote =
    !assignmentView?.activeSubmission && (assignmentView?.canAttempt ?? true);
  const assignmentDescription =
    assignmentView?.description ?? data.lesson.description;
  const assignmentInstructions = assignmentView?.instructions ?? null;

  // The header duration must match the task's own source of truth: the
  // actual video length, the exam/assignment timer view, then the persisted
  // lesson duration as an honest last resort.
  const headerMinutes =
    data.lesson.type === "EXAM" || data.lesson.type === "QUIZ"
      ? examTimer
      : data.lesson.type === "ASSIGNMENT"
        ? assignmentTimer
        : null;
  const duration = formatDuration(
    headerMinutes
      ? headerMinutes * 60
      : videoDuration ?? data.lesson.duration,
  );

  const fileKind =
    data.lesson.type === "QUIZ"
      ? "QUIZ"
      : data.lesson.type === "LIVE"
        ? "LIVE"
        : data.lesson.type === "RESOURCE"
          ? "RESOURCE"
          : "PDF";

  return (
    <div className="sc-canvas lc-page">
      <div className="lp-container" style={{ maxWidth: 1240 }}>
        <div className="lc-lesson">
          <nav className="lc-breadcrumb" aria-label="مسار الصفحة">
            <Link href="/student/courses">كورساتي</Link>
            <TaskGlyph name="chevron" size={12} />
            {courseId && (
              <>
                <Link href={courseHref}>{courseTitle ?? "الكورس"}</Link>
                <TaskGlyph name="chevron" size={12} />
              </>
            )}
            <span aria-current="page">{data.lesson.title}</span>
          </nav>

          <div className="lc-lesson-grid">
            <div className="lc-lesson-main">
              <header className="lc-lesson-head">
                <div className="lc-lesson-kicker">
                  <span className="lc-chip">
                    <TaskGlyph
                      name={typeIconKind(data.lesson.type)}
                      size={14}
                    />
                    {typeLabel(data.lesson.type)}
                  </span>
                  {duration && (
                    <span className="lc-chip">
                      <TaskGlyph name="clock" size={13} />
                      {duration}
                    </span>
                  )}
                  {sectionTitle && (
                    <span className="lc-chip">{sectionTitle}</span>
                  )}
                  <TaskStatusCapsule status={pageStatus} compact />
                </div>
                <h1 className="lc-lesson-title">{data.lesson.title}</h1>
              </header>

              {locked ? (
                <section className="lc-lock-card">
                  <span className="lc-lock-orb" aria-hidden="true">
                    <TaskGlyph name="lock" size={28} strokeWidth={1.4} />
                  </span>
                  <p className="lc-eyebrow">درس مقفل</p>
                  <h2 className="lc-lock-title">
                    هذه الحصة تُفتح بعد خطوة سابقة
                  </h2>
                  <p className="lc-lock-copy">
                    {unlockReason(data.access.unlockType) ??
                      "أكمل الخطوة السابقة لفتح هذه الحصة."}
                  </p>
                  {data.lesson.description && (
                    <p className="lc-lock-desc">{data.lesson.description}</p>
                  )}
                  <div className="lc-lock-actions">
                    {prerequisiteHref && (
                      <Link
                        href={prerequisiteHref}
                        className="lc-solid-btn"
                      >
                        {prerequisiteLabel}
                        <TaskGlyph name="arrow" size={16} />
                      </Link>
                    )}
                    <Link href={courseHref} className="lc-outline-btn">
                      {backLabel}
                    </Link>
                  </div>
                </section>
              ) : data.lesson.type === "VIDEO" ? (
                <>
                  <div className="lc-cinema-shell">
                    <span className="lc-cinema-halo" aria-hidden="true" />
                    {youTubeVideo ? (
                      <CinemaPlayer
                        key={youTubeVideo.id}
                        video={youTubeVideo}
                        title={youTubeVideo.title || data.lesson.title}
                      />
                    ) : (
                      <div className="lc-cinema-frame lc-cinema-frame--empty">
                        <div className="lc-cinema-empty">
                          <span className="lc-cinema-empty-orb">
                            <TaskGlyph name="play" size={26} />
                          </span>
                          <p className="lc-eyebrow">درس مرئي</p>
                          <h2>
                            {hasAnyVideo
                              ? "هذا الفيديو غير مدعوم في المشغل الحالي."
                              : "لا يوجد فيديو متاح لهذه الحصة بعد."}
                          </h2>
                          <p>
                            {hasAnyVideo
                              ? "افتح الحصة من متصفح آخر أو تواصل مع المعلم."
                              : "سيظهر المشغل هنا فور إرفاق الفيديو."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <LessonNote
                    label="توجيه الحصة"
                    meta={
                      <>
                        <span>{typeLabel(data.lesson.type)}</span>
                        {duration && (
                          <>
                            <span className="lc-sep" aria-hidden="true" />
                            <span>{duration}</span>
                          </>
                        )}
                        <span className="lc-sep" aria-hidden="true" />
                        <span>
                          {locked ? "مقفلة" : "متاحة الآن"}
                        </span>
                      </>
                    }
                  >
                    <p>
                      {data.lesson.description ??
                        "لم يضف المعلم وصفًا لهذه الحصة بعد."}
                    </p>
                  </LessonNote>
                </>
              ) : data.lesson.type === "EXAM" ||
                data.lesson.type === "QUIZ" ? (
                <>
                  <LessonTaskBrief
                    kind={data.lesson.type === "QUIZ" ? "QUIZ" : "EXAM"}
                    title={data.exam?.title ?? data.lesson.title}
                    description={examDescription}
                    timerMinutes={examTimer}
                    questionCount={examView?.questions.length ?? null}
                    maxAttempts={examView?.maxAttempts ?? null}
                    status={baseStatus}
                    href={examHref}
                    ctaLabel={examCta}
                    timerNote={examTimerNote}
                  />
                  {examInstructions && (
                    <LessonNote label="تعليمات الاختبار">
                      <p>{examInstructions}</p>
                    </LessonNote>
                  )}
                </>
              ) : data.lesson.type === "ASSIGNMENT" ? (
                <>
                  <LessonTaskBrief
                    kind="ASSIGNMENT"
                    title={data.assignment?.title ?? data.lesson.title}
                    description={assignmentDescription}
                    timerMinutes={assignmentTimer}
                    maxAttempts={assignmentView?.maxAttempts ?? null}
                    status={baseStatus}
                    href={assignmentHref}
                    ctaLabel={assignmentCta}
                    timerNote={assignmentTimerNote}
                  />
                  {assignmentInstructions && (
                    <LessonNote label="تعليمات الواجب">
                      <p>{assignmentInstructions}</p>
                    </LessonNote>
                  )}
                </>
              ) : (
                <>
                  <LessonTaskBrief
                    kind={fileKind}
                    title={data.lesson.title}
                    description={
                      data.lesson.description ??
                      "لم يرفق المعلم مواد لهذه الحصة بعد."
                    }
                    timerMinutes={null}
                    status={{
                      label: "لا توجد مواد",
                      tone: "muted",
                      pulse: false,
                    }}
                    href={null}
                    ctaLabel=""
                  />
                  <LessonNote label="ملاحظة الحصة">
                    <p>
                      هذه الحصة من نوع {typeLabel(data.lesson.type)}، ولا
                      تعرض الصفحة الحالية مواد قابلة للفتح بعد.
                    </p>
                  </LessonNote>
                </>
              )}
            </div>

            <LessonSidebar
              courseId={courseId}
              structure={structure}
              tasks={tasks}
              currentLessonId={data.lesson.id}
              currentTask={currentTask}
              currentData={data}
              prerequisite={prerequisite}
              loading={curriculumLoading}
              error={curriculumError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
