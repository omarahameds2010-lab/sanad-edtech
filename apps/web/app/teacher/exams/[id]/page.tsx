"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import {
  api,
  ApiError,
  type GradingAttempt,
  type TeacherExamDetail,
} from "@/app/lib/api";

const statusConfig: Record<string, { label: string; color: string }> = {
  SUBMITTED: { label: "مُسلّم", color: "#3b82f6" },
  GRADED: { label: "مُصحّح", color: "#10b981" },
  IN_PROGRESS: { label: "جاري", color: "#f59e0b" },
  TIMED_OUT: { label: "انتهى الوقت", color: "#ef4444" },
  CANCELLED: { label: "ملغي", color: "#6b7280" },
};

function statusLabel(status: string): string {
  return statusConfig[status]?.label ?? status;
}

function statusColor(status: string): string {
  return statusConfig[status]?.color ?? "#6b7280";
}

function answerText(answer: unknown): string {
  if (answer === null || answer === undefined) return "—";
  if (typeof answer === "string") return answer === "" ? "—" : answer;
  try {
    return JSON.stringify(answer);
  } catch {
    return "—";
  }
}

export default function TeacherExamGradingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { token } = useAuth();
  const [examId, setExamId] = useState<string | null>(null);
  const [exam, setExam] = useState<TeacherExamDetail | null>(null);
  const [attempts, setAttempts] = useState<GradingAttempt[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    params.then((p) => setExamId(p.id));
  }, [params]);

  const reload = useCallback(async () => {
    if (!token || !examId) return;
    const [detail, queue] = await Promise.all([
      api.getTeacherExam(token, examId),
      api.getGradingQueue(token, examId),
    ]);
    setExam(detail);
    setAttempts(queue.attempts);
  }, [token, examId]);

  useEffect(() => {
    if (!token || !examId) return;
    reload().catch((e) =>
      setError(e instanceof ApiError ? e.message : "تعذر تحميل البيانات"),
    );
  }, [token, examId, reload]);

  const selected = attempts.find((a) => a.id === selectedId) ?? null;

  async function handleGrade() {
    if (!token || !selected) return;
    const numeric = Number(score);
    if (!Number.isInteger(numeric) || numeric < 0 || numeric > 100) {
      setNotice("الدرجة يجب أن تكون رقمًا صحيحًا بين 0 و 100");
      return;
    }
    setGrading(true);
    setNotice(null);
    try {
      await api.gradeAttempt(token, selected.id, {
        score: numeric,
        feedback: feedback.trim() === "" ? undefined : feedback.trim(),
      });
      setScore("");
      setFeedback("");
      await reload();
      setNotice("تم حفظ الدرجة بنجاح");
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : "تعذر حفظ الدرجة");
    } finally {
      setGrading(false);
    }
  }

  if (!token) {
    return (
      <div className="card">
        <p>
          سجّل الدخول أولًا. <Link href="/login">تسجيل الدخول</Link>
        </p>
      </div>
    );
  }

  if (error) return <div className="card"><p>{error}</p></div>;
  if (!exam) return <div className="card"><p>جاري التحميل…</p></div>;

  const stats = {
    total: attempts.length,
    pending: attempts.filter(
      (a) => a.status === "SUBMITTED" || a.status === "TIMED_OUT",
    ).length,
    graded: attempts.filter((a) => a.status === "GRADED").length,
    passed: attempts.filter((a) => a.passed === true).length,
  };

  const questionById = new Map(exam.questions.map((q) => [q.id, q]));

  return (
    <>
      <nav style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: "var(--space-sm)" }}>
        <Link href="/teacher/exams">الاختبارات</Link> › {exam.title}
      </nav>
      <h1 style={{ marginBottom: "var(--space-md)" }}>تصحيح: {exam.title}</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "var(--space-sm)",
          marginBottom: "var(--space-lg)",
        }}
      >
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>الإجمالي</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#3b82f6" }}>{stats.pending}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>بانتظار التصحيح</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#10b981" }}>{stats.graded}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>مُصحّح</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#10b981" }}>{stats.passed}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>ناجح</div>
        </div>
      </div>

      {!selected ? (
        <div className="card" style={{ overflow: "hidden" }}>
          {attempts.length === 0 ? (
            <p>لا توجد محاولات بعد.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "right", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
                  <th style={{ padding: "var(--space-md)" }}>الطالب</th>
                  <th style={{ padding: "var(--space-md)" }}>المحاولة</th>
                  <th style={{ padding: "var(--space-md)" }}>الحالة</th>
                  <th style={{ padding: "var(--space-md)" }}>الدرجة</th>
                  <th style={{ padding: "var(--space-md)" }}>التسليم</th>
                  <th style={{ padding: "var(--space-md)" }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((att) => (
                  <tr key={att.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "var(--space-md)", fontWeight: 600 }}>
                      {att.student.name}
                      <div style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)" }} dir="ltr">
                        {att.student.phone}
                      </div>
                    </td>
                    <td style={{ padding: "var(--space-md)", textAlign: "center" }}>#{att.attemptNumber}</td>
                    <td style={{ padding: "var(--space-md)" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 10px",
                          borderRadius: "999px",
                          fontSize: 12,
                          fontWeight: 600,
                          background: `${statusColor(att.status)}20`,
                          color: statusColor(att.status),
                        }}
                      >
                        {statusLabel(att.status)}
                      </span>
                    </td>
                    <td style={{ padding: "var(--space-md)", fontWeight: 600 }}>
                      {att.score !== null && att.score !== undefined ? `${att.score}/100` : "—"}
                    </td>
                    <td style={{ padding: "var(--space-md)", fontSize: 12, color: "var(--text-muted)" }}>
                      {att.submittedAt ? new Date(att.submittedAt).toLocaleString("ar-EG") : "—"}
                    </td>
                    <td style={{ padding: "var(--space-md)" }}>
                      <button onClick={() => { setSelectedId(att.id); setNotice(null); }} style={{ padding: "4px 12px", fontSize: 12 }}>
                        تصحيح
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "var(--space-lg)", maxWidth: 1200 }}>
          <div className="card">
            <h3 style={{ marginBottom: "var(--space-md)" }}>
              إجابات {selected.student.name} (محاولة #{selected.attemptNumber})
            </h3>
            <div style={{ display: "grid", gap: "var(--space-sm)" }}>
              {(selected.answers ?? []).map((ans, idx) => {
                const q = questionById.get(ans.questionId);
                return (
                  <div key={idx} style={{ padding: "var(--space-sm)", borderRadius: "var(--radius-control)", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                      {q ? q.text : ans.questionId}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      إجابة الطالب: <strong>{answerText(ans.answer)}</strong>
                    </div>
                  </div>
                );
              })}
              {(selected.answers ?? []).length === 0 && (
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                  لا توجد إجابات مسجلة لهذه المحاولة.
                </p>
              )}
            </div>
          </div>

          <aside>
            <div className="card">
              <h3 style={{ marginBottom: "var(--space-md)" }}>التصحيح</h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>
                الحالة الحالية: {statusLabel(selected.status)}
                {selected.score !== null && selected.score !== undefined
                  ? ` · الدرجة: ${selected.score}/100`
                  : ""}
              </p>
              <label style={{ display: "block", marginBottom: "var(--space-sm)" }}>
                <span style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
                  الدرجة (0–100)
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder={selected.score?.toString() ?? "مثال: 85"}
                  style={{ width: "100%" }}
                />
              </label>
              <label style={{ display: "block", marginBottom: "var(--space-md)" }}>
                <span style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
                  ملاحظات للطالب
                </span>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  style={{ width: "100%" }}
                  placeholder="أحسنت، راجع…"
                />
              </label>
              {notice && (
                <p style={{ fontSize: 13, marginBottom: "var(--space-sm)" }}>{notice}</p>
              )}
              <button
                onClick={() => void handleGrade()}
                disabled={grading}
                style={{ width: "100%", background: "var(--color-action)", color: "white", marginBottom: "var(--space-sm)" }}
              >
                {grading ? "جاري الحفظ…" : "حفظ الدرجة"}
              </button>
              <button
                onClick={() => { setSelectedId(null); setScore(""); setFeedback(""); setNotice(null); }}
                style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
              >
                رجوع إلى الطابور
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
