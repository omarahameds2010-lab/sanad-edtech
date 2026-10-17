"use client";

import { useEffect, useRef, useState } from "react";

/** True when the OS asks for reduced motion; stays live if the setting changes. */
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

/** easeOutQuint — rises fast, settles softly, never overshoots. */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

/**
 * Liquid number interpolation: counts 0 → target over exactly `durationMs`.
 *
 * Under reduced motion it snaps straight to the value — the number is data,
 * so stillness must never hide it.
 */
export function useLiquidCounter(target: number, durationMs = 1200): number {
  const [value, setValue] = useState(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) {
      setValue(target);
      return;
    }

    let frame = 0;
    let guard = 0;
    let done = false;

    const start = performance.now();

    const finish = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(frame);
      clearTimeout(guard);
      setValue(target);
    };

    const step = (now: number) => {
      if (done) return;
      const t = Math.min(1, Math.max(0, (now - start) / durationMs));
      setValue(target * easeOut(t));
      if (t < 1) frame = requestAnimationFrame(step);
      else finish();
    };

    frame = requestAnimationFrame(step);

    // Fallback guarantee: requestAnimationFrame does not fire at all in a
    // hidden, minimised or occluded tab — which is exactly the state a
    // screenshot tool or a backgrounded window produces. Without this the
    // metric would sit at zero forever, hiding real data behind decoration.
    guard = setTimeout(finish, durationMs + 120) as unknown as number;

    return () => {
      done = true;
      cancelAnimationFrame(frame);
      clearTimeout(guard);
    };
  }, [target, durationMs, reduced]);

  return value;
}

export interface MagneticState {
  /** Normalised pointer position inside the element, -0.5…0.5. */
  nx: number;
  ny: number;
  /** Pointer position as a percentage, for the gleam mask. */
  mx: number;
  my: number;
  active: boolean;
}

/**
 * Pointer tracking for the pearl-gleam border mask and the magnetic pull.
 *
 * Neither moves the panel itself — the material stays still and only the edge
 * reacts, so there is no layout snap or wobble.
 */
export function useMagnetic<T extends HTMLElement = HTMLDivElement>(
  maxPull = 6,
) {
  const ref = useRef<T | null>(null);
  const [state, setState] = useState<MagneticState>({
    nx: 0,
    ny: 0,
    mx: 50,
    my: 50,
    active: false,
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      setState({
        nx: px - 0.5,
        ny: py - 0.5,
        mx: px * 100,
        my: py * 100,
        active: true,
      });
    };

    const onLeave = () =>
      setState({ nx: 0, ny: 0, mx: 50, my: 50, active: false });

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return { ref, state, maxPull };
}
