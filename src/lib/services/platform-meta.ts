export type PlatformTopicTag = {
  name: string;
  slug: string;
};

export type PlatformProblemMeta = {
  title: string;
  url: string;
  platformSlug: string;
  platformProblemId: string;
  platformDifficulty: string;
  normalizedDifficulty: number;
  simplifiedStatement?: string;
  topicTags: PlatformTopicTag[];
};

/** Map a competitive-programming rating (e.g. CF rating, AtCoder difficulty) to a 1–10 normalized scale. */
export function ratingToNormalized(rating: number | null | undefined, per400 = 400): number {
  if (rating == null || Number.isNaN(rating)) return 5;
  const n = Math.floor(rating / per400) + 1;
  return Math.max(1, Math.min(10, n));
}

export function slugifyTag(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
