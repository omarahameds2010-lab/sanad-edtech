"use client";

import Link from "next/link";
import type { CourseStructure, StudentLesson } from "@/app/lib/api";
import {
  nextTask,
  taskHref,
  taskMeta,
  taskStatus,
  typeLabel,
  typeIconKind,
  unlockReason,
  type CurriculumTask,
} from "@/app/student/courses/lib/curriculum";
import {
  TaskGlyph,
  type TaskGlyphName,
} from "@/app/student/components/TaskGlyph";
import { TaskStatusCapsule } from "@/app/student/components/TaskStatusCapsule";

interface LessonSidebarProps {
  courseId: string | null;
  structure: CourseStructure | null;
  tasks: CurriculumTask[];
  currentLessonId: string;
  currentTask: CurriculumTask;
  currentData: StudentLesson;
  prerequisite?: CurriculumTask | null;
  loading?: boolean;
  error?: string | null;
}

interface SidebarCta {
  label: string;
  href: string | null;
  icon: TaskGlyphName;
  note: string | null;
  locked: boolean;
}

function nextCtaLabel(task: CurriculumTask): string {
  switch (task.lesson.type) {
    case "EXAM":
      return "الانتقال للاختبار فورًا";
    case "ASSIGNMENT":
      return "فتح الواجب";
    case "VIDEO":
      return "الدرس التالي";
    case "PDF":
    case "RESOURCE":
      return "فتح الملف التالي";
    case "LIVE":
      return "الانضمام للبث";
    default:
      return "الخطوة التالية";
  }
}

function buildCta(
  courseId: string | null,
  currentData: StudentLesson,
  next: CurriculumTask | null,
  prerequisite: CurriculumTask | null,
): SidebarCta {
  const examHref = currentData.exam
    ? `/student/exams/${currentData.exam.id}`
    : null;
  const assignmentHref = currentData.assignment
    ? `/student/assignments/${currentData.assignment.id}`
    : null;
  const lockedReason = unlockReason(currentData.access.unlockType);

  if (currentData.access.isLocked) {
    if (prerequisite && courseId) {
      const href = taskHref(prerequisite, courseId);
      if (href) {
        return {
          label:
            prerequisite.lesson.type === "EXAM"
              ? "ادخل الاختبار لفتح الحصة"
              : "افتح الواجب لفتح الحصة",
          href,
          icon: typeIconKind(prerequisite.lesson.type),
          note: lockedReason,
          locked: false,
        };
      }
    }

    return {
      label: "الحصة مقفلة",
      href: null,
      icon: "lock",
      note: lockedReason,
      locked: true,
    };
  }

  if (next) {
    const nextLocked =
      next.lesson.lockStatus === "LOCKED" ||
      next.lesson.lockStatus === "EXPIRED";

    if (nextLocked) {
      const reason = unlockReason(next.lesson.unlockType);

      // The student is standing on the prerequisite: entering it opens the
      // next node. This is a server rule, not an inferred completion.
      if (next.lesson.unlockType === "ENTER_EXAM" && examHref) {
        return {
          label: "ادخل الاختبار لفتح التالي",
          href: examHref,
          icon: "exam",
          note: reason,
          locked: false,
        };
      }
      if (next.lesson.unlockType === "ENTER_ASSIGNMENT" && assignmentHref) {
        return {
          label: "افتح الواجب لفتح التالي",
          href: assignmentHref,
          icon: "assignment",
          note: reason,
          locked: false,
        };
      }

      return {
        label: "الدرس التالي مقفل",
        href: null,
        icon: "lock",
        note: reason,
        locked: true,
      };
    }

    const href = courseId ? taskHref(next, courseId) : null;
    if (href) {
      return {
        label: nextCtaLabel(next),
        href,
        icon: typeIconKind(next.lesson.type),
        note: null,
        locked: false,
      };
    }
  }

  if (examHref) {
    return {
      label: "ادخل الاختبار",
      href: examHref,
      icon: "exam",
      note: null,
      locked: false,
    };
  }

  if (assignmentHref) {
    return {
      label: "افتح الواجب",
      href: assignmentHref,
      icon: "assignment",
      note: null,
      locked: false,
    };
  }

  if (courseId) {
    return {
      label: "العودة إلى مسار الكورس",
      href: `/student/courses/${courseId}`,
      icon: "back",
      note: null,
      locked: false,
    };
  }

  return {
    label: "العودة إلى كورساتي",
    href: "/student/courses",
    icon: "back",
    note: null,
    locked: false,
  };
}

