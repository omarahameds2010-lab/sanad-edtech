"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertIcon,
  ArrowIcon,
  AssignmentsIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  ExamsIcon,
  InboxIcon,
  PhoneIcon,
} from "../TeacherIcons";
import {
  examLessonLabel,
  type LiveExamRow,
  type LoadState,
  type PendingRow,
} from "./types";

const dateFormatter = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  day: "numeric",
  month: "short",
});

const timeFormatter = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  hour: "2-digit",
  minute: "2-digit",
});

function formatWhen(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return `اليوم ${timeFormatter.format(date)}`;
  }

  const diff = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diff === 1) return "أمس";
  if (diff > 1 && diff < 7) return `منذ ${diff} أيام`;
  return dateFormatter.format(date);
}

function pendingStatus(row: PendingRow): {
  label: string;
  tone: "amber" | "red";
} {
  if (row.kind === "exam" && row.status === "TIMED_OUT") {
    return { label: "انتهى الوقت", tone: "red" };
  }
  if (row.status === "LATE") {
    return { label: "تسليم متأخر", tone: "amber" };
  }
  return { label: "بانتظار التصحيح", tone: "amber" };
}

function Kicker({
  kind,
}: {
  kind: PendingRow["kind"];
}) {
  return (
    <span className="td-kind" data-kind={kind}>
      {kind === "exam" ? <ExamsIcon size={12} /> : <AssignmentsIcon size={12} />}
      {kind === "exam" ? "اختبار" : "واجب"}
    </span>
  );
}

function ReviewEmpty({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="td-empty">
      <span className="td-state-icon is-green" aria-hidden>
        <CheckIcon size={19} />
      </span>
      <h3 className="td-empty-title">لا توجد مهام تصحيح معلقة</h3>
      <p className="td-empty-body">
        كل التسليمات والمحاولات مصححة. أي شغل جديد هيظهر هنا أول ما تفتح
        اللوحة.
      </p>
      <div className="td-empty-actions">
        <Link className="td-soft-btn" href="/teacher/assignments">
          راجع الواجبات
          <ArrowIcon size={14} />
        </Link>
        <Link className="td-soft-btn" href="/teacher/exams">
          راجع الاختبارات
          <ArrowIcon size={14} />
        </Link>
      </div>
      <button type="button" className="td-text-btn" onClick={onRetry}>
        تحديث الطابور
      </button>
    </div>
  );
}

function ErrorEmpty({
  title,
  body,
  onRetry,
}: {
  title: string;
  body: string;
  onRetry: () => void;
}) {
  return (
    <div className="td-empty">
      <span className="td-state-icon is-red" aria-hidden>
        <AlertIcon size={20} />
      </span>
      <h3 className="td-empty-title">{title}</h3>
      <p className="td-empty-body">{body}</p>
      <button type="button" className="td-soft-btn" onClick={onRetry}>
        حاول تاني
      </button>
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <div className="td-table-skeleton" aria-hidden>
      {[0, 1, 2].map((index) => (
        <div className="td-table-skeleton-row" key={index}>
          <span className="td-skeleton td-skeleton-avatar" />
          <span className="td-skeleton td-skeleton-line" />
          <span className="td-skeleton td-skeleton-line-sm" />
          <span className="td-skeleton td-skeleton-pill" />
        </div>
      ))}
    </div>
  );
}

function ExamsEmpty() {
  return (
    <div className="td-empty">
      <span className="td-state-icon" aria-hidden>
        <ExamsIcon size={20} />
      </span>
      <h3 className="td-empty-title">لا توجد اختبارات منشورة</h3>
      <p className="td-empty-body">
        أنشئ اختبارًا من داخل الدرس، وبعد النشر هيظهر للطلاب وهيظهر هنا.
      </p>
      <Link className="td-soft-btn" href="/teacher/courses">
        روح للكورسات
        <ArrowIcon size={14} />
      </Link>
    </div>
  );
}

