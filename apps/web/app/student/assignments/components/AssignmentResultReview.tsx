"use client";

import Link from "next/link";
import { useState } from "react";
import {
  api,
  ApiError,
  type AssignmentSubmissionSummary,
  type StudentLesson,
} from "@/app/lib/api";

interface AssignmentResultReviewProps {
  token: string;
  assignmentTitle: string;
  latest: AssignmentSubmissionSummary;
  passingScore: number | null;
  lessonId: string | null;
}

function youTubeEmbedUrl(lesson: StudentLesson): string | null {
  const video = lesson.videos.find(
    (item) => item.provider === "youtube" && item.providerVideoId,
  );
  return video
    ? `https://www.youtube-nocookie.com/embed/${video.providerVideoId}`
    : null;
}

export default function AssignmentResultReview({
  token,
  assignmentTitle,
  latest,
  passingScore,
  lessonId,
}: AssignmentResultReviewProps) {
  const [lessonOpen, setLessonOpen] = useState(false);
  const [lesson, setLesson] = useState<StudentLesson | null>(null);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [lessonLoading, setLessonLoading] = useState(false);

  const graded = latest.status === "GRADED" && latest.score !== null;
  const hasGap =
    graded &&
    passingScore !== null &&
    latest.score !== null &&
    latest.score < passingScore;
  const content = latest.content?.trim() ?? "";
  const attachmentCount = Array.isArray(latest.attachments)
    ? latest.attachments.length
    : 0;

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

      <div className="ar-review-grid">
        <article className="ar-card ar-answer">
          <div className="ar-card-head">
            <span className="ar-kicker">إجابتك المقالية</span>
            <span className="ar-chip">من التسليم</span>
          </div>
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
        </article>

        <article className="ar-card ar-evaluation">
          <div className="ar-card-head">
            <span className="ar-kicker">مراجعة المعلم</span>
            <span className="ar-chip" data-tone={graded ? "green" : "muted"}>
              {graded ? "معتمدة" : "بانتظار المراجعة"}
            </span>
          </div>

          <div className="ar-score-row">
            <strong className="ar-score">
              {graded ? `${latest.score}%` : "—"}
            </strong>
            <span>
              {graded
                ? hasGap
                  ? "أقل من درجة النجاح المحددة للواجب"
                  : "درجة معتمدة من المعلم"
                : "لسه مفيش درجة معتمدة"}
            </span>
          </div>

          <p className="ar-feedback">
            {latest.feedback?.trim()
              ? latest.feedback
              : "ملاحظات المعلم هتظهر هنا بعد اعتماد التصحيح."}
          </p>

          <div className="ar-evidence" data-ready="false">
            <div className="ar-evidence-head">
              <span>الدليل النصي من المرجع</span>
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
