"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  api,
  ApiError,
  type AssignmentSubmissionSummary,
  type StudentLesson,
} from "@/app/lib/api";
import { buildScoreBlueprint } from "../lib/progress";
import {
  isPortfolioSaved,
  readPortfolio,
  removePortfolioEntry,
  savePortfolioEntry,
  type PortfolioEntry,
} from "../lib/portfolio";

interface AssignmentResultReviewProps {
  token: string;
  assignmentTitle: string;
  latest: AssignmentSubmissionSummary;
  passingScore: number | null;
  lessonId: string | null;
  history?: AssignmentSubmissionSummary[];
}

function youTubeEmbedUrl(lesson: StudentLesson): string | null {
  const video = lesson.videos.find(
    (item) => item.provider === "youtube" && item.providerVideoId,
  );
  return video
    ? `https://www.youtube-nocookie.com/embed/${video.providerVideoId}`
    : null;
}

function LockIcon() {
  return (
    <svg
      className="ar-evidence-icon"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v2" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg
      className="ar-feedback-icon"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-4 2v-4.6A7.5 7.5 0 0 1 12.5 4 7.5 7.5 0 0 1 20 11.5Z" />
      <path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" />
    </svg>
  );
}

function VerifiedIcon() {
  return (
    <svg
      className="ar-verified-icon"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3 5.5 5.8v5.1c0 4.1 2.6 7.5 6.5 9.1 3.9-1.6 6.5-5 6.5-9.1V5.8L12 3Z" />
      <path d="m8.8 11.6 2.1 2.2 4.5-4.7" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg
      className="ar-legacy-icon"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6.5 4.5h11v16L12 17l-5.5 3.5v-16Z" />
    </svg>
  );
}

