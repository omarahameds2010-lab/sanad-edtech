"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/app/lib/auth";
import {
  api,
  ApiError,
  type TeacherAnalyticsOverview,
} from "@/app/lib/api";
import { CourseEnrollmentChart } from "../components/dashboard/CourseEnrollmentChart";
import type { CourseBar, LoadState } from "../components/dashboard/types";
import {
  AnalyticsIcon,
  ArrowIcon,
  AssignmentsIcon,
  CoursesIcon,
  ExamsIcon,
  InboxIcon,
  StudentsIcon,
} from "../components/TeacherIcons";

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "تم التسليم",
  GRADED: "مصحح",
  LATE: "متأخر",
  RETURNED: "معاد للمراجعة",
  REJECTED: "مرفوض",
  TIMED_OUT: "انتهى الوقت",
  IN_PROGRESS: "قيد الحل",
};

function formatScore(value: number | null) {
  return value === null ? "—" : `${value}%`;
}

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

function formatShortDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function analyticsErrorMessage(cause: unknown) {
  if (cause instanceof ApiError) {
    if (cause.code === "FEATURE_DISABLED") {
      return "التحليلات غير متاحة في خطة أكاديميتك الحالية. تواصل مع إدارة المنصة لترقية الخطة.";
    }
    if (cause.status === 403) {
      return "مالكش صلاحية الوصول لتحليلات الأكاديمية.";
    }
  }
  return "تعذر تحميل تحليلات المعلم";
}

function AnalyticsState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="tx-state">
      <span className="tx-state-icon" aria-hidden>
        <AnalyticsIcon size={24} />
      </span>
      <h2 className="tx-state-title">{title}</h2>
      <p className="tx-state-body">{body}</p>
      {action}
    </div>
  );
}

function StatCard({
  label,
  value,
  foot,
  Icon,
  live,
}: {
  label: string;
  value: string;
  foot: string;
  Icon: typeof AnalyticsIcon;
  live?: boolean;
}) {
  return (
    <div className={`st-stat${live ? " st-stat-live" : ""}`}>
      <div className="st-stat-top">
        <span className="st-stat-label">{label}</span>
        <span className="st-stat-icon" aria-hidden>
          <Icon />
        </span>
      </div>
      <div className="st-stat-value">{value}</div>
      <div className="st-stat-foot">{foot}</div>
    </div>
  );
}

