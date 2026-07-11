import {
  type PlatformProblemMeta,
  type PlatformTopicTag,
  ratingToNormalized,
  slugifyTag,
} from "./platform-meta";

const AC_API = "https://kenkoooo.com/atcoder/api/v3";
const AC_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export function parseAtCoderUrl(url: string): string | null {
  try {
    const trimmed = url.trim();
    if (!trimmed) return null;

    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host !== "atcoder.jp") return null;

    const m =
      parsed.pathname.match(/\/contest\/([^/]+)\/tasks\/([^/]+)/i) ??
      parsed.pathname.match(/\/tasks\/([^/]+)/i);
    return m ? (m[2] ?? m[1]) : null;
  } catch {
    return null;
  }
}

export function isAtCoderUrl(url: string): boolean {
  return parseAtCoderUrl(url) !== null;
}

function toTopicTags(names: string[] | undefined): PlatformTopicTag[] {
  return (names ?? []).map((name) => ({ name, slug: slugifyTag(name) }));
}

export async function fetchAtCoderProblem(urlOrId: string): Promise<PlatformProblemMeta> {
  const taskId = parseAtCoderUrl(urlOrId);
  if (!taskId) {
    throw new Error(
      "Not a valid AtCoder problem URL. Example: https://atcoder.jp/contests/abc123/tasks/abc123_a"
    );
  }

  const res = await fetch(`${AC_API}/problem?id=${encodeURIComponent(taskId)}`, {
    headers: { "User-Agent": AC_UA, Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`AtCoder request failed (${res.status}). Try again in a moment.`);
  }

  const problem = (await res.json()) as {
    id?: string;
    contest_id?: string;
    title?: string;
    difficulty?: number | null;
    tags?: string[];
    url?: string;
  };

  if (!problem || !problem.title) {
    throw new Error(`Problem "${taskId}" not found on AtCoder. Check the URL.`);
  }

  const difficulty = problem.difficulty ?? null;

  return {
    title: problem.title,
    url: problem.url || `https://atcoder.jp/contests/${problem.contest_id}/tasks/${taskId}`,
    platformSlug: "atcoder",
    platformProblemId: taskId,
    platformDifficulty: difficulty != null ? `Diff ${difficulty}` : "",
    normalizedDifficulty: ratingToNormalized(difficulty),
    simplifiedStatement: undefined,
    topicTags: toTopicTags(problem.tags),
  };
}
