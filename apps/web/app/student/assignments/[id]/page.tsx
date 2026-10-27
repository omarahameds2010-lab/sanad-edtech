"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import {
  api,
  ApiError,
  newIdempotencyKey,
  type AssignmentSubmissionSummary,
  type StudentAssignmentView,
  type SubmitAssignmentResult,
} from "@/app/lib/api";
import { formatCountdown } from "@/app/lib/exam";
import { useCountdown } from "@/app/lib/useCountdown";
import ConfirmDialog from "@/app/student/components/ConfirmDialog";
import AssignmentResultReview from "../components/AssignmentResultReview";
import SubmissionTheater from "../components/SubmissionTheater";

type Phase =
  | "loading"
  | "needs-login"
  | "intro"
  | "writing"
  | "submitting"
  | "done"
  | "closed"
  | "error";

function QuietPanel({ text }: { text: ReactNode }) {
  return (
    <article className="sc-panel">
      <div className="sc-body">
        <p className="sc-meta" style={{ margin: 0 }}>
          {text as any}
        </p>
      </div>
    </article>
  );
}

function Notice({ text }: { text: ReactNode }) {
  return (
    <div className="sc-canvas">
      <div className="lp-container" style={{ maxWidth: 880 }}>
        <QuietPanel text={text} />
      </div>
    </div>
  );
}

