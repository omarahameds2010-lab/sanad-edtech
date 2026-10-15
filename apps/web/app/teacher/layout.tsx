"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import TeacherCommandRegistrar from "./TeacherCommandRegistrar";

const navItems = [
  { href: "/teacher", label: "نظرة عامة" },
  { href: "/teacher/courses", label: "الكورسات" },
  { href: "/teacher/students", label: "الطلاب" },
  { href: "/teacher/assignments", label: "الواجبات" },
  { href: "/teacher/exams", label: "الاختبارات" },
  { href: "/teacher/payments", label: "المدفوعات" },
  { href: "/teacher/analytics", label: "التحليلات" },
  { href: "/teacher/settings", label: "الإعدادات" },
];

/**
 * The white-label nav capsule.
 *
 * Replaces the traditional sidebar entirely. It is a single floating capsule
 * anchored top-centre: full labels while the teacher is at the top of a page,
 * collapsing to a compact dot-disc once they scroll down to read a table, and
 * expanding again the moment they scroll up.
 *
 * The active indicator glides between sections via `left`/`width` transitions
 * on a measured pill — the "liquid mercury" feel — rather than jumping.
 */
export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [morphed, setMorphed] = useState(false);
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  // Scroll-morph: collapse once the teacher heads into content, expand on the
  // faintest upward intent.
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > 90 && !morphed) setMorphed(true);
      else if (y < 40 && morphed) setMorphed(false);
      else if (y < last - 4 && morphed && y > 40) setMorphed(false);
      last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [morphed]);

  // Measure the active link so the pill can glide to it.
  useEffect(() => {
    const el = linkRefs.current[pathname];
    if (!el) return;
    setPill({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
  }, [pathname, morphed]);

  return (
    <div className="tc-canvas">
      <TeacherCommandRegistrar />

      <nav
        aria-label="تنقل المعلم"
        data-morphed={morphed ? "true" : undefined}
        style={{
          position: "fixed",
          top: 16,
          insetInline: 0,
          margin: "0 auto",
          zIndex: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "max-content",
          maxWidth: "calc(100vw - 24px)",
          padding: morphed ? "7px 9px" : "8px 10px",
          borderRadius: 999,
          background: "rgba(7, 7, 8, 0.55)",
          backdropFilter: "blur(20px) saturate(140%)",
          WebkitBackdropFilter: "blur(20px) saturate(140%)",
          border: "1px solid var(--tc-hairline)",
          boxShadow: "0 18px 44px -18px rgba(0,0,0,0.7)",
          transition:
            "padding 420ms cubic-bezier(.2,0,0,1), background 420ms ease",
        }}
      >
        {/* Sanad anchor: the emerald mark that carries identity when collapsed. */}
        <Link
          href="/teacher"
          aria-label="سند — لوحة المعلم"
          title="لوحة المعلم"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "6px 10px",
            borderRadius: 999,
            textDecoration: "none",
            color: "var(--tc-ink)",
            fontWeight: 800,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          سند
          <span className="tc-pulse" aria-hidden />
        </Link>

        {/* Links fade out and collapse to icons/anchors when scrolled. */}
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            position: "relative",
            opacity: morphed ? 0 : 1,
            pointerEvents: morphed ? "none" : undefined,
            transition: "opacity 300ms ease",
          }}
        >
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: 4,
              bottom: 4,
              left: pill.ready ? pill.left : 0,
              width: pill.ready ? pill.width : 0,
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
              opacity: pill.ready ? 1 : 0,
              transition:
                "left 460ms cubic-bezier(.2,0,0,1), width 460ms cubic-bezier(.2,0,0,1), opacity 260ms ease",
            }}
          />
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                ref={(el) => {
                  linkRefs.current[item.href] = el;
                }}
                aria-current={active ? "page" : undefined}
                style={{
                  position: "relative",
                  zIndex: 1,
                  padding: "7px 13px",
                  borderRadius: 999,
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? "var(--tc-ink)" : "var(--tc-ink-dim)",
                  whiteSpace: "nowrap",
                  transition: "color 300ms ease",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </span>

        {/* The launch point: a capsule, not a crammed bottom-of-sidebar block. */}
        <Link
          href="/teacher/courses/new"
          className="tc-grade-btn"
          style={{ padding: "8px 16px", flexShrink: 0 }}
        >
          <span className="tc-thread" aria-hidden />
          <span>كورس جديد</span>
        </Link>
      </nav>

      <main className="tc-inner">{children as any}</main>
    </div>
  );
}
