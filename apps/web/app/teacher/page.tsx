"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from "react";
import { useAuth } from "@/app/lib/auth";
import {
  api,
  type AssignmentListItem,
  type ExamListItem,
  type TeacherCourse,
  type TeacherStudent,
} from "@/app/lib/api";
import { ActionCenter } from "./components/dashboard/ActionCenter";
import { AssistantRail } from "./components/dashboard/AssistantRail";
import { CourseEnrollmentChart } from "./components/dashboard/CourseEnrollmentChart";
import type {
  CourseBar,
  LiveExamRow,
  LoadState,
  PendingRow,
  PendingSummary,
} from "./components/dashboard/types";
import {
  AlertIcon,
  AssignmentsIcon,
  CoursesIcon,
  ExamsIcon,
  InboxIcon,
  StudentsIcon,
} from "./components/TeacherIcons";

type KpiTone = "plain" | "green" | "amber";

type KpiIcon = ComponentType<{
  size?: number;
  className?: string;
  strokeWidth?: number;
}>;

interface KpiData {
  label: string;
  value: number | null;
  suffix?: string;
  foot: string;
  href: string;
  Icon: KpiIcon;
  tone?: KpiTone;
  loading: boolean;
  failed: boolean;
}

interface DashboardData {
  courses: TeacherCourse[] | null;
  students: TeacherStudent[] | null;
  assignments: AssignmentListItem[] | null;
  exams: ExamListItem[] | null;
  pending: PendingSummary;
}

const failedPending = (): PendingSummary => ({
  rows: [],
  total: null,
  capped: false,
  failed: true,
  byExam: {},
});

async function readPendingQueues(
  token: string,
  assignments: AssignmentListItem[],
  exams: ExamListItem[],
): Promise<PendingSummary> {
  let failed = false;
  let capped = false;
  const rows: PendingRow[] = [];
  const byExam: Record<string, number> = {};

  const publishedAssignments = assignments.filter(
    (assignment) => assignment.status === "PUBLISHED",
  );
  const publishedExams = exams.filter((exam) => exam.status === "PUBLISHED");

  const readAssignments = publishedAssignments.map(async (assignment) => {
    try {
      const [submitted, late] = await Promise.all([
        api.getSubmissionQueue(token, assignment.id, "SUBMITTED", 100),
        api.getSubmissionQueue(token, assignment.id, "LATE", 100),
      ]);

      if (submitted.nextCursor || late.nextCursor) capped = true;

      for (const submission of [
        ...submitted.submissions,
        ...late.submissions,
      ]) {
        rows.push({
          id: submission.id,
          kind: "assignment",
          title: assignment.title,
          studentName: submission.student.name,
          studentPhone: submission.student.phone ?? null,
          submittedAt: submission.submittedAt,
          status: submission.status,
          href: `/teacher/assignments/${assignment.id}`,
        });
      }
    } catch {
      failed = true;
    }
  });

  const readExams = publishedExams.map(async (exam) => {
    try {
      const [submitted, timedOut] = await Promise.all([
        api.getGradingQueue(token, exam.id, "SUBMITTED", 100),
        api.getGradingQueue(token, exam.id, "TIMED_OUT", 100),
      ]);

      if (submitted.nextCursor || timedOut.nextCursor) capped = true;
      byExam[exam.id] =
        submitted.attempts.length + timedOut.attempts.length;

      for (const attempt of [...submitted.attempts, ...timedOut.attempts]) {
        rows.push({
          id: attempt.id,
          kind: "exam",
          title: exam.title,
          studentName: attempt.student.name,
          studentPhone: attempt.student.phone ?? null,
          submittedAt: attempt.submittedAt ?? attempt.startedAt,
          status: attempt.status,
          href: `/teacher/exams/${exam.id}`,
        });
      }
    } catch {
      failed = true;
    }
  });

  await Promise.all([...readAssignments, ...readExams]);

  rows.sort((a, b) => {
    const aTime = new Date(a.submittedAt).getTime();
    const bTime = new Date(b.submittedAt).getTime();
    return (Number.isNaN(aTime) ? 0 : aTime) - (Number.isNaN(bTime) ? 0 : bTime);
  });

  return {
    rows,
    total: failed ? null : rows.length,
    capped,
    failed,
    byExam,
  };
}