export default function TeacherAnalyticsPage() {
  const { token } = useAuth();
  const [days, setDays] = useState<Range>(30);
  const [overview, setOverview] = useState<TeacherAnalyticsOverview | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(() => {
    if (!token) return;
    const request = requestRef.current + 1;
    requestRef.current = request;
    setError(null);
    setOverview(null);
    api
      .getTeacherAnalytics(token, days)
      .then((data) => {
        if (requestRef.current === request) setOverview(data);
      })
      .catch((cause) => {
        if (requestRef.current === request) {
          setError(analyticsErrorMessage(cause));
        }
      });
  }, [token, days]);

  useEffect(() => {
    load();
  }, [load]);

  const bars = useMemo<CourseBar[] | null>(() => {
    if (!overview) return null;
    return overview.courses.map((course) => ({
      id: course.id,
      title: course.title,
      count: course.enrollments,
    }));
  }, [overview]);

  const trendMax = useMemo(
    () =>
      overview?.enrollmentTrend.reduce(
        (max, day) => Math.max(max, day.count),
        0,
      ) ?? 0,
    [overview],
  );

  const trendTotal = useMemo(
    () =>
      overview?.enrollmentTrend.reduce((sum, day) => sum + day.count, 0) ?? 0,
    [overview],
  );

  const chartState: LoadState =
    overview === null ? (error ? "failed" : "loading") : "ready";

  if (!token) {
    return (
      <section className="tx-shell">
        <AnalyticsState
          title="سجّل الدخول أولًا"
          body="عشان تشوف تحليلات أكاديميتك، محتاج تكون مسجل دخول بحساب مدرس."
          action={
            <Link className="tx-cta tx-cta-outline" href="/login">
              تسجيل الدخول
            </Link>
          }
        />
      </section>
    );
  }

  if (error && !overview) {
    return (
      <section className="tx-shell">
        <AnalyticsState
          title="تعذر تحميل التحليلات"
          body={error}
          action={
            <button type="button" className="tx-cta" onClick={load}>
              حاول تاني
            </button>
          }
        />
      </section>
    );
  }

  if (!overview) {
    return (
      <section className="tx-shell" aria-busy="true" aria-live="polite">
        <header className="tx-head">
          <div>
            <span className="tx-eyebrow">
              <span className="tx-eyebrow-dot" aria-hidden />
              تحليلات المعلم
            </span>
            <h1 className="tx-title">التحليلات</h1>
            <p className="tx-sub">
              بنجهّز أرقام أكاديميتك من الكورسات والطلاب والتقييمات…
            </p>
          </div>
        </header>

        <div className="st-stats" aria-hidden>
          {[0, 1, 2, 3].map((index) => (
            <div className="st-stat st-stat-skeleton" key={index}>
              <span className="tx-skeleton-line tx-skeleton-line-short" />
              <span className="tx-skeleton-line st-skeleton-value" />
              <span className="tx-skeleton-line" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="tx-shell">
      <header className="tx-head">
        <div className="tx-head-copy">
          <span className="tx-eyebrow">
            <span className="tx-eyebrow-dot" aria-hidden />
            تحليلات المعلم
          </span>
          <h1 className="tx-title">التحليلات</h1>
          <p className="tx-sub">
            صورة حقيقية عن التحاق الطلاب، إنجاز الدروس، ونتائج التقييمات — كل
            رقم محسوب من بيانات أكاديميتك.
          </p>
        </div>

        <div className="ta-range-group">
          <div className="ta-range" role="group" aria-label="مدة التحليل">
            {RANGES.map((range) => {
              const allowed = range <= overview.maxWindowDays;
              return (
                <button
                  key={range}
                  type="button"
                  aria-pressed={days === range}
                  disabled={!allowed}
                  title={
                    allowed
                      ? undefined
                      : `خطتك الحالية تحتفظ بآخر ${overview.maxWindowDays} يومًا فقط`
                  }
                  onClick={() => setDays(range)}
                >
                  {range === 7
                    ? "٧ أيام"
                    : range === 30
                      ? "٣٠ يومًا"
                      : "٩٠ يومًا"}
                </button>
              );
            })}
          </div>
          {overview.maxWindowDays < 90 ? (
            <p className="ta-range-note">
              خطتك الحالية تحتفظ بآخر {overview.maxWindowDays} يومًا من
              التحليلات.
            </p>
          ) : null}
        </div>
      </header>

      <div className="st-stats" aria-label="مؤشرات التحصيل">
        <StatCard
          label="متوسط درجات الواجبات"
          value={formatScore(overview.assignments.averageScore)}
          foot={`${formatCount(overview.assignments.submitted)} تسليمًا`}
          Icon={AssignmentsIcon}
        />
        <StatCard
          label="متوسط درجات الاختبارات"
          value={formatScore(overview.exams.averageScore)}
          foot={`${formatCount(overview.exams.attempts)} محاولة`}
          Icon={ExamsIcon}
          live
        />
        <StatCard
          label="نسبة النجاح في الاختبارات"
          value={formatScore(overview.exams.passRate)}
          foot={`${formatCount(overview.exams.passed)} من ${formatCount(
            overview.exams.graded,
          )} محاولة مصححة`}
          Icon={AnalyticsIcon}
        />
        <StatCard
          label="بانتظار التصحيح"
          value={formatCount(overview.totals.pendingGrading)}
          foot={`${formatCount(overview.assignments.pending)} واجب + ${formatCount(
            overview.exams.pending,
          )} اختبار`}
          Icon={InboxIcon}
        />
      </div>

      <div className="ta-stack">
        <CourseEnrollmentChart
          bars={bars}
          studentsTotal={overview.totals.activeStudents}
          state={chartState}
          onRetry={load}
        />

        <article className="td-card" aria-label="إنجاز الدروس داخل الكورسات">
          <header className="td-card-head">
            <div>
              <span className="td-card-kicker">إنجاز المحتوى</span>
              <h2 className="td-card-title">نسبة إنجاز الدروس</h2>
            </div>
            <span className="td-card-note">
              {formatCount(overview.totals.completedLessons)} درس مكتمل
            </span>
          </header>

          <div className="ta-panel-body">
            {overview.courses.length === 0 ? (
              <p className="ta-empty">
                لا توجد كورسات منشورة بعد. انشر أول كورس عشان تبدأ التحليلات.
              </p>
            ) : (
              <div className="ta-course-list">
                {overview.courses.map((course) => (
                  <article className="ta-course" key={course.id}>
                    <div className="ta-course-head">
                      <h3 className="ta-course-title">{course.title}</h3>
                      <span className="ta-course-rate">
                        {formatScore(course.completionRate)}
                      </span>
                    </div>
                    <div className="ta-course-meta">
                      <span>
                        <StudentsIcon size={14} />{" "}
                        {formatCount(course.enrollments)} التحاق
                      </span>
                      <span>
                        <CoursesIcon size={14} />{" "}
                        {formatCount(course.completedLessons)} من{" "}
                        {formatCount(course.lessons)} درس
                      </span>
                    </div>
                    <div
                      className="ta-progress"
                      role="progressbar"
                      aria-valuenow={course.completionRate}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`نسبة إنجاز ${course.title}`}
                    >
                      <span
                        style={{ width: `${course.completionRate}%` }}
                      />
                    </div>
                    <Link
                      className="ta-link"
                      href={`/teacher/courses/${course.id}`}
                    >
                      فتح الكورس
                      <ArrowIcon size={14} />
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </article>

        <div className="ta-two-col">
          <article className="td-card" aria-label="الالتحاقات الجديدة">
            <header className="td-card-head">
              <div>
                <span className="td-card-kicker">آخر {overview.windowDays} يومًا</span>
                <h2 className="td-card-title">التحاقات الطلاب الجديدة</h2>
              </div>
              <span className="td-card-note">
                {formatCount(trendTotal)} التحاق
              </span>
            </header>

            <div className="ta-panel-body">
              <div className="ta-trend" aria-hidden>
                {overview.enrollmentTrend.map((day) => {
                  const height =
                    trendMax > 0 && day.count > 0
                      ? Math.max(8, Math.round((day.count / trendMax) * 100))
                      : 2;
                  return (
                    <span
                      className="ta-trend-col"
                      key={day.date}
                      title={`${day.date}: ${day.count}`}
                    >
                      <span
                        className="ta-trend-bar"
                        style={{ height: `${height}%` }}
                      />
                    </span>
                  );
                })}
              </div>
              <div className="ta-trend-foot">
                <span>
                  {formatShortDate(overview.enrollmentTrend[0]?.date ?? "")}
                </span>
                <span>
                  {formatShortDate(
                    overview.enrollmentTrend[
                      overview.enrollmentTrend.length - 1
                    ]?.date ?? "",
                  )}
                </span>
              </div>
              <p className="ta-note">
                {overview.totals.newStudents} طالب جديد في نفس الفترة، و
                {formatCount(overview.totals.activeEnrollments)} التحاق نشط
                بإجمالي الكورسات المنشورة.
              </p>
            </div>
          </article>

          <article className="td-card" aria-label="النشاط الأخير">
            <header className="td-card-head">
              <div>
                <span className="td-card-kicker">آخر التسليمات</span>
                <h2 className="td-card-title">النشاط الأخير</h2>
              </div>
              <span className="td-card-note">
                {formatCount(overview.recentActivity.length)} عنصر
              </span>
            </header>

            <div className="ta-panel-body">
              {overview.recentActivity.length === 0 ? (
                <p className="ta-empty">
                  لا يوجد نشاط بعد. أول ما الطلاب يسلّموا واجبات أو اختبارات
                  هيظهر هنا.
                </p>
              ) : (
                <div className="ta-activity">
                  {overview.recentActivity.map((item) => (
                    <div className="ta-activity-row" key={item.id}>
                      <span className="ta-activity-kind" aria-hidden>
                        {item.kind === "assignment" ? (
                          <AssignmentsIcon size={16} />
                        ) : (
                          <ExamsIcon size={16} />
                        )}
                      </span>
                      <div className="ta-activity-copy">
                        <div className="ta-activity-title">{item.title}</div>
                        <div className="ta-activity-meta">
                          {item.studentName} ·{" "}
                          {STATUS_LABELS[item.status] ?? item.status} ·{" "}
                          {formatShortDate(item.at)}
                        </div>
                      </div>
                      <span className="ta-activity-score">
                        {formatScore(item.score)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
