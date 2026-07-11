import { detectPlatformSlug, type FetchPlatform } from "../platform-detect";
import { fetchLeetCodeProblem } from "./leetcode.service";
import { fetchCodeforcesProblem } from "./codeforces.service";
import { fetchAtCoderProblem } from "./atcoder.service";
import type { PlatformProblemMeta } from "./platform-meta";

export { detectPlatformSlug };
export type { FetchPlatform };

/** Fetch problem metadata from any supported platform based on the URL. */
export async function fetchProblemByUrl(url: string): Promise<PlatformProblemMeta> {
  const slug = detectPlatformSlug(url);
  switch (slug) {
    case "leetcode":
      return fetchLeetCodeProblem(url);
    case "codeforces":
      return fetchCodeforcesProblem(url);
    case "atcoder":
      return fetchAtCoderProblem(url);
    default:
      throw new Error("Unsupported URL. Supported platforms: LeetCode, Codeforces, AtCoder.");
  }
}
