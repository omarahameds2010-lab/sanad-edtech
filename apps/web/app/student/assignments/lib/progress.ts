export interface AttemptLike {
  id: string;
  status: string;
  score?: number | null;
  submittedAt: string;
  gradedAt?: string | null;
  content?: string | null;
  attachments?: unknown[] | null;
}

export interface GrowthPoint {
  key: string;
  count: number;
  cumulative: number;
}

export interface GrowthSummary {
  points: GrowthPoint[];
  streak: number;
  activeDays: number;
  total: number;
}

export interface ScorePoint {
  id: string;
  score: number;
  at: string;
}

export interface ScoreBlueprint {
  points: ScorePoint[];
  first: number;
  latest: number;
  delta: number;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Local calendar key — the student's own day, not a UTC day boundary. */
export function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
}

/** True only when the attempt contains an actual answer. */
export function hasSubmittedWork(attempt: AttemptLike): boolean {
  if (typeof attempt.content === "string" && attempt.content.trim()) {
    return true;
  }
  if (Array.isArray(attempt.attachments) && attempt.attachments.length > 0) {
    return true;
  }
  return attempt.status === "GRADED" || attempt.status === "LATE";
}

/**
 * Builds the silent growth bridge from real submitted attempts.
 *
 * Days with no work stay flat. The cumulative value carries forward, so
 * returning after a pause continues the same line instead of resetting it.
 */
export function buildGrowthSummary(
  attempts: AttemptLike[],
  today: Date = new Date(),
  days = 14,
): GrowthSummary {
  const completed = attempts.filter(hasSubmittedWork);
  const keys = new Set(completed.map((attempt) => localDayKey(new Date(attempt.submittedAt))));
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const firstDay = new Date(todayStart);
  firstDay.setDate(firstDay.getDate() - (days - 1));

  const counts = new Map<string, number>();
  let baseline = 0;
  for (const attempt of completed) {
    const submitted = new Date(attempt.submittedAt);
    if (submitted < firstDay) {
      baseline += 1;
      continue;
    }
    const key = localDayKey(submitted);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const points: GrowthPoint[] = [];
  let running = baseline;
  for (let index = 0; index < days; index += 1) {
    const day = new Date(firstDay);
    day.setDate(firstDay.getDate() + index);
    const key = localDayKey(day);
    const count = counts.get(key) ?? 0;
    running += count;
    points.push({ key, count, cumulative: running });
  }

  let cursor = new Date(todayStart);
  if (!keys.has(localDayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (keys.has(localDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    points,
    streak,
    activeDays: points.filter((point) => point.count > 0).length,
    total: completed.length,
  };
}

/** Approved grades only — no suggested score ever enters this chart. */
export function buildScoreBlueprint(attempts: AttemptLike[]): ScoreBlueprint | null {
  const points = attempts
    .filter(
      (attempt) =>
        attempt.status === "GRADED" &&
        typeof attempt.score === "number" &&
        Number.isFinite(attempt.score),
    )
    .map((attempt) => ({
      id: attempt.id,
      score: Math.max(0, Math.min(100, Math.round(attempt.score as number))),
      at: attempt.gradedAt ?? attempt.submittedAt,
    }))
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  if (points.length === 0) return null;

  return {
    points,
    first: points[0].score,
    latest: points[points.length - 1].score,
    delta: points[points.length - 1].score - points[0].score,
  };
}