function KpiCard({
  label,
  value,
  suffix,
  foot,
  href,
  Icon,
  tone = "plain",
  loading,
  failed,
  index,
}: {
  label: string;
  value: number | null;
  suffix?: string;
  foot: string;
  href: string;
  Icon: KpiIcon;
  tone?: KpiTone;
  loading: boolean;
  failed: boolean;
  index: number;
}) {
  const shownValue =
    value === null ? "—" : `${value.toLocaleString("en-US")}${suffix ?? ""}`;

  return (
    <Link
      href={href}
      className="td-kpi"
      data-tone={tone}
      aria-label={
        loading
          ? `${label}: جارٍ التحميل`
          : failed
            ? `${label}: تعذر التحميل`
            : `${label}: ${shownValue}`
      }
      style={{ animationDelay: `${Math.min(index, 6) * 55}ms` }}
    >
      <div className="td-kpi-top">
        <span className="td-kpi-label">{label}</span>
        <span className="td-kpi-icon" aria-hidden>
          <Icon size={18} />
        </span>
      </div>

      {loading ? (
        <span className="td-skeleton td-kpi-skeleton-value" aria-hidden />
      ) : (
        <div
          className="td-kpi-value"
          data-tone={failed ? "plain" : tone}
        >
          {failed ? "—" : shownValue}
        </div>
      )}

      <div className="td-kpi-foot">
        {loading ? (
          <span className="td-skeleton td-kpi-skeleton-foot" aria-hidden />
        ) : failed ? (
          "تعذر التحميل"
        ) : (
          foot
        )}
      </div>
    </Link>
  );
}

