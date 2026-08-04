import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import * as problemService from "../../lib/services/problem.service";
import { fetchProblemByUrl } from "../../lib/services/problem-fetch";
import { transformProblem } from "../../lib/transforms";

const reviewGradeSchema = z.enum(["again", "hard", "good", "easy"]);

const solutionInputSchema = z.object({
  language: z.string(),
  submissionUrl: z.string().url().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
  localPath: z.string().optional().or(z.literal("")),
});

const tagInputSchema = z.object({
  tagId: z.string(),
  role: z.string().optional(),
  tagDifficulty: z.number().int().min(1).max(10).optional(),
  isInstructive: z.boolean().optional(),
});

function mapSolutions(
  solutions?: Array<{
    language: string;
    submissionUrl?: string;
    githubUrl?: string;
    localPath?: string;
  }>
) {
  return solutions?.map((s) => ({
    ...s,
    submissionUrl: s.submissionUrl || undefined,
    githubUrl: s.githubUrl || undefined,
    localPath: s.localPath || undefined,
  }));
}

export const problemRouter = router({
  list: publicProcedure.query(async () => {
    const problems = await problemService.listProblems();
    return problems.map(transformProblem);
  }),

  listPaged: publicProcedure
    .input(
      z.object({
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).max(200).optional(),
        greatOnly: z.boolean().optional(),
        platformId: z.string().optional(),
        tagId: z.string().optional(),
        dueOnly: z.boolean().optional(),
        srsEnabled: z.boolean().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { items, total } = await problemService.listProblemsPaged(input);
      return {
        items: items.map(transformProblem),
        total,
      };
    }),

  listDue: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).optional() }).optional())
    .query(async ({ input }) => {
      const items = await problemService.listDueForReview(input);
      return items.map(transformProblem);
    }),

  listUpcoming: publicProcedure
    .input(
      z
        .object({
          days: z.number().int().min(1).max(90).optional(),
          limit: z.number().int().min(1).max(200).optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const items = await problemService.listUpcomingReviews(input);
      return items.map(transformProblem);
    }),

  srsStats: publicProcedure.query(async () => {
    return problemService.getSrsStats();
  }),

  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const problem = await problemService.getProblemById(input.id);
    if (!problem) return null;
    return transformProblem(problem);
  }),

  create: publicProcedure
    .input(
      z.object({
        platformId: z.string(),
        title: z.string().min(1),
        url: z.string().url(),
        platformProblemId: z.string().optional(),
        platformDifficulty: z.string().optional(),
        normalizedDifficulty: z.number().int().min(1).max(10).optional(),
        simplifiedStatement: z.string().optional(),
        notes: z.string().optional(),
        isGreatProblem: z.boolean().optional(),
        drillType: z.string().nullable().optional(),
        drillNotes: z.string().optional(),
        tags: z.array(tagInputSchema).optional(),
        solutions: z.array(solutionInputSchema).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const problem = await problemService.createProblem({
        ...input,
        solutions: mapSolutions(input.solutions),
      });
      return transformProblem(problem);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        platformId: z.string().optional(),
        title: z.string().min(1).optional(),
        url: z.string().url().optional(),
        platformProblemId: z.string().optional(),
        platformDifficulty: z.string().optional(),
        normalizedDifficulty: z.number().int().min(1).max(10).optional(),
        simplifiedStatement: z.string().optional(),
        notes: z.string().optional(),
        isGreatProblem: z.boolean().optional(),
        drillType: z.string().nullable().optional(),
        drillNotes: z.string().optional(),
        tags: z.array(tagInputSchema).optional(),
        solutions: z.array(solutionInputSchema).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const problem = await problemService.updateProblem(id, {
        ...data,
        solutions: mapSolutions(data.solutions),
      });
      return transformProblem(problem);
    }),

  delete: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    await problemService.deleteProblem(input.id);
    return { success: true };
  }),

  review: publicProcedure
    .input(z.object({ id: z.string(), grade: reviewGradeSchema }))
    .mutation(async ({ input }) => {
      const problem = await problemService.reviewProblem(input.id, input.grade);
      return transformProblem(problem);
    }),

  setSrsEnabled: publicProcedure
    .input(z.object({ id: z.string(), enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      const problem = await problemService.setSrsEnabled(input.id, input.enabled);
      return transformProblem(problem);
    }),

  resetSrs: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    const problem = await problemService.resetSrs(input.id);
    return transformProblem(problem);
  }),

  markDrilled: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    const problem = await problemService.markDrilled(input.id);
    return transformProblem(problem);
  }),

  undoDrilled: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    const problem = await problemService.undoDrilled(input.id);
    return transformProblem(problem);
  }),

  fetchFromUrl: publicProcedure
    .input(z.object({ url: z.string().min(1) }))
    .mutation(async ({ input }) => {
      return fetchProblemByUrl(input.url);
    }),
});
