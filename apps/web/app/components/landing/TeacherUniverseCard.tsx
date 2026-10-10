"use client";

import Link from "next/link";
import { useRef, type CSSProperties } from "react";

interface UniverseTeacher {
  slug: string;
  subject: string;
  name: string;
  focus: string;
  tagline: string;
  motif: "orbit" | "grid" | "ink";
  accent: string;
  accentSoft: string;
}

const glow: Record<string, string> = {
  orbit: "#22D3EE",
  grid: "#818CF8",
  ink: "#34D399",
};

const avatarLetter: Record<string, string> = {
  orbit: "λ",
  grid: "π",
  ink: "ع",
};

export default function TeacherUniverseCard({
  teacher,
  enterLabel,
  backLabel,
}: {
  teacher: UniverseTeacher;
  enterLabel: string;
  backLabel: string;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);
  const accent = glow[teacher.motif] ?? teacher.accent;

  function onMove(e: React.MouseEvent) {
    const el = cardRef.current;
    const sheen = sheenRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 5).toFixed(2)}deg)`;
    el.style.boxShadow = `0 24px 60px -12px ${accent}33, 0 8px 24px rgba(0, 0, 0, 0.4)`;
    if (sheen) {
      const sx = ((e.clientX - r.left) / r.width) * 100;
      const sy = ((e.clientY - r.top) / r.height) * 100;
      sheen.style.background = `radial-gradient(circle at ${sx.toFixed(1)}% ${sy.toFixed(1)}%, rgba(255,255,255,0.16) 0%, transparent 55%)`;
      sheen.style.opacity = "1";
    }
  }

  function onLeave() {
    const el = cardRef.current;
    const sheen = sheenRef.current;
    if (el) {
      el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
      el.style.boxShadow = `0 12px 40px -12px ${accent}22, 0 8px 24px rgba(0, 0, 0, 0.4)`;
    }
    if (sheen) sheen.style.opacity = "0";
  }

  const tags = teacher.focus.split(/[·•]/).map((tt) => tt.trim()).filter(Boolean);

  return (
    <article
      ref={cardRef}
      aria-label={teacher.name}
      className="lp-glass"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={
        {
          position: "relative",
          overflow: "hidden",
          padding: "clamp(24px, 4vw, 40px)",
          width: "100%",
          maxWidth: 920,
          margin: "0 auto",
          transition: "transform 200ms ease-out, box-shadow 300ms ease",
          boxShadow: `0 12px 40px -12px ${accent}22, 0 8px 24px rgba(0, 0, 0, 0.4)`,
        } as CSSProperties
      }
    >
      <div
        ref={sheenRef}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0,
          transition: "opacity 300ms ease",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
        <div
          aria-hidden
          style={{
            width: 96,
            height: 96,
            borderRadius: 24,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
            fontWeight: 800,
            color: accent,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {avatarLetter[teacher.motif] ?? teacher.name[0]}
        </div>
        <div style={{ flex: "1 1 220px" }}>
          <span
            style={{
              display: "inline-block",
              borderRadius: 999,
              padding: "4px 14px",
              fontSize: 13,
              fontWeight: 700,
              color: "#0B0D10",
              background: accent,
            }}
          >
            {teacher.subject}
          </span>
          <h3 className="lp-text-gradient" style={{ margin: "12px 0 12px", fontSize: 30, fontWeight: 700, lineHeight: 1.6 }}>
            {teacher.name}
          </h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
            {tags.map((tag) => (
              <span
                key={tag}
                className="lp-tag"
                style={{ "--tag-accent": accent, "--tag-accent-soft": `${accent}33` } as CSSProperties}
              >
                {tag}
              </span>
            ))}
          </div>
          <p style={{ color: "#A7ADBA", lineHeight: 1.9, margin: "12px 0 0", maxWidth: 560 }}>
            {teacher.tagline}
          </p>
          <Link
            href={`/teachers/${teacher.slug}`}
            className="lp-cta"
            style={{ marginTop: 20, color: accent }}
          >
            {enterLabel}
            <span className="lp-arrow" aria-hidden>{backLabel}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
