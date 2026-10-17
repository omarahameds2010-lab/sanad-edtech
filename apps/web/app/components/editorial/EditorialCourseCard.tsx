import Link from "next/link";
import type { CSSProperties } from "react";

/* ------------------------------------------------------------------
   EditorialCourseCard — the “book cover” course card.
   Cover 16:9 · badges over the cover · overlay shade + caption ·
   title / description / thin-icon meta / optional tags & note ·
   footer: price + solid emerald CTA, or progress + soft CTA when the
   student is enrolled. Whole card is one link.
   ------------------------------------------------------------------ */

export interface EditorialBadge {
  label: string;
  kind?: "glass" | "solid";
}

export interface EditorialMeta {
  icon: "clock" | "lesson" | "exam" | "video";
  text: string;
}

export interface EditorialCourseCardProps {
  href: string;
  /** Big book-cover numeral («١»…) */
  numeral: string;
  badges?: EditorialBadge[];
  caption?: string | null;
  title: string;
  desc?: string | null;
  meta?: EditorialMeta[];
  tags?: string[];
  accentNote?: string | null;
  /** Formatted price, or the “free” label. Hidden while null. */
  price?: string | null;
  priceFree?: boolean;
  cta: string;
  /** «←» (ar) / «→» (en) — the arrow drifts in reading direction on hover. */
  arrow?: string;
  enrolled?: { pct: number; label: string } | null;
  /** Digit shaping for percentages. */
  lang?: "ar" | "en";
  className?: string;
  style?: CSSProperties;
}

function MetaIcon({ name }: { name: EditorialMeta["icon"] }) {
  switch (name) {
    case "clock":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </svg>
      );
    case "video":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
          <path d="M10.2 9.4l4.2 2.6-4.2 2.6z" />
        </svg>
      );
    case "exam":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 3.5h8.5L19 7v13.5H7z" />
          <path d="M15.2 3.8V7.4H18.8" />
          <path d="M9.6 12.2h5.6M9.6 15.6h3.6" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 6.4C10.6 5.3 8.5 5 6.6 5.6c-.8.2-1.2.7-1.2 1.5v9.6c0 1.1.9 1.9 2 1.7 1.6-.4 3.4-.2 4.6.7" />
          <path d="M12 6.4c1.4-1.1 3.5-1.4 5.4-.8.8.2 1.2.7 1.2 1.5v9.6c0 1.1-.9 1.9-2 1.7-1.6-.4-3.4-.2-4.6.7" />
          <path d="M12 6.4v12.2" />
        </svg>
      );
  }
}

export function EditorialCourseCard({
  href,
  numeral,
  badges = [],
  caption,
  title,
  desc,
  meta,
  tags,
  accentNote,
  price,
  priceFree,
  cta,
  arrow = "←",
  enrolled,
  lang = "ar",
  className,
  style,
}: EditorialCourseCardProps) {
  const pct = enrolled
    ? Math.max(2, Math.min(100, Math.round(enrolled.pct)))
    : 0;
  const pctText = pct.toLocaleString(lang === "ar" ? "ar-EG" : "en");

  return (
    <Link
      href={href}
      className={`ed-card${className ? ` ${className}` : ""}`}
      aria-label={title}
      style={
        {
          "--ed-arrow-x": arrow === "→" ? "4px" : "-4px",
          ...style,
        } as CSSProperties
      }
    >
      <div className="ed-cover">
        <span className="ed-cover-aurora" aria-hidden />
        <span className="cover-grain" aria-hidden />
        <span className="ed-cover-numeral" aria-hidden>
          {numeral}
        </span>
        {badges.length > 0 && (
          <span className="ed-cover-badges">
            {badges.map((b) => (
              <span
                key={b.label}
                className={`ed-badge ${b.kind === "solid" ? "ed-badge-solid" : "ed-badge-glass"}`}
              >
                {b.label}
              </span>
            ))}
          </span>
        )}
        <span className="ed-cover-shade" aria-hidden />
        {caption && <span className="ed-cover-caption">{caption}</span>}
      </div>

      <div className="ed-body">
        <h3 className="ed-title">{title}</h3>
        {desc && <p className="ed-desc">{desc}</p>}
        {meta && meta.length > 0 && (
          <span className="ed-meta">
            {meta.map((m) => (
              <span key={m.text} className="ed-meta-item">
                <MetaIcon name={m.icon} />
                <span>{m.text}</span>
              </span>
            ))}
          </span>
        )}
        {tags && tags.length > 0 && (
          <span className="ed-tags">
            {tags.map((tag) => (
              <span key={tag} className="ed-tag">
                {tag}
              </span>
            ))}
          </span>
        )}
        {accentNote && <span className="ed-note">{accentNote}</span>}

        <span className="ed-foot">
          {enrolled ? (
            <>
              <span className="ed-progress">
                <span className="ed-progress-track">
                  <span
                    className="ed-progress-fill"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="ed-progress-num">
                  {pctText}
                  {lang === "ar" ? "٪" : "%"}
                </span>
              </span>
              <span className="ed-btn ed-btn-soft">
                {enrolled.label}
                <span className="ed-arrow" aria-hidden>
                  {arrow}
                </span>
              </span>
            </>
          ) : (
            <>
              {price && (
                <span
                  className={priceFree ? "ed-price ed-price-free" : "ed-price"}
                >
                  {price}
                </span>
              )}
              <span className="ed-btn ed-btn-solid">
                {cta}
                <span className="ed-arrow" aria-hidden>
                  {arrow}
                </span>
              </span>
            </>
          )}
        </span>
      </div>
    </Link>
  );
}

/** Loading twin — the skeleton state of the matrix. */
export function EditorialCourseCardSkeleton() {
  return (
    <article className="ed-card ed-skeleton" aria-hidden>
      <div className="ed-cover ed-sk-cover" />
      <div className="ed-body">
        <span className="ed-sk-line" style={{ width: "72%", height: 18 }} />
        <span className="ed-sk-line" style={{ width: "92%" }} />
        <span className="ed-sk-line" style={{ width: "58%" }} />
        <span
          className="ed-sk-line"
          style={{ width: 132, height: 38, marginTop: 16, borderRadius: 999 }}
        />
      </div>
    </article>
  );
}
