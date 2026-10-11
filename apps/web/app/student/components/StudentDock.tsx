"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import StudentOrb from "./StudentOrb";

const items = [
  { href: "/student", label: "لوحتي", exact: true },
  { href: "/student/courses", label: "كورساتي", exact: false },
  { href: "/student/assignments", label: "واجباتي", exact: false },
  { href: "/student/exams", label: "اختباراتي", exact: false },
];

export default function StudentDock() {
  const pathname = usePathname();
  const [compact, setCompact] = useState(false);
  const [thumb, setThumb] = useState({ left: 0, width: 0, ready: false });
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);

  const activeIndex = Math.max(
    0,
    items.findIndex((it) =>
      it.exact
        ? pathname === it.href
        : pathname === it.href || pathname.startsWith(it.href + "/"),
    ),
  );

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 140);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function measure() {
      const el = refs.current[activeIndex];
      if (el) {
        setThumb({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeIndex, pathname]);

  return (
    <div
      style={{
        position: "sticky",
        top: compact ? 12 : 20,
        zIndex: 40,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
        paddingTop: 12,
        transition: "top 300ms ease",
      }}
    >
      <StudentOrb />
      <nav
        aria-label="تنقل الطالب"
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: compact ? 2 : 4,
          background: "rgba(255, 255, 255, 0.72)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid var(--paper-200)",
          borderRadius: 999,
          padding: compact ? "6px" : "6px 10px",
          boxShadow: "0 12px 32px -12px rgba(11, 13, 16, 0.18)",
          transition: "padding 300ms ease, gap 300ms ease",
          maxWidth: "calc(100vw - 32px)",
          overflowX: "auto",
        }}
      >
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 6,
            bottom: 6,
            left: thumb.ready ? thumb.left : 6,
            width: thumb.ready ? thumb.width : 0,
            borderRadius: 999,
            background: "var(--ink-950)",
            opacity: thumb.ready ? 1 : 0,
            transition:
              "left 320ms cubic-bezier(.2,0,0,1), width 320ms cubic-bezier(.2,0,0,1), opacity 200ms ease",
          }}
        />
        {items.map((it, i) => {
          const selected = i === activeIndex;
          return (
            <Link
              key={it.href}
              ref={(el) => {
                refs.current[i] = el;
              }}
              href={it.href}
              aria-current={selected ? "page" : undefined}
              style={{
                position: "relative",
                zIndex: 1,
                padding: compact ? "7px 12px" : "8px 16px",
                borderRadius: 999,
                fontSize: compact ? 12 : 14,
                fontWeight: 700,
                color: selected ? "#ffffff" : "var(--ink-700)",
                textDecoration: "none",
                whiteSpace: "nowrap",
                transition:
                  "color 200ms ease, padding 300ms ease, font-size 300ms ease",
              }}
              title={it.label}
            >
              {it.label}
            </Link>
          );
        })}
        <span
          aria-hidden
          title="سند"
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "var(--color-action)",
            marginInlineStart: 4,
            flexShrink: 0,
            animation: "lp-dot-pulse 2.6s ease-in-out infinite",
          }}
        />
      </nav>
    </div>
  );
}
