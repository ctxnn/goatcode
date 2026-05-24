import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import * as platformService from "../../lib/services/platform.service";

export const platformRouter = router({
  list: publicProcedure.query(async () => {
    return platformService.listPlatforms();
  }),

  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    return platformService.getPlatformById(input.id);
  }),

  create: publicProcedure
    .input(z.object({ name: z.string(), slug: z.string() }))
    .mutation(async ({ input }) => {
      return platformService.createPlatform(input);
    }),

  update: publicProcedure
    .input(z.object({ id: z.string(), name: z.string().optional(), slug: z.string().optional() }))
    .mutation(async ({ input }) => {
      return platformService.updatePlatform(input.id, input);
    }),

  delete: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    await platformService.deletePlatform(input.id);
    return { success: true };
  }),
});
