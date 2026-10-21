"use client";

import Link from "next/link";
import { ArrowIcon, CoursesIcon } from "../TeacherIcons";
import type { CourseBar, LoadState } from "./types";

export function CourseEnrollmentChart({
  bars,
  studentsTotal,
  state,
  onRetry,
}: {
  bars: CourseBar[] | null;
  studentsTotal: number | null;
  state: LoadState;
  onRetry: () => void;
}) {
  const hasEnrollments = Boolean(
    bars?.some((bar) => bar.count > 0),
  );
  const max = bars?.reduce((value, bar) => Math.max(value, bar.count), 0) ?? 0;
  const topId = hasEnrollments
    ? bars?.find((bar) => bar.count === max)?.id
    : undefined;

  return (
    <article className="td-card td-chart-card" aria-label="توزيع الطلاب على الكورسات">
      <header className="td-card-head">
        <div>
          <span className="td-card-kicker">أداء الكورسات</span>
          <h2 className="td-card-title">توزيع الطلاب على الكورسات</h2>
        </div>
        {state === "ready" && studentsTotal !== null ? (
          <span className="td-card-note">
            {studentsTotal.toLocaleString("en-US")} طالب في سجلك
          </span>
        ) : null}
      </header>

      <div className="td-chart-wrap">
        {state === "loading" ? (
          <div className="td-chart" aria-hidden>
            <div className="td-chart-grid" />
            <div className="td-chart-bars">
              {[52, 78, 38, 64].map((height, index) => (
                <div className="td-chart-col" key={index}>
                  <span className="td-skeleton td-chart-value-skeleton" />
                  <div className="td-chart-track">
                    <span
                      className="td-skeleton td-chart-bar-skeleton"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="td-skeleton td-chart-label-skeleton" />
                </div>
              ))}
            </div>
          </div>
        ) : state === "failed" ? (
          <div className="td-chart-state">
            <span className="td-state-icon" aria-hidden>
              <CoursesIcon size={20} />
            </span>
            <p>تعذر تحميل بيانات الكورسات.</p>
            <button type="button" className="td-soft-btn" onClick={onRetry}>
              حاول تاني
            </button>
          </div>
        ) : !bars || bars.length === 0 ? (
          <div className="td-chart-state">
            <span className="td-state-icon" aria-hidden>
              <CoursesIcon size={20} />
            </span>
            <p>لا توجد كورسات منشورة بعد.</p>
            <Link className="td-soft-btn" href="/teacher/courses">
              روح للكورسات
              <ArrowIcon size={14} />
            </Link>
          </div>
        ) : (
          <>
            <div className="td-chart">
              <div className="td-chart-grid" aria-hidden />
              <div className="td-chart-bars">
                {bars.map((bar) => {
                  const height =
                    bar.count > 0 && max > 0
                      ? Math.max(8, Math.round((bar.count / max) * 100))
                      : 0;
                  return (
                    <div className="td-chart-col" key={bar.id}>
                      <span className="td-chart-value">{bar.count}</span>
                      <div className="td-chart-track">
                        <span
                          className="td-chart-bar"
                          data-top={bar.id === topId ? "true" : "false"}
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className="td-chart-label" title={bar.title}>
                        {bar.title}
                      </span>
                    </div>
                  );
                })}
              </div>
              {!hasEnrollments ? (
                <p className="td-chart-empty">
                  لا يوجد طلاب ملتحقون بهذه الكورسات بعد.
                </p>
              ) : null}
            </div>

            <div className="td-chart-foot">
              <span>التحاقات الطلاب بالكورسات المنشورة</span>
              {hasEnrollments ? (
                <span className="td-chart-legend">
                  <span className="td-live-dot" aria-hidden />
                  الكورس الأعلى التحاقًا
                </span>
              ) : null}
            </div>
          </>
        )}
      </div>
    </article>
  );
}
