/**
 * Public demo access.
 *
 * These are intentionally public, disposable accounts created by
 * `pnpm --filter api seed:path2`. They are not real users and must never be
 * reused for production. Override them with NEXT_PUBLIC_DEMO_* env vars when
 * the demo tenant uses different seeded credentials.
 */
export const DEMO_ACCOUNTS = {
  student: {
    phone: process.env.NEXT_PUBLIC_DEMO_STUDENT_PHONE ?? "01000000002",
    password: process.env.NEXT_PUBLIC_DEMO_STUDENT_PASSWORD ?? "Student123!",
  },
  teacher: {
    phone: process.env.NEXT_PUBLIC_DEMO_TEACHER_PHONE ?? "01000000001",
    password:
      process.env.NEXT_PUBLIC_DEMO_TEACHER_PASSWORD ?? "Joker-Arabic#2026",
  },
} as const;

export type DemoRole = keyof typeof DEMO_ACCOUNTS;

/** The single link to put in the submission, the README, and the first slide. */
export const DEMO_ROUTE = "/demo";

/** The founder's five-minute cut — the fallback if the live API is asleep. */
export const DEMO_FILM_URL =
  "https://drive.google.com/file/d/1j_6TDQVtOVDRyEcU1q0Jbt2ZMC5-zzIW/view?usp=sharing";

/** Served from apps/web/public/demo-qr.png. */
export const DEMO_QR_SRC = "/demo-qr.png";
