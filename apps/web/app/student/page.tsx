"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import {
  api,
  ApiError,
  type AssignmentListItem,
  type AssignmentSubmissionSummary,
  type EnrollmentItem,
  type ExamListItem,
  type ProgressionItem,
  type PublicCourseCard,
  type StudentAttemptSummary,
} from "@/app/lib/api";
import {
  buildActivityEvents,
  buildAgenda,
  bucketEventsByDay,
  computeBadges,
  computeCourseProgress,
  countOpenContent,
  enrolledCoursesLabel,
  findResumeTarget,
  firstNameOf,
  latestFeedback,
  overallPercent,
  streakDays,
  type CourseFeed,
} from "@/app/lib/dashboard";
import {
  AgendaTimeline,
  BadgeShelf,
  ChainSimulator,
  DashboardSkeleton,
  EmptyCourses,
  FeedbackCard,
  PassportCard,
  ProgressOrbit,
  ResumeCard,
  SignalChart,
  StatStrip,
} from "./components/command-center/widgets";

interface DashData {
  enrollments: EnrollmentItem[];
  exams: ExamListItem[];
  assignments: AssignmentListItem[];
  publicCourses: PublicCourseCard[];
  progressionByCourse: Record<string, ProgressionItem[]>;
  attemptsByExam: Record<string, StudentAttemptSummary[]>;
  submissionsByAssignment: Record<string, AssignmentSubmissionSummary[]>;
}

