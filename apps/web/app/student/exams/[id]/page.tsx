"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

type Phase =
  | "loading"
  | "needs-login"
  | "intro"
  | "taking"
  | "submitting"
  | "done"
  | "closed"
  | "error";

function isChoice(q: ExamQuestionView): boolean {
  return q.type === "MCQ" || q.type === "TRUE_FALSE";
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

  const remaining = useCountdown(phase === "taking" ? expiresAt : null, handleExpire);

  const setAnswer = useCallback((questionId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  // ------------------------------ render ------------------------------

  if (phase === "loading" || phase === "submitting") {
    return (
      <div className="card">
        <p>{phase === "loading" ? "جاري التحميل…" : "جاري تسليم الإجابات…"}</p>
      </div>
    );
  }

  if (phase === "needs-login") {
    return (
      <div className="card">
        <p>
          سجّل الدخول أولًا للدخول إلى الاختبار.{" "}
          <Link href="/login">تسجيل الدخول</Link>
        </p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="card">
        <p style={{ color: "#ef4444" }}>{error ?? "حدث خطأ غير متوقع"}</p>
        <p style={{ marginTop: 8 }}>
          <Link href="/student/exams">العودة إلى الاختبارات</Link>
        </p>
      </div>
    );
  }

  if ((phase === "intro" || phase === "closed") && view) {
    return (
      <div className="card" style={{ maxWidth: 640 }}>
        <h1 style={{ marginBottom: 8 }}>{view.title}</h1>
        {view.description && (
          <p style={{ color: "var(--text-muted)", marginBottom: 8 }}>
            {view.description}
          </p>
        )}
        {view.instructions && (
          <p style={{ marginBottom: 12, fontSize: 14 }}>{view.instructions}</p>
        )}
        <ul style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
          <li>عدد الأسئلة: {view.questions.length}</li>
          <li>المدة: {view.timerMinutes} دقيقة (بتوقيت السيرفر)</li>
          <li>المحاولات المستخدمة: {view.studentAttemptCount} من {view.maxAttempts}</li>
          <li>درجة النجاح: {view.passingScore}%</li>
        </ul>
        {phase === "intro" ? (
          <button onClick={() => void startExam()}>بدء الاختبار</button>
        ) : (
          <div>
            <p style={{ marginBottom: 8 }}>
              استنفدت محاولاتك في هذا الاختبار.
            </p>
            {attempts[0]?.score !== null && attempts[0]?.score !== undefined && (
              <p>آخر درجة: {attempts[0].score}%</p>
            )}
          </div>
        )}
      </div>
    );
  }

  if (phase === "done") {
    const latest = attempts[0];
    return (
      <div className="card" style={{ maxWidth: 640 }}>
        <h1 style={{ marginBottom: 8 }}>تم تسليم الاختبار</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: 12 }}>
          {result?.isTimedOut
            ? "انتهى الوقت وتم التسليم تلقائيًا."
            : (result?.message ?? "تم استلام إجاباتك بنجاح.")}
        </p>
        {latest && (
          <p style={{ marginBottom: 12, fontSize: 14 }}>
            الحالة: {latest.status}
            {latest.score !== null && latest.score !== undefined
              ? ` · الدرجة: ${latest.score}% ${latest.passed ? "(ناجح)" : "(راسب)"}`
              : " · الدرجة: بانتظار التصحيح"}
          </p>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          {nextLesson ? (
            <Link href={`/student/lessons/${nextLesson.id}`}>
              <button>الدرس التالي: {nextLesson.title}</button>
            </Link>
          ) : (
            <Link href="/student/lessons/l1">
              <button>العودة إلى الدروس</button>
            </Link>
          )}
          <Link href="/student/exams">كل الاختبارات</Link>
        </div>
      </div>
    );
  }

  // taking
  const q = questions[index];
  if (!q) {
    return (
      <div className="card"><p>لا توجد أسئلة في هذا الاختبار.</p></div>
    );
  }
  const answered = countAnswered(questions, answers);

  return (
    <div>
      {/* Timer bar */}
      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-md)",
          position: "sticky",
          top: 0,
          zIndex: 5,
        }}
      >
        <strong>{view?.title}</strong>
        <span
          dir="ltr"
          style={{
            fontVariantNumeric: "tabular-nums",
            fontWeight: 700,
            color:
              remaining !== null && remaining < 300 ? "#ef4444" : "inherit",
          }}
        >
          {remaining === null ? "…" : formatCountdown(remaining)}
        </span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {answered} من {questions.length} مجاب
        </span>
      </div>

      {/* Question palette */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "var(--space-md)" }}>
        {questions.map((item, i) => {
          const hasAnswer =
            answers[item.id] !== undefined &&
            answers[item.id] !== null &&
            answers[item.id] !== "";
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(i)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                fontWeight: i === index ? 700 : 400,
                background: i === index ? "var(--color-action)" : hasAnswer ? "#10b981" : "var(--bg-surface)",
                color: i === index || hasAnswer ? "white" : "inherit",
              }}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Current question */}
      <div className="card" style={{ marginBottom: "var(--space-md)" }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
          السؤال {index + 1} من {questions.length} · {q.points}{" "}
          {q.points === 1 ? "درجة" : "درجات"}
        </p>
        <h2 style={{ marginBottom: 12 }}>{q.text}</h2>

        {isChoice(q) && (
          <div style={{ display: "grid", gap: 8 }}>
            {(q.options ?? []).map((opt) => (
              <label
                key={opt.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 12px",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name={q.id}
                  checked={answers[q.id] === opt.id}
                  onChange={() => setAnswer(q.id, opt.id)}
                />
                <span>{opt.text}</span>
              </label>
            ))}
          </div>
        )}

        {q.type === "SHORT_ANSWER" && (
          <input
            type="text"
            value={(answers[q.id] as string) ?? ""}
            onChange={(e) => setAnswer(q.id, e.target.value)}
            placeholder="اكتب إجابتك المختصرة"
            style={{ width: "100%" }}
          />
        )}

        {(q.type === "ESSAY" || q.type === "MATCHING") && (
          <textarea
            value={(answers[q.id] as string) ?? ""}
            onChange={(e) => setAnswer(q.id, e.target.value)}
            placeholder={
              q.type === "ESSAY" ? "اكتب إجابتك المقالية هنا" : "اكتب المطابقة لكل عنصر"
            }
            rows={6}
            style={{ width: "100%" }}
          />
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          السابق
        </button>
        {index < questions.length - 1 ? (
          <button type="button" onClick={() => setIndex((i) => i + 1)}>
            التالي
          </button>
        ) : (
          <button
            type="button"
            style={{ background: "#10b981", color: "white" }}
            onClick={() => {
              const left = questions.length - answered;
              const ok =
                left === 0 ||
                window.confirm(`لديك ${left} أسئلة بلا إجابة. تسليم على أي حال؟`);
              if (ok) void submitExam(false);
            }}
          >
            إنهاء الاختبار وتسليم الإجابات
          </button>
        )}
      </div>
    </div>
  );
}
