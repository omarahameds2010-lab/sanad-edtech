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

type Phase =
  | "loading"
  | "needs-login"
  | "intro"
  | "writing"
  | "submitting"
  | "done"
  | "closed"
  | "error";

/** Submission lifecycle → student-facing Arabic. Unknown values pass through. */
const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: "جارٍ",
  SUBMITTED: "تم التسليم",
  LATE: "تم التسليم (متأخر)",
  GRADED: "تم التصحيح",
  EXPIRED: "انتهى الوقت",
  CANCELLED: "ملغي",
};

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
      setPhase("submitting");
      try {
        const res = await api.submitAssignment(
          token,
          assignmentId,
          content,
          submitKeyRef.current,
        );
        setResult(res);
        const mine = await api.getMySubmissions(token, assignmentId);
        setSubmissions(mine);
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

  // ------------------------------ render ------------------------------

  if (phase === "loading" || phase === "submitting") {
    return (
      <Notice
        text={phase === "loading" ? "جاري التحميل…" : "جاري تسليم الواجب…"}
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
                  color: "rgba(252, 165, 165, 0.92)",
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

  if ((phase === "intro" || phase === "closed") && view) {
    const lastSubmission = submissions[0];
    return (
      <div className="sc-canvas">
        <div className="lp-container" style={{ maxWidth: 880 }}>
          <article className="sc-panel">
            <div className="sc-body">
              <p className="sc-eyebrow">
                {phase === "intro" ? "واجب جاهز للبدء" : "المحاولات مستنفدة"}
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
                    color: "rgba(244, 244, 246, 0.75)",
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
              {phase === "intro" ? (
                <div className="sc-nav-row">
                  <button
                    type="button"
                    className="sc-btn sc-btn-primary"
                    onClick={() => void startAttempt()}
                  >
                    ابدأ الواجب <span aria-hidden>←</span>
                  </button>
                  <Link
                    href="/student/assignments"
                    className="sc-btn sc-btn-ghost"
                  >
                    رجوع للواجبات
                  </Link>
                </div>
              ) : (
                <>
                  <p
                    className="sc-meta"
                    style={{ marginTop: "var(--space-4)", fontSize: 14 }}
                  >
                    استنفدت محاولاتك في هذا الواجب.
                    {lastSubmission?.score !== null &&
                    lastSubmission?.score !== undefined
                      ? ` آخر درجة: ${lastSubmission.score}٪.`
                      : ""}
                  </p>
                  <div className="sc-nav-row">
                    <Link
                      href="/student/assignments"
                      className="sc-btn sc-btn-ghost"
                    >
                      رجوع للواجبات
                    </Link>
                  </div>
                </>
              )}
            </div>
          </article>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const latest = submissions[0];
    return (
      <div className="sc-canvas">
        <div className="lp-container" style={{ maxWidth: 880 }}>
          <article className="sc-panel">
            <div className="sc-body">
              <p className="sc-eyebrow">تم التسليم بنجاح</p>
              <h1 className="sc-title">تم تسليم الواجب</h1>
              <p
                className="sc-meta"
                style={{ marginTop: "var(--space-3)", fontSize: 15 }}
              >
                {result?.isLate
                  ? "تم التسليم بعد انتهاء الوقت (متأخر)."
                  : (result?.message ?? "تم استلام إجابتك بنجاح.")}
              </p>
              {latest && (
                <div className="sc-spec-grid">
                  <div className="sc-spec">
                    <span className="sc-spec-label">الحالة</span>
                    <span className="sc-spec-value">
                      {SUBMISSION_STATUS_LABELS[latest.status] ?? latest.status}
                    </span>
                  </div>
                  <div className="sc-spec">
                    <span className="sc-spec-label">الدرجة</span>
                    <span className="sc-spec-value">
                      {latest.score !== null && latest.score !== undefined
                        ? `${latest.score}٪`
                        : "بانتظار التصحيح"}
                    </span>
                  </div>
                </div>
              )}
              {latest?.feedback && (
                <div
                  className="sc-spec"
                  style={{ marginTop: "var(--space-2)" }}
                >
                  <span className="sc-spec-label">ملاحظات المدرس</span>
                  <span
                    className="sc-spec-value"
                    style={{ fontWeight: 500, lineHeight: 1.9 }}
                  >
                    {latest.feedback}
                  </span>
                </div>
              )}
              <div className="sc-nav-row">
                {unlockedLessonIds[0] ? (
                  <Link
                    href={`/student/lessons/${unlockedLessonIds[0]}`}
                    className="sc-btn sc-btn-primary"
                  >
                    الدرس المفتوح <span aria-hidden>←</span>
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
          </article>
        </div>
      </div>
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
                  color: "rgba(244, 244, 246, 0.78)",
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
