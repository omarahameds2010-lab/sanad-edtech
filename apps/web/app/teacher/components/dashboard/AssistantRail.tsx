"use client";

import Link from "next/link";
import {
  ArrowIcon,
  AssignmentsIcon,
  CheckIcon,
  ClockIcon,
  ExamsIcon,
  InboxIcon,
  ShieldAlertIcon,
  SparkIcon,
} from "../TeacherIcons";
import {
  examLessonLabel,
  type LiveExamRow,
  type LoadState,
  type PendingRow,
} from "./types";

const shortDateFormatter = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  day: "numeric",
  month: "short",
});

function shortWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "اليوم";
  const diff = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diff === 1) return "أمس";
  if (diff > 1 && diff < 7) return `${diff} أيام`;
  return shortDateFormatter.format(date);
}

function SideSkeleton() {
  return (
    <div className="td-side-skeleton" aria-hidden>
      <span className="td-skeleton td-side-skeleton-line" />
      <span className="td-skeleton td-side-skeleton-value" />
      <span className="td-skeleton td-side-skeleton-line" />
    </div>
  );
}

export function AssistantRail({
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
  const reviewRows = pending?.slice(0, 2) ?? [];
  const liveRows = liveExams?.slice(0, 2) ?? [];

  const reviewChip =
    pendingState === "loading"
      ? { label: "جارٍ القراءة", tone: "quiet" }
      : pendingState === "failed"
        ? { label: "غير مكتمل", tone: "red" }
        : (pendingTotal ?? 0) > 0
          ? { label: "عاجل", tone: "red" }
          : { label: "مكتمل", tone: "green" };

  const reviewTitle =
    (pendingTotal ?? 0) > 0
      ? "قرارك مطلوب"
      : pendingState === "failed"
        ? "تعذر قراءة الطابور"
        : "لا شيء معلّق";

  const reviewCaption =
    pendingState === "loading"
      ? "بنجهّز طابور التصحيح من الخادم…"
      : pendingState === "failed"
        ? "طابور واحد على الأقل لم يستجب، والأرقام غير المؤكدة لن تظهر."
        : (pendingTotal ?? 0) > 0
          ? "تسليم ومحاولة بانتظار قرارك."
          : "كل التسليمات والمحاولات مصححة.";

  const liveCount =
    liveExamsState === "loading"
      ? null
      : liveExamsState === "failed"
        ? null
        : (liveExams?.length ?? 0);

  const liveChip =
    liveExamsState === "loading"
      ? { label: "جارٍ التحقق", tone: "quiet" }
      : (liveCount ?? 0) > 0
        ? { label: "مباشر", tone: "green" }
        : { label: "غير متاح", tone: "quiet" };

  const liveStateLabel =
    liveExamsState === "loading"
      ? "…"
      : liveExamsState === "failed"
        ? "تعذر"
        : (liveCount ?? 0) > 0
          ? "منشور"
          : "لا يوجد";

  return (
    <aside className="td-side" aria-label="المساعد الذكي للمعلم">
      <article className="td-side-card td-review-card">
        <div className="td-side-top">
          <span className="td-side-icon" aria-hidden>
            <ShieldAlertIcon size={17} />
          </span>
          <span className="td-chip" data-tone="red">
            مراجعة حتمية
          </span>
          <span className="td-chip td-side-state" data-tone={reviewChip.tone}>
            {reviewChip.label}
          </span>
        </div>

        <h3 className="td-side-title">{reviewTitle}</h3>

        {pendingState === "loading" ? (
          <SideSkeleton />
        ) : (
          <div className="td-side-metric">
            {pendingTotal === null
              ? "—"
              : `${pendingTotal.toLocaleString("en-US")}${pendingCapped ? "+" : ""}`}
          </div>
        )}

        <p className="td-side-caption">{reviewCaption}</p>

        {pendingState === "ready" && reviewRows.length > 0 ? (
          <div className="td-side-tasks">
            {reviewRows.map((row) => (
              <Link
                className="td-side-task"
                href={row.href}
                key={`${row.kind}-${row.id}`}
              >
                <span className="td-side-task-icon" aria-hidden>
                  {row.kind === "exam" ? (
                    <ExamsIcon size={14} />
                  ) : (
                    <AssignmentsIcon size={14} />
                  )}
                </span>
                <span className="td-side-task-copy">
                  <strong>{row.studentName}</strong>
                  <small>{row.title}</small>
                </span>
                <span className="td-side-task-time">
                  {shortWhen(row.submittedAt)}
                </span>
              </Link>
            ))}
          </div>
        ) : null}

        {pendingState === "ready" && (pendingTotal ?? 0) === 0 ? (
          <div className="td-side-calm">
            <span className="td-side-calm-icon" aria-hidden>
              <CheckIcon size={15} />
            </span>
            <span>مفيش أي تسليم مستني قرارك.</span>
          </div>
        ) : null}

        {pendingState === "failed" ? (
          <button type="button" className="td-side-retry" onClick={onRetry}>
            حاول تاني
          </button>
        ) : (
          <Link className="td-side-link" href="/teacher/assignments">
            افتح طابور التصحيح
            <ArrowIcon size={13} />
          </Link>
        )}
      </article>

      <article className="td-side-card td-gap-card">
        <div className="td-side-top">
          <span className="td-side-icon" aria-hidden>
            <SparkIcon size={17} />
          </span>
          <span className="td-chip" data-tone="amber">
            فجوة معرفية
          </span>
          <span className="td-chip td-side-state" data-tone="quiet">
            قيد الربط
          </span>
        </div>

        <h3 className="td-side-title">المساعد الذكي</h3>

        <div className="td-gap-empty">
          <span className="td-gap-mark" aria-hidden>
            —
          </span>
          <p>
            الفجوات المجمّعة مش متاحة في النسخة الحالية. بتظهر هنا بعد ربط
            تقييمات SANAD على الخادم.
          </p>
        </div>

        <span className="td-side-foot">من تقييمات SANAD</span>
      </article>

      <article className="td-side-card td-live-card">
        <div className="td-side-top">
          <span className="td-side-icon" aria-hidden>
            <ExamsIcon size={17} />
          </span>
          <span className="td-chip" data-tone={liveChip.tone}>
            {liveChip.tone === "green" ? (
              <span className="td-live-dot" aria-hidden />
            ) : null}
            {liveChip.label}
          </span>
          <span
            className="td-chip td-side-state"
            data-tone={liveExamsState === "failed" ? "red" : "quiet"}
          >
            {liveStateLabel}
          </span>
        </div>

        <h3 className="td-side-title">اختبارات حية</h3>

        {liveExamsState === "loading" ? (
          <SideSkeleton />
        ) : (
          <div className="td-side-metric">
            {liveCount === null ? "—" : liveCount.toLocaleString("en-US")}
          </div>
        )}

        <p className="td-side-caption">
          {liveExamsState === "loading"
            ? "بنجهّز قائمة الاختبارات من الخادم…"
            : liveExamsState === "failed"
              ? "تعذر تحميل قائمة الاختبارات."
              : liveCount === 0
                ? "لا توجد اختبارات منشورة للطلاب."
                : "اختبار منشور ومتاح للطلاب."}
        </p>

        {liveExamsState === "ready" && liveRows.length > 0 ? (
          <div className="td-side-tasks">
            {liveRows.map((exam) => (
              <Link className="td-side-task" href={exam.href} key={exam.id}>
                <span className="td-side-task-icon" aria-hidden>
                  <ClockIcon size={14} />
                </span>
                <span className="td-side-task-copy">
                  <strong>{exam.title}</strong>
                  <small>{examLessonLabel(exam)}</small>
                </span>
                <span className="td-side-task-time">
                  {exam.pending === null
                    ? "—"
                    : `${exam.pending.toLocaleString("en-US")} بانتظار`}
                </span>
              </Link>
            ))}
          </div>
        ) : null}

        {liveExamsState === "failed" ? (
          <button type="button" className="td-side-retry" onClick={onRetry}>
            حاول تاني
          </button>
        ) : (
          <Link className="td-side-link" href="/teacher/exams">
            كل الاختبارات
            <ArrowIcon size={13} />
          </Link>
        )}
      </article>

      <div className="td-side-note">
        <InboxIcon size={14} />
        <span>كل الأرقام في هذه اللوحة مقروءة من الخادم.</span>
      </div>
    </aside>
  );
}
