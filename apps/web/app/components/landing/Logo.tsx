"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLang } from "./i18n";

const AR_WORD = "سند";
const EN_WORD = "SANAD";

export default function Logo() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const word = isAr ? AR_WORD : EN_WORD;

  const wrapRef = useRef<HTMLAnchorElement>(null);
  const [burstKey, setBurstKey] = useState(0);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(t);
  }, []);

  function magnet(e: React.MouseEvent) {
    const el = wrapRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${(dx * 0.06).toFixed(1)}px, ${(dy * 0.08).toFixed(1)}px)`;
  }

  function reset() {
    const el = wrapRef.current;
    if (el) el.style.transform = "translate(0, 0)";
  }

  function burst(e: React.MouseEvent) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const host = el.querySelector<HTMLElement>("[data-particles]");
    if (!host) return;
    const cx = e.clientX - r.left;
    const cy = e.clientY - r.top;
    for (let i = 0; i < 10; i++) {
      const p = document.createElement("span");
      const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 26 + Math.random() * 26;
      p.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:5px;height:5px;border-radius:50%;background:#34D399;pointer-events:none;`;
      host.appendChild(p);
      p.animate(
        [
          { transform: "translate(0,0) scale(1)", opacity: 1 },
          {
            transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(0)`,
            opacity: 0,
          },
        ],
        { duration: 550 + Math.random() * 300, easing: "cubic-bezier(.2,0,0,1)" },
      ).onfinish = () => p.remove();
    }
    setBurstKey((k) => k + 1);
  }

  return (
    <Link
      ref={wrapRef}
      href="/"
      aria-label={isAr ? "سند — الصفحة الرئيسية" : "Sanad — home"}
      onMouseMove={magnet}
      onMouseLeave={reset}
      onMouseEnter={burst}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "baseline",
        textDecoration: "none",
        transition: "transform 180ms ease-out",
        overflow: "visible",
      }}
    >
      <span
        key={word}
        aria-hidden={false}
        style={{ display: "inline-flex", direction: isAr ? "rtl" : "ltr" }}
      >
        {word.split("").map((ch, i) => (
          <span
            key={`${word}-${i}-${burstKey}`}
            className={entered ? "lp-logo-letter" : undefined}
            style={
              {
                display: "inline-block",
                fontWeight: 800,
                fontSize: 22,
                color: "var(--ink-950)",
                fontFamily: isAr
                  ? "'IBM Plex Sans Arabic', 'Noto Sans Arabic', system-ui, sans-serif"
                  : "'Inter', system-ui, sans-serif",
                letterSpacing: isAr ? 0 : "0.02em",
                opacity: entered ? undefined : 0,
                ["--lp-letter-delay" as string]: `${i * 90}ms`,
              } as React.CSSProperties
            }
          >
            {ch}
          </span>
        ))}
        <span
          aria-hidden
          className="lp-logo-dot"
          style={{
            display: "inline-block",
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#047857",
            marginInlineStart: 3,
            alignSelf: "flex-end",
            marginBottom: 4,
          }}
        />
      </span>
      <span
        aria-hidden
        className={entered ? "lp-logo-underline" : undefined}
        style={{
          position: "absolute",
          bottom: -3,
          insetInlineStart: 0,
          height: 2,
          width: entered ? "100%" : "0%",
          background: "linear-gradient(90deg, var(--color-action), transparent)",
          borderRadius: 2,
          transition: "width 900ms cubic-bezier(.2,0,0,1) 500ms",
        }}
      />
      <span data-particles aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
    </Link>
  );
}
