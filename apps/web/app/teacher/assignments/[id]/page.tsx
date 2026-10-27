"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import SanadAiCard from "@/app/components/SanadAiCard";
import {
  api,
  ApiError,
  type AiCriterionResult,
  type AiEvaluation,
  type AskSanadPassage,
  type AssignmentDetail,
  type GradingSubmission,
} from "@/app/lib/api";

const BRANCHES: { id: string; label: string; color: string }[] = [
  { id: "all", label: "الكل", color: "#8b5cf6" },
  { id: "nahw", label: "النحو والإعراب", color: "#10b981" },
  { id: "sarf", label: "الصرف والإملاء", color: "#0ea5e9" },
  { id: "balagha", label: "البلاغة والنقد", color: "#f59e0b" },
  { id: "arood", label: "العروض والشعر", color: "#ec4899" },
  { id: "lugha", label: "اللغة والمفردات", color: "#6366f1" },
  { id: "quran", label: "القرآن وعلومه", color: "#14b8a6" },
  { id: "sira", label: "السيرة والتاريخ", color: "#f97316" },
];

function branchColor(branch: string): string {
  return BRANCHES.find((b) => b.id === branch)?.color ?? "#6b7280";
}

const statusConfig: Record<string, { label: string; color: string }> = {
  SUBMITTED: { label: "مُسلّم", color: "#3b82f6" },
  GRADED: { label: "مُصحّح", color: "#10b981" },
  LATE: { label: "متأخر", color: "#f59e0b" },
  REJECTED: { label: "مرفوض", color: "#ef4444" },
  RETURNED: { label: "مُعاد", color: "#6b7280" },
};

function statusLabel(status: string): string {
  return statusConfig[status]?.label ?? status;
}

function statusColor(status: string): string {
  return statusConfig[status]?.color ?? "#6b7280";
}