export default function StudentDashboard() {
  const { token, userName } = useAuth();
  const [data, setData] = useState<DashData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focus, setFocus] = useState(false);

  // Focus mode is toggled from the dock; the event keeps both in sync.
  useEffect(() => {
    function onFocus(e: Event) {
      setFocus(Boolean((e as CustomEvent).detail));
    }
    window.addEventListener("sanad:focus", onFocus);
    return () => window.removeEventListener("sanad:focus", onFocus);
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const [enr, asg, exm, publics] = await Promise.all([
          api.getMyEnrollments(token),
          api.listAssignments(token).then((r) => r.assignments),
          api.listExams(token).then((r) => r.exams),
          api.listPublicCourses().catch(() => [] as PublicCourseCard[]),
        ]);
        const progSettled = await Promise.allSettled(
          enr.map((e) => api.getStudentProgression(token, e.course.id)),
        );
        const attemptsSettled = await Promise.allSettled(
          exm.map((e) => api.getMyAttempts(token, e.id)),
        );
        const subsSettled = await Promise.allSettled(
          asg.map((a) => api.getMySubmissions(token, a.id)),
        );
        if (cancelled) return;

        const progressionByCourse: Record<string, ProgressionItem[]> = {};
        progSettled.forEach((s, i) => {
          const enrollment = enr[i];
          if (s.status === "fulfilled" && enrollment) {
            progressionByCourse[enrollment.course.id] = s.value.progression;
          }
        });
        const attemptsByExam: Record<string, StudentAttemptSummary[]> = {};
        attemptsSettled.forEach((s, i) => {
          const exam = exm[i];
          if (s.status === "fulfilled" && exam) {
            attemptsByExam[exam.id] = s.value;
          }
        });
        const submissionsByAssignment: Record<
          string,
          AssignmentSubmissionSummary[]
        > = {};
        subsSettled.forEach((s, i) => {
          const assignment = asg[i];
          if (s.status === "fulfilled" && assignment) {
            submissionsByAssignment[assignment.id] = s.value;
          }
        });

        setData({
          enrollments: enr,
          exams: exm,
          assignments: asg,
          publicCourses: publics,
          progressionByCourse,
          attemptsByExam,
          submissionsByAssignment,
        });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "تعذر تحميل اللوحة");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const derived = useMemo(() => {
    if (!data) return null;
    const {
      enrollments,
      exams,
      assignments,
      publicCourses,
      progressionByCourse,
      attemptsByExam,
      submissionsByAssignment,
    } = data;

    const courses: CourseFeed[] = enrollments.map((e) => ({
      courseId: e.course.id,
      courseTitle: e.course.title,
      items: progressionByCourse[e.course.id] ?? [],
    }));
    const percents = courses.map((c) => computeCourseProgress(c.items).percent);
    const overall = overallPercent(percents);
    const openContent = courses.reduce(
      (sum, c) => sum + countOpenContent(c.items),
      0,
    );
    const submissionsCount =
      Object.values(attemptsByExam).reduce((n, rows) => n + rows.length, 0) +
      Object.values(submissionsByAssignment).reduce(
        (n, rows) => n + rows.length,
        0,
      );

    const events = buildActivityEvents({
      courses,
      enrollments: enrollments.map((e) => ({
        startsAt: e.startsAt,
        label: e.course.title,
      })),
      attempts: exams.flatMap((ex) =>
        (attemptsByExam[ex.id] ?? []).map((a) => ({
          submittedAt: a.submittedAt,
          label: ex.title,
        })),
      ),
      submissions: assignments.flatMap((as) =>
        (submissionsByAssignment[as.id] ?? []).map((s) => ({
          submittedAt: s.submittedAt,
          label: as.title,
        })),
      ),
    });
    const now = new Date();
    const dayBuckets = bucketEventsByDay(events, now, 7);
    const streak = streakDays(events, now);

    const grants = courses.flatMap((c) =>
      c.items
        .map((i) => i.unlockInfo?.unlockedAt)
        .filter((at): at is string => Boolean(at))
        .map((at) => ({ at })),
    );
    const badges = computeBadges({
      attempts: exams.flatMap((ex) =>
        (attemptsByExam[ex.id] ?? []).map((a) => ({
          submittedAt: a.submittedAt,
          passed: a.passed,
        })),
      ),
      submissions: assignments.flatMap((as) =>
        (submissionsByAssignment[as.id] ?? []).map((s) => ({
          submittedAt: s.submittedAt,
        })),
      ),
      grants,
      streak,
    });

    const resume = findResumeTarget(courses);

    const courseTitleByLessonId: Record<string, string> = {};
    const courseIdByLessonId: Record<string, string> = {};
    for (const c of courses)
      for (const i of c.items) {
        courseTitleByLessonId[i.id] = c.courseTitle;
        courseIdByLessonId[i.id] = c.courseId;
      }

    const agenda = buildAgenda({
      exams,
      assignments,
      attemptsByExam,
      submissionsByAssignment,
      courseTitleByLessonId,
    });

    const feedback = latestFeedback(assignments, submissionsByAssignment);
    let feedbackTeacher: string | null = null;
    let feedbackCourse: string | null = null;
    if (feedback) {
      const courseId = courseIdByLessonId[feedback.lessonId];
      if (courseId) {
        feedbackTeacher =
          publicCourses.find((p) => p.id === courseId)?.teacher?.name ?? null;
        feedbackCourse =
          enrollments.find((e) => e.course.id === courseId)?.course.title ??
          null;
      }
    }

    const courseRows = enrollments.map((e) => {
      const items = progressionByCourse[e.course.id];
      return {
        courseId: e.course.id,
        title: e.course.title,
        href: `/student/courses/${e.course.id}`,
        percent: items ? computeCourseProgress(items).percent : null,
      };
    });

    return {
      overall,
      openContent,
      submissionsCount,
      dayBuckets,
      badges,
      resume,
      agenda,
      feedback,
      feedbackTeacher,
      feedbackCourse,
      courseRows,
    };
  }, [data]);

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
        <p style={{ color: "#ef4444" }}>{error}</p>
      </div>
    );
  }

  if (!data || !derived) {
    return (
      <div className="cc-root">
        <div className="cc-ambient" aria-hidden="true">
          <span className="cc-orb cc-orb--a" />
          <span className="cc-orb cc-orb--b" />
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  const hasCourses = data.enrollments.length > 0;
  const heroCtaHref = derived.resume
    ? `/student/lessons/${derived.resume.lessonId}`
    : "/student/courses";

  return (
    <div className="cc-root">
      <div className="cc-ambient" aria-hidden="true">
        <span className="cc-orb cc-orb--a" />
        <span className="cc-orb cc-orb--b" />
      </div>
      <div className={`cc-bento${focus ? " cc-bento--focus" : ""}`}>
        <section className="cc-card cc-hero cc-keep">
          <div className="cc-hero-inner">
            <span className="cc-eyebrow">مسارك منظم — وكل خطوة محسوبة</span>
            <h1 className="cc-hero-title">
              أهلاً {firstNameOf(userName)}، جاهز لخطوتك التالية؟
            </h1>
            <p className="cc-hero-sub">
              {hasCourses
                ? `مسجل في ${enrolledCoursesLabel(data.enrollments.length)} — أكمل من حيث توقفت.`
                : "اختر كورسك الأول وابدأ الرحلة."}
            </p>
            <Link
              href={hasCourses ? heroCtaHref : "/courses"}
              className="cc-cta cc-cta--glow"
            >
              {hasCourses ? "أكمل التعلم" : "تصفح الكورسات"}
            </Link>
          </div>
        </section>

        {hasCourses ? (
          <>
            <section className="cc-card cc-orbit">
              <h2 className="cc-card-title">تقدمك الكلي</h2>
              <ProgressOrbit percent={derived.overall} note="مفتوح من مسارك" />
            </section>

            <section className="cc-card cc-stats">
              <StatStrip
                stats={[
                  { label: "كورساتي", value: data.enrollments.length },
                  { label: "دروس مفتوحة", value: derived.openContent },
                  { label: "تسليماتي", value: derived.submissionsCount },
                ]}
              />
            </section>

            <section className="cc-card cc-resume cc-keep">
              <ResumeCard target={derived.resume} />
            </section>

            <section className="cc-card cc-agenda">
              <div className="cc-agenda-head">
                <h2 className="cc-card-title">المهام والمواعيد</h2>
                <div className="cc-agenda-actions">
                  <Link href="/student/assignments" className="cc-ghost-btn">
                    واجباتي
                  </Link>
                  <Link href="/student/exams" className="cc-ghost-btn">
                    اختباراتي
                  </Link>
                </div>
              </div>
              <AgendaTimeline items={derived.agenda} />
            </section>

            <section className="cc-card cc-chart">
              <div className="cc-chart-head">
                <h2 className="cc-card-title">إشارة التعلم</h2>
                <span className="cc-chart-sub">
                  آخر ٧ أيام — من سجل السيرفر
                </span>
              </div>
              <SignalChart buckets={derived.dayBuckets} />
            </section>

            <section className="cc-card cc-passports">
              <h2 className="cc-card-title">جوازاتك الدراسية</h2>
              <div className="cc-passport-list">
                {derived.courseRows.map((r) => (
                  <PassportCard
                    key={r.courseId}
                    title={r.title}
                    href={r.href}
                    percent={r.percent}
                  />
                ))}
              </div>
            </section>

            <section className="cc-card cc-badges">
              <h2 className="cc-card-title">رف الإنجازات</h2>
              <BadgeShelf badges={derived.badges} />
            </section>

            {derived.feedback && (
              <section className="cc-card cc-feedback">
                <FeedbackCard
                  entry={derived.feedback}
                  teacherName={derived.feedbackTeacher}
                  courseTitle={derived.feedbackCourse}
                />
              </section>
            )}

            <section className="cc-card cc-chain">
              <h2 className="cc-card-title">شفافية التقدم</h2>
              <ChainSimulator />
            </section>
          </>
        ) : (
          <section className="cc-card cc-empty">
            <EmptyCourses />
          </section>
        )}
      </div>
    </div>
  );
}
