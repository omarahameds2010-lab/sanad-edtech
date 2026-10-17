"use client";

import { useState } from "react";
import Link from "next/link";
import VideoUploader from "@/app/components/upload/VideoUploader";
import ThumbnailUploader from "@/app/components/upload/ThumbnailUploader";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError } from "@/app/lib/api";

interface VideoLessonEditorProps {
  lessonId: string;
  initialData?: {
    title?: string;
    description?: string;
    videoId?: string;
    duration?: number;
    visibility?: string;
    allowDownload?: boolean;
  };
  onSave?: (data: any) => Promise<void>;
  saveStatus?: any;
  lastSavedAt?: Date | null;
  onSaveNow?: () => void;
}

export default function VideoLessonEditor({
  lessonId,
  initialData = {},
}: VideoLessonEditorProps) {
  const { token } = useAuth();
  const [form] = useState({
    title: initialData.title || "",
    description: initialData.description || "",
  });
  const [youtubeId, setYoutubeId] = useState("");
  const [youtubeTitle, setYoutubeTitle] = useState("");
  const [ytPhase, setYtPhase] = useState<"idle" | "saving" | "done" | "error">(
    "idle",
  );
  const [ytError, setYtError] = useState<string | null>(null);

  async function handleAttachYouTube() {
    if (!token) {
      setYtError("سجّل الدخول أولًا لربط الفيديو.");
      setYtPhase("error");
      return;
    }
    setYtError(null);
    setYtPhase("saving");
    try {
      await api.attachYouTube(token, {
        lessonId,
        title:
          youtubeTitle.trim() === ""
            ? form.title.trim() || "فيديو الدرس"
            : youtubeTitle.trim(),
        providerVideoId: youtubeId.trim(),
        description:
          form.description.trim() === "" ? undefined : form.description.trim(),
      });
      setYtPhase("done");
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setYtError("الدرس مرتبط بفيديو يوتيوب بالفعل — احذفه أولًا للاستبدال.");
      } else {
        setYtError(e instanceof ApiError ? e.message : "تعذر ربط الفيديو");
      }
      setYtPhase("error");
    }
  }

  return (
    <div style={{ display: "grid", gap: "var(--space-lg)" }}>
      <div className="card">
        <h3 style={{ marginBottom: "var(--space-md)" }}>
          فيديو يوتيوب (مسار سريع — بدون رفع)
        </h3>
        <p
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
            marginBottom: "var(--space-md)",
          }}
        >
          الصق معرّف فيديو UNLISTED من يوتيوب (الحروف بعد{" "}
          <span dir="ltr">v=</span>) ليظهر فورًا للطلاب في صفحة الدرس.
        </p>
        <label style={{ display: "block", marginBottom: "var(--space-md)" }}>
          <span
            style={{
              display: "block",
              marginBottom: 4,
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            عنوان الفيديو
          </span>
          <input
            value={youtubeTitle}
            onChange={(e) => setYoutubeTitle(e.target.value)}
            style={inputStyle}
            placeholder="مثال: شرح المتغيرات"
          />
        </label>
        <label style={{ display: "block", marginBottom: "var(--space-md)" }}>
          <span
            style={{
              display: "block",
              marginBottom: 4,
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            معرّف الفيديو (Video ID) *
          </span>
          <input
            value={youtubeId}
            onChange={(e) => setYoutubeId(e.target.value)}
            style={{ ...inputStyle, direction: "ltr", textAlign: "left" }}
            placeholder="dQw4w9WgXcQ"
            dir="ltr"
          />
        </label>
        {ytPhase === "error" && ytError && (
          <p role="alert" style={{ color: "#ef4444", fontSize: 13 }}>
            {ytError}
            {!token && (
              <>
                {" "}
                <Link href="/login">تسجيل الدخول</Link>
              </>
            )}
          </p>
        )}
        {ytPhase === "done" ? (
          <p style={{ fontWeight: 600, color: "#10b981" }}>
            تم ربط الفيديو — يظهر الآن في صفحة الدرس للطلاب ✅
          </p>
        ) : (
          <button
            type="button"
            onClick={() => void handleAttachYouTube()}
            disabled={ytPhase === "saving"}
            style={{ background: "#ef4444", color: "white", fontWeight: 700 }}
          >
            {ytPhase === "saving" ? "جاري الربط…" : "ربط فيديو يوتيوب"}
          </button>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: "var(--space-md)" }}>الفيديو</h3>
        {initialData.videoId ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: 500 }}>فيديو مرفوع</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                المدة:{" "}
                {initialData.duration
                  ? formatDuration(initialData.duration)
                  : "—"}
              </div>
            </div>
            <button
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              استبدال
            </button>
          </div>
        ) : (
          <VideoUploader lessonId={lessonId} />
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: "var(--space-md)" }}>صورة مصغرة</h3>
        <ThumbnailUploader lessonId={lessonId} />
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "var(--bg-surface)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-control)",
  color: "var(--text-primary)",
  fontFamily: "inherit",
  fontSize: 14,
};

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
