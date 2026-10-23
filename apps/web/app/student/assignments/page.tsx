"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/app/lib/auth";
import {
  api,
  ApiError,
  type AssignmentListItem,
  type AssignmentSubmissionSummary,
  type StudentAssignmentView,
  type StudentLesson,
} from "@/app/lib/api";
import AssignmentResultReview from "./components/AssignmentResultReview";
import {
  AcademicBlueprint,
  BlueprintSummary,
  GrowthBridge,
} from "./components/ProgressModules";
import {
  buildGrowthSummary,
  buildScoreBlueprint,
} from "./lib/progress";

type AssignmentState =
  "available" | "active" | "submitted" | "expired" | "unavailable" | "unknown";

type FilterId = "all" | "available" | "submitted" | "expired";
type ViewMode = "list" | "path";

interface AssignmentRow {
  item: AssignmentListItem;
  view: StudentAssignmentView | null;
  state: AssignmentState;
  attempted: boolean;
  viewFailed: boolean;
  latest: AssignmentSubmissionSummary | null;
  submissions: AssignmentSubmissionSummary[];
}

interface RemedialState {
  rowId: string;
  loading: boolean;
  data: StudentLesson | null;
  error: string | null;
}

interface PraiseState {
  submissionId: string;
  title: string;
  score: number;
}

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: "all", label: "الكل" },
  { id: "available", label: "متاح حالياً" },
  { id: "submitted", label: "تم التسليم" },
  { id: "expired", label: "فات موعده" },
];

const STATE_COPY: Record<
  AssignmentState,
  { label: string; tone: "green" | "neutral" | "red" | "muted" }
> = {
  available: { label: "متاح", tone: "green" },
  active: { label: "قيد الحل", tone: "green" },
  submitted: { label: "تم التسليم", tone: "neutral" },
  expired: { label: "فات موعده", tone: "red" },
  unavailable: { label: "غير متاح", tone: "muted" },
  unknown: { label: "حالة غير مقروءة", tone: "muted" },
};

const ITEM_STATUS_LABELS: Record<string, string> = {
  PUBLISHED: "متاح",
  DRAFT: "مسودة",
  CLOSED: "مغلق",
  ARCHIVED: "مؤرشف",
};

const STATE_PRIORITY: Record<AssignmentState, number> = {
  available: 0,
  active: 1,
  submitted: 2,
  expired: 3,
  unknown: 4,
  unavailable: 5,
};

function FilePenIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}

function ClockIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

function BookIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
      <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
    </svg>
  );
}

function ArrowIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function CheckIcon({ size = 17 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m5 12.5 4.2 4.2L19 6.8" />
    </svg>
  );
}

function ClipboardIcon({ size = 17 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="5" y="4.5" width="14" height="16" rx="2.5" />
      <path d="M9 4.5V3.8A1.3 1.3 0 0 1 10.3 2.5h3.4A1.3 1.3 0 0 1 15 3.8v.7M9 10.5h6M9 14.5h4" />
    </svg>
  );
}

function CompassIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </svg>
  );
}

function ListIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  );
}

function PathIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="6" cy="5" r="2" />
      <circle cx="18" cy="12" r="2" />
      <circle cx="6" cy="19" r="2" />
      <path d="M8 5h3a3 3 0 0 1 3 3v1a3 3 0 0 0 3 3M8 19h3a3 3 0 0 0 3-3v-1a3 3 0 0 1 3-3" />
    </svg>
  );
}

function RefreshIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 11a8 8 0 0 0-13.6-5.2L4 8" />
      <path d="M4 4v4h4M4 13a8 8 0 0 0 13.6 5.2L20 16" />
      <path d="M20 20v-4h-4" />
    </svg>
  );
}

function SparkIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3.5 13.7 9l5.3 1.8-5.3 1.8L12 18l-1.7-5.4L5 10.8 10.3 9z" />
      <path d="M18.5 16.5 19.2 19l2.3.8-2.3.8-.7 2.4" />
    </svg>
  );
}

function lessonEmbedUrl(lesson: StudentLesson): string | null {
  const video = lesson.videos.find(
    (item) => item.provider === "youtube" && item.providerVideoId,
  );
  return video
    ? `https://www.youtube-nocookie.com/embed/${video.providerVideoId}`
    : null;
}