export default function TeacherDashboard() {
  const { token, userName } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const loading = data === null;

  const reload = useCallback(() => {
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!token) {
      setData(null);
      return;
    }

    let cancelled = false;
    setData(null);

    (async () => {
      const [coursesResult, studentsResult, assignmentsResult, examsResult] =
        await Promise.allSettled([
          api.listTeacherCourses(token),
          api.listStudents(token),
          api.listAssignments(token),
          api.listTeacherExams(token),
        ]);

      const courses =
        coursesResult.status === "fulfilled" ? coursesResult.value : null;
      const students =
        studentsResult.status === "fulfilled" ? studentsResult.value : null;
      const assignments =
        assignmentsResult.status === "fulfilled"
          ? assignmentsResult.value.assignments
          : null;
      const exams =
        examsResult.status === "fulfilled" ? examsResult.value.exams : null;

      const pending =
        assignments && exams
          ? await readPendingQueues(token, assignments, exams)
          : failedPending();

      if (cancelled) return;

      setData({ courses, students, assignments, exams, pending });
    })().catch(() => {
      if (cancelled) return;
      setData({
        courses: null,
        students: null,
        assignments: null,
        exams: null,
        pending: failedPending(),
      });
    });

    return () => {
      cancelled = true;
    };
  }, [token, reloadKey]);

  const courses = data?.courses ?? null;
  const students = data?.students ?? null;
  const assignments = data?.assignments ?? null;
  const exams = data?.exams ?? null;
  const pending = data?.pending ?? null;

  const publishedCourseCount = courses
    ? courses.filter((course) => course.status === "PUBLISHED").length
    : null;
  const activeStudentCount = students
    ? students.filter((student) => student.status === "ACTIVE").length
    : null;
  const publishedExamCount = exams
    ? exams.filter((exam) => exam.status === "PUBLISHED").length
    : null;
  const publishedAssignmentCount = assignments
    ? assignments.filter((assignment) => assignment.status === "PUBLISHED")
        .length
    : null;

  const pendingState: LoadState = loading
    ? "loading"
    : pending?.failed
      ? "failed"
      : "ready";
  const liveExamsState: LoadState = loading
    ? "loading"
    : exams === null
      ? "failed"
      : "ready";
  const chartState: LoadState = loading
    ? "loading"
    : courses === null || students === null
      ? "failed"
      : "ready";

  const courseBars = useMemo<CourseBar[] | null>(() => {
    if (!courses || !students) return null;

    return courses
      .filter((course) => course.status === "PUBLISHED")
      .map((course) => {
        const enrolled = new Set<string>();
        for (const student of students) {
          if (
            student.enrollments.some(
              (enrollment) => enrollment.course.id === course.id,
            )
          ) {
            enrolled.add(student.id);
          }
        }
        return {
          id: course.id,
          title: course.title,
          count: enrolled.size,
        };
      })
      .sort(
        (a, b) =>
          b.count - a.count || a.title.localeCompare(b.title, "ar"),
      );
  }, [courses, students]);

  const liveExamRows = useMemo<LiveExamRow[] | null>(() => {
    if (!exams) return null;

    return exams
      .filter((exam) => exam.status === "PUBLISHED")
      .map((exam) => ({
        id: exam.id,
        title: exam.title,
        lessonTitle: exam.lesson?.title ?? null,
        timerMinutes: exam.timerMinutes,
        pending: pending?.failed
          ? null
          : (pending?.byExam[exam.id] ?? 0),
        href: `/teacher/exams/${exam.id}`,
      }))
      .sort((a, b) => (b.pending ?? 0) - (a.pending ?? 0));
  }, [exams, pending]);

  const failedSources = data
    ? Array.from(
        new Set(
          [
            data.courses === null ? "الكورسات" : null,
            data.students === null ? "الطلاب" : null,
            data.assignments === null ? "الواجبات" : null,
            data.exams === null ? "الاختبارات" : null,
            data.pending.failed ? "طابور التصحيح" : null,
          ].filter((value): value is string => Boolean(value)),
        ),
      )
    : [];

  const pendingTotal = pending?.total ?? null;
  const pendingCapped = pending?.capped ?? false;

  const statusTone =
    pendingState === "loading"
      ? "quiet"
      : pendingState === "failed"
        ? "danger"
        : pendingTotal !== null && pendingTotal > 0
          ? "attention"
          : "calm";

  const statusLabel =
    pendingState === "loading"
      ? "بنجهّز طابور التصحيح"
      : pendingState === "failed"
        ? "تعذر قراءة بعض الطوابير"
        : pendingTotal !== null && pendingTotal > 0
          ? `${pendingTotal.toLocaleString("en-US")}${pendingCapped ? "+" : ""} بانتظار قرارك`
          : "لا مهام معلقة";

  const teacherName = userName ? `أستاذ ${userName}` : "أستاذ";

  const kpis: KpiData[] = [
    {
      label: "طلاب نشطون",
      value: activeStudentCount,
      foot:
        students !== null
          ? `من ${students.length.toLocaleString("en-US")} طالب في سجلك`
          : "من سجل الطلاب",
      href: "/teacher/students",
      Icon: StudentsIcon,
      tone: "green" as KpiTone,
      loading,
      failed: data !== null && students === null,
    },
    {
      label: "كورسات منشورة",
      value: publishedCourseCount,
      foot:
        courses !== null
          ? `من ${courses.length.toLocaleString("en-US")} كورس`
          : "من كورساتك",
      href: "/teacher/courses",
      Icon: CoursesIcon,
      tone: "plain" as KpiTone,
      loading,
      failed: data !== null && courses === null,
    },
    {
      label: "اختبارات منشورة",
      value: publishedExamCount,
      foot:
        exams !== null
          ? `من ${exams.length.toLocaleString("en-US")} اختبار`
          : "من اختباراتك",
      href: "/teacher/exams",
      Icon: ExamsIcon,
      tone: "plain" as KpiTone,
      loading,
      failed: data !== null && exams === null,
    },
    {
      label: "واجبات منشورة",
      value: publishedAssignmentCount,
      foot:
        assignments !== null
          ? `من ${assignments.length.toLocaleString("en-US")} واجب`
          : "من واجباتك",
      href: "/teacher/assignments",
      Icon: AssignmentsIcon,
      tone: "plain" as KpiTone,
      loading,
      failed: data !== null && assignments === null,
    },
    {
      label: "بانتظار التصحيح",
      value: pendingTotal,
      suffix: pendingCapped ? "+" : undefined,
      foot: pendingCapped ? "العدد قد يزيد" : "تسليمات ومحاولات",
      href: "/teacher/assignments",
      Icon: InboxIcon,
      tone:
        pendingTotal !== null && pendingTotal > 0
          ? ("amber" as KpiTone)
          : ("plain" as KpiTone),
      loading: pendingState === "loading",
      failed: pendingState === "failed",
    },
  ];

  return (
    <section className="td-shell" aria-busy={loading}>
      <header className="td-head">
        <div className="td-head-copy">
          <span className="td-eyebrow">
            <span className="tc-pulse" aria-hidden />
            لوحة المعلم
          </span>
          <h1 className="td-greeting">
            <span className="td-greeting-lead">صباح الخير،</span>
            <span className="td-greeting-name">{teacherName}</span>
          </h1>
          <p className="td-sub">
            كل ما يخص كورساتك وطلابك ومهام التصحيح في مكان واحد.
          </p>
        </div>

        <span className="td-head-status" data-tone={statusTone} role="status">
          <span className="td-head-dot" aria-hidden />
          {statusLabel}
        </span>
      </header>

      {failedSources.length > 0 ? (
        <div className="td-notice" role="status">
          <span className="td-notice-icon" aria-hidden>
            <AlertIcon size={16} />
          </span>
          <p>
            تعذر تحميل: {failedSources.join("، ")}. الأرقام الناقصة معروضة كـ
            «—» بدل تقديرها.
          </p>
          <button type="button" className="td-notice-btn" onClick={reload}>
            حاول تاني
          </button>
        </div>
      ) : null}

      <section aria-label="مؤشرات الأداء">
        <div className="td-kpis">
          {kpis.map((kpi, index) => (
            <KpiCard {...kpi} index={index} key={kpi.label} />
          ))}
        </div>
      </section>

      <div className="td-grid">
        <div className="td-main">
          <CourseEnrollmentChart
            bars={courseBars}
            studentsTotal={students?.length ?? null}
            state={chartState}
            onRetry={reload}
          />

          <ActionCenter
            pending={pending?.rows ?? null}
            pendingTotal={pendingTotal}
            pendingCapped={pendingCapped}
            pendingState={pendingState}
            liveExams={liveExamRows}
            liveExamsState={liveExamsState}
            onRetry={reload}
          />
        </div>

        <AssistantRail
          pending={pending?.rows ?? null}
          pendingTotal={pendingTotal}
          pendingCapped={pendingCapped}
          pendingState={pendingState}
          liveExams={liveExamRows}
          liveExamsState={liveExamsState}
          onRetry={reload}
        />
      </div>
    </section>
  );
}
