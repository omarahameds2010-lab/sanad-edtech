"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError, type LessonVideo, type StudentLesson } from "@/app/lib/api";

function youTubeEmbedUrl(video: LessonVideo): string | null {
  if (video.provider !== "youtube" || !video.providerVideoId) return null;
  return `https://www.youtube-nocookie.com/embed/${video.providerVideoId}`;
}

export default function StudentLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { token } = useAuth();
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [data, setData] = useState<StudentLesson | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setLessonId(p.id));
  }, [params]);

  useEffect(() => {
    if (!lessonId || !token) return;
    let cancelled = false;
    api
      .getStudentLesson(token, lessonId)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof ApiError ? e.message : "تعذر تحميل الدرس");
      });
    return () => {
      cancelled = true;
    };
  }, [lessonId, token]);

  if (!token) {
    return (
      <div className="card">
        <p>
          سجّل الدخول أولًا لعرض الدرس.{" "}
          <Link href="/login">تسجيل الدخول</Link>
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <p style={{ color: "#ef4444" }}>{error}</p>
        <p style={{ marginTop: 8 }}>
          <Link href="/student">العودة إلى لوحتي</Link>
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card">
        <p>جاري تحميل الدرس…</p>
      </div>
    );
  }

  const { lesson, access, exam, videos } = data;

  if (access.isLocked) {
    return (
      <div className="card" style={{ maxWidth: 640 }}>
        <h1 style={{ marginBottom: 8 }}>{lesson.title}</h1>
        <p style={{ color: "var(--text-muted)" }}>
          هذا الدرس مقفل حاليًا
          {access.unlockType && access.unlockType !== "NONE"
            ? ` — يُفتح عند: ${access.unlockType}`
            : ""}
          . أكمل الدروس السابقة أولًا.
        </p>
      </div>
    );
  }

  const youTubeVideo = videos.find((v) => youTubeEmbedUrl(v) !== null) ?? null;

  return (
    <div style={{ maxWidth: 880 }}>
      <nav style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: "var(--space-sm)" }}>
        <Link href="/student">لوحتي</Link> › {lesson.title}
      </nav>

      <h1 style={{ marginBottom: "var(--space-md)" }}>{lesson.title}</h1>

      {lesson.description && (
        <p style={{ color: "var(--text-muted)", marginBottom: "var(--space-lg)" }}>
          {lesson.description}
        </p>
      )}

      {/* Video lesson */}
      {lesson.type === "VIDEO" && (
        <>
          {youTubeVideo ? (
            <div
              style={{
                width: "100%",
                aspectRatio: "16/9",
                borderRadius: "var(--radius-card)",
                overflow: "hidden",
                marginBottom: "var(--space-lg)",
                border: "1px solid var(--border-subtle)",
                background: "black",
              }}
            >
              <iframe
                src={youTubeEmbedUrl(youTubeVideo) as string}
                title={youTubeVideo.title}
                width="100%"
                height="100%"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ border: 0 }}
              />
            </div>
          ) : (
            <div
              style={{
                width: "100%",
                aspectRatio: "16/9",
                background: "var(--bg-surface)",
                borderRadius: "var(--radius-card)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "var(--space-lg)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                لا يوجد فيديو متاح لهذا الدرس بعد.
              </p>
            </div>
          )}
        </>
      )}

      {/* Exam entry */}
      {exam && (
        <div className="card" style={{ marginBottom: "var(--space-lg)" }}>
          <h3 style={{ marginBottom: "var(--space-sm)" }}>
            الاختبار: {exam.title}
          </h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "var(--space-md)" }}>
            المدة: {exam.timerMinutes} دقيقة بتوقيت السيرفر.
          </p>
          <Link href={`/student/exams/${exam.id}`}>
            <button style={{ background: "#ef4444", color: "white" }}>
              دخول الاختبار
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