function formatMoment(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AssignmentResultReview({
  token,
  assignmentTitle,
  latest,
  passingScore,
  lessonId,
  history = [],
}: AssignmentResultReviewProps) {
  const [lessonOpen, setLessonOpen] = useState(false);
  const [lesson, setLesson] = useState<StudentLesson | null>(null);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([]);
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);

  useEffect(() => {
    setPortfolio(readPortfolio());
  }, []);

  const graded = latest.status === "GRADED" && latest.score !== null;
  const hasGap =
    graded &&
    passingScore !== null &&
    latest.score !== null &&
    latest.score < passingScore;
  const verdict = graded ? (hasGap ? "gap" : "clear") : "pending";
  const content = latest.content?.trim() ?? "";
  const attachmentCount = Array.isArray(latest.attachments)
    ? latest.attachments.length
    : 0;
  const feedback = latest.feedback?.trim() ?? "";
  const answerType =
    content && attachmentCount > 0
      ? "مقالية + مرفقات"
      : attachmentCount > 0
        ? "مرفقات"
        : "مقالية";

  const growth = useMemo(() => {
    const source = history.length ? history : [latest];
    const withLatest = source.some((item) => item.id === latest.id)
      ? source
      : [latest, ...source];
    return buildScoreBlueprint(withLatest);
  }, [history, latest]);

  const growthPoints = growth?.points.length ?? 0;
  const firstApproved = growth?.first ?? latest.score ?? 0;
  const lastApproved = growth?.latest ?? latest.score ?? 0;
  const growthDelta = growth?.delta ?? 0;
  const growthPct = Math.max(0, Math.min(100, lastApproved));
  const saved = isPortfolioSaved(latest.id, portfolio);

  function saveLegacy() {
    if (!graded) return;
    try {
      const next = savePortfolioEntry({
        submissionId: latest.id,
        assignmentTitle,
        score: latest.score ?? 0,
        submittedAt: latest.submittedAt,
        gradedAt: latest.gradedAt ?? null,
        content,
        feedback,
        savedAt: new Date().toISOString(),
      });
      setPortfolio(next);
      setPortfolioError(null);
    } catch {
      setPortfolioError("تعذر حفظ المراجعة محليًا على هذا المتصفح.");
    }
  }

  function removeLegacy(submissionId: string) {
    try {
      const next = removePortfolioEntry(submissionId);
      setPortfolio(next);
      setPortfolioOpen(next.length > 0);
      setPortfolioError(null);
    } catch {
      setPortfolioError("تعذر تعديل سجل التميز على هذا المتصفح.");
    }
  }

  async function toggleLesson() {
    if (!lessonId) return;
    if (lessonOpen) {
      setLessonOpen(false);
      return;
    }
    setLessonOpen(true);
    if (lesson || lessonLoading) return;
    setLessonLoading(true);
    setLessonError(null);
    try {
      const data = await api.getStudentLesson(token, lessonId);
      setLesson(data);
    } catch (error) {
      setLessonError(
        error instanceof ApiError
          ? error.message
          : "تعذر تحميل مراجعة الدرس",
      );
    } finally {
      setLessonLoading(false);
    }
  }

  const embedUrl = lesson ? youTubeEmbedUrl(lesson) : null;

  return (
    <section className="ar-review" aria-label={`نتيجة ${assignmentTitle}`}>
      <header className="ar-review-head">
        <div>
          <span className="ar-eyebrow">مراجعة النتيجة</span>
          <h2>{assignmentTitle}</h2>
        </div>
        <span className="ar-review-date">
          {new Date(latest.submittedAt).toLocaleDateString("ar-EG", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </header>

      <div className="ar-review-grid" data-link={verdict}>
        <article
          className="ar-card ar-answer"
          data-side="answer"
          data-verdict={verdict}
        >
          <div className="ar-card-head">
            <span className="ar-kicker">إجابتك المقالية</span>
            <span className="ar-chip">من التسليم</span>
          </div>
          {graded ? (
            <div className="ar-answer-verdict" data-tone={verdict}>
              <span className="ar-answer-verdict-dot" aria-hidden />
              <span>
                {hasGap
                  ? "تحتاج مراجعة — الدرجة أقل من حد النجاح"
                  : "إجابة معتمدة — راجع الربط مع مراجعة المعلم"}
              </span>
            </div>
          ) : null}
          {content ? (
            <p className="ar-answer-text">{content}</p>
          ) : (
            <p className="ar-empty">
              التسليم محفوظ لكن مفيش نص مقالي محفوظ معه.
            </p>
          )}
          {attachmentCount > 0 ? (
            <p className="ar-attachments">
              + {attachmentCount.toLocaleString("en-US")}{" "}
              {attachmentCount === 1 ? "مرفق" : "مرفقات"} محفوظة
            </p>
          ) : null}
          <div className="ar-answer-meta">
            <div>
              <span>وقت التسليم</span>
              <strong>{formatMoment(latest.submittedAt)}</strong>
            </div>
            <div>
              <span>نوع الإجابة</span>
              <strong>{answerType}</strong>
            </div>
          </div>
        </article>

        <article className="ar-card ar-evaluation" data-side="review">
          <div className="ar-card-head">
            <span className="ar-kicker">مراجعة المعلم</span>
            {graded ? (
              <span className="ar-verified-seal">
                <VerifiedIcon />
                <span>معتمد ومراجع</span>
                <small>VERIFIED</small>
              </span>
            ) : (
              <span className="ar-chip" data-tone="amber">
                بانتظار المراجعة
              </span>
            )}
          </div>

          {graded ? (
            <>
              <div className="ar-score-row">
                <strong
                  className="ar-score"
                  data-gap={hasGap ? "true" : "false"}
                >
                  {latest.score}%
                </strong>
                <div className="ar-score-copy">
                  <span className="ar-score-note" data-gap={hasGap}>
                    {hasGap
                      ? "أقل من درجة النجاح المحددة للواجب"
                      : "درجة معتمدة من المعلم"}
                  </span>
                  <span className="ar-score-meta">
                    درجة نهائية · اعتماد المعلم
                  </span>
                </div>
              </div>

              {growthPoints > 0 ? (
                <div
                  className="ar-growth-filament"
                  data-gap={hasGap ? "true" : "false"}
                >
                  <div className="ar-growth-head">
                    <span>مؤشر النمو في هذا الواجب</span>
                    <strong>
                      {growthPoints > 1
                        ? `${firstApproved}% → ${lastApproved}%`
                        : "أول اعتماد"}
                    </strong>
                  </div>
                  <div
                    className="ar-growth-track"
                    role="img"
                    aria-label={
                      growthPoints > 1
                        ? `مؤشر النمو من ${firstApproved}% إلى ${lastApproved}%`
                        : `أول اعتماد بدرجة ${lastApproved}%`
                    }
                  >
                    <span
                      className="ar-growth-fill"
                      style={{ width: `${growthPct}%` }}
                    />
                    {growthPoints > 1 ? (
                      <span
                        className="ar-growth-origin"
                        style={{
                          insetInlineStart: `${Math.max(
                            0,
                            Math.min(100, firstApproved),
                          )}%`,
                        }}
                      />
                    ) : null}
                  </div>
                  <p className="ar-growth-foot">
                    {growthPoints > 1
                      ? growthDelta > 0
                        ? `+${growthDelta} نقطة من أول اعتماد`
                        : growthDelta < 0
                          ? `${growthDelta} نقطة من أول اعتماد`
                          : "مستقر عند أول اعتماد"
                      : "خط الأساس اتحفظ بعد اعتماد المعلم"}
                  </p>
                </div>
              ) : null}
            </>
          ) : (
            <div className="ar-pending">
              <span className="ar-pending-filament" aria-hidden />
              <div className="ar-pending-copy">
                <strong>إجابتك في أمان</strong>
                <span>بانتظار نظرة المعلم المخصصة.</span>
              </div>
            </div>
          )}

          <div className="ar-feedback-hub" data-empty={!feedback}>
            <div className="ar-feedback-head">
              <span className="ar-feedback-title">
                <MessageIcon />
                ملاحظات المعلم
              </span>
              <span className="ar-feedback-state">
                {graded ? "مراجعة بشرية" : "بانتظار الاعتماد"}
              </span>
            </div>
            <p className="ar-feedback">
              {feedback
                ? feedback
                : graded
                  ? "مفيش ملاحظات إضافية محفوظة مع التصحيح."
                  : "ملاحظات المعلم هتظهر هنا بعد اعتماد التصحيح."}
            </p>
          </div>

          <div className="ar-evidence" data-ready="false">
            <div className="ar-evidence-head">
              <span className="ar-evidence-title">
                <LockIcon />
                الدليل النصي من المرجع
              </span>
              <span className="ar-chip">قيد الربط</span>
            </div>
            <p>
              الاقتباس الحرفي من بنك المعرفة هيتفعّل لما محرك سند يرجّع الـChunk
              المرتبط بمراجعة المعلم. لحد ساعتها، مراجعة المعلم المعتمدة هي
              المرجع.
            </p>
          </div>
        </article>
      </div>

      {graded ? (
        <div className="ar-legacy">
          <div className="ar-legacy-copy">
            <span className="ar-legacy-eyebrow">
              <BookmarkIcon />
              ميثاق الفخر الرقمي
            </span>
            <p>
              احفظ هذه المراجعة في سجل التميز، وارجع لصياغتك وقت ما تحتاج.
            </p>
          </div>
          <div className="ar-legacy-actions">
            {portfolio.length > 0 ? (
              <button
                type="button"
                className="ar-legacy-link"
                onClick={() => setPortfolioOpen((open) => !open)}
                aria-expanded={portfolioOpen}
              >
                {portfolioOpen
                  ? "إغلاق السجل"
                  : `سجل التميز · ${portfolio.length}`}
              </button>
            ) : null}
            <button
              type="button"
              className="ar-legacy-save"
              data-saved={saved ? "true" : "false"}
              onClick={saveLegacy}
              disabled={saved}
            >
              <BookmarkIcon />
              {saved ? "محفوظة في سجل التميز" : "حفظ في سجل التميز"}
            </button>
          </div>
        </div>
      ) : null}

      {portfolioError ? (
        <p className="ar-legacy-error" role="status">
          {portfolioError}
        </p>
      ) : null}

      {portfolioOpen && portfolio.length > 0 ? (
        <div className="ar-portfolio">
          <div className="ar-portfolio-head">
            <span className="ar-kicker">سجل التميز</span>
            <span>محفوظ محليًا على هذا المتصفح</span>
          </div>
          <ul>
            {portfolio.map((item) => (
              <li key={item.submissionId}>
                <div className="ar-portfolio-row">
                  <strong>{item.assignmentTitle}</strong>
                  <span>
                    {item.score}% ·{" "}
                    {formatMoment(item.gradedAt ?? item.submittedAt)}
                  </span>
                </div>
                {item.content ? <p>{item.content}</p> : null}
                {item.feedback ? <small>{item.feedback}</small> : null}
                <button
                  type="button"
                  onClick={() => removeLegacy(item.submissionId)}
                >
                  إزالة
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {graded ? (
        <div className="ar-remedy">
          <div className="ar-remedy-copy">
            <span className="ar-kicker">
              {hasGap ? "فجوة معرفية واضحة" : "خطوة مراجعة"}
            </span>
            <p>
              {hasGap
                ? "درجتك أقل من حد النجاح. راجع أساس الدرس بسرعة قبل المحاولة الجاية."
                : "مراجعة درس الواجب بتساعدك تثبّت الأساس اللي اتصحح عليه."}
            </p>
          </div>
          <button
            type="button"
            className="ar-remedy-btn"
            onClick={() => void toggleLesson()}
            disabled={!lessonId || lessonLoading}
            aria-expanded={lessonOpen}
          >
            <span className="ar-remedy-icon" aria-hidden>
              ↻
            </span>
            {lessonLoading
              ? "بنجهّز المراجعة…"
              : lessonOpen
                ? "إغلاق المراجعة"
                : hasGap
                  ? "ردم الفجوة المعرفية الآن"
                  : "مراجعة أساس الواجب"}
          </button>
        </div>
      ) : null}

      {lessonOpen ? (
        <div className="ar-lesson">
          {lessonLoading ? (
            <p className="ar-empty">جاري تحميل درس المراجعة…</p>
          ) : lessonError ? (
            <div className="ar-lesson-message">
              <p>{lessonError}</p>
              {lessonId ? (
                <Link href={`/student/lessons/${lessonId}`}>
                  افتح صفحة الدرس
                </Link>
              ) : null}
            </div>
          ) : lesson ? (
            <>
              <div className="ar-lesson-head">
                <span className="ar-kicker">مراجعة موجهة</span>
                <h3>{lesson.lesson.title}</h3>
                {lesson.lesson.description ? (
                  <p>{lesson.lesson.description}</p>
                ) : null}
              </div>
              {embedUrl ? (
                <div className="ar-video">
                  <iframe
                    src={embedUrl}
                    title={lesson.lesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="ar-lesson-message">
                  <p>
                    الدرس متاح، لكن مفيش فيديو منشور له في النسخة الحالية.
                  </p>
                  {lessonId ? (
                    <Link href={`/student/lessons/${lessonId}`}>
                      افتح صفحة الدرس
                    </Link>
                  ) : null}
                </div>
              )}
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