function hasSubmittedAnswer(view: StudentAssignmentView): boolean {
  const attempt = view.activeSubmission;
  if (!attempt) return false;
  if (typeof attempt.content === "string" && attempt.content.trim()) {
    return true;
  }
  return Array.isArray(attempt.attachments) && attempt.attachments.length > 0;
}

function deriveState(
  item: AssignmentListItem,
  view: StudentAssignmentView | null,
  viewFailed: boolean,
): AssignmentState {
  if (item.status !== "PUBLISHED") return "unavailable";
  if (viewFailed || !view) return "unknown";

  if (view.activeSubmission) {
    // The API keeps a submitted answer in SUBMITTED until a teacher grades
    // it, and uses the same status for an attempt the student only entered.
    // Content/attachments are the only runtime signal that separates them.
    if (hasSubmittedAnswer(view)) return "submitted";
    return view.isExpired ? "expired" : "active";
  }

  if (view.studentAttemptCount > 0) return "submitted";
  if (view.canAttempt) return "available";
  return "unavailable";
}

function matchesFilter(row: AssignmentRow, filter: FilterId): boolean {
  if (filter === "all") return true;
  if (filter === "available") return row.state === "available";
  if (filter === "submitted") return row.state === "submitted";
  return row.state === "expired";
}

function statusCopy(row: AssignmentRow) {
  if (row.item.status !== "PUBLISHED" && row.state === "unavailable") {
    return {
      label: ITEM_STATUS_LABELS[row.item.status] ?? row.item.status,
      tone: "muted" as const,
    };
  }
  if (row.latest?.status === "GRADED" && row.latest.score !== null) {
    return { label: "تم التصحيح", tone: "neutral" as const };
  }
  return STATE_COPY[row.state];
}

function SkeletonCard({ index }: { index: number }) {
  return (
    <div className="sw-skel-card" style={{ animationDelay: `${index * 70}ms` }}>
      <span className="sw-skel sw-skel-icon" />
      <div className="sw-skel-copy">
        <span className="sw-skel sw-skel-line-lg" />
        <span className="sw-skel sw-skel-line-sm" />
      </div>
      <span className="sw-skel sw-skel-pill" />
      <span className="sw-skel sw-skel-btn" />
    </div>
  );
}

function SkeletonStat({ tall = false }: { tall?: boolean }) {
  return (
    <div className={`sw-skel-stat${tall ? " sw-skel-stat-tall" : ""}`}>
      <span className="sw-skel sw-skel-line-sm" />
      <span className="sw-skel sw-skel-value" />
      <span className="sw-skel sw-skel-line-lg" />
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <aside className="sw-side" aria-hidden>
      <SkeletonStat />
      <SkeletonStat />
      <SkeletonStat tall />
    </aside>
  );
}

