"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError } from "@/app/lib/api";
import type { CourseProgression, EnrollmentItem } from "@/app/lib/api";
import {
  deriveCourseMetrics,
  pickFeatured,
  type CourseEntry,
} from "@/app/student/courses/lib/metrics";
import FeaturedCourseCard from "./components/FeaturedCourseCard";
import ProgressHorizon from "./components/ProgressHorizon";

/** Fetches a course's progression, tolerating a single missing course. */
async function loadProgression(
  token: string,
  courseId: string,
): Promise<CourseProgression | null> {
  try {
    return await api.getStudentProgression(token, courseId);
  } catch {
    // A course we cannot read the progression for is still a real enrollment.
    // Rendering it without a percentage is honest; inventing one is not.
    return null;
  }
}

export default function StudentCoursesPage() {
  const { token } = useAuth();
  const [entries, setEntries] = useState<CourseEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    (async () => {
      try {
        const enrollments: EnrollmentItem[] = await api.getMyEnrollments(token);

        // One progression request per enrolled course, in parallel.
        const progressions = await Promise.all(
          enrollments.map((en) => loadProgression(token, en.course.id)),
        );

        if (cancelled) return;

        const built: CourseEntry[] = enrollments.map((en, i) => {
          const prog = progressions[i];
          const nodes = prog?.progression ?? [];

          return {
            courseId: en.course.id,
            title: en.course.title,
            slug: en.course.slug,
            enrollmentStatus: en.status,
            metrics: deriveCourseMetrics(nodes),
            lockedNodes: nodes.filter((n) => n.isLocked),
            openNodes: nodes.filter((n) => !n.isLocked),
            raw: prog ?? {
              courseId: en.course.id,
              userId: "",
              progression: [],
            },
          };
        });

        setEntries(built);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "تعذر تحميل الكورسات");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) {
    return (
      <div className="card">
        <p>
          سجّل الدخول أولًا. <Link href="/login">تسجيل الدخول</Link>
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <p>{error}</p>
      </div>
    );
  }

  if (entries === null) {
    return (
      <div className="card">
        <p>جاري التحميل…</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="card">
        <p>لست مسجلًا في أي كورس بعد.</p>
      </div>
    );
  }

  const featured = pickFeatured(entries)!;

  return (
    <div className="sc-canvas">
      <div className="lp-container" style={{ maxWidth: 1280 }}>
        <header style={{ marginBottom: "var(--space-8)" }}>
          <p className="sc-eyebrow">سجل التعلم</p>
          <h1 className="sc-title">كورساتي</h1>
        </header>

        <div className="sc-grid">
          <FeaturedCourseCard entry={featured} />
          <ProgressHorizon entries={entries} />

          {/*
            Remaining courses (if any) occupy their own nodes. Order is
            deterministic: featured first, then by course id.
          */}
          {entries
            .filter((e) => e.courseId !== featured.courseId)
            .sort((a, b) => a.courseId.localeCompare(b.courseId))
            .map((entry) => (
              <article key={entry.courseId} className="sc-panel">
                <div className="sc-body">
                  <p className="sc-eyebrow">مسار</p>
                  <h3 className="sc-title" style={{ fontSize: 24 }}>
                    {entry.title}
                  </h3>
                  <p className="sc-meta">
                    {entry.metrics.open} من {entry.metrics.total} عناصر مفتوحة
                  </p>
                  <div
                    className="sc-track sc-layer-track"
                    style={{ marginTop: "var(--space-6)" }}
                  >
                    <div
                      className="sc-track-fill"
                      style={{ width: `${entry.metrics.percent}%` }}
                    />
                  </div>
                  <Link
                    href={`/student/courses/${entry.courseId}`}
                    className="lp-cta"
                    style={{
                      marginTop: "var(--space-6)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      fontWeight: 700,
                      color: "#ffffff",
                    }}
                  >
                    متابعة
                    <span className="lp-arrow" aria-hidden>
                      ←
                    </span>
                  </Link>
                </div>
              </article>
            ))}
        </div>
      </div>
    </div>
  );
}
