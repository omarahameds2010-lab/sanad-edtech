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
  type ExamAnswer,
  type ExamQuestionView,
  type NextLessonRef,
  type StudentAttemptSummary,
  type StudentExamView,
  type SubmitExamResult,
} from "@/app/lib/api";
import {
  buildSubmitPayload,
  countAnswered,
  formatCountdown,
} from "@/app/lib/exam";
import { useCountdown } from "@/app/lib/useCountdown";
import ConfirmDialog from "@/app/student/components/ConfirmDialog";

type Phase =
  | "loading"
  | "needs-login"
  | "intro"
  | "taking"
  | "submitting"
  | "done"
  | "closed"
  | "error";

/** Attempt lifecycle → student-facing Arabic. Unknown values pass through. */
const ATTEMPT_STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: "جارٍ",
  SUBMITTED: "تم التسليم",
  TIMED_OUT: "انتهى الوقت — تسليم تلقائي",
  GRADED: "تم التصحيح",
  CANCELLED: "ملغي",
  EXPIRED: "انتهى الوقت",
};

function isChoice(q: ExamQuestionView): boolean {
  return q.type === "MCQ" || q.type === "TRUE_FALSE";
}

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

export default function StudentExamRunnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { token } = useAuth();
  const [examId, setExamId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [view, setView] = useState<StudentExamView | null>(null);
  const [questions, setQuestions] = useState<ExamQuestionView[]>([]);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [index, setIndex] = useState(0);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitExamResult | null>(null);
  const [attempts, setAttempts] = useState<StudentAttemptSummary[]>([]);
  const [nextLesson, setNextLesson] = useState<NextLessonRef | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const submitKeyRef = useRef<string>(newIdempotencyKey());
  const submittingRef = useRef(false);

  useEffect(() => {
    params.then((p) => setExamId(p.id));
  }, [params]);

  const fail = useCallback((e: unknown, fallback: string) => {
    setError(e instanceof ApiError ? e.message : fallback);
    setPhase("error");
  }, []);

  // Initial load: student view → resume active attempt, offer start, or close.
  useEffect(() => {
    if (!examId) return;
    if (!token) {
      setPhase("needs-login");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const v = await api.getStudentExamView(token, examId);
        if (cancelled) return;
        setView(v);
        setQuestions(v.questions);
        if (v.activeAttempt) {
          // Resume: re-anchor the countdown to the server timer.
          const timer = await api.getExamTimer(token, examId);
          if (cancelled) return;
          setExpiresAt(timer.expiresAt);
          setPhase("taking");
        } else if (v.canAttempt) {
          setPhase("intro");
        } else {
          const mine = await api.getMyAttempts(token, examId);
          if (cancelled) return;
          setAttempts(mine);
          setPhase("closed");
        }
      } catch (e) {
        if (!cancelled) fail(e, "تعذر تحميل الاختبار");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [examId, token, fail]);

  const startExam = useCallback(async () => {
    if (!token || !examId || !view) return;
    setPhase("loading");
    try {
      const entered = await api.enterExam(token, examId, view.lessonId);
      setQuestions(entered.attempt.questions);
      setAnswers({});
      setIndex(0);
      setExpiresAt(entered.attempt.expiresAt);
      submitKeyRef.current = newIdempotencyKey();
      setPhase("taking");
    } catch (e) {
      fail(e, "تعذر بدء الاختبار");
    }
  }, [token, examId, view, fail]);

  const submitExam = useCallback(
    async (auto: boolean) => {
      if (!token || !examId || submittingRef.current) return;
      submittingRef.current = true;
      setPhase("submitting");
      try {
        const payload = buildSubmitPayload(questions, answers);
        const res = await api.submitExam(
          token,
          examId,
          payload,
          submitKeyRef.current,
        );
        setResult(res);
        const mine = await api.getMyAttempts(token, examId);
        setAttempts(mine);
        // ENTER_EXAM unlocks the next lesson server-side; fetch it for the link.
        if (view) {
          try {
            const next = await api.getNextLesson(token, view.lessonId);
            setNextLesson(next);
          } catch {
            setNextLesson(null);
          }
        }
        setPhase("done");
      } catch (e) {
        // A late/duplicate submit may 404 (already submitted) — recover by
        // re-reading attempts instead of showing a dead end.
        try {
          const mine = await api.getMyAttempts(token, examId);
          const latest = mine[0];
          if (
            latest &&
            (latest.status === "SUBMITTED" ||
              latest.status === "TIMED_OUT" ||
              latest.status === "GRADED")
          ) {
            setAttempts(mine);
            setPhase("done");
            return;
          }
        } catch {
          // fall through to the error state below
        }
        submittingRef.current = false;
        fail(e, auto ? "انتهى الوقت وتعذر التسليم" : "تعذر تسليم الإجابات");
      }
    },
    [token, examId, questions, answers, view, fail],
  );

  const handleExpire = useCallback(() => {
    void submitExam(true);
  }, [submitExam]);

  const remaining = useCountdown(
    phase === "taking" ? expiresAt : null,
    handleExpire,
  );

  const setAnswer = useCallback((questionId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  // ------------------------------ render ------------------------------

  if (phase === "loading" || phase === "submitting") {
    return (
      <Notice
        text={phase === "loading" ? "جاري التحميل…" : "جاري تسليم الإجابات…"}
      />
    );
  }

  if (phase === "needs-login") {
    return (
      <Notice
        text={
          <>
            سجّل الدخول أولًا للدخول إلى الاختبار.{" "}
            <Link href="/login">تسجيل الدخول</Link>
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
                <Link href="/student/exams" className="sc-btn sc-btn-ghost">
                  العودة إلى الاختبارات
                </Link>
              </div>
            </div>
          </article>
        </div>
      </div>
    );
  }

  if ((phase === "intro" || phase === "closed") && view) {
    const lastAttempt = attempts[0];
    return (
      <div className="sc-canvas">
        <div className="lp-container" style={{ maxWidth: 880 }}>
          <article className="sc-panel">
            <div className="sc-body">
              <p className="sc-eyebrow">
                {phase === "intro" ? "اختبار جاهز للبدء" : "المحاولات مستنفدة"}
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
                  <span className="sc-spec-label">عدد الأسئلة</span>
                  <span className="sc-spec-value">{view.questions.length}</span>
                </div>
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
                  <span className="sc-spec-label">درجة النجاح</span>
                  <span className="sc-spec-value">{view.passingScore}٪</span>
                </div>
              </div>
              {phase === "intro" ? (
                <div className="sc-nav-row">
                  <button
                    type="button"
                    className="sc-btn sc-btn-primary"
                    onClick={() => void startExam()}
                  >
                    ابدأ الاختبار <span aria-hidden>←</span>
                  </button>
                  <Link href="/student/exams" className="sc-btn sc-btn-ghost">
                    رجوع للاختبارات
                  </Link>
                </div>
              ) : (
                <>
                  <p
                    className="sc-meta"
                    style={{ marginTop: "var(--space-4)", fontSize: 14 }}
                  >
                    استنفدت محاولاتك في هذا الاختبار.
                    {lastAttempt?.score !== null &&
                    lastAttempt?.score !== undefined
                      ? ` آخر درجة: ${lastAttempt.score}٪.`
                      : ""}
                  </p>
                  <div className="sc-nav-row">
                    <Link href="/student/exams" className="sc-btn sc-btn-ghost">
                      رجوع للاختبارات
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
    const latest = attempts[0];
    return (
      <div className="sc-canvas">
        <div className="lp-container" style={{ maxWidth: 880 }}>
          <article className="sc-panel">
            <div className="sc-body">
              <p className="sc-eyebrow">تم التسليم بنجاح</p>
              <h1 className="sc-title">تم تسليم الاختبار</h1>
              <p
                className="sc-meta"
                style={{ marginTop: "var(--space-3)", fontSize: 15 }}
              >
                {result?.isTimedOut
                  ? "انتهى الوقت وتم التسليم تلقائيًا."
                  : (result?.message ?? "تم استلام إجاباتك بنجاح.")}
              </p>
              {latest && (
                <div className="sc-spec-grid">
                  <div className="sc-spec">
                    <span className="sc-spec-label">الحالة</span>
                    <span className="sc-spec-value">
                      {ATTEMPT_STATUS_LABELS[latest.status] ?? latest.status}
                    </span>
                  </div>
                  <div className="sc-spec">
                    <span className="sc-spec-label">الدرجة</span>
                    <span className="sc-spec-value">
                      {latest.score !== null && latest.score !== undefined
                        ? `${latest.score}٪ ${latest.passed ? "(ناجح)" : "(راسب)"}`
                        : "بانتظار التصحيح"}
                    </span>
                  </div>
                </div>
              )}
              <div className="sc-nav-row">
                {nextLesson ? (
                  <Link
                    href={`/student/lessons/${nextLesson.id}`}
                    className="sc-btn sc-btn-primary"
                  >
                    الدرس التالي: {nextLesson.title} <span aria-hidden>←</span>
                  </Link>
                ) : (
                  <Link
                    href="/student/lessons/l1"
                    className="sc-btn sc-btn-primary"
                  >
                    العودة إلى الدروس <span aria-hidden>←</span>
                  </Link>
                )}
                <Link href="/student/exams" className="sc-btn sc-btn-ghost">
                  كل الاختبارات
                </Link>
              </div>
            </div>
          </article>
        </div>
      </div>
    );
  }

  // taking
  const q = questions[index];
  if (!q) {
    return <Notice text="لا توجد أسئلة في هذا الاختبار." />;
  }
  const answered = countAnswered(questions, answers);
  const unanswered = questions.length - answered;
  const lowTime = remaining !== null && remaining < 300;

  return (
    <div className="sc-canvas">
      <div className="lp-container" style={{ maxWidth: 980 }}>
        <div className="sc-deck">
          <div>
            <p className="sc-eyebrow" style={{ margin: 0 }}>
              اختبار جارٍ الآن
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
          <p className="sc-meta" style={{ margin: 0, fontSize: 14 }}>
            {answered} من {questions.length} مجاب
          </p>
        </div>

        {/* Question palette */}
        <div className="sc-pal-row" aria-label="التنقل بين الأسئلة">
          {questions.map((item, i) => {
            const hasAnswer =
              answers[item.id] !== undefined &&
              answers[item.id] !== null &&
              answers[item.id] !== "";
            const state =
              i === index ? "current" : hasAnswer ? "answered" : "idle";
            return (
              <button
                key={item.id}
                type="button"
                className="sc-pal"
                data-state={state}
                onClick={() => setIndex(i)}
                aria-label={`السؤال ${i + 1}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Current question */}
        <article className="sc-panel" style={{ marginTop: "var(--space-6)" }}>
          <div className="sc-body">
            <p className="sc-meta" style={{ margin: 0 }}>
              السؤال {index + 1} من {questions.length} · {q.points}{" "}
              {q.points === 1 ? "درجة" : "درجات"}
            </p>
            <h2
              className="sc-title"
              style={{ fontSize: 26, marginTop: "var(--space-3)" }}
            >
              {q.text}
            </h2>

            {isChoice(q) && (
              <div
                style={{
                  display: "grid",
                  gap: "var(--space-2)",
                  marginTop: "var(--space-4)",
                }}
              >
                {(q.options ?? []).map((opt) => (
                  <label
                    key={opt.id}
                    className="sc-choice"
                    data-selected={answers[q.id] === opt.id}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === opt.id}
                      onChange={() => setAnswer(q.id, opt.id)}
                    />
                    <span className="sc-choice-dot" aria-hidden />
                    <span>{opt.text}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === "SHORT_ANSWER" && (
              <input
                type="text"
                className="sc-input"
                style={{ marginTop: "var(--space-4)" }}
                value={(answers[q.id] as string) ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder="اكتب إجابتك المختصرة"
              />
            )}

            {(q.type === "ESSAY" || q.type === "MATCHING") && (
              <textarea
                className="sc-input"
                rows={7}
                style={{ marginTop: "var(--space-4)" }}
                value={(answers[q.id] as string) ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder={
                  q.type === "ESSAY"
                    ? "اكتب إجابتك المقالية هنا"
                    : "اكتب المطابقة لكل عنصر"
                }
              />
            )}
          </div>
        </article>

        {/* Navigation */}
        <div className="sc-nav-row">
          <button
            type="button"
            className="sc-btn"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            <span aria-hidden>→</span> السابق
          </button>
          {index < questions.length - 1 ? (
            <button
              type="button"
              className="sc-btn sc-btn-primary"
              onClick={() => setIndex((i) => i + 1)}
            >
              التالي <span aria-hidden>←</span>
            </button>
          ) : (
            <button
              type="button"
              className="sc-btn sc-btn-primary"
              onClick={() => setConfirmOpen(true)}
            >
              إنهاء وتسليم الإجابات <span aria-hidden>←</span>
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        eyebrow="تأكيد التسليم"
        title="متأكد إنك خلصت يا صاحبي؟"
        body={
          unanswered > 0
            ? `فاضل ${unanswered} ${
                unanswered === 1 ? "سؤال" : "أسئلة"
              } من غير إجابة — تقدر ترجع تراجعهم. متنساش تراجع قبل ما تسلّم، والتسليم النهائي مفيش رجوع بعده.`
            : "كل الأسئلة متجاوب عليها. متنساش تراجع مرة أخيرة قبل ما تسلّم، والتسليم النهائي مفيش رجوع بعده."
        }
        confirmLabel="أيوه، سلّم الاختبار"
        cancelLabel="راجع تاني"
        onConfirm={() => {
          setConfirmOpen(false);
          void submitExam(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
