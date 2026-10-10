"use client";

import Link from "next/link";
import { useState } from "react";
import { useLang } from "./i18n";

export default function JourneyMap() {
  const { t, lang } = useLang();
  const [active, setActive] = useState("course");
  const nodes = t.journey.nodes;
  const node = nodes.find((n) => n.id === active) ?? nodes[0];
  const activeIndex = nodes.findIndex((n) => n.id === active);

  return (
    <section aria-label="Learning map">
      <div className="lp-container" style={{ paddingBottom: 56 }}>
        <div
          style={{
            background: "var(--ink-950)",
            borderRadius: "var(--radius-xl)",
            padding: "32px 28px",
            color: "#F4F4F6",
          }}
        >
          <p className="lp-eyebrow" style={{ color: "#34D399" }}>
            {t.journey.eyebrow}
          </p>
          <div
            role="tablist"
            aria-label="Learning path stages"
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 8,
            }}
          >
            {nodes.map((n, i) => {
              const selected = n.id === active;
              const done = i < activeIndex;
              return (
                <button
                  key={n.id}
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActive(n.id)}
                  style={{
                    flex: "1 1 120px",
                    borderRadius: 12,
                    padding: "12px 8px",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 14,
                    border: selected
                      ? "2px solid #34D399"
                      : "1px solid rgba(255,255,255,0.15)",
                    background: selected
                      ? "rgba(52, 211, 153, 0.12)"
                      : done
                        ? "rgba(255,255,255,0.06)"
                        : "transparent",
                    color: selected || done ? "#F4F4F6" : "#A7ADBA",
                    transition: "all 200ms ease",
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: "#34D399",
                      marginBottom: 4,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {lang === "ar" ? ["١", "٢", "٣", "٤", "٥"][i] : i + 1}
                  </span>
                  {n.label}
                </button>
              );
            })}
          </div>
          <div
            role="tabpanel"
            key={node.id + lang}
            className="lp-tab-enter"
            style={{
              marginTop: 24,
              borderTop: "1px solid rgba(255,255,255,0.12)",
              paddingTop: 24,
              display: "grid",
              gap: 8,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 22, color: "#F4F4F6" }}>{node.title}</h3>
            <p style={{ margin: 0, color: "#A7ADBA", lineHeight: 1.9, maxWidth: 640 }}>
              {node.body}
            </p>
            <Link
              href={node.href}
              style={{ color: "#34D399", fontWeight: 700, marginTop: 8 }}
            >
              {node.cta} {lang === "ar" ? "←" : "→"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
