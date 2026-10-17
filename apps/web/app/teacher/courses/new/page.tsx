"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth";
import { api, ApiError } from "@/app/lib/api";
import { PREP_GRADES, isPrepGrade } from "@/app/lib/teacher-content";

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
  const [grade, setGrade] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Prefill the grade when the teacher arrives from a grade page.
  useEffect(() => {
    const g = new URLSearchParams(window.location.search).get("grade");
    if (g && isPrepGrade(g)) setGrade(g);
  }, []);

  if (!token) {
    return (
      <div className="pub-note">
        سجّل الدخول أولًا. <Link href="/login">تسجيل الدخول</Link>
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
        grade: grade === "" ? undefined : grade,
      });
      router.push(`/teacher/courses/${course.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر إنشاء الكورس");
    } finally {
      setPending(false);
    }
  }

  return (
    <section>
      <Link href="/teacher/publish" className="pub-back">
        → مساحة النشر
      </Link>

      <header className="pub-head">
        <p className="pub-eyebrow">كورس جديد</p>
        <h1 className="pub-title">أنشئ كورس جديد</h1>
        <p className="pub-sub">
          اختار الصف، وبعد الإنشاء هتفتح مساحة الكورس مباشرة علشان ترفع الوحدات
          والدروس والامتحانات والواجبات.
        </p>
      </header>

      <article className="tc-panel" style={{ maxWidth: 680 }}>
        <form className="pub-form" onSubmit={handleSubmit}>
          <div>
            <span className="pub-label">عنوان الكورس *</span>
            <input
              className="sc-input"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugifyLatin(e.target.value));
              }}
              required
              placeholder="مثال: اللغة العربية — الأول الإعدادي"
            />
          </div>

          <div>
            <span className="pub-label">
              المعرّف (slug) — حروف إنجليزية وأرقام وشرطات *
            </span>
            <input
              className="sc-input"
              type="text"
              dir="ltr"
              value={slugTouched ? slug : slugifyLatin(title)}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              required
            />
          </div>

          <div>
            <span className="pub-label">وصف مختصر</span>
            <input
              className="sc-input"
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="سطر واحد يوضح للطالب محتوى الكورس"
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-3)",
            }}
          >
            <div>
              <span className="pub-label">الصف الدراسي</span>
              <select
                className="sc-input"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
              >
                <option value="">بدون صف</option>
                {PREP_GRADES.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="pub-label">السعر (جنيه)</span>
              <input
                className="sc-input"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <span className="pub-label">الظهور</span>
            <select
              className="sc-input"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
            >
              <option value="PUBLIC">عام</option>
              <option value="PRIVATE">خاص</option>
              <option value="UNLISTED">غير مدرج</option>
            </select>
          </div>

          {error && (
            <p className="pub-error" style={{ marginTop: 0 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="pub-btn pub-btn-primary"
            disabled={pending}
            style={{ justifySelf: "start" }}
          >
            {pending ? "جاري الإنشاء…" : "إنشاء الكورس"}
          </button>
        </form>
      </article>
    </section>
  );
}
