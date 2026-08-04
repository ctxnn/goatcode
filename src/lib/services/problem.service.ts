import { prisma } from "../prisma";
import { createDatabaseBackup } from "../db-backup";
import type { Prisma } from "@prisma/client";
import { applySm2, DEFAULT_EASE, type ReviewGrade } from "../srs";

const problemInclude = {
  platform: true,
  problemTags: { include: { tag: true } },
  solutions: true,
} satisfies Prisma.ProblemInclude;

export type ProblemInput = {
  platformId: string;
  title: string;
  url: string;
  platformProblemId?: string;
  platformDifficulty?: string;
  normalizedDifficulty?: number;
  simplifiedStatement?: string;
  notes?: string;
  isGreatProblem?: boolean;
  drillType?: string | null;
  drillNotes?: string;
  tags?: Array<{
    tagId: string;
    role?: string;
    tagDifficulty?: number;
    isInstructive?: boolean;
  }>;
  solutions?: Array<{
    language: string;
    submissionUrl?: string;
    githubUrl?: string;
    localPath?: string;
  }>;
};

export async function listProblems() {
  return prisma.problem.findMany({
    include: problemInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function listProblemsPaged(input: {
  page?: number;
  pageSize?: number;
  greatOnly?: boolean;
  platformId?: string;
  tagId?: string;
  dueOnly?: boolean;
  srsEnabled?: boolean;
  search?: string;
}) {
  const page = input.page || 1;
  const pageSize = input.pageSize || 20;
  const now = new Date();

  const where: Prisma.ProblemWhereInput = {};
  if (input.greatOnly) where.isGreatProblem = true;
  if (input.platformId) where.platformId = input.platformId;
  if (input.tagId) {
    where.problemTags = { some: { tagId: input.tagId } };
  }
  if (input.search?.trim()) {
    where.title = { contains: input.search.trim() };
  }
  if (input.srsEnabled !== undefined) {
    where.srsEnabled = input.srsEnabled;
  }
  if (input.dueOnly) {
    where.srsEnabled = true;
    where.OR = [{ nextReviewAt: null }, { nextReviewAt: { lte: now } }];
  }

  const [items, total] = await Promise.all([
    prisma.problem.findMany({
      where,
      include: problemInclude,
      orderBy: input.dueOnly
        ? [{ nextReviewAt: "asc" }, { isGreatProblem: "desc" }, { createdAt: "desc" }]
        : { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.problem.count({ where }),
  ]);

  return { items, total };
}

export async function getProblemById(id: string) {
  return prisma.problem.findUnique({
    where: { id },
    include: problemInclude,
  });
}

export async function listDueForReview(input?: { limit?: number }) {
  const now = new Date();
  const limit = input?.limit ?? 50;

  return prisma.problem.findMany({
    where: {
      srsEnabled: true,
      OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: now } }],
    },
    include: problemInclude,
    orderBy: [{ nextReviewAt: "asc" }, { isGreatProblem: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export async function listUpcomingReviews(input?: { days?: number; limit?: number }) {
  const now = new Date();
  const days = input?.days ?? 7;
  const limit = input?.limit ?? 50;
  const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return prisma.problem.findMany({
    where: {
      srsEnabled: true,
      nextReviewAt: { gt: now, lte: until },
    },
    include: problemInclude,
    orderBy: { nextReviewAt: "asc" },
    take: limit,
  });
}

export async function getSrsStats() {
  const now = new Date();

  const [dueCount, totalEnabled, learningCount, totalProblems] = await Promise.all([
    prisma.problem.count({
      where: {
        srsEnabled: true,
        OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: now } }],
      },
    }),
    prisma.problem.count({ where: { srsEnabled: true } }),
    prisma.problem.count({
      where: { srsEnabled: true, srsRepetitions: { lt: 2 } },
    }),
    prisma.problem.count(),
  ]);

  const easeAgg = await prisma.problem.aggregate({
    where: { srsEnabled: true },
    _avg: { srsEaseFactor: true },
  });

  return {
    dueCount,
    totalEnabled,
    learningCount,
    graduatedCount: Math.max(0, totalEnabled - learningCount),
    totalProblems,
    avgEase: easeAgg._avg.srsEaseFactor ?? DEFAULT_EASE,
  };
}

export async function createProblem(data: ProblemInput) {
  const { tags, solutions, ...rest } = data;
  const now = new Date();

  const problem = await prisma.problem.create({
    data: {
      ...rest,
      // New saves enter the review queue immediately ("due" for first scheduling).
      srsEnabled: true,
      srsRepetitions: 0,
      srsEaseFactor: DEFAULT_EASE,
      srsIntervalDays: 0,
      nextReviewAt: now,
      problemTags: tags
        ? {
            create: tags.map((t) => ({
              tagId: t.tagId,
              role: t.role,
              tagDifficulty: t.tagDifficulty,
              isInstructive: t.isInstructive,
            })),
          }
        : undefined,
      solutions: solutions
        ? {
            create: solutions.map((s) => ({
              language: s.language,
              submissionUrl: s.submissionUrl,
              githubUrl: s.githubUrl,
              localPath: s.localPath,
            })),
          }
        : undefined,
    },
    include: problemInclude,
  });

  await createDatabaseBackup("problem-create");
  return problem;
}

export async function updateProblem(id: string, data: Partial<ProblemInput>) {
  const { tags, solutions, ...rest } = data;

  const problem = await prisma.$transaction(async (tx) => {
    if (tags) {
      await tx.problemTag.deleteMany({ where: { problemId: id } });
    }
    if (solutions) {
      await tx.solution.deleteMany({ where: { problemId: id } });
    }

    return tx.problem.update({
      where: { id },
      data: {
        ...rest,
        ...(tags && {
          problemTags: {
            create: tags.map((t) => ({
              tagId: t.tagId,
              role: t.role,
              tagDifficulty: t.tagDifficulty,
              isInstructive: t.isInstructive,
            })),
          },
        }),
        ...(solutions && {
          solutions: {
            create: solutions.map((s) => ({
              language: s.language,
              submissionUrl: s.submissionUrl,
              githubUrl: s.githubUrl,
              localPath: s.localPath,
            })),
          },
        }),
      },
      include: problemInclude,
    });
  });

  await createDatabaseBackup("problem-update");
  return problem;
}

export async function deleteProblem(id: string) {
  const problem = await prisma.problem.delete({
    where: { id },
  });

  await createDatabaseBackup("problem-delete");
  return problem;
}

export async function reviewProblem(id: string, grade: ReviewGrade) {
  const existing = await prisma.problem.findUnique({ where: { id } });
  if (!existing) throw new Error("Problem not found");

  const now = new Date();
  const next = applySm2(
    {
      srsRepetitions: existing.srsRepetitions,
      srsEaseFactor: existing.srsEaseFactor,
      srsIntervalDays: existing.srsIntervalDays,
      nextReviewAt: existing.nextReviewAt,
      lastReviewGrade: (existing.lastReviewGrade as ReviewGrade | null) ?? null,
    },
    grade,
    now
  );

  const problem = await prisma.problem.update({
    where: { id },
    data: {
      ...next,
      drillCompletions: { increment: 1 },
      lastDrilledAt: now,
    },
    include: problemInclude,
  });

  await createDatabaseBackup("problem-review");
  return problem;
}

/** Maps to a Good grade for backward compatibility. */
export async function markDrilled(id: string) {
  return reviewProblem(id, "good");
}

export async function undoDrilled(id: string) {
  const problem = await prisma.problem.findUnique({ where: { id } });
  if (!problem) throw new Error("Problem not found");

  const updatedProblem = await prisma.problem.update({
    where: { id },
    data: {
      drillCompletions: Math.max(0, problem.drillCompletions - 1),
    },
    include: problemInclude,
  });

  await createDatabaseBackup("problem-undo-drilled");
  return updatedProblem;
}

export async function setSrsEnabled(id: string, enabled: boolean) {
  const problem = await prisma.problem.update({
    where: { id },
    data: {
      srsEnabled: enabled,
      // Resuming with no schedule puts it back in the due queue.
      ...(enabled && { nextReviewAt: new Date() }),
    },
    include: problemInclude,
  });

  await createDatabaseBackup("problem-srs-toggle");
  return problem;
}

export async function resetSrs(id: string) {
  const now = new Date();
  const problem = await prisma.problem.update({
    where: { id },
    data: {
      srsEnabled: true,
      srsRepetitions: 0,
      srsEaseFactor: DEFAULT_EASE,
      srsIntervalDays: 0,
      nextReviewAt: now,
      lastReviewGrade: null,
    },
    include: problemInclude,
  });

  await createDatabaseBackup("problem-srs-reset");
  return problem;
}

/** One-time style backfill: null nextReviewAt + enabled → due now. */
export async function backfillNullNextReview() {
  const result = await prisma.problem.updateMany({
    where: { srsEnabled: true, nextReviewAt: null },
    data: { nextReviewAt: new Date() },
  });
  return result.count;
}
