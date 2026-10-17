"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/lib/auth";

export default function StudentOrb() {
  const { userName, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const boxRef = useRef<HTMLDivElement>(null);

  const initial = (userName?.trim()?.[0] ?? "ط").toUpperCase();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function handleLogout() {
    logout();
    setOpen(false);
    router.push("/login");
  }

  function onMove(e: React.MouseEvent) {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    setTilt({
      x: ((e.clientX - r.left) / r.width - 0.5) * 6,
      y: ((e.clientY - r.top) / r.height - 0.5) * 6,
    });
  }

  const menuItems = [
    {
      key: "profile",
      label: "الملف الشخصي",
      href: "/student/profile",
      danger: false,
    },
  ];

  return (
    <div ref={boxRef} style={{ position: "relative", flexShrink: 0 }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -14,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(4,120,87,0.22) 0%, transparent 65%)",
          opacity: hover ? 1 : 0,
          transition: "opacity 400ms ease",
          pointerEvents: "none",
        }}
      />
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => {
          setHover(false);
          setTilt({ x: 0, y: 0 });
        }}
        onMouseMove={onMove}
        aria-expanded={open}
        aria-label={userName ?? "حسابي"}
        title={userName ?? "حسابي"}
        style={{
          position: "relative",
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "1px solid var(--paper-200)",
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: 17,
          color: "var(--ink-950)",
          boxShadow: hover
            ? "0 0 0 4px var(--color-action-soft), 0 12px 28px -8px rgba(11, 13, 16, 0.3)"
            : "0 8px 20px -8px rgba(11, 13, 16, 0.25)",
          transform: `scale(${hover ? 1.06 : 1})`,
          transition: "transform 250ms ease, box-shadow 300ms ease",
        }}
      >
        <svg
          aria-hidden
          viewBox="0 0 48 48"
          style={{
            position: "absolute",
            inset: -5,
            width: 54,
            height: 54,
            pointerEvents: "none",
          }}
        >
          <circle
            cx="24"
            cy="24"
            r="22.5"
            fill="none"
            stroke="var(--color-action)"
            strokeWidth="1"
            opacity="0.45"
            strokeDasharray="32 110"
            strokeLinecap="round"
            className="lp-orbit-ring"
          />
        </svg>
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: -5,
            width: 54,
            height: 54,
            transformOrigin: "center",
            pointerEvents: "none",
            animation: hover ? "none" : "lp-orbit-spin 14s linear infinite",
            transform: hover ? "rotate(0deg)" : undefined,
          }}
        >
          <span
            aria-hidden
            title="متصل"
            style={{
              display: "block",
              position: "absolute",
              top: -4,
              left: "50%",
              marginLeft: -4.5,
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: "var(--color-action)",
              boxShadow: "0 0 10px 2px rgba(4,120,87,0.5)",
              border: "2px solid #ffffff",
              animation: "lp-dot-pulse 2.6s ease-in-out infinite",
            }}
          />
        </span>
        <span
          aria-hidden
          style={{
            display: "inline-block",
            transform: `translate(${tilt.x.toFixed(1)}px, ${tilt.y.toFixed(1)}px)`,
            transition: "transform 120ms ease-out",
          }}
        >
          {initial}
        </span>
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: 52,
            insetInlineEnd: 0,
            width: 230,
            background: "rgba(255, 255, 255, 0.82)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--paper-200)",
            borderRadius: 18,
            boxShadow: "0 24px 48px -16px rgba(11, 13, 16, 0.3)",
            padding: 8,
            zIndex: 50,
          }}
        >
          <p
            className="lp-orb-item"
            style={{
              margin: 0,
              padding: "10px 12px 12px",
              borderBottom: "1px solid var(--paper-200)",
              fontWeight: 800,
              color: "var(--ink-950)",
              animationDelay: "0ms",
            }}
          >
            {userName ?? "حسابي"}
          </p>
          {menuItems.map((item, i) => (
            <Link
              key={item.key}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="lp-orb-item"
              style={{
                display: "block",
                padding: "10px 12px",
                borderRadius: 10,
                color: "var(--ink-700)",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
                animationDelay: `${80 + i * 70}ms`,
              }}
            >
              {item.label}
            </Link>
          ))}
          <button
            role="menuitem"
            onClick={handleLogout}
            className="lp-orb-item"
            style={{
              width: "100%",
              textAlign: "start",
              padding: "10px 12px",
              borderRadius: 10,
              border: "none",
              background: "none",
              color: "#991b1b",
              opacity: 0.75,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              animationDelay: `${80 + menuItems.length * 70}ms`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.background = "rgba(220, 38, 38, 0.07)";
              e.currentTarget.style.boxShadow =
                "0 0 14px rgba(220, 38, 38, 0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.75";
              e.currentTarget.style.background = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            تسجيل الخروج
          </button>
        </div>
      )}
    </div>
  );
}
