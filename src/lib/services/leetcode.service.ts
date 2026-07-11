const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";

const QUESTION_QUERY = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId
      questionFrontendId
      title
      titleSlug
      difficulty
      content
      topicTags {
        name
        slug
      }
    }
  }
`;

export type LeetCodeTopicTag = {
  name: string;
  slug: string;
};

export type LeetCodeProblemMeta = {
  title: string;
  url: string;
  titleSlug: string;
  platformSlug: "leetcode";
  platformProblemId: string;
  platformDifficulty: string;
  normalizedDifficulty: number;
  simplifiedStatement?: string;
  topicTags: LeetCodeTopicTag[];
};

const DIFFICULTY_TO_NORMALIZED: Record<string, number> = {
  Easy: 3,
  Medium: 5,
  Hard: 8,
};

export function parseLeetCodeSlug(url: string): string | null {
  try {
    const trimmed = url.trim();
    if (!trimmed) return null;

    // Accept bare slug
    if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(trimmed) && !trimmed.includes("/")) {
      return trimmed.toLowerCase();
    }

    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host !== "leetcode.com" && host !== "leetcode.cn") {
      return null;
    }

    const match = parsed.pathname.match(/\/problems\/([a-z0-9-]+)/i);
    return match?.[1]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

export function isLeetCodeUrl(url: string): boolean {
  return parseLeetCodeSlug(url) !== null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchLeetCodeProblem(urlOrSlug: string): Promise<LeetCodeProblemMeta> {
  const slug = parseLeetCodeSlug(urlOrSlug);
  if (!slug) {
    throw new Error("Not a valid LeetCode problem URL. Example: https://leetcode.com/problems/two-sum/");
  }

  const response = await fetch(LEETCODE_GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: "https://leetcode.com",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    body: JSON.stringify({
      query: QUESTION_QUERY,
      variables: { titleSlug: slug },
      operationName: "questionData",
    }),
  });

  if (!response.ok) {
    throw new Error(`LeetCode request failed (${response.status}). Try again in a moment.`);
  }

  const payload = (await response.json()) as {
    data?: {
      question?: {
        questionId: string;
        questionFrontendId: string;
        title: string;
        titleSlug: string;
        difficulty: string;
        content?: string | null;
        topicTags?: Array<{ name: string; slug: string }>;
      } | null;
    };
    errors?: Array<{ message: string }>;
  };

  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message || "LeetCode GraphQL error");
  }

  const question = payload.data?.question;
  if (!question) {
    throw new Error(`Problem not found for slug "${slug}". Check the URL.`);
  }

  const plain = question.content ? stripHtml(question.content) : "";
  const simplifiedStatement = plain ? plain.slice(0, 500) + (plain.length > 500 ? "…" : "") : undefined;

  return {
    title: question.title,
    url: `https://leetcode.com/problems/${question.titleSlug}/`,
    titleSlug: question.titleSlug,
    platformSlug: "leetcode",
    platformProblemId: question.questionFrontendId || question.questionId,
    platformDifficulty: question.difficulty,
    normalizedDifficulty: DIFFICULTY_TO_NORMALIZED[question.difficulty] ?? 5,
    simplifiedStatement,
    topicTags: (question.topicTags ?? []).map((t) => ({ name: t.name, slug: t.slug })),
  };
}
