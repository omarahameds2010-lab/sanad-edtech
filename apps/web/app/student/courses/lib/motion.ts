"use client";

import { useEffect, useRef, useState } from "react";

/** True when the OS asks for reduced motion. Kept live so toggling works. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return reduced;
}

/** easeOutQuint — a smooth cubic-style ease-out, never overshooting. */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

/**
 * A number that counts up to `target` over exactly `durationMs`.
 *
 * Honours `prefers-reduced-motion` by snapping straight to the target: the
 * motion is decoration, so a student who asked for stillness gets stillness and
 * still sees the true value.
 */
export function useTickingMetric(target: number, durationMs = 1200): number {
  const [value, setValue] = useState(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) {
      setValue(target);
      return;
    }

    let frame = 0;
    const start = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / durationMs));
      setValue(target * easeOut(t));
      if (t < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, reduced]);

  return value;
}

export interface ParallaxState {
  /** Rotation on X, degrees (card bottom toward the pointer). */
  rx: number;
  /** Rotation on Y, degrees. */
  ry: number;
  /** Pointer position as a percentage, for the gleam mask. */
  mx: number;
  my: number;
  active: boolean;
}

const IDLE: ParallaxState = { rx: 0, ry: 0, mx: 50, my: 50, active: false };

/**
 * 3D parallax pointer tracking for a card.
 *
 * Returns a ref to attach and the current state. Rotations stay within
 * `maxDeg`, and everything goes flat when reduced motion is requested — the
 * card still works, it just stops moving.
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>(
  maxDeg = 10,
) {
  const ref = useRef<T | null>(null);
  const reduced = usePrefersReducedMotion();
  const [state, setState] = useState<ParallaxState>(IDLE);

  useEffect(() => {
    if (reduced) {
      setState(IDLE);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;

      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;

      setState({
        rx: (0.5 - py) * maxDeg,
        ry: (px - 0.5) * maxDeg,
        mx: px * 100,
        my: py * 100,
        active: true,
      });
    };

    const onLeave = () => setState(IDLE);

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [maxDeg, reduced]);

  const style: React.CSSProperties = reduced
    ? { transform: "none" }
    : {
        transform: `perspective(1100px) rotateX(${state.rx.toFixed(2)}deg) rotateY(${state.ry.toFixed(2)}deg)`,
        transition: state.active
          ? "none"
          : "transform 600ms cubic-bezier(.2,0,0,1)",
      };

  return { ref, state, style };
}