export default function StudentAssignmentRunnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { token } = useAuth();
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [view, setView] = useState<StudentAssignmentView | null>(null);
  const [content, setContent] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitAssignmentResult | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmissionSummary[]>(
    [],
  );
  const [unlockedLessonIds, setUnlockedLessonIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitStartedAt, setSubmitStartedAt] = useState(0);
  const [submitElapsedMs, setSubmitElapsedMs] = useState<number | null>(null);
  const [theaterDone, setTheaterDone] = useState(false);
  const submitKeyRef = useRef<string>(newIdempotencyKey());
  const submittingRef = useRef(false);

  useEffect(() => {
    params.then((p) => setAssignmentId(p.id));
  }, [params]);

  const fail = useCallback((e: unknown, fallback: string) => {
    setError(e instanceof ApiError ? e.message : fallback);
    setPhase("error");
  }, []);

  useEffect(() => {
    if (!assignmentId) return;
    if (!token) {
      setPhase("needs-login");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const v = await api.getStudentAssignmentView(token, assignmentId);
        if (cancelled) return;
        setView(v);
        if (v.activeSubmission) {
          // An active attempt is always in progress: `submittedAt` is null
          // until the student hands it in, even when a previous attempt was
          // submitted on time.
          setContent(v.activeSubmission.content ?? "");
          const timer = await api.getAssignmentTimer(token, assignmentId);
          if (cancelled) return;
          setExpiresAt(timer.expiresAt);
          setPhase("writing");
        } else if (v.canAttempt) {
          setPhase("intro");
        } else {
          const mine = await api.getMySubmissions(token, assignmentId);
          if (cancelled) return;
          setSubmissions(mine);
          setPhase("closed");
        }
      } catch (e) {
        if (!cancelled) fail(e, "تعذر تحميل الواجب");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assignmentId, token, fail]);

  const startAttempt = useCallback(async () => {
    if (!token || !assignmentId || !view) return;
    setPhase("loading");
    try {
      const entered = await api.startAssignment(
        token,
        assignmentId,
        view.lessonId,
      );
      setContent("");
      setExpiresAt(entered.attempt.expiresAt);
      setUnlockedLessonIds(entered.unlocked.lessonIds ?? []);
      submitKeyRef.current = newIdempotencyKey();
      setPhase("writing");
    } catch (e) {
      fail(e, "تعذر بدء الواجب");
    }
  }, [token, assignmentId, view, fail]);

  const submitWork = useCallback(
    async (auto: boolean) => {
      if (!token || !assignmentId || submittingRef.current) return;
      submittingRef.current = true;
      const startedAt =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      setSubmitStartedAt(startedAt);
      setSubmitElapsedMs(null);
      setTheaterDone(false);
      setPhase("submitting");
      try {
        const res = await api.submitAssignment(
          token,
          assignmentId,
          content,
          submitKeyRef.current,
        );
        const elapsed = Math.max(
          0,
          Math.round(
            (typeof performance !== "undefined"
              ? performance.now()
              : Date.now()) - startedAt,
          ),
        );
        setResult(res);
        setSubmitElapsedMs(elapsed);
        setTheaterDone(true);

        // A delegated read failure must never turn a successful submission
        // into an error. Keep the server-confirmed attempt as a local fallback.
        let mine: AssignmentSubmissionSummary[] = [];
        try {
          mine = await api.getMySubmissions(token, assignmentId);
        } catch {
          // The review page can still render the confirmed submission below.
        }
        if (mine.length === 0) {
          mine = [
            {
              id: res.attemptId,
              status: res.status,
              score: null,
              submittedAt: res.submittedAt,
              content,
            },
          ];
        }
        setSubmissions(mine);
        await new Promise((resolve) => window.setTimeout(resolve, 700));
        setPhase("done");
      } catch (e) {
        try {
          const mine = await api.getMySubmissions(token, assignmentId);
          const latest = mine[0];
          if (
            latest &&
            (latest.status === "SUBMITTED" ||
              latest.status === "LATE" ||
              latest.status === "GRADED")
          ) {
            setSubmissions(mine);
            setPhase("done");
            return;
          }
        } catch {
          // fall through
        }
        setTheaterDone(false);
        setSubmitElapsedMs(null);
        submittingRef.current = false;
        fail(e, auto ? "انتهى الوقت وتعذر التسليم" : "تعذر تسليم الواجب");
      }
    },
    [token, assignmentId, content, fail],
  );

  const handleExpire = useCallback(() => {
    void submitWork(true);
  }, [submitWork]);

  const remaining = useCountdown(
    phase === "writing" ? expiresAt : null,
    handleExpire,
  );

  function renderResultPage(
    eyebrow: string,
    headline: string,
    message: string,
    latest: AssignmentSubmissionSummary | null,
    tone: "success" | "neutral" = "neutral",
  ) {
    const resultHasGap =
      latest !== null &&
      latest.status === "GRADED" &&
      latest.score !== null &&
      view?.passingScore !== null &&
      view?.passingScore !== undefined &&
      latest.score < view.passingScore;

    return (
      <div className="sc-canvas">
        <div className="lp-container" style={{ maxWidth: 1040 }}>
          <header className="ar-page-head" data-tone={tone}>
            <p className="sc-eyebrow" style={{ margin: 0 }}>
              {eyebrow}
            </p>
            <h1 className="sc-title" style={{ marginTop: 6 }}>
              {headline}
            </h1>
            <p className="sc-meta" style={{ marginTop: 12, fontSize: 15 }}>
              {message}
            </p>
          </header>

          {latest && token ? (
            <AssignmentResultReview
              token={token}
              assignmentTitle={view?.title ?? "الواجب"}
              latest={latest}
              passingScore={view?.passingScore ?? null}
              lessonId={view?.lessonId ?? null}
              history={submissions}
            />
          ) : (
            <QuietPanel text="تم حفظ الحالة، لكن تعذر تحميل تفاصيل التسليم الآن." />
          )}

          <div className="ar-result-actions">
            {unlockedLessonIds[0] ? (
              <Link
                href={`/student/lessons/${unlockedLessonIds[0]}`}
                className="sc-btn sc-btn-primary"
              >
                الدرس المفتوح <span aria-hidden>←</span>
              </Link>
            ) : null}
            {view?.lessonId ? (
              <Link
                href={`/student/lessons/${view.lessonId}`}
                className={`sc-btn sc-btn-ghost${
                  resultHasGap ? " ar-action-guide" : ""
                }`}
              >
                {resultHasGap ? (
                  <span className="ar-action-pulse" aria-hidden />
                ) : null}
                صفحة الدرس
              </Link>
            ) : null}
            <Link
              href="/student/assignments"
              className="sc-btn sc-btn-ghost"
            >
              كل الواجبات
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------ render ------------------------------

  if (phase === "loading") {
    return <Notice text="جاري التحميل…" />;
  }

  if (phase === "submitting") {
    return (
      <SubmissionTheater
        startedAt={submitStartedAt}
        elapsedMs={submitElapsedMs}
        done={theaterDone}
      />
    );
  }

  if (phase === "needs-login") {
    return (
      <Notice
        text={
          <>
            سجّل الدخول أولًا. <Link href="/login">تسجيل الدخول</Link>
          </>
        }
      />
    );
  }

  if (phase === "error") {
    return (
      <div className="sc-canvas">
        <div className="lp-container" style={{ maxWidth: 880 }}>
          <article className="sc-panel">
            <div className="sc-body">
              <p className="sc-eyebrow">تعذّر إكمال الطلب</p>
              <p
                className="sc-meta"
                style={{
                  marginTop: "var(--space-3)",
                  fontSize: 15,
                  color: "var(--sc-danger, rgba(252, 165, 165, 0.92))",
                }}
              >
                {error ?? "حدث خطأ غير متوقع"}
              </p>
              <div className="sc-nav-row">
                <Link
                  href="/student/assignments"
                  className="sc-btn sc-btn-ghost"
                >
                  العودة إلى الواجبات
                </Link>
              </div>
            </div>
          </article>
        </div>
      </div>
    );
  }

  if (phase === "closed" && view) {
    return renderResultPage(
      "المحاولات مستنفدة",
      "النتيجة النهائية",
      "استنفدت محاولاتك في هذا الواجب. دي مراجعة آخر تسليم محفوظ، والدرجة الرسمية بيعتمدها المعلم.",
      submissions[0] ?? null,
    );
  }

  if (phase === "intro" && view) {
    return (
      <div className="sc-canvas">
        <div className="lp-container" style={{ maxWidth: 880 }}>
          <article className="sc-panel">
            <div className="sc-body">
              <p className="sc-eyebrow">
                {view.studentAttemptCount > 0
                  ? "محاولة جديدة"
                  : "واجب جاهز للبدء"}
              </p>
              <h1 className="sc-title">{view.title}</h1>
              {view.description && (
                <p
                  className="sc-meta"
                  style={{ marginTop: "var(--space-3)", fontSize: 15 }}
                >
                  {view.description}
                </p>
              )}
              {view.instructions && (
                <p
                  className="sc-meta"
                  style={{
                    marginTop: "var(--space-2)",
                    fontSize: 14,
                    color: "var(--sc-instructions, rgba(244, 244, 246, 0.75))",
                    lineHeight: 1.9,
                  }}
                >
                  {view.instructions}
                </p>
              )}
              <div className="sc-spec-grid">
                <div className="sc-spec">
                  <span className="sc-spec-label">المدة (بتوقيت السيرفر)</span>
                  <span className="sc-spec-value">
                    {view.timerMinutes} دقيقة
                  </span>
                </div>
                <div className="sc-spec">
                  <span className="sc-spec-label">المحاولات</span>
                  <span className="sc-spec-value">
                    {view.studentAttemptCount} من {view.maxAttempts}
                  </span>
                </div>
                <div className="sc-spec">
                  <span className="sc-spec-label">التأخير</span>
                  <span className="sc-spec-value">
                    {view.allowLateSubmission
                      ? "مقبول (يُسجَّل متأخرًا)"
                      : "غير مقبول"}
                  </span>
                </div>
              </div>
              <div className="sc-nav-row">
                <button
                  type="button"
                  className="sc-btn sc-btn-primary"
                  onClick={() => void startAttempt()}
                >
                  {view.studentAttemptCount > 0
                    ? "ابدأ محاولة جديدة"
                    : "ابدأ الواجب"}{" "}
                  <span aria-hidden>←</span>
                </button>
                <Link
                  href="/student/assignments"
                  className="sc-btn sc-btn-ghost"
                >
                  رجوع للواجبات
                </Link>
              </div>
            </div>
          </article>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const latest = submissions[0] ?? null;
    return renderResultPage(
      "تم التسليم بنجاح",
      "تم تسليم الواجب",
      result?.isLate
        ? "تم التسليم بعد انتهاء الوقت (متأخر). المراجعة الرسمية بعد اعتماد المعلم."
        : "تم استلام إجابتك بنجاح. المراجعة الرسمية بعد اعتماد المعلم.",
      latest,
      "success",
    );
  }

  // writing
  const lowTime = remaining !== null && remaining < 1800;

  return (
    <div className="sc-canvas">
      <div className="lp-container" style={{ maxWidth: 880 }}>
        <div className="sc-deck">
          <div>
            <p className="sc-eyebrow" style={{ margin: 0 }}>
              واجب جارٍ الآن
            </p>
            <h1 className="sc-title" style={{ fontSize: 24, marginTop: 6 }}>
              {view?.title}
            </h1>
          </div>
          <div className="sc-timer" data-low={String(lowTime)}>
            <span className="sc-timer-label">متبقٍ</span>
            <span dir="ltr">
              {remaining === null ? "…" : formatCountdown(remaining)}
            </span>
          </div>
        </div>

        {view?.instructions && (
          <article className="sc-panel" style={{ marginTop: "var(--space-6)" }}>
            <div className="sc-body">
              <p className="sc-eyebrow" style={{ margin: 0 }}>
                التعليمات
              </p>
              <p
                className="sc-meta"
                style={{
                  marginTop: "var(--space-3)",
                  fontSize: 14,
                  color: "var(--sc-instructions, rgba(244, 244, 246, 0.78))",
                  lineHeight: 1.9,
                }}
              >
                {view.instructions}
              </p>
            </div>
          </article>
        )}

        <article className="sc-panel" style={{ marginTop: "var(--space-6)" }}>
          <div className="sc-body">
            <p className="sc-eyebrow" style={{ margin: 0 }}>
              إجابتك
            </p>
            <textarea
              className="sc-input"
              style={{ marginTop: "var(--space-3)" }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="اكتب حلّك وخطواتك هنا…"
              rows={12}
            />
          </div>
        </article>

        <div className="sc-nav-row">
          <button
            type="button"
            className="sc-btn sc-btn-primary"
            onClick={() => setConfirmOpen(true)}
          >
            تسليم الواجب <span aria-hidden>←</span>
          </button>
          <Link href="/student/assignments" className="sc-btn sc-btn-ghost">
            كل الواجبات
          </Link>
        </div>

        <p
          className="sc-meta"
          style={{ marginTop: "var(--space-3)", fontSize: 12 }}
        >
          آخر موعد بتوقيت السيرفر:{" "}
          {expiresAt ? new Date(expiresAt).toLocaleString("ar-EG") : "…"} —
          المؤقت محسوب على السيرفر، ولو قفلت الصفحة ورجعت هتكمّل من نفس الموعد.
        </p>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        eyebrow="تأكيد التسليم"
        title="متأكد إنك خلصت يا صديقي؟"
        body={
          content.trim() === ""
            ? "إجابتك فاضية — تقدر ترجع تكتب حلّك الأول، أو تسلّم كده برضه. متنساش تراجع قبل ما تسلّم، والتسليم النهائي مفيش رجوع بعده."
            : "متنساش تراجع حلّك قبل ما تسلّم، والتسليم النهائي مفيش رجوع بعده."
        }
        confirmLabel="أيوه، سلّم الواجب"
        cancelLabel="راجع تاني"
        onConfirm={() => {
          setConfirmOpen(false);
          void submitWork(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
