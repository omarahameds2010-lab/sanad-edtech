import Link from "next/link";
import type { CSSProperties } from "react";

/* ------------------------------------------------------------------
   TeacherCard — editorial “book cover” card for the directory.
   Ink cover + emerald aurora + monogram ghost, glass/solid badges,
   paper body with name, tagline, focus, meta and the emerald CTA.
   ------------------------------------------------------------------ */

interface TeacherCardProps {
  slug: string;
  subject: string;
  teacherName: string;
  focusAreas: string;
  tagline?: string;
  /** Cover caption, e.g. «المرحلة الإعدادية». */
  stage?: string;
  /** Solid emerald chip on the cover, e.g. «التسجيل مفتوح». */
  openLabel: string;
  /** Small meta line under the focus areas, e.g. «٣ كورسات». */
  meta?: string;
  /** CTA label, e.g. «ادخل المنصة». */
  enter: string;
  arrow?: string;
}

export default function TeacherCard({
  slug,
  subject,
  teacherName,
  focusAreas,
  tagline,
  stage,
  openLabel,
  meta,
  enter,
  arrow = "←",
}: TeacherCardProps) {
  return (
    <article className="tp-card">
      <Link
        href={`/teachers/${slug}`}
        className="tp-card-hit"
        aria-label={`${enter}: ${teacherName}`}
      >
        <div className="tp-cover">
          <span className="tp-cover-aurora" aria-hidden />
          <span className="cover-grain" aria-hidden />
          <span className="tp-cover-ghost" aria-hidden>
            ع
          </span>
          <div className="tp-cover-badges">
            <span className="ed-badge ed-badge-glass">{subject}</span>
            <span className="ed-badge ed-badge-solid">{openLabel}</span>
          </div>
          <span className="tp-cover-shade" aria-hidden />
          {stage && <span className="tp-cover-caption">{stage}</span>}
        </div>

        <div className="tp-body">
          <h2 className="tp-name">{teacherName}</h2>
          {tagline && <p className="tp-tagline">{tagline}</p>}
          <p className="tp-focus">{focusAreas}</p>
          {meta && <p className="tp-meta">{meta}</p>}
          <span
            className="tp-enter"
            style={
              {
                "--tp-arrow-x": arrow === "→" ? "4px" : "-4px",
              } as CSSProperties
            }
          >
            {enter}
            <span className="tp-arrow" aria-hidden>
              {arrow}
            </span>
          </span>
        </div>
      </Link>
    </article>
  );
}
