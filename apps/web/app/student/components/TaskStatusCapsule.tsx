import type { TaskStatus } from "@/app/student/courses/lib/curriculum";
import { TaskGlyph } from "./TaskGlyph";

interface TaskStatusCapsuleProps {
  status: TaskStatus;
  compact?: boolean;
}

/**
 * A quiet state capsule. The dot is the only moving part; the label carries
 * the meaning even when motion is reduced or color is not perceived.
 */
export function TaskStatusCapsule({
  status,
  compact = false,
}: TaskStatusCapsuleProps) {
  return (
    <span
      className={`lc-status lc-status--${status.tone}${
        compact ? " is-compact" : ""
      }`}
      data-pulse={status.pulse || undefined}
    >
      {status.tone === "locked" ? (
        <TaskGlyph name="lock" size={12} strokeWidth={1.6} />
      ) : (
        <span className="lc-status-dot" aria-hidden="true" />
      )}
      <span>{status.label}</span>
    </span>
  );
}
