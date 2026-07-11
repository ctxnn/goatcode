/**
 * SM-2 style spaced repetition for coding problems (no Anki dependency).
 *
 * "Due" means: this problem is scheduled for re-practice right now
 * (nextReviewAt <= now, or never scheduled yet). It is NOT "problems solved after a date".
 */

export type ReviewGrade = "again" | "hard" | "good" | "easy";

export type SrsState = {
  srsRepetitions: number;
  srsEaseFactor: number;
  srsIntervalDays: number;
  nextReviewAt: Date | null;
  lastReviewGrade: ReviewGrade | null;
};

export const DEFAULT_EASE = 2.5;
export const MIN_EASE = 1.3;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function gradeToQuality(grade: ReviewGrade): number {
  switch (grade) {
    case "again":
      return 1;
    case "hard":
      return 3;
    case "good":
      return 4;
    case "easy":
      return 5;
  }
}

function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * MS_PER_DAY);
}

function clampEase(ease: number): number {
  return Math.max(MIN_EASE, Math.round(ease * 100) / 100);
}

/**
 * Classic SM-2 ease update for quality 0–5.
 * EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 */
export function updateEaseFactor(ease: number, quality: number): number {
  const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  return clampEase(ease + delta);
}

export function applySm2(state: SrsState, grade: ReviewGrade, now = new Date()): SrsState {
  const quality = gradeToQuality(grade);
  let { srsRepetitions, srsEaseFactor, srsIntervalDays } = state;

  if (grade === "again") {
    srsRepetitions = 0;
    srsIntervalDays = 1;
    srsEaseFactor = clampEase(srsEaseFactor - 0.2);
    return {
      srsRepetitions,
      srsEaseFactor,
      srsIntervalDays,
      nextReviewAt: addDays(now, 1),
      lastReviewGrade: grade,
    };
  }

  // Successful recall path
  if (srsRepetitions === 0) {
    srsIntervalDays = grade === "hard" ? 1 : grade === "easy" ? 2 : 1;
  } else if (srsRepetitions === 1) {
    srsIntervalDays = grade === "hard" ? 2 : grade === "easy" ? 4 : 3;
  } else {
    const base = Math.max(1, srsIntervalDays);
    if (grade === "hard") {
      srsIntervalDays = Math.max(1, Math.round(base * 1.2));
    } else if (grade === "easy") {
      srsIntervalDays = Math.max(1, Math.round(base * srsEaseFactor * 1.3));
    } else {
      srsIntervalDays = Math.max(1, Math.round(base * srsEaseFactor));
    }
  }

  srsRepetitions += 1;
  srsEaseFactor = updateEaseFactor(srsEaseFactor, quality);

  return {
    srsRepetitions,
    srsEaseFactor,
    srsIntervalDays,
    nextReviewAt: addDays(now, srsIntervalDays),
    lastReviewGrade: grade,
  };
}

export function formatNextReview(nextReviewAt: Date | null | undefined, now = new Date()): string {
  if (!nextReviewAt) return "Due";
  const diffMs = nextReviewAt.getTime() - now.getTime();
  if (diffMs <= 0) return "Due";
  const days = Math.ceil(diffMs / MS_PER_DAY);
  if (days === 1) return "in 1 day";
  if (days < 14) return `in ${days} days`;
  const weeks = Math.round(days / 7);
  if (weeks < 8) return `in ${weeks} wk`;
  return nextReviewAt.toLocaleDateString();
}

export function isDue(
  problem: { srsEnabled: boolean; nextReviewAt: Date | null },
  now = new Date()
): boolean {
  if (!problem.srsEnabled) return false;
  if (!problem.nextReviewAt) return true;
  return problem.nextReviewAt.getTime() <= now.getTime();
}
