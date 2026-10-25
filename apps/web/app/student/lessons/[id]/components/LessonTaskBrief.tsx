"use client";

import Link from "next/link";
import {
  formatDuration,
  questionCountLabel,
  typeLabel,
  type TaskStatus,
} from "@/app/student/courses/lib/curriculum";
import { TaskGlyph } from "@/app/student/components/TaskGlyph";
import { TaskStatusCapsule } from "@/app/student/components/TaskStatusCapsule";

interface LessonTaskBriefProps {
  kind: "EXAM" | "ASSIGNMENT" | "PDF" | "RESOURCE" | "QUIZ" | "LIVE";
  title: string;
  description?: string | null;
  timerMinutes?: number | null;
  questionCount?: number | null;
  maxAttempts?: number | null;
  status: TaskStatus;
  href: string | null;
  ctaLabel: string;
  timerNote?: boolean;
}

function attemptsLabel(count: number): string {
  if (count === 1) return "محاولة واحدة";
  if (count === 2) return "محاولتان";
  if (count >= 3 && count <= 10) return `${count} محاولات`;
  return `${count} محاولة`;
}

export function LessonTaskBrief({
  kind,
  title,
  description,
  timerMinutes,
  questionCount,
  maxAttempts,
  status,
  href,
  ctaLabel,
  timerNote = true,
}: LessonTaskBriefProps) {
  const duration = timerMinutes
    ? formatDuration(timerMinutes * 60)
    : null;
  const timedTask =
    kind === "EXAM" || kind === "QUIZ" || kind === "ASSIGNMENT";
  const showTimerNote = timedTask && timerNote;
  const icon =
    kind === "EXAM" || kind === "QUIZ"
      ? "exam"
      : kind === "ASSIGNMENT"
        ? "assignment"
        : kind === "LIVE"
          ? "live"
          : "file";

  return (
    <section className="lc-brief">
      <span className="lc-brief-glow" aria-hidden="true" />
      <div className="lc-brief-top">
        <span className="lc-brief-orb" aria-hidden="true">
          <TaskGlyph name={icon} size={26} strokeWidth={1.4} />
        </span>
        <div className="lc-brief-heading">
          <p className="lc-eyebrow">{typeLabel(kind)}</p>
          <h2 className="lc-brief-title">{title}</h2>
        </div>
        <TaskStatusCapsule status={status} />
      </div>

      {description && <p className="lc-brief-desc">{description}</p>}

      <div className="lc-brief-meta">
        {duration && (
          <span className="lc-brief-chip">
            <TaskGlyph name="clock" size={13} />
            {duration}
          </span>
        )}
        {questionCount !== null &&
          questionCount !== undefined &&
          questionCount > 0 && (
            <span className="lc-brief-chip">
              <TaskGlyph name="exam" size={13} />
              {questionCountLabel(questionCount)}
            </span>
          )}
        {maxAttempts !== null && maxAttempts !== undefined && (
          <span className="lc-brief-chip">
            <TaskGlyph name="refresh" size={13} />
            {attemptsLabel(maxAttempts)}
          </span>
        )}
      </div>

      {href && (
        <div className="lc-brief-actions">
          <Link href={href} className="lc-solid-btn">
            {ctaLabel}
            <TaskGlyph name="arrow" size={16} />
          </Link>
          {showTimerNote && (
            <p className="lc-brief-note">
              المؤقت يبدأ عند فتح المهمة، وليس عند فتح هذه الصفحة.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
