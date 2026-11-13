"use client";

import Link from "next/link";
import { useEffect } from "react";

import "./system-pages.css";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="system-shell">
      <section className="system-card" aria-labelledby="error-title">
        <p className="system-eyebrow">حدث خطأ غير متوقع</p>
        <h1 id="error-title" className="system-title">
          لم نستطع إكمال هذه الصفحة.
        </h1>
        <p className="system-text">
          جرّب إعادة المحاولة. إذا تكرر الخطأ، ارجع إلى الصفحة الرئيسية أو أبلغ
          فريق المنصة.
        </p>
        {error.digest ? (
          <p className="system-code">رقم المرجع: {error.digest}</p>
        ) : null}
        <div className="system-actions">
          <button type="button" className="system-primary" onClick={reset}>
            إعادة المحاولة
          </button>
          <Link className="system-secondary" href="/">
            العودة للرئيسية
          </Link>
        </div>
      </section>
    </main>
  );
}
