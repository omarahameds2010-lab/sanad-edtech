"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCommandPalette } from "@/app/hooks/useCommandPalette";
import StudentOrb from "./StudentOrb";

type DockIconName =
  "grid" | "book" | "clipboard" | "file" | "search" | "target";

const items: Array<{
  href: string;
  label: string;
  exact: boolean;
  icon: DockIconName;
}> = [
  { href: "/student", label: "لوحتي", exact: true, icon: "grid" },
  { href: "/student/courses", label: "كورساتي", exact: false, icon: "book" },
  {
    href: "/student/assignments",
    label: "واجباتي",
    exact: false,
    icon: "clipboard",
  },
  { href: "/student/exams", label: "اختباراتي", exact: false, icon: "file" },
];

function DockIcon({ name }: { name: DockIconName }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "grid":
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
          <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
        </svg>
      );
    case "clipboard":
      return (
        <svg {...common}>
          <rect x="5" y="4.5" width="14" height="16" rx="2.5" />
          <path d="M9 4.5V3.8A1.3 1.3 0 0 1 10.3 2.5h3.4A1.3 1.3 0 0 1 15 3.8v.7" />
          <path d="M9 10.5h6M9 14.5h4" />
        </svg>
      );
    case "file":
      return (
        <svg {...common}>
          <path d="M14 3H7.5A2.5 2.5 0 0 0 5 5.5v13A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V8z" />
          <path d="M14 3v5h5" />
          <path d="m9.5 14.5 2 2 3.5-4" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m20 20-3.8-3.8" />
        </svg>
      );
    case "target":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="4.5" />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return null;
  }
}

export default function StudentDock() {
  const pathname = usePathname();
  const { open: openPalette } = useCommandPalette();
  const [compact, setCompact] = useState(false);
  const [thumb, setThumb] = useState({ left: 0, width: 0, ready: false });
  const [focus, setFocus] = useState(false);
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);

  const dark = pathname === "/student";
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

  // Leaving the dashboard ends focus mode; the dimming only exists there.
  useEffect(() => {
    setFocus(false);
  }, [pathname]);

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
  }, [activeIndex, pathname, compact]);

  function toggleFocus() {
    const next = !focus;
    setFocus(next);
    window.dispatchEvent(new CustomEvent("sanad:focus", { detail: next }));
  }

  return (
    <div
      className="sd-wrap"
      style={{
        position: "sticky",
        top: compact ? 12 : 20,
        zIndex: 40,
        paddingTop: 12,
        transition: "top 300ms ease",
      }}
    >
      <StudentOrb />
      <nav
        aria-label="تنقل الطالب"
        className={`sd-nav${compact ? " is-compact" : ""}`}
        data-theme={dark ? "dark" : "light"}
      >
        <span
          aria-hidden="true"
          className="sd-thumb"
          style={{
            left: thumb.ready ? thumb.left : 6,
            width: thumb.ready ? thumb.width : 0,
            opacity: thumb.ready ? 1 : 0,
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
              className={`sd-item${selected ? " is-active" : ""}`}
              title={it.label}
            >
              <DockIcon name={it.icon} />
              <span>{it.label}</span>
            </Link>
          );
        })}
        <span aria-hidden="true" className="sd-sep" />
        <button
          type="button"
          className="sd-action"
          onClick={openPalette}
          aria-label="بحث سريع (Ctrl+K)"
          title="بحث سريع — Ctrl+K"
        >
          <DockIcon name="search" />
          <kbd>⌘K</kbd>
        </button>
        {dark && (
          <button
            type="button"
            className={`sd-action${focus ? " is-on" : ""}`}
            onClick={toggleFocus}
            aria-pressed={focus}
            aria-label={focus ? "إلغاء وضع التركيز" : "وضع التركيز"}
            title="وضع التركيز"
          >
            <DockIcon name="target" />
          </button>
        )}
      </nav>
    </div>
  );
}
