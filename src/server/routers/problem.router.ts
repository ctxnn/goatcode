import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import * as problemService from "../../lib/services/problem.service";
import { transformProblem } from "../../lib/transforms";

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
      })
    )
    .query(async ({ input }) => {
      const { items, total } = await problemService.listProblemsPaged(input);
      return {
        items: items.map(transformProblem),
        total,
      };
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
        tags: z
          .array(
            z.object({
              tagId: z.string(),
              role: z.string().optional(),
              tagDifficulty: z.number().int().min(1).max(10).optional(),
              isInstructive: z.boolean().optional(),
            })
          )
          .optional(),
        solutions: z
          .array(
            z.object({
              language: z.string(),
              submissionUrl: z.string().url().optional().or(z.literal("")),
              githubUrl: z.string().url().optional().or(z.literal("")),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const problem = await problemService.createProblem({
        ...input,
        solutions: input.solutions?.map((s) => ({
          ...s,
          submissionUrl: s.submissionUrl || undefined,
          githubUrl: s.githubUrl || undefined,
        })),
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
        tags: z
          .array(
            z.object({
              tagId: z.string(),
              role: z.string().optional(),
              tagDifficulty: z.number().int().min(1).max(10).optional(),
              isInstructive: z.boolean().optional(),
            })
          )
          .optional(),
        solutions: z
          .array(
            z.object({
              language: z.string(),
              submissionUrl: z.string().url().optional().or(z.literal("")),
              githubUrl: z.string().url().optional().or(z.literal("")),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const problem = await problemService.updateProblem(id, {
        ...data,
        solutions: data.solutions?.map((s) => ({
          ...s,
          submissionUrl: s.submissionUrl || undefined,
          githubUrl: s.githubUrl || undefined,
        })),
      });
      return transformProblem(problem);
    }),

  delete: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    await problemService.deleteProblem(input.id);
    return { success: true };
  }),

  markDrilled: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    const problem = await problemService.markDrilled(input.id);
    return transformProblem(problem);
  }),

  undoDrilled: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    const problem = await problemService.undoDrilled(input.id);
    return transformProblem(problem);
  }),
});
