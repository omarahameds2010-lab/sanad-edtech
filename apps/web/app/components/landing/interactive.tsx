"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** Fade-up reveal on scroll. SSR-safe: visible until mounted. */
export function Reveal({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(20px)",
        transition: `opacity 600ms ease ${delay}ms, transform 600ms ease ${delay}ms`,
      }}
    >
      {children as any}
    </div>
  );
}

/** Magnetic wrapper: drifts toward the cursor, springs back on leave.
 *  `maxPx` optionally clamps the drift (used for the subtle 2px pull). */
export function Magnetic({
  children,
  maxPx,
}: {
  children: any;
  maxPx?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el || reduced) return;
    const r = el.getBoundingClientRect();
    let dx = (e.clientX - (r.left + r.width / 2)) * 0.08;
    let dy = (e.clientY - (r.top + r.height / 2)) * 0.12;
    if (maxPx !== undefined) {
      dx = Math.max(-maxPx, Math.min(maxPx, dx));
      dy = Math.max(-maxPx, Math.min(maxPx, dy));
    }
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  function onLeave() {
    const el = ref.current;
    if (el) el.style.transform = "translate(0, 0)";
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        display: "inline-block",
        transition: "transform 180ms ease-out",
      }}
    >
      {children as any}
    </div>
  );
}

/** Subtle 3D tilt on hover for cards. */
export function Tilt({ children }: { children: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el || reduced) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(800px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 5).toFixed(2)}deg)`;
  }

  function onLeave() {
    const el = ref.current;
    if (el)
      el.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ transition: "transform 200ms ease-out", height: "100%" }}
    >
      {children as any}
    </div>
  );
}

/** Article card that feeds --mx/--my so a pointer-following glow can sit
 *  on its border (pure CSS consumes the variables). */
export function GlowCard({
  className,
  children,
}: {
  className?: string;
  children: any;
}) {
  const ref = useRef<HTMLElement | null>(null);

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty(
      "--mx",
      `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`,
    );
    el.style.setProperty(
      "--my",
      `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`,
    );
  }

  return (
    <article ref={ref as any} className={className} onMouseMove={onMove}>
      {children as any}
    </article>
  );
}

/** Scroll-linked parallax drift for decorative backdrops. */
export function Parallax({
  className,
  speed = 0.12,
}: {
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    let raf = 0;
    const apply = () => {
      const y = window.scrollY || 0;
      el.style.transform = `translate3d(0, ${(y * -speed).toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduced, speed]);

  return <div ref={ref} className={className} aria-hidden />;
}
