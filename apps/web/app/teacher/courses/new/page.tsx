"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError } from "@/app/lib/api";

function slugifyLatin(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 100) || `course-${Date.now().toString(36)}`
  );
}

export default function NewCoursePage() {
  const { token } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [shortDescription, setShortDescription] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!token) {
    return (
      <div className="card">
        <p>
          سجّل الدخول أولًا. <Link href="/login">تسجيل الدخول</Link>
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const finalSlug = (slugTouched ? slug : slugifyLatin(title)).trim();
    if (title.trim() === "" || finalSlug === "") {
      setError("العنوان والمعرّف مطلوبان");
      return;
    }
    const priceNumber = price.trim() === "" ? undefined : Number(price);
    if (
      priceNumber !== undefined &&
      (!Number.isFinite(priceNumber) || priceNumber < 0)
    ) {
      setError("السعر يجب أن يكون رقمًا موجبًا");
      return;
    }
    setPending(true);
    try {
      const course = await api.createCourse(token as string, {
        title: title.trim(),
        slug: finalSlug,
        shortDescription:
          shortDescription.trim() === "" ? undefined : shortDescription.trim(),
        visibility,
        language: "ar",
        price: priceNumber,
        currency: "EGP",
      });
      router.push(`/teacher/courses/${course.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر إنشاء الكورس");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <nav
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          marginBottom: "var(--space-sm)",
        }}
      >
        <Link href="/teacher/courses">الكورسات</Link> › كورس جديد
      </nav>
      <h1 style={{ marginBottom: "var(--space-lg)" }}>كورس جديد</h1>

      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", marginBottom: "var(--space-md)" }}>
          <span style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
            عنوان الكورس *
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(slugifyLatin(e.target.value));
            }}
            required
            style={{ width: "100%" }}
          />
        </label>

        <label style={{ display: "block", marginBottom: "var(--space-md)" }}>
          <span style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
            المعرّف (slug) — حروف إنجليزية وأرقام وشرطات *
          </span>
          <input
            type="text"
            dir="ltr"
            value={slugTouched ? slug : slugifyLatin(title)}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            required
            style={{ width: "100%" }}
          />
        </label>

        <label style={{ display: "block", marginBottom: "var(--space-md)" }}>
          <span style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
            وصف مختصر
          </span>
          <input
            type="text"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-md)",
            marginBottom: "var(--space-md)",
          }}
        >
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
              الظهور
            </span>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              style={{ width: "100%" }}
            >
              <option value="PUBLIC">عام</option>
              <option value="PRIVATE">خاص</option>
              <option value="UNLISTED">غير مدرج</option>
            </select>
          </label>

          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
              السعر (جنيه)
            </span>
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              style={{ width: "100%" }}
            />
          </label>
        </div>

        {error && (
          <p
            style={{
              color: "#ef4444",
              fontSize: 13,
              marginBottom: "var(--space-md)",
            }}
          >
            {error}
          </p>
        )}

        <button type="submit" disabled={pending} style={{ width: "100%" }}>
          {pending ? "جاري الإنشاء…" : "إنشاء الكورس"}
        </button>
      </form>
    </div>
  );
}