export default function TeacherAssignmentGradingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { token } = useAuth();
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [submissions, setSubmissions] = useState<GradingSubmission[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [grading, setGrading] = useState(false);
  // ---- SANAD AI panel ----
  const [askBranch, setAskBranch] = useState("all");
  const [askQuestion, setAskQuestion] = useState("");
  const [passages, setPassages] = useState<AskSanadPassage[]>([]);
  const [asking, setAsking] = useState(false);
  const [aiResult, setAiResult] = useState<AiEvaluation | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [refAnswer, setRefAnswer] = useState("");
  const [maxScore, setMaxScore] = useState("10");
  const [criteria, setCriteria] = useState<
    { id: string; description: string; max_score: number }[]
  >([{ id: "c1", description: "", max_score: 10 }]);

  useEffect(() => {
    params.then((p) => setAssignmentId(p.id));
  }, [params]);

  const reload = useCallback(async () => {
    if (!token || !assignmentId) return;
    const [detail, queue] = await Promise.all([
      api.getAssignment(token, assignmentId),
      api.getSubmissionQueue(token, assignmentId),
    ]);
    setAssignment(detail);
    setSubmissions(queue.submissions);
  }, [token, assignmentId]);

  useEffect(() => {
    if (!token || !assignmentId) return;
    reload().catch((e) =>
      setError(e instanceof ApiError ? e.message : "تعذر تحميل البيانات"),
    );
  }, [token, assignmentId, reload]);

  const selected = submissions.find((s) => s.id === selectedId) ?? null;

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
      await api.gradeSubmission(token, selected.id, {
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

  async function handleAsk() {
    if (!token || !assignmentId || askQuestion.trim() === "") return;
    setAsking(true);
    setNotice(null);
    try {
      const res = await api.askSanad(token, assignmentId, {
        question: askQuestion.trim(),
        branch: askBranch,
      });
      setPassages(res.data.passages);
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : "تعذر سؤال سند");
    } finally {
      setAsking(false);
    }
  }

  async function handleEvaluate() {
    if (!token || !assignmentId || !selected) return;
    const max = Number(maxScore);
    const cleanCriteria = criteria
      .filter((c) => c.description.trim() !== "" && c.max_score > 0)
      .map((c, i) => ({
        id: c.id.trim() === "" ? `c${i + 1}` : c.id.trim(),
        description: c.description.trim(),
        max_score: c.max_score,
      }));
    const sum = cleanCriteria.reduce((s, c) => s + c.max_score, 0);
    if (refAnswer.trim() === "" || cleanCriteria.length === 0) {
      setNotice("أدخل الإجابة النموذجية ومعيارًا واحدًا على الأقل");
      return;
    }
    if (sum !== max) {
      setNotice(`مجموع المعايير (${sum}) يجب أن يساوي الدرجة العظمى (${max})`);
      return;
    }
    setEvaluating(true);
    setNotice(null);
    try {
      const res = await api.evaluateWithAI(token, assignmentId, {
        answer: selected.content ?? "",
        grading: {
          reference_answer: refAnswer.trim(),
          max_score: max,
          rubric_version: "v1",
          criteria: cleanCriteria,
        },
        branches: [askBranch],
      });
      setAiResult(res.data);
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : "تعذر التقييم بالذكاء");
    } finally {
      setEvaluating(false);
    }
  }

  function handleApproveAi() {
    if (!aiResult) return;
    setScore(String(aiResult.score));
    setFeedback(aiResult.feedback);
    setNotice("تم اعتماد اقتراح الذكاء — راجع ثم احفظ الدرجة");
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

  if (error)
    return (
      <div className="card">
        <p>{error}</p>
      </div>
    );
  if (!assignment)
    return (
      <div className="card">
        <p>جاري التحميل…</p>
      </div>
    );

  const stats = {
    total: submissions.length,
    pending: submissions.filter(
      (s) => s.status === "SUBMITTED" || s.status === "LATE",
    ).length,
    graded: submissions.filter((s) => s.status === "GRADED").length,
  };

  return (
    <>
      <nav
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          marginBottom: "var(--space-sm)",
        }}
      >
        <Link href="/teacher/assignments">الواجبات</Link> › {assignment.title}
      </nav>
      <h1 style={{ marginBottom: "var(--space-md)" }}>
        تصحيح: {assignment.title}
      </h1>

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
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            الإجمالي
          </div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#3b82f6" }}>
            {stats.pending}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            بانتظار التصحيح
          </div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#10b981" }}>
            {stats.graded}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>مُصحّح</div>
        </div>
      </div>

      {!selected ? (
        <div className="card" style={{ overflow: "hidden" }}>
          {submissions.length === 0 ? (
            <p>لا توجد تسليمات بعد.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    textAlign: "right",
                    borderBottom: "1px solid var(--border-subtle)",
                    background: "var(--bg-surface)",
                  }}
                >
                  <th style={{ padding: "var(--space-md)" }}>الطالب</th>
                  <th style={{ padding: "var(--space-md)" }}>المحاولة</th>
                  <th style={{ padding: "var(--space-md)" }}>الحالة</th>
                  <th style={{ padding: "var(--space-md)" }}>الدرجة</th>
                  <th style={{ padding: "var(--space-md)" }}>التسليم</th>
                  <th style={{ padding: "var(--space-md)" }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr
                    key={sub.id}
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                  >
                    <td style={{ padding: "var(--space-md)", fontWeight: 600 }}>
                      <Link href={`/teacher/students/${sub.student.id}`}>
                        {sub.student.name}
                      </Link>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 400,
                          color: "var(--text-muted)",
                        }}
                        dir="ltr"
                      >
                        {sub.student.phone}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "var(--space-md)",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                      dir="ltr"
                    >
                      #{sub.attemptNumber}
                    </td>
                    <td style={{ padding: "var(--space-md)" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 10px",
                          borderRadius: "999px",
                          fontSize: 12,
                          fontWeight: 600,
                          background: `${statusColor(sub.status)}20`,
                          color: statusColor(sub.status),
                        }}
                      >
                        {statusLabel(sub.status)}
                      </span>
                    </td>
                    <td style={{ padding: "var(--space-md)", fontWeight: 600 }}>
                      {sub.score !== null && sub.score !== undefined
                        ? `${sub.score}/100`
                        : "—"}
                    </td>
                    <td
                      style={{
                        padding: "var(--space-md)",
                        fontSize: 12,
                        color: "var(--text-muted)",
                      }}
                    >
                      {sub.submittedAt
                        ? new Date(sub.submittedAt).toLocaleString("ar-EG")
                        : "—"}
                    </td>
                    <td style={{ padding: "var(--space-md)" }}>
                      <button
                        onClick={() => {
                          setSelectedId(sub.id);
                          setNotice(null);
                        }}
                        style={{ padding: "4px 12px", fontSize: 12 }}
                      >
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: "var(--space-lg)",
            maxWidth: 1200,
          }}
        >
          <div className="card">
            <h3 style={{ marginBottom: "var(--space-md)" }}>
              إجابة {selected.student.name}
            </h3>
            <div
              style={{
                padding: "var(--space-md)",
                borderRadius: "var(--radius-control)",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                whiteSpace: "pre-wrap",
                fontSize: 14,
              }}
            >
              {selected.content && selected.content.trim() !== ""
                ? selected.content
                : "لا يوجد محتوى نصي مسجل."}
            </div>
          </div>

          <aside>
            <div className="card">
              <h3 style={{ marginBottom: "var(--space-md)" }}>التصحيح</h3>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  marginBottom: 8,
                }}
              >
                الحالة الحالية: {statusLabel(selected.status)}
                {selected.score !== null && selected.score !== undefined
                  ? ` · الدرجة: ${selected.score}/100`
                  : ""}
              </p>
              <label
                style={{ display: "block", marginBottom: "var(--space-sm)" }}
              >
                <span
                  style={{ display: "block", fontSize: 13, marginBottom: 4 }}
                >
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
              <label
                style={{ display: "block", marginBottom: "var(--space-md)" }}
              >
                <span
                  style={{ display: "block", fontSize: 13, marginBottom: 4 }}
                >
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
                <p style={{ fontSize: 13, marginBottom: "var(--space-sm)" }}>
                  {notice}
                </p>
              )}
              <button
                onClick={() => void handleGrade()}
                disabled={grading}
                style={{
                  width: "100%",
                  background: "var(--color-action)",
                  color: "white",
                  marginBottom: "var(--space-sm)",
                }}
              >
                {grading ? "جاري الحفظ…" : "حفظ الدرجة"}
              </button>
              <button
                onClick={() => {
                  setSelectedId(null);
                  setScore("");
                  setFeedback("");
                  setNotice(null);
                  setAiResult(null);
                  setPassages([]);
                }}
                style={{
                  width: "100%",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                رجوع إلى الطابور
              </button>
            </div>

            <div className="card" style={{ marginTop: "var(--space-md)" }}>
              <h3 style={{ marginBottom: "var(--space-sm)" }}>
                اسأل سند <span className="badge">SANAD</span>
              </h3>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginBottom: "var(--space-sm)",
                }}
              >
                {BRANCHES.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setAskBranch(b.id)}
                    style={{
                      padding: "4px 10px",
                      fontSize: 12,
                      borderRadius: 999,
                      border: `1px solid ${b.color}`,
                      background:
                        askBranch === b.id ? `${b.color}26` : "transparent",
                      color: askBranch === b.id ? b.color : "var(--text-muted)",
                      fontWeight: askBranch === b.id ? 700 : 400,
                    }}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <input
                  value={askQuestion}
                  onChange={(e) => setAskQuestion(e.target.value)}
                  placeholder="اكتب سؤالًا من المنهج…"
                  style={{ flex: 1 }}
                />
                <button
                  onClick={() => void handleAsk()}
                  disabled={asking || askQuestion.trim() === ""}
                >
                  {asking ? "…" : "اسأل"}
                </button>
              </div>
              {passages.map((p) => (
                <div
                  key={p.chunk_id}
                  style={{
                    borderRight: `3px solid ${branchColor(p.branch)}`,
                    background: "var(--bg-surface)",
                    borderRadius: 8,
                    padding: 8,
                    fontSize: 13,
                    marginBottom: 6,
                  }}
                >
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {p.source_id} · {p.branch}
                  </div>
                  <div>{p.text.slice(0, 220)}</div>
                </div>
              ))}

              <h3 style={{ margin: "var(--space-md) 0 var(--space-sm)" }}>
                التقييم بالذكاء
              </h3>
              <textarea
                value={refAnswer}
                onChange={(e) => setRefAnswer(e.target.value)}
                rows={2}
                style={{ width: "100%", marginBottom: 6 }}
                placeholder="الإجابة النموذجية…"
              />
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <input
                  type="number"
                  min={1}
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                  style={{ width: 90 }}
                  aria-label="الدرجة العظمى"
                />
                <button
                  onClick={() =>
                    setCriteria((c) => [
                      ...c,
                      { id: `c${c.length + 1}`, description: "", max_score: 0 },
                    ])
                  }
                  style={{ fontSize: 12 }}
                >
                  + معيار
                </button>
              </div>
              {criteria.map((c, i) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: 6, marginBottom: 6 }}
                >
                  <input
                    value={c.description}
                    onChange={(e) =>
                      setCriteria((prev) =>
                        prev.map((x, j) =>
                          j === i ? { ...x, description: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder={`المعيار ${i + 1}`}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="number"
                    min={0}
                    value={c.max_score}
                    onChange={(e) =>
                      setCriteria((prev) =>
                        prev.map((x, j) =>
                          j === i
                            ? { ...x, max_score: Number(e.target.value) }
                            : x,
                        ),
                      )
                    }
                    style={{ width: 64 }}
                    aria-label="درجة المعيار"
                  />
                </div>
              ))}
              <button
                onClick={() => void handleEvaluate()}
                disabled={evaluating}
                style={{ width: "100%", marginBottom: 8 }}
              >
                {evaluating ? "جاري التقييم…" : "قيّم بالذكاء"}
              </button>
              {aiResult && (
                <>
                  {aiResult.needsTeacherReview && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "#f59e0b",
                        fontWeight: 700,
                        marginBottom: 6,
                      }}
                    >
                      يحتاج مراجعتك قبل الاعتماد
                    </p>
                  )}
                  <SanadAiCard
                    score={aiResult.score}
                    maxScore={aiResult.maxScore}
                    evaluation={aiResult.criteria
                      .map((x) => `${x.criterion_id}: ${x.earned}/${x.max}`)
                      .join(" · ")}
                    feedback={aiResult.feedback}
                    knowledgeGap={aiResult.knowledgeGap.join(" · ")}
                    nextStep="راجع الاقتراح ثم اضغط اعتماد ثم احفظ الدرجة"
                  />
                  <button
                    onClick={handleApproveAi}
                    style={{
                      width: "100%",
                      marginTop: 8,
                      background: "var(--color-action)",
                      color: "white",
                    }}
                  >
                    اعتماد الاقتراح
                  </button>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
