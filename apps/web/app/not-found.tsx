import Link from "next/link";

import "./system-pages.css";

export default function NotFound() {
  return (
    <main className="system-shell">
      <section className="system-card" aria-labelledby="not-found-title">
        <p className="system-eyebrow">404 — الصفحة غير موجودة</p>
        <h1 id="not-found-title" className="system-title">
          يبدو أنك خرجت عن المسار.
        </h1>
        <p className="system-text">
          الرابط الذي تحاول الوصول إليه غير موجود أو تم نقله. يمكنك العودة إلى
          الصفحة الرئيسية أو استكشاف الكورسات المتاحة.
        </p>
        <div className="system-actions">
          <Link className="system-primary" href="/">
            العودة للرئيسية
          </Link>
          <Link className="system-secondary" href="/courses">
            استكشاف الكورسات
          </Link>
        </div>
      </section>
    </main>
  );
}