export function ActionCenter({
  pending,
  pendingTotal,
  pendingCapped,
  pendingState,
  liveExams,
  liveExamsState,
  onRetry,
}: {
  pending: PendingRow[] | null;
  pendingTotal: number | null;
  pendingCapped: boolean;
  pendingState: LoadState;
  liveExams: LiveExamRow[] | null;
  liveExamsState: LoadState;
  onRetry: () => void;
}) {
  const [tab, setTab] = useState<"review" | "exams" | null>(null);
  const active =
    tab ?? (pendingTotal !== null && pendingTotal > 0 ? "review" : "exams");

  const reviewRows = pending?.slice(0, 6) ?? [];
  const examRows = liveExams?.slice(0, 6) ?? [];

  const reviewCount =
    pendingState === "loading"
      ? "…"
      : pendingState === "failed" || pendingTotal === null
        ? "—"
        : `${pendingTotal.toLocaleString("en-US")}${pendingCapped ? "+" : ""}`;

  const examsCount =
    liveExamsState === "loading"
      ? "…"
      : liveExamsState === "failed"
        ? "—"
        : (liveExams?.length ?? 0).toLocaleString("en-US");

  const headerHref =
    active === "review" ? "/teacher/assignments" : "/teacher/exams";
  const headerLabel =
    active === "review" ? "كل الواجبات" : "كل الاختبارات";

  return (
    <article
      className="td-card td-action-card"
      id="td-action-center"
      aria-label="مركز الإجراءات"
    >
      <header className="td-card-head">
        <div>
          <span className="td-card-kicker">طابور التصحيح</span>
          <h2 className="td-card-title">مركز الإجراءات</h2>
        </div>
        <Link className="td-soft-link" href={headerHref}>
          {headerLabel}
          <ArrowIcon size={14} />
        </Link>
      </header>

      <div className="td-tabs" role="tablist" aria-label="مركز الإجراءات">
        <button
          type="button"
          className="td-tab"
          id="td-review-tab"
          role="tab"
          aria-selected={active === "review"}
          aria-controls="td-review-panel"
          data-active={active === "review" ? "true" : "false"}
          onClick={() => setTab("review")}
        >
          <InboxIcon size={14} />
          بانتظار قرارك
          <span className="td-tab-count">{reviewCount}</span>
        </button>

        <button
          type="button"
          className="td-tab"
          id="td-exams-tab"
          role="tab"
          aria-selected={active === "exams"}
          aria-controls="td-exams-panel"
          data-active={active === "exams" ? "true" : "false"}
          onClick={() => setTab("exams")}
        >
          <ExamsIcon size={14} />
          الاختبارات الحية
          <span className="td-tab-count">{examsCount}</span>
        </button>
      </div>

      {active === "review" ? (
        <div
          id="td-review-panel"
          role="tabpanel"
          aria-labelledby="td-review-tab"
        >
          {pendingState === "loading" ? (
            <ReviewSkeleton />
          ) : pendingState === "failed" ? (
            <ErrorEmpty
              title="تعذر قراءة طابور التصحيح"
              body="بعض الطوابير لم تستجب. جرّب التحديث من غير ما نفترض أرقامًا غير مؤكدة."
              onRetry={onRetry}
            />
          ) : reviewRows.length === 0 ? (
            <ReviewEmpty onRetry={onRetry} />
          ) : (
            <>
              <div className="td-table-wrap">
                <table className="td-table">
                  <thead>
                    <tr>
                      <th scope="col">الطالب</th>
                      <th scope="col">النوع</th>
                      <th scope="col">التقييم</th>
                      <th scope="col">الحالة</th>
                      <th scope="col">
                        <span className="td-sr-only">فتح الطابور</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewRows.map((row) => {
                      const status = pendingStatus(row);
                      const initial = row.studentName.trim().charAt(0) || "ط";
                      return (
                        <tr className="td-row" key={`${row.kind}-${row.id}`}>
                          <td className="td-cell">
                            <span className="td-person">
                              <span className="td-avatar" aria-hidden>
                                {initial}
                              </span>
                              <span className="td-person-copy">
                                <span className="td-person-name">
                                  {row.studentName}
                                </span>
                                <span className="td-person-meta">
                                  <PhoneIcon size={10} />
                                  <span dir="ltr">
                                    {row.studentPhone ?? "—"}
                                  </span>
                                </span>
                              </span>
                            </span>
                          </td>
                          <td className="td-cell">
                            <Kicker kind={row.kind} />
                          </td>
                          <td className="td-cell">
                            <span className="td-assessment" title={row.title}>
                              {row.title}
                            </span>
                            <span className="td-assessment-meta">
                              {formatWhen(row.submittedAt)}
                            </span>
                          </td>
                          <td className="td-cell">
                            <span
                              className="td-pill"
                              data-tone={status.tone}
                            >
                              {status.label}
                            </span>
                          </td>
                          <td className="td-cell td-cell-action">
                            <Link className="td-open" href={row.href}>
                              افتح
                              <ArrowIcon size={12} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="td-mobile-list">
                {reviewRows.map((row) => {
                  const status = pendingStatus(row);
                  const initial = row.studentName.trim().charAt(0) || "ط";
                  return (
                    <details
                      className="td-m-card"
                      key={`m-${row.kind}-${row.id}`}
                    >
                      <summary>
                        <span className="td-avatar" aria-hidden>
                          {initial}
                        </span>
                        <span className="td-m-main">
                          <strong className="td-m-name">{row.studentName}</strong>
                          <span className="td-m-phone">
                            <span dir="ltr">{row.studentPhone ?? "—"}</span>
                          </span>
                        </span>
                        <ChevronDownIcon
                          size={16}
                          className="td-m-caret"
                        />
                      </summary>
                      <div className="td-m-body">
                        <div className="td-m-row">
                          <Kicker kind={row.kind} />
                          <span className="td-m-title">{row.title}</span>
                        </div>
                        <div className="td-m-row">
                          <ClockIcon size={13} />
                          <span>{formatWhen(row.submittedAt)}</span>
                          <span className="td-pill" data-tone={status.tone}>
                            {status.label}
                          </span>
                        </div>
                        <Link className="td-m-cta" href={row.href}>
                          افتح طابور التصحيح
                          <ArrowIcon size={13} />
                        </Link>
                      </div>
                    </details>
                  );
                })}
              </div>
            </>
          )}
        </div>
      ) : (
        <div
          id="td-exams-panel"
          role="tabpanel"
          aria-labelledby="td-exams-tab"
        >
          {liveExamsState === "loading" ? (
            <ReviewSkeleton />
          ) : liveExamsState === "failed" ? (
            <ErrorEmpty
              title="تعذر تحميل الاختبارات"
              body="مش قادرين نقرأ قائمة الاختبارات دلوقتي. جرّب التحديث."
              onRetry={onRetry}
            />
          ) : examRows.length === 0 ? (
            <ExamsEmpty />
          ) : (
            <>
              <div className="td-table-wrap">
                <table className="td-table td-exams-table">
                  <thead>
                    <tr>
                      <th scope="col">الاختبار</th>
                      <th scope="col">الدرس</th>
                      <th scope="col">المدة</th>
                      <th scope="col">بانتظار التصحيح</th>
                      <th scope="col">الحالة</th>
                      <th scope="col">
                        <span className="td-sr-only">فتح الاختبار</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {examRows.map((exam) => (
                      <tr className="td-row" key={exam.id}>
                        <td className="td-cell">
                          <span className="td-exam-name">
                            <span className="td-mini-icon" aria-hidden>
                              <ExamsIcon size={14} />
                            </span>
                            <span className="td-assessment" title={exam.title}>
                              {exam.title}
                            </span>
                          </span>
                        </td>
                        <td className="td-cell">
                          <span className="td-muted">
                            {examLessonLabel(exam)}
                          </span>
                        </td>
                        <td className="td-cell">
                          <span className="td-inline">
                            <ClockIcon size={12} />
                            {exam.timerMinutes} دقيقة
                          </span>
                        </td>
                        <td className="td-cell">
                          <span className="td-inline td-pending">
                            <InboxIcon size={12} />
                            {exam.pending === null
                              ? "—"
                              : exam.pending.toLocaleString("en-US")}
                          </span>
                        </td>
                        <td className="td-cell">
                          <span className="td-live">
                            <span className="td-live-dot" aria-hidden />
                            منشور
                          </span>
                        </td>
                        <td className="td-cell td-cell-action">
                          <Link className="td-open" href={exam.href}>
                            افتح
                            <ArrowIcon size={12} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="td-mobile-list">
                {examRows.map((exam) => (
                  <details className="td-m-card" key={`m-${exam.id}`}>
                    <summary>
                      <span className="td-mini-icon" aria-hidden>
                        <ExamsIcon size={15} />
                      </span>
                      <span className="td-m-main">
                        <strong className="td-m-name">{exam.title}</strong>
                        <span className="td-m-sub">
                          {examLessonLabel(exam)}
                        </span>
                      </span>
                      <span className="td-pill" data-tone="green">
                        منشور
                      </span>
                      <ChevronDownIcon size={16} className="td-m-caret" />
                    </summary>
                    <div className="td-m-body">
                      <div className="td-m-row">
                        <ClockIcon size={13} />
                        <span>{exam.timerMinutes} دقيقة</span>
                      </div>
                      <div className="td-m-row">
                        <InboxIcon size={13} />
                        <span>
                          {exam.pending === null
                            ? "—"
                            : exam.pending.toLocaleString("en-US")}{" "}
                          بانتظار التصحيح
                        </span>
                      </div>
                      <Link className="td-m-cta" href={exam.href}>
                        افتح الاختبار
                        <ArrowIcon size={13} />
                      </Link>
                    </div>
                  </details>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </article>
  );
}
