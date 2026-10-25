"use client";

import Link from "next/link";
import type { CourseStructure } from "@/app/lib/api";
import {
  summarizeCurriculum,
  taskCountLabel,
  taskHref,
  taskMeta,
  taskNote,
  taskStatus,
  type CurriculumTask,
  typeIconKind,
} from "@/app/student/courses/lib/curriculum";
import { TaskGlyph } from "@/app/student/components/TaskGlyph";
import { TaskStatusCapsule } from "@/app/student/components/TaskStatusCapsule";

interface CurriculumBoardProps {
  courseId: string;
  structure: CourseStructure;
  tasks: CurriculumTask[];
  enriching: boolean;
}

function TaskRow({
  task,
  courseId,
}: {
  task: CurriculumTask;
  courseId: string;
}) {
  const locked =
    task.lesson.lockStatus === "LOCKED" || task.lesson.lockStatus === "EXPIRED";
  const href = taskHref(task, courseId);
  const status = taskStatus(task);
  const icon = typeIconKind(task.lesson.type);
  const note = taskNote(task);

  const body = (
    <>
      <span className="lc-task-main">
        <span className="lc-task-title-line">
          <span className="lc-task-title">{task.lesson.title}</span>
          {task.lesson.isFree && <span className="lc-task-tag">مجاني</span>}
        </span>
        <span className="lc-task-meta">{taskMeta(task)}</span>
        {note && <span className="lc-task-note">{note}</span>}
      </span>
      <span className="lc-task-status">
        <TaskStatusCapsule status={status} />
      </span>
    </>
  );

  return (
    <div className="lc-task-row" data-locked={locked || undefined}>
      <span className="lc-task-rail" aria-hidden="true">
        <span className="lc-rail-dot">
          <TaskGlyph name={icon} size={17} />
        </span>
      </span>
      {href ? (
        <Link
          href={href}
          className="lc-task-card"
          aria-label={`${task.lesson.title} — ${status.label}`}
        >
          {body}
        </Link>
      ) : (
        <div className="lc-task-card is-locked" aria-disabled="true">
          {body}
        </div>
      )}
    </div>
  );
}

export function CurriculumBoard({
  courseId,
  structure,
  tasks,
  enriching,
}: CurriculumBoardProps) {
  const { course } = structure;
  const summary = summarizeCurriculum(tasks);
  const hasExpired = tasks.some(
    (task) => task.lesson.lockStatus === "EXPIRED",
  );
  const description = course.description ?? course.shortDescription;

  return (
    <div className="lc-course">
      <nav className="lc-breadcrumb" aria-label="مسار الصفحة">
        <Link href="/student/courses">كورساتي</Link>
        <TaskGlyph name="chevron" size={12} />
        <span aria-current="page">{course.title}</span>
      </nav>

      <header className="lc-hero">
        <div className="lc-hero-glow" aria-hidden="true" />
        <div className="lc-hero-copy">
          <p className="lc-eyebrow">فهرس الكورس · المسار الأكاديمي</p>
          <h1 className="lc-hero-title">{course.title}</h1>
          {description && <p className="lc-hero-desc">{description}</p>}
          <div className="lc-hero-meta">
            <span>إعداد: {course.teacher.name}</span>
            {summary.total > 0 && (
              <>
                <span className="lc-sep" aria-hidden="true" />
                <span>{taskCountLabel(summary.total)} في المسار</span>
              </>
            )}
          </div>
        </div>

        <div className="lc-hero-stats" aria-label="ملخص المسار">
          <div className="lc-stat">
            <span className="lc-stat-value">{summary.total}</span>
            <span className="lc-stat-label">إجمالي المهام</span>
          </div>
          <div className="lc-stat">
            <span className="lc-stat-value">{summary.open}</span>
            <span className="lc-stat-label">متاحة الآن</span>
          </div>
          <div className="lc-stat">
            <span className="lc-stat-value">{summary.units}</span>
            <span className="lc-stat-label">
              {summary.units === 1 ? "وحدة" : "وحدات"}
            </span>
          </div>
        </div>

        <div className="lc-hero-track">
          <div className="lc-availability-head">
            <span>المسار المتاح</span>
            <strong>{summary.percent}%</strong>
          </div>
          <div
            className="lc-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={summary.percent}
            aria-label="نسبة المهام المتاحة في المسار"
          >
            <span
              className="lc-track-fill"
              style={{ width: `${summary.percent}%` }}
            />
          </div>
          <p className="lc-availability-note">
            {summary.total === 0
              ? "لا توجد مهام منشورة في هذا المسار بعد."
              : summary.open === summary.total
                ? "جميع مهام المسار متاحة الآن."
                : hasExpired
                  ? `${summary.open} من ${summary.total} مهام متاحة الآن — بعض المهام انتهت.`
                  : `${summary.open} من ${summary.total} مهام متاحة الآن — الباقي يُفتح بالتسلسل.`}
          </p>
        </div>
      </header>

      {structure.sections.length === 0 ? (
        <div className="lc-empty-card">
          <TaskGlyph name="book" size={26} />
          <h2>لا توجد وحدات منشورة بعد</h2>
          <p>سيظهر المسار الأكاديمي هنا فور نشر أول وحدة.</p>
        </div>
      ) : (
        <div className="lc-units" aria-busy={enriching}>
          {structure.sections.map((section, index) => {
            const sectionTasks = tasks.filter(
              (task) => task.sectionId === section.id,
            );
            return (
              <section className="lc-unit" key={section.id}>
                <header className="lc-unit-head">
                  <div className="lc-unit-heading">
                    <p className="lc-eyebrow">مسار الوحدة</p>
                    <h2 className="lc-unit-title">{section.title}</h2>
                  </div>
                  <div className="lc-unit-side">
                    <span className="lc-unit-index" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="lc-unit-count">
                      {taskCountLabel(sectionTasks.length)}
                    </span>
                  </div>
                </header>
                <div className="lc-unit-body">
                  {sectionTasks.map((task) => (
                    <TaskRow
                      key={task.lesson.id}
                      task={task}
                      courseId={courseId}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
