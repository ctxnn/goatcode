import { type PlatformProblemMeta, type PlatformTopicTag } from "./platform-meta";

const USACO_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export function parseUsacoUrl(url: string): string | null {
  try {
    const trimmed = url.trim();
    if (!trimmed) return null;
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host !== "usaco.org") return null;
    const cpid = parsed.searchParams.get("cpid");
    return cpid ? cpid : null;
  } catch {
    return null;
  }
}

export function isUsacoUrl(url: string): boolean {
  return parseUsacoUrl(url) !== null;
}

function isChallengePage(html: string): boolean {
  return (
    /cdn-cgi\/challenge-platform/i.test(html) ||
    /window\.location\s*=\s*['"]index\.php['"]/i.test(html)
  );
}

function extractTitle(html: string): string {
  const cleaned = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const candidates = [
    cleaned.match(/<h1[^>]*>([^<]{2,80})<\/h1>/i),
    cleaned.match(/<h2[^>]*>([^<]{2,80})<\/h2>/i),
    cleaned.match(/<b>([^<]{2,80})<\/b>/i),
  ];
  for (const m of candidates) {
    const t = m?.[1]?.replace(/\s+/g, " ").trim();
    if (t && !/^usaco$/i.test(t)) return t;
  }
  return "";
}

export async function fetchUsacoProblem(urlOrId: string): Promise<PlatformProblemMeta> {
  const cpid = parseUsacoUrl(urlOrId);
  if (!cpid) {
    throw new Error(
      "Not a valid USACO problem URL. Example: https://usaco.org/index.php?page=viewproblem2&cpid=1"
    );
  }

  const res = await fetch(`https://usaco.org/index.php?page=viewproblem2&cpid=${encodeURIComponent(cpid)}`, {
    headers: { "User-Agent": USACO_UA, Accept: "text/html" },
  });
  if (!res.ok) {
    throw new Error(`USACO request failed (${res.status}). Try again in a moment.`);
  }

  const html = await res.text();
  if (isChallengePage(html)) {
    throw new Error(
      "USACO blocked this request (Cloudflare challenge). Please add the problem manually — paste the title yourself."
    );
  }

  const title = extractTitle(html);
  if (!title) {
    throw new Error(`Could not read the title for USACO problem ${cpid}. Add it manually.`);
  }

  const tags: PlatformTopicTag[] = [];

  return {
    title,
    url: `https://usaco.org/index.php?page=viewproblem2&cpid=${cpid}`,
    platformSlug: "usaco",
    platformProblemId: cpid,
    platformDifficulty: "",
    normalizedDifficulty: 5,
    simplifiedStatement: undefined,
    topicTags: tags,
  };
}
