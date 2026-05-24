import type { Problem, Platform, Solution, ProblemTag, Tag } from "@prisma/client";

type PopulatedProblemTag = ProblemTag & { tag: Tag };

export type PopulatedProblem = Problem & {
  platform: Platform;
  problemTags: PopulatedProblemTag[];
  solutions: Solution[];
};

export function transformProblem(problem: PopulatedProblem) {
  return {
    ...problem,
    tags: problem.problemTags.map(pt => ({
      tagId: pt.tagId,
      name: pt.tag.name,
      slug: pt.tag.slug,
      role: pt.role,
      tagDifficulty: pt.tagDifficulty,
      isInstructive: pt.isInstructive,
    })),
    // Remove the nested problemTags to clean up the API response
    problemTags: undefined,
  };
}
