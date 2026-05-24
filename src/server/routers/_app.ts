import { router } from "../trpc";
import { problemRouter } from "./problem.router";
import { platformRouter } from "./platform.router";
import { tagRouter } from "./tag.router";
import { solutionRouter } from "./solution.router";

export const appRouter = router({
  problem: problemRouter,
  platform: platformRouter,
  tag: tagRouter,
  solution: solutionRouter,
});

export type AppRouter = typeof appRouter;