export default function StudentAssignmentsPage() {
  const { token, ready } = useAuth();
  const [rows, setRows] = useState<AssignmentRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState<FilterId>("all");
  const [view, setView] = useState<ViewMode>("list");
  const [remedial, setRemedial] = useState<RemedialState | null>(null);
  const [remedialRowId, setRemedialRowId] = useState<string | null>(null);
  const [praise, setPraise] = useState<PraiseState | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      setRows(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setRows(null);
    setError(null);

    (async () => {
      try {
        const result = await api.listAssignments(token);
        if (cancelled) return;

        const enriched = await Promise.all(
          result.assignments.map(async (item): Promise<AssignmentRow> => {
            if (item.status !== "PUBLISHED") {
              return {
                item,
                view: null,
                viewFailed: false,
                state: "unavailable" as AssignmentState,
                attempted: false,
                latest: null,
                submissions: [],
              };
            }

            const [viewResult, submissionsResult] = await Promise.allSettled([
              api.getStudentAssignmentView(token, item.id),
              api.getMySubmissions(token, item.id),
            ]);
            const studentView =
              viewResult.status === "fulfilled" ? viewResult.value : null;
            const submissions =
              submissionsResult.status === "fulfilled"
                ? submissionsResult.value
                : [];
            const viewFailed = viewResult.status === "rejected";
            const state = deriveState(item, studentView, viewFailed);

            return {
              item,
              view: studentView,
              viewFailed,
              state,
              attempted: state === "submitted",
              latest: submissions[0] ?? null,
              submissions,
            };
          }),
        );

        if (cancelled) return;

        const ordered = [...enriched].sort((a, b) => {
          const diff = STATE_PRIORITY[a.state] - STATE_PRIORITY[b.state];
          return diff !== 0 ? diff : 0;
        });

        setRows(ordered);
      } catch (cause) {
        if (cancelled) return;
        setError(
          cause instanceof ApiError ? cause.message : "تعذر تحميل الواجبات",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, token, reloadKey]);

  const loading = ready && !!token && rows === null && error === null;

  const stats = useMemo(() => {
    const all = rows ?? [];
    const eligible = all.filter((row) => row.item.status === "PUBLISHED");
    const total = eligible.length;
    const completed = eligible.filter((row) => row.attempted).length;
    const available = eligible.filter(
      (row) => row.state === "available",
    ).length;
    const active = eligible.filter((row) => row.state === "active").length;
    const submitted = eligible.filter(
      (row) => row.state === "submitted",
    ).length;
    const expired = eligible.filter((row) => row.state === "expired").length;
    const incomplete = eligible.some((row) => row.viewFailed);
    const completion =
      incomplete || total === 0 ? null : Math.round((completed / total) * 100);

    return {
      all,
      eligible,
      total,
      completed,
      available,
      active,
      submitted,
      expired,
      incomplete,
      open: available + active,
      completion,
    };
  }, [rows]);

  const allSubmissions = useMemo(
    () => (rows ?? []).flatMap((row) => row.submissions),
    [rows],
  );
  const growth = useMemo(
    () => buildGrowthSummary(allSubmissions),
    [allSubmissions],
  );
  const blueprint = useMemo(
    () => buildScoreBlueprint(allSubmissions),
    [allSubmissions],
  );
  const latestGradedRow = useMemo(() => {
    const graded = (rows ?? []).filter(
      (row) =>
        row.latest?.status === "GRADED" && row.latest.score !== null,
    );
    return (
      [...graded].sort((a, b) => {
        const aDate = a.latest?.gradedAt ?? a.latest?.submittedAt ?? "";
        const bDate = b.latest?.gradedAt ?? b.latest?.submittedAt ?? "";
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      })[0] ?? null
    );
  }, [rows]);

  useEffect(() => {
    if (!latestGradedRow?.latest || latestGradedRow.latest.score === null) {
      return;
    }
    const latest = latestGradedRow.latest;
    const score = latest.score;
    if (score === null || score < 90) return;

    const key = `sanad:praise:${latest.id}`;
    try {
      if (window.localStorage.getItem(key) === "1") return;
    } catch {
      // A blocked storage API must not hide a real achievement.
    }
    setPraise({
      submissionId: latest.id,
      title: latestGradedRow.item.title,
      score,
    });
  }, [latestGradedRow]);

  useEffect(() => {
    if (!praise) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          `sanad:praise:${praise.submissionId}`,
          "1",
        );
      } catch {
        // ignore storage failures
      }
      setPraise(null);
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [praise]);

  function dismissPraise() {
    if (praise) {
      try {
        window.localStorage.setItem(
          `sanad:praise:${praise.submissionId}`,
          "1",
        );
      } catch {
        // ignore storage failures
      }
    }
    setPraise(null);
  }

  const visible = useMemo(
    () => (rows ?? []).filter((row) => matchesFilter(row, filter)),
    [rows, filter],
  );

  const filterCounts: Record<FilterId, number> = {
    all: stats.all.length,
    available: stats.available,
    submitted: stats.submitted,
    expired: stats.expired,
  };

  const completionLabel =
    stats.completion === null ? "—" : `${stats.completion}%`;
  const openLabel = stats.incomplete ? "—" : stats.open.toLocaleString("en-US");
  const failedViews = stats.eligible.filter((row) => row.viewFailed).length;
  const sideLoading = !ready || loading;
  const showSidebar = !sideLoading && !!token && !error && rows !== null;
  const solo = !sideLoading && !showSidebar;

  async function toggleRemedial(row: AssignmentRow) {
    if (!token) return;
    const lessonId = row.item.lesson?.id ?? row.item.lessonId;
    if (!lessonId) return;
    if (remedialRowId === row.item.id) {
      setRemedialRowId(null);
      return;
    }
    setRemedialRowId(row.item.id);
    if (remedial?.rowId === row.item.id) return;
    setRemedial({
      rowId: row.item.id,
      loading: true,
      data: null,
      error: null,
    });
    try {
      const data = await api.getStudentLesson(token, lessonId);
      setRemedial({
        rowId: row.item.id,
        loading: false,
        data,
        error: null,
      });
    } catch (cause) {
      setRemedial({
        rowId: row.item.id,
        loading: false,
        data: null,
        error:
          cause instanceof ApiError
            ? cause.message
            : "تعذر تحميل مراجعة الدرس",
      });
    }
  }

  return (
    <div className="sw-canvas">
      <div className="sw-shell" aria-busy={loading}>
        <div className="sw-layout" data-solo={solo ? "true" : undefined}>
          <section className="sw-main">
            <header className="sw-head">
              <div className="sw-head-copy">
                <span className="sw-eyebrow">التسليم</span>
                <h1 className="sw-title">واجباتي</h1>
                <p className="sw-sub">
                  اكتب إجابتك وسلّم قبل ما ينتهي المؤقت — الوقت محسوب من الخادم.
                </p>
              </div>
              {rows ? (
                <span className="sw-head-count">
                  <strong>{stats.total.toLocaleString("en-US")}</strong>
                  <span>واجب</span>
                </span>
              ) : null}
            </header>

            {!ready || loading ? (
              <>
                <div className="sw-toolbar-skeleton" aria-hidden>
                  <span className="sw-skel sw-skel-filter" />
                  <span className="sw-skel sw-skel-filter" />
                  <span className="sw-skel sw-skel-filter" />
                </div>
                <div
                  className="sw-list-skeleton"
                  aria-label="جارٍ تحميل الواجبات"
                >
                  {[0, 1, 2].map((index) => (
                    <SkeletonCard key={index} index={index} />
                  ))}
                </div>
              </>
            ) : !token ? (
              <div className="sw-state">
                <span className="sw-state-mark" aria-hidden>
                  <FilePenIcon size={22} />
                </span>
                <h2>سجّل الدخول أولًا</h2>
                <p>
                  عشان تشوف واجباتك وتحفظ إجاباتك، محتاج تكون مسجل دخول بحساب
                  طالب.
                </p>
                <Link href="/login" className="sw-btn sw-btn-primary">
                  تسجيل الدخول
                  <ArrowIcon />
                </Link>
              </div>
            ) : error ? (
              <div className="sw-state sw-state-error">
                <span className="sw-state-mark" aria-hidden>
                  <FilePenIcon size={22} />
                </span>
                <h2>تعذر تحميل الواجبات</h2>
                <p>{error}</p>
                <button
                  type="button"
                  className="sw-btn sw-btn-secondary"
                  onClick={() => setReloadKey((value) => value + 1)}
                >
                  حاول تاني
                </button>
              </div>
            ) : (
              <>
                {failedViews > 0 ? (
                  <div className="sw-notice" role="status">
                    <span className="sw-notice-mark" aria-hidden>
                      !
                    </span>
                    <p>
                      تعذر قراءة حالة {failedViews.toLocaleString("en-US")}{" "}
                      {failedViews === 1 ? "واجب" : "واجبات"}. الأرقام الناقصة
                      معروضة كـ «—» بدل تقديرها.
                    </p>
                  </div>
                ) : null}

                <div className="sw-toolbar">
                  <div
                    className="sw-filters"
                    role="group"
                    aria-label="تصفية الواجبات"
                  >
                    {FILTERS.map((item) => {
                      const active = filter === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className="sw-filter"
                          data-active={active ? "true" : "false"}
                          aria-pressed={active}
                          onClick={() => setFilter(item.id)}
                        >
                          <span>{item.label}</span>
                          <span className="sw-filter-count">
                            {filterCounts[item.id].toLocaleString("en-US")}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div
                    className="sw-view-switch"
                    role="group"
                    aria-label="طريقة عرض الواجبات"
                  >
                    <button
                      type="button"
                      data-active={view === "list" ? "true" : "false"}
                      aria-pressed={view === "list"}
                      onClick={() => setView("list")}
                      title="عرض القائمة"
                    >
                      <ListIcon />
                      <span>قائمة</span>
                    </button>
                    <button
                      type="button"
                      data-active={view === "path" ? "true" : "false"}
                      aria-pressed={view === "path"}
                      onClick={() => setView("path")}
                      title="عرض المسار"
                    >
                      <PathIcon />
                      <span>مسار</span>
                    </button>
                  </div>
                </div>

                {stats.eligible.length === 0 ? (
                  <div className="sw-state">
                    <span className="sw-state-mark" aria-hidden>
                      <FilePenIcon size={22} />
                    </span>
                    <h2>لا توجد واجبات منشورة بعد</h2>
                    <p>
                      أول ما ينشر المدرس واجبًا في كورس مشترك فيه، هتلاقيه هنا
                      جاهز للحل.
                    </p>
                  </div>
                ) : visible.length === 0 ? (
                  <div className="sw-state sw-state-quiet">
                    <span className="sw-state-mark" aria-hidden>
                      <ClipboardIcon size={21} />
                    </span>
                    <h2>لا توجد واجبات في هذا التصنيف</h2>
                    <p>جرّب تصنيفًا آخر أو ارجع لكل الواجبات.</p>
                    <button
                      type="button"
                      className="sw-btn sw-btn-secondary"
                      onClick={() => setFilter("all")}
                    >
                      عرض الكل
                    </button>
                  </div>
                ) : (
                  <div className="sw-list" data-view={view}>
                    {visible.map((row, index) => {
                      const copy = statusCopy(row);
                      const lessonId = row.item.lesson?.id ?? row.item.lessonId;
                      const canOpen = row.item.status === "PUBLISHED";
                      const titleId = `assignment-${row.item.id}-title`;
                      const latest = row.latest;
                      const latestScore = latest?.score ?? null;
                      const graded =
                        latest?.status === "GRADED" && latestScore !== null;
                      const passingScore = row.view?.passingScore ?? null;
                      const hasGap =
                        graded &&
                        passingScore !== null &&
                        latestScore !== null &&
                        latestScore < passingScore;
                      const remedyOpen = remedialRowId === row.item.id;
                      const primaryLabel =
                        row.state === "active"
                          ? "متابعة الحل"
                          : row.state === "submitted"
                            ? "عرض التسليم"
                            : "فتح الواجب";

                      return (
                        <article
                          key={row.item.id}
                          className="sw-card"
                          data-state={row.state}
                          data-step={index + 1}
                          aria-labelledby={titleId}
                          style={{
                            animationDelay: `${Math.min(index, 8) * 45}ms`,
                          }}
                        >
                          <div className="sw-card-identity">
                            <span className="sw-card-icon" aria-hidden>
                              <FilePenIcon size={20} />
                            </span>
                            <div className="sw-card-copy">
                              <span className="sw-card-kicker">واجب</span>
                              <h2 className="sw-card-title" id={titleId}>
                                {canOpen ? (
                                  <Link
                                    href={`/student/assignments/${row.item.id}`}
                                  >
                                    {row.item.title}
                                  </Link>
                                ) : (
                                  row.item.title
                                )}
                              </h2>
                              <div className="sw-card-meta">
                                <span className="sw-meta-item">
                                  <ClockIcon />
                                  <span>{row.item.timerMinutes} دقيقة</span>
                                </span>
                                {row.item.lesson?.title ? (
                                  <>
                                    <span className="sw-meta-sep" aria-hidden />
                                    <span className="sw-meta-item">
                                      <BookIcon />
                                      <span title={row.item.lesson.title}>
                                        {row.item.lesson.title}
                                      </span>
                                    </span>
                                  </>
                                ) : null}
                                {latestScore !== null ? (
                                  <>
                                    <span className="sw-meta-sep" aria-hidden />
                                    <span className="sw-meta-item sw-meta-score">
                                      <CheckIcon size={13} />
                                      <span dir="ltr">{latestScore}%</span>
                                    </span>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="sw-card-status">
                            <span
                              className="sw-status"
                              data-tone={copy.tone}
                              title={copy.label}
                            >
                              <span className="sw-status-dot" aria-hidden />
                              {copy.label}
                            </span>
                          </div>

                          <div className="sw-card-actions">
                            {hasGap ? (
                              <button
                                type="button"
                                className="sw-btn sw-btn-primary"
                                onClick={() => void toggleRemedial(row)}
                                aria-expanded={remedyOpen}
                              >
                                {remedyOpen
                                  ? "إغلاق المراجعة"
                                  : "ردم الفجوة المعرفية الآن"}
                                <RefreshIcon />
                              </button>
                            ) : canOpen ? (
                              <Link
                                href={`/student/assignments/${row.item.id}`}
                                className="sw-btn sw-btn-primary"
                              >
                                {graded ? "مراجعة النتيجة" : primaryLabel}
                                <ArrowIcon />
                              </Link>
                            ) : (
                              <span
                                className="sw-btn sw-btn-secondary sw-btn-disabled"
                                aria-disabled="true"
                              >
                                غير متاح
                              </span>
                            )}

                            {hasGap ? (
                              <Link
                                href={`/student/assignments/${row.item.id}`}
                                className="sw-btn sw-btn-secondary"
                              >
                                مراجعة النتيجة
                              </Link>
                            ) : graded && lessonId ? (
                              <button
                                type="button"
                                className="sw-btn sw-btn-secondary"
                                onClick={() => void toggleRemedial(row)}
                                aria-expanded={remedyOpen}
                              >
                                {remedyOpen ? "إغلاق المراجعة" : "مراجعة أساس الواجب"}
                              </button>
                            ) : lessonId && canOpen ? (
                              <Link
                                href={`/student/lessons/${lessonId}`}
                                className="sw-btn sw-btn-secondary"
                              >
                                صفحة الدرس
                              </Link>
                            ) : null}
                          </div>

                          {remedyOpen ? (
                            <div className="sw-card-remedy">
                              <div className="sw-remedy-head">
                                <div>
                                  <span className="sw-remedy-kicker">
                                    {hasGap
                                      ? "مراجعة موجهة للفجوة"
                                      : "مراجعة أساس الواجب"}
                                  </span>
                                  <h3>
                                    {remedial?.data?.lesson.title ??
                                      row.item.lesson?.title ??
                                      "درس الواجب"}
                                  </h3>
                                </div>
                                <button
                                  type="button"
                                  className="sw-remedy-close"
                                  onClick={() => setRemedialRowId(null)}
                                  aria-label="إغلاق المراجعة"
                                >
                                  ×
                                </button>
                              </div>

                              {remedial?.rowId !== row.item.id ||
                              remedial.loading ? (
                                <p className="sw-remedy-state">
                                  بنجهّز مراجعة الدرس…
                                </p>
                              ) : remedial.error ? (
                                <div className="sw-remedy-state">
                                  <p>{remedial.error}</p>
                                  {lessonId ? (
                                    <Link
                                      href={`/student/lessons/${lessonId}`}
                                      className="sw-btn sw-btn-secondary"
                                    >
                                      افتح صفحة الدرس
                                    </Link>
                                  ) : null}
                                </div>
                              ) : remedial.data ? (
                                remedial.data.access.isLocked ? (
                                  <p className="sw-remedy-state">
                                    الدرس مقفل حاليًا. كمّل الخطوة السابقة أولًا
                                    عشان تفتح المراجعة.
                                  </p>
                                ) : lessonEmbedUrl(remedial.data) ? (
                                  <div className="sw-remedy-video">
                                    <iframe
                                      src={
                                        lessonEmbedUrl(remedial.data) as string
                                      }
                                      title={remedial.data.lesson.title}
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    />
                                  </div>
                                ) : (
                                  <div className="sw-remedy-state">
                                    <p>
                                      الدرس متاح، لكن مفيش فيديو منشور له في
                                      النسخة الحالية.
                                    </p>
                                    {lessonId ? (
                                      <Link
                                        href={`/student/lessons/${lessonId}`}
                                        className="sw-btn sw-btn-secondary"
                                      >
                                        افتح صفحة الدرس
                                      </Link>
                                    ) : null}
                                  </div>
                                )
                              ) : null}
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                )}

                {latestGradedRow?.latest && token ? (
                  <div className="sw-main-extra">
                    <AssignmentResultReview
                      token={token}
                      assignmentTitle={latestGradedRow.item.title}
                      latest={latestGradedRow.latest}
                      passingScore={
                        latestGradedRow.view?.passingScore ?? null
                      }
                      lessonId={
                        latestGradedRow.item.lesson?.id ??
                        latestGradedRow.item.lessonId
                      }
                    />
                    {blueprint ? (
                      <AcademicBlueprint blueprint={blueprint} />
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
          </section>

          {sideLoading ? (
            <SidebarSkeleton />
          ) : showSidebar ? (
            <aside className="sw-side" aria-label="ملخص واجباتي">
              <article className="sw-stat sw-stat-green">
                <div className="sw-stat-head">
                  <span>الإنجاز</span>
                  <span className="sw-stat-icon" aria-hidden>
                    <CheckIcon />
                  </span>
                </div>
                <div className="sw-stat-value">{completionLabel}</div>
                <div
                  className="sw-progress"
                  role="progressbar"
                  aria-label="نسبة الواجبات المسلمة"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={stats.completion ?? undefined}
                  aria-valuetext={
                    stats.completion === null
                      ? "غير متاح"
                      : `${stats.completion}%`
                  }
                >
                  <span
                    style={{ width: `${stats.completion ?? 0}%` }}
                    aria-hidden
                  />
                </div>
                <p className="sw-stat-foot">
                  {stats.completion === null
                    ? "تعذر حساب النسبة لكل الواجبات"
                    : `${stats.completed.toLocaleString("en-US")} من ${stats.total.toLocaleString("en-US")} واجب تم تسليمه`}
                </p>
                <GrowthBridge summary={growth} />
              </article>

              <article className="sw-stat">
                <div className="sw-stat-head">
                  <span>المهام المعلقة</span>
                  <span className="sw-stat-icon" aria-hidden>
                    <ClipboardIcon />
                  </span>
                </div>
                <div className="sw-stat-value sw-stat-value-plain">
                  {openLabel}
                </div>
                <p className="sw-stat-foot">
                  {stats.incomplete
                    ? "الأرقام لا تشمل الحالات غير المقروءة"
                    : stats.active > 0
                      ? `${stats.available.toLocaleString("en-US")} متاح الآن · ${stats.active.toLocaleString("en-US")} قيد الحل`
                      : "متاحة للبدء الآن"}
                </p>
                <div className="sw-stat-split">
                  <span>تم التسليم</span>
                  <strong>
                    {stats.incomplete
                      ? "—"
                      : stats.completed.toLocaleString("en-US")}
                  </strong>
                </div>
              </article>

              <article
                className={`sw-compass-card${blueprint ? " sw-compass-card-data" : ""}`}
              >
                <div className="sw-compass-head">
                  <span className="sw-compass-icon" aria-hidden>
                    <CompassIcon />
                  </span>
                  <div>
                    <h2>{blueprint ? "خريطة النضوج" : "بوصلة التحصيل"}</h2>
                    <span
                      className="sw-chip"
                      data-tone={blueprint ? "green" : undefined}
                    >
                      {blueprint ? "درجات معتمدة" : "قيد الربط"}
                    </span>
                  </div>
                </div>
                {blueprint ? (
                  <>
                    <BlueprintSummary blueprint={blueprint} />
                    <p className="sw-compass-note">
                      بوصلة الفجوات الدقيقة هتترسم بعد ربط تحليل سند لكل إجابة.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="sw-compass-visual" aria-hidden>
                      <span className="sw-compass-ring sw-compass-ring-outer" />
                      <span className="sw-compass-ring sw-compass-ring-inner" />
                      <span className="sw-compass-axis sw-compass-axis-x" />
                      <span className="sw-compass-axis sw-compass-axis-y" />
                      <span className="sw-compass-needle" />
                    </div>
                    <p>
                      هتظهر الفجوات المعرفية هنا بعد ربط تحليلات الإجابات. مفيش
                      تقديرات مصطنعة قبل كده.
                    </p>
                  </>
                )}
              </article>

              <p className="sw-side-note">
                الأرقام بتتحدّث من حالة الخادم، وأي حالة غير مقروءة تظهر كـ «—».
              </p>
            </aside>
          ) : null}
        </div>
      </div>

      {praise && typeof document !== "undefined"
        ? createPortal(
            <aside
              className="sw-praise-toast"
              role="status"
              aria-live="polite"
            >
              <span className="sw-praise-icon" aria-hidden>
                <SparkIcon size={18} />
              </span>
              <div className="sw-praise-copy">
                <span className="sw-praise-eyebrow">تقدير أكاديمي</span>
                <strong>
                  تقدير متقن: درجة {praise.score}% في {praise.title}.
                </strong>
                <p>مراجعة معتمدة من المعلم — عمل يستحق التوقف.</p>
              </div>
              <button
                type="button"
                className="sw-praise-close"
                onClick={dismissPraise}
                aria-label="إغلاق التقدير"
              >
                ×
              </button>
            </aside>,
            document.body,
          )
        : null}
    </div>
  );
}
