export type FetchPlatform = "leetcode" | "codeforces" | "atcoder" | "cses" | "usaco";

/**
 * Detect which supported platform a problem URL (or bare slug) belongs to.
 * Full URLs are matched by host; bare slugs are guessed (Codeforces / AtCoder
 * patterns first, then LeetCode) so users can paste minimal identifiers.
 */
export function detectPlatformSlug(url: string): FetchPlatform | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (/leetcode\.(com|cn)\//i.test(trimmed)) return "leetcode";
  if (/codeforces\.com\//i.test(trimmed)) return "codeforces";
  if (/atcoder\.jp\//i.test(trimmed)) return "atcoder";
  if (/cses\.fi\//i.test(trimmed)) return "cses";
  if (/usaco\.org\//i.test(trimmed)) return "usaco";

  // Bare identifiers
  if (/^\d+[a-z]\d*$/i.test(trimmed)) return "codeforces"; // 1462a
  if (/^[a-z]{2,5}\d+_?[a-z]?\d*$/i.test(trimmed)) return "atcoder"; // abc123_a / abc123a
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(trimmed)) return "leetcode"; // two-sum

  return null;
}

export function isFetchableUrl(url: string): boolean {
  return detectPlatformSlug(url) !== null;
}
