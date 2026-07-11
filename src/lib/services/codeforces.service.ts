import {
  type PlatformProblemMeta,
  type PlatformTopicTag,
  ratingToNormalized,
  slugifyTag,
} from "./platform-meta";

const CF_API = "https://codeforces.com/api";
const CF_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

type CfProblem = {
  contestId?: number;
  index?: string;
  name?: string;
  type?: string;
  points?: number;
  rating?: number;
  tags?: string[];
};

export type CodeforcesRef = { contestId: string; index: string };

export function parseCodeforcesUrl(url: string): CodeforcesRef | null {
  try {
    const trimmed = url.trim();
    if (!trimmed) return null;

    // Bare forms: "1462A" or "1462/A"
    const bare = trimmed.match(/^(\d+)\/([A-Z]\d?)$/i) ?? trimmed.match(/^(\d+)([A-Z]\d?)$/i);
    if (bare && !trimmed.includes(".")) {
      return { contestId: bare[1], index: bare[2].toUpperCase() };
    }

    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host !== "codeforces.com") return null;

    const m =
      parsed.pathname.match(/\/problemset\/problem\/(\d+)\/([A-Z]\d?)/i) ??
      parsed.pathname.match(/\/contest\/(\d+)\/problem\/([A-Z]\d?)/i);
    if (!m) return null;

    return { contestId: m[1], index: m[2].toUpperCase() };
  } catch {
    return null;
  }
}

export function isCodeforcesUrl(url: string): boolean {
  return parseCodeforcesUrl(url) !== null;
}

function toTopicTags(names: string[] | undefined): PlatformTopicTag[] {
  return (names ?? []).map((name) => ({ name, slug: slugifyTag(name) }));
}

export async function fetchCodeforcesProblem(urlOrRef: string): Promise<PlatformProblemMeta> {
  const ref = parseCodeforcesUrl(urlOrRef);
  if (!ref) {
    throw new Error(
      "Not a valid Codeforces problem URL. Example: https://codeforces.com/problemset/problem/1462/A"
    );
  }

  const { contestId, index } = ref;
  const headers = { "User-Agent": CF_UA, Accept: "application/json" };

  let problem: CfProblem | null = null;
  let rating: number | undefined;

  // Primary: contest.problems includes per-problem rating.
  try {
    const res = await fetch(`${CF_API}/contest.problems?contestId=${encodeURIComponent(contestId)}`, { headers });
    if (res.ok) {
      const payload = (await res.json()) as {
        status?: string;
        result?: { problems?: CfProblem[]; problemStatistics?: Array<{ contestId?: number; index?: string; rating?: number }> };
      };
      if (payload.status === "OK" && payload.result?.problems) {
        problem = payload.result.problems.find((p) => p.index === index) ?? null;
        const stat = payload.result.problemStatistics?.find(
          (s) => s.index === index && String(s.contestId) === contestId
        );
        rating = problem?.rating ?? stat?.rating;
      }
    }
  } catch {
    // fall through to problemset fallback
  }

  // Fallback: problemset.problems (reliable, but no rating field).
  if (!problem) {
    const res = await fetch(`${CF_API}/problemset.problems`, { headers });
    if (!res.ok) {
      throw new Error(`Codeforces request failed (${res.status}). Try again in a moment.`);
    }
    const payload = (await res.json()) as {
      status?: string;
      result?: { problems?: CfProblem[] };
      comment?: string;
    };
    if (payload.status !== "OK" || !payload.result?.problems) {
      throw new Error(payload.comment || "Codeforces API error.");
    }
    problem =
      payload.result.problems.find(
        (p) => p.index === index && String(p.contestId) === contestId
      ) ?? null;
  }

  if (!problem || !problem.name) {
    throw new Error(`Problem ${contestId}${index} not found on Codeforces. Check the URL.`);
  }

  return {
    title: problem.name,
    url: `https://codeforces.com/problemset/problem/${contestId}/${index}`,
    platformSlug: "codeforces",
    platformProblemId: `${contestId}${index}`,
    platformDifficulty: rating != null ? `Rating ${rating}` : `Index ${index}`,
    normalizedDifficulty: ratingToNormalized(rating),
    simplifiedStatement: undefined,
    topicTags: toTopicTags(problem.tags),
  };
}