export function LessonSidebar({
  courseId,
  structure,
  tasks,
  currentLessonId,
  currentTask,
  currentData,
  prerequisite = null,
  loading = false,
  error = null,
}: LessonSidebarProps) {
  const currentStatus = taskStatus(currentTask);
  const next = nextTask(tasks, currentLessonId);
  const cta = buildCta(courseId, currentData, next, prerequisite);
  const backHref = courseId
    ? `/student/courses/${courseId}`
    : "/student/courses";
  const backLabel = courseId ? "العودة إلى مسار الكورس" : "العودة إلى كورساتي";
  const showBack = cta.href !== backHref;

  const hasAttachments = Boolean(
    (currentData.assignment && currentData.lesson.type !== "ASSIGNMENT") ||
      (currentData.exam && currentData.lesson.type !== "EXAM"),
  );

  return (
    <aside className="lc-side" aria-label="مسار الحصة">
      <header className="lc-side-head">
        <p className="lc-side-eyebrow">مسار الوحدة</p>
        <h2 className="lc-side-title">
          {currentTask.sectionTitle || currentData.lesson.title}
        </h2>
        <div className="lc-side-current">
          <TaskStatusCapsule status={currentStatus} compact />
          <span className="lc-side-current-meta">{taskMeta(currentTask)}</span>
        </div>
      </header>

      {hasAttachments && (
        <div className="lc-side-attachments">
          <p className="lc-side-label">ملحقات هذه الحصة</p>
          {currentData.assignment &&
            currentData.lesson.type !== "ASSIGNMENT" && (
              <Link
                href={`/student/assignments/${currentData.assignment.id}`}
                className="lc-side-attach"
              >
                <span className="lc-side-attach-icon">
                  <TaskGlyph name="assignment" size={15} />
                </span>
                <span className="lc-side-attach-copy">
                  <span className="lc-side-attach-kicker">الواجب المرتبط</span>
                  <span className="lc-side-attach-name">
                    {currentData.assignment.title}
                  </span>
                </span>
                <TaskGlyph name="chevron" size={13} />
              </Link>
            )}
          {currentData.exam && currentData.lesson.type !== "EXAM" && (
            <Link
              href={`/student/exams/${currentData.exam.id}`}
              className="lc-side-attach"
            >
              <span className="lc-side-attach-icon">
                <TaskGlyph name="exam" size={15} />
              </span>
              <span className="lc-side-attach-copy">
                <span className="lc-side-attach-kicker">الاختبار المرتبط</span>
                <span className="lc-side-attach-name">
                  {currentData.exam.title}
                </span>
              </span>
              <TaskGlyph name="chevron" size={13} />
            </Link>
          )}
        </div>
      )}

      {loading && !structure ? (
        <div className="lc-side-fallback">
          <span className="lc-spinner" aria-hidden="true" />
          <p>جارٍ تحميل مسار الوحدة…</p>
        </div>
      ) : error && !structure ? (
        <div className="lc-side-fallback">
          <span className="lc-side-fallback-icon">
            <TaskGlyph name="refresh" size={20} />
          </span>
          <p>تعذر تحميل بقية المسار الآن.</p>
          <Link href={backHref} className="lc-side-back">
            {backLabel}
          </Link>
        </div>
      ) : structure ? (
        <div className="lc-side-scroll">
          <p className="lc-side-label">قائمة المحتويات</p>
          {structure.sections.map((section) => {
            const sectionTasks = tasks.filter(
              (task) => task.sectionId === section.id,
            );
            if (sectionTasks.length === 0) return null;

            return (
              <div className="lc-side-unit" key={section.id}>
                <p className="lc-side-unit-title">{section.title}</p>
                <ul className="lc-side-list">
                  {sectionTasks.map((task) => {
                    const isCurrent = task.lesson.id === currentLessonId;
                    const status = isCurrent ? currentStatus : taskStatus(task);
                    const locked = isCurrent
                      ? currentData.access.isLocked
                      : task.lesson.lockStatus === "LOCKED" ||
                        task.lesson.lockStatus === "EXPIRED";
                    const metaTask = isCurrent
                      ? {
                          ...task,
                          details: {
                            ...task.details,
                            studentLesson: currentData,
                          },
                        }
                      : task;
                    const href =
                      isCurrent || !courseId ? null : taskHref(task, courseId);

                    const inner = (
                      <>
                        <span className="lc-side-icon">
                          <TaskGlyph
                            name={typeIconKind(task.lesson.type)}
                            size={15}
                          />
                        </span>
                        <span className="lc-side-copy">
                          <span className="lc-side-name">
                            {task.lesson.title}
                          </span>
                          <span className="lc-side-meta">
                            {taskMeta(metaTask)}
                          </span>
                        </span>
                        {isCurrent ? (
                          <span className="lc-side-current-tag">الحالية</span>
                        ) : (
                          <span
                            className="lc-side-state"
                            data-tone={status.tone}
                            title={status.label}
                            aria-label={status.label}
                          >
                            {status.tone === "locked" ? (
                              <TaskGlyph name="lock" size={12} />
                            ) : (
                              <span className="lc-side-dot" />
                            )}
                          </span>
                        )}
                      </>
                    );

                    return (
                      <li key={task.lesson.id}>
                        {href ? (
                          <Link
                            href={href}
                            className="lc-side-item"
                            aria-label={`${task.lesson.title} — ${status.label}`}
                          >
                            {inner}
                          </Link>
                        ) : (
                          <div
                            className={`lc-side-item${
                              isCurrent ? " is-current" : ""
                            }${locked ? " is-locked" : ""}`}
                            aria-current={isCurrent ? "true" : undefined}
                            aria-disabled={locked ? "true" : undefined}
                          >
                            {inner}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="lc-side-fallback">
          <span className="lc-side-fallback-icon">
            <TaskGlyph name="book" size={20} />
          </span>
          <p>
            افتح هذه الحصة من صفحة الكورس لعرض بقية المهام في المسار.
          </p>
          <span className="lc-side-fallback-type">
            {typeLabel(currentData.lesson.type)}
          </span>
        </div>
      )}

      <footer className="lc-side-foot">
        {cta.href ? (
          <Link
            href={cta.href}
            className={`lc-side-cta${cta.locked ? " is-locked" : ""}`}
          >
            <span className="lc-side-cta-icon">
              <TaskGlyph name={cta.icon} size={17} />
            </span>
            <span className="lc-side-cta-copy">
              <span>{cta.label}</span>
              {cta.note && <small>{cta.note}</small>}
            </span>
            {cta.icon !== "back" && <TaskGlyph name="arrow" size={16} />}
          </Link>
        ) : (
          <div className="lc-side-cta is-locked" aria-disabled="true">
            <span className="lc-side-cta-icon">
              <TaskGlyph name="lock" size={17} />
            </span>
            <span className="lc-side-cta-copy">
              <span>{cta.label}</span>
              {cta.note && <small>{cta.note}</small>}
            </span>
          </div>
        )}

        {showBack && (
          <Link href={backHref} className="lc-side-back">
            <TaskGlyph name="back" size={14} />
            {backLabel}
          </Link>
        )}
      </footer>
    </aside>
  );
}
