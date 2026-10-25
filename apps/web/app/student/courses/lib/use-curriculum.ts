"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/app/lib/api";
import type { CourseStructure } from "@/app/lib/api";
import {
  flattenCurriculum,
  mapWithConcurrency,
  type CurriculumTask,
  type TaskDetails,
} from "./curriculum";

/**
 * Loads the server curriculum, then progressively enriches every task with
 * the student-lesson bundle. The lesson payload carries the server's
 * per-student unlock overlay, so a task unlocked by an ENTER_* grant stops
 * looking locked even when the authored structure still says LOCKED.
 *
 * Assignment/exam views are fetched only for tasks the server says are open.
 * The structure is rendered as soon as it arrives; enrichment is intentionally
 * failure-tolerant: a task whose detail request fails keeps its real
 * structure lock/type/duration instead of receiving a guessed status.
 */
export function useCurriculum(token: string | null, courseId: string | null) {
  const [structure, setStructure] = useState<CourseStructure | null>(null);
  const [tasks, setTasks] = useState<CurriculumTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !courseId) {
      setStructure(null);
      setTasks([]);
      setLoading(false);
      setEnriching(false);
      setError(null);
      return;
    }

    let cancelled = false;

    setStructure(null);
    setTasks([]);
    setLoading(true);
    setEnriching(false);
    setError(null);

    (async () => {
      try {
        const nextStructure = await api.getStudentCourseStructure(token, courseId);
        if (cancelled) return;

        const initial = flattenCurriculum(nextStructure);
        setStructure(nextStructure);
        setTasks(initial);
        setLoading(false);
        setEnriching(true);

        if (initial.length === 0) return;

        const enriched = await mapWithConcurrency(
          initial,
          4,
          async (
            task,
          ): Promise<{
            id: string;
            details: TaskDetails;
            lockStatus: string;
            unlockType: string;
          }> => {
            const details: TaskDetails = {};
            let lockStatus = task.lesson.lockStatus;
            let unlockType = task.lesson.unlockType;

            try {
              details.studentLesson = await api.getStudentLesson(
                token,
                task.lesson.id,
              );
              const access = details.studentLesson.access;
              lockStatus = access.isLocked
                ? "LOCKED"
                : access.lockStatus || "UNLOCKED";
              unlockType = access.unlockType || unlockType;
            } catch {
              // Keep the structure's own lock/type/duration.
            }

            const studentLesson = details.studentLesson;
            if (studentLesson && !studentLesson.access.isLocked) {
              if (studentLesson.assignment) {
                try {
                  details.assignmentView = await api.getStudentAssignmentView(
                    token,
                    studentLesson.assignment.id,
                  );
                } catch {
                  // A view we cannot read stays unknown; status falls back.
                }
              }

              if (studentLesson.exam) {
                try {
                  details.examView = await api.getStudentExamView(
                    token,
                    studentLesson.exam.id,
                  );
                } catch {
                  // Same rule: no fabricated status.
                }
              }
            }

            return {
              id: task.lesson.id,
              details,
              lockStatus,
              unlockType,
            };
          },
        );

        if (cancelled) return;

        const byId = new Map(enriched.map((entry) => [entry.id, entry]));
        setTasks((current) =>
          current.map((task) => {
            const entry = byId.get(task.lesson.id);
            if (!entry) return task;
            return {
              ...task,
              lesson: {
                ...task.lesson,
                lockStatus: entry.lockStatus,
                unlockType: entry.unlockType,
              },
              details: entry.details,
            };
          }),
        );
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof ApiError ? e.message : "تعذر تحميل فهرس الكورس",
        );
        setLoading(false);
      } finally {
        if (!cancelled) setEnriching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, courseId]);

  return { structure, tasks, loading, enriching, error };
}
