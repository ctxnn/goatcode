import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import * as tagService from "../../lib/services/tag.service";

export const tagRouter = router({
  list: publicProcedure.query(async () => {
    return tagService.listTags();
  }),

  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    return tagService.getTagById(input.id);
  }),

  create: publicProcedure
    .input(z.object({ name: z.string(), description: z.string().optional() }))
    .mutation(async ({ input }) => {
      return tagService.createTag(input);
    }),

  update: publicProcedure
    .input(z.object({ id: z.string(), name: z.string().optional(), description: z.string().optional() }))
    .mutation(async ({ input }) => {
      return tagService.updateTag(input.id, input);
    }),

  delete: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    await tagService.deleteTag(input.id);
    return { success: true };
  }),
});
