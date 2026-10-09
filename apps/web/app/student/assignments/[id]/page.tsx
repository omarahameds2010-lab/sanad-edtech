"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { formatCountdown, getRemainingSeconds } from "@/app/lib/exam";
import { useCountdown } from "@/app/lib/useCountdown";

type Phase =
  | "loading"
  | "needs-login"
  | "intro"
  | "writing"
  | "submitting"
  | "done"
  | "closed"
  | "error";

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
  const [submissions, setSubmissions] = useState<AssignmentSubmissionSummary[]>([]);
  const [unlockedLessonIds, setUnlockedLessonIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
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
      const entered = await api.startAssignment(token, assignmentId, view.lessonId);
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

  const remaining = useCountdown(phase === "writing" ? expiresAt : null, handleExpire);

  if (phase === "loading" || phase === "submitting") {
    return (
      <div className="card">
        <p>{phase === "loading" ? "جاري التحميل…" : "جاري تسليم الواجب…"}</p>
      </div>
    );
  }

  if (phase === "needs-login") {
    return (
      <div className="card">
        <p>
          سجّل الدخول أولًا. <Link href="/login">تسجيل الدخول</Link>
        </p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="card">
        <p style={{ color: "#ef4444" }}>{error ?? "حدث خطأ غير متوقع"}</p>
        <p style={{ marginTop: 8 }}>
          <Link href="/student/assignments">العودة إلى الواجبات</Link>
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
          <li>المدة: {view.timerMinutes} دقيقة (بتوقيت السيرفر)</li>
          <li>المحاولات المستخدمة: {view.studentAttemptCount} من {view.maxAttempts}</li>
          <li>
            التأخير: {view.allowLateSubmission ? "مقبول (يُسجَّل متأخرًا)" : "غير مقبول"}
          </li>
        </ul>
        {phase === "intro" ? (
          <button onClick={() => void startAttempt()}>بدء الواجب</button>
        ) : (
          <div>
            <p>استنفدت محاولاتك في هذا الواجب.</p>
            {submissions[0]?.score !== null &&
              submissions[0]?.score !== undefined && (
                <p>آخر درجة: {submissions[0].score}%</p>
              )}
          </div>
        )}
      </div>
    );
  }

  if (phase === "done") {
    const latest = submissions[0];
    return (
      <div className="card" style={{ maxWidth: 640 }}>
        <h1 style={{ marginBottom: 8 }}>تم تسليم الواجب</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: 12 }}>
          {result?.isLate
            ? "تم التسليم بعد انتهاء الوقت (متأخر)."
            : (result?.message ?? "تم استلام إجابتك بنجاح.")}
        </p>
        {latest && (
          <p style={{ marginBottom: 12, fontSize: 14 }}>
            الحالة: {latest.status}
            {latest.score !== null && latest.score !== undefined
              ? ` · الدرجة: ${latest.score}%`
              : " · الدرجة: بانتظار التصحيح"}
            {latest.feedback ? ` · ملاحظات المدرس: ${latest.feedback}` : ""}
          </p>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          {unlockedLessonIds[0] && (
            <Link href={`/student/lessons/${unlockedLessonIds[0]}`}>
              <button>الدرس المفتوح</button>
            </Link>
          )}
          <Link href="/student/assignments">كل الواجبات</Link>
        </div>
      </div>
    );
  }

  // writing
  return (
    <div style={{ maxWidth: 760 }}>
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
            color: remaining !== null && remaining < 1800 ? "#ef4444" : "inherit",
          }}
        >
          {remaining === null ? "…" : formatCountdown(remaining)}
        </span>
      </div>

      {view?.instructions && (
        <div className="card" style={{ marginBottom: "var(--space-md)" }}>
          <h3 style={{ marginBottom: 8 }}>التعليمات</h3>
          <p style={{ fontSize: 14 }}>{view.instructions}</p>
        </div>
      )}

      <div className="card" style={{ marginBottom: "var(--space-md)" }}>
        <h3 style={{ marginBottom: 8 }}>إجابتك</h3>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="اكتب حلّك وخطواتك هنا…"
          rows={12}
          style={{ width: "100%" }}
        />
      </div>

      <button
        type="button"
        style={{ background: "#10b981", color: "white" }}
        onClick={() => {
          if (
            content.trim() === "" &&
            !window.confirm("إجابتك فارغة. تسليم على أي حال؟")
          )
            return;
          void submitWork(false);
        }}
      >
        تسليم الواجب
      </button>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
        آخر موعد بتوقيت السيرفر:{" "}
        {expiresAt ? new Date(expiresAt).toLocaleString("ar-EG") : "…"} ·{" "}
        متبقٍ {remaining === null ? "…" : formatCountdown(remaining)} · يُحفظ
        المؤقت بإعادة التحميل (أعد فتح الصفحة للمتابعة من نفس الموعد).
      </p>
    </div>
  );
}
