import { type PlatformProblemMeta, type PlatformTopicTag } from "./platform-meta";

const CSES_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export function parseCsesUrl(url: string): string | null {
  try {
    const trimmed = url.trim();
    if (!trimmed) return null;
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host !== "cses.fi") return null;
    const m = parsed.pathname.match(/\/problemset\/task\/(\d+)/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

export function isCsesUrl(url: string): boolean {
  return parseCsesUrl(url) !== null;
}

export async function fetchCsesProblem(urlOrId: string): Promise<PlatformProblemMeta> {
  const id = parseCsesUrl(urlOrId);
  if (!id) {
    throw new Error("Not a valid CSES problem URL. Example: https://cses.fi/problemset/task/1068/");
  }

  const res = await fetch(`https://cses.fi/problemset/task/${id}/`, {
    headers: { "User-Agent": CSES_UA, Accept: "text/html" },
  });
  if (!res.ok) {
    throw new Error(`CSES request failed (${res.status}). Try again in a moment.`);
  }

  const html = await res.text();
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  let title = titleMatch?.[1]?.trim() ?? "";
  title = title.replace(/^CSES\s*-\s*/i, "").trim();

  if (!title) {
    throw new Error(`Could not read the title for CSES task ${id}. Add it manually.`);
  }

  const tags: PlatformTopicTag[] = [];

  return {
    title,
    url: `https://cses.fi/problemset/task/${id}/`,
    platformSlug: "cses",
    platformProblemId: id,
    platformDifficulty: "",
    normalizedDifficulty: 5,
    simplifiedStatement: undefined,
    topicTags: tags,
  };
}
