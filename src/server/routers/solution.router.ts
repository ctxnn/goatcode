import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import * as solutionService from "../../lib/services/solution.service";

export const solutionRouter = router({
  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    return solutionService.getSolutionById(input.id);
  }),

  create: publicProcedure
    .input(
      z.object({
        problemId: z.string(),
        language: z.string(),
        submissionUrl: z.string().url().optional().or(z.literal("")),
        githubUrl: z.string().url().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ input }) => {
      return solutionService.createSolution({
        ...input,
        submissionUrl: input.submissionUrl || undefined,
        githubUrl: input.githubUrl || undefined,
      });
    }),

  delete: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    await solutionService.deleteSolution(input.id);
    return { success: true };
  }),
});
