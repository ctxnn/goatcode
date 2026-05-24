import { prisma } from "../prisma";
import { createDatabaseBackup } from "../db-backup";
import type { Prisma } from "@prisma/client";

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
    include: {
      platform: true,
      problemTags: { include: { tag: true } },
      solutions: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listProblemsPaged(input: {
  page?: number;
  pageSize?: number;
  greatOnly?: boolean;
  platformId?: string;
  tagId?: string;
}) {
  const page = input.page || 1;
  const pageSize = input.pageSize || 20;

  const where: Prisma.ProblemWhereInput = {};
  if (input.greatOnly) where.isGreatProblem = true;
  if (input.platformId) where.platformId = input.platformId;
  if (input.tagId) {
    where.problemTags = { some: { tagId: input.tagId } };
  }

  const [items, total] = await Promise.all([
    prisma.problem.findMany({
      where,
      include: {
        platform: true,
        problemTags: { include: { tag: true } },
        solutions: true,
      },
      orderBy: { createdAt: "desc" },
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
    include: {
      platform: true,
      problemTags: { include: { tag: true } },
      solutions: true,
    },
  });
}

export async function createProblem(data: ProblemInput) {
  const { tags, solutions, ...rest } = data;

  const problem = await prisma.problem.create({
    data: {
      ...rest,
      problemTags: tags ? {
        create: tags.map(t => ({
          tagId: t.tagId,
          role: t.role,
          tagDifficulty: t.tagDifficulty,
          isInstructive: t.isInstructive,
        })),
      } : undefined,
      solutions: solutions ? {
        create: solutions.map(s => ({
          language: s.language,
          submissionUrl: s.submissionUrl,
          githubUrl: s.githubUrl,
          localPath: s.localPath,
        })),
      } : undefined,
    },
    include: {
      platform: true,
      problemTags: { include: { tag: true } },
      solutions: true,
    },
  });

  await createDatabaseBackup("problem-create");
  return problem;
}

export async function updateProblem(id: string, data: Partial<ProblemInput>) {
  const { tags, solutions, ...rest } = data;

  const problem = await prisma.$transaction(async (tx) => {
    // If tags are provided, replace them all
    if (tags) {
      await tx.problemTag.deleteMany({ where: { problemId: id } });
    }
    // If solutions are provided, replace them all
    if (solutions) {
      await tx.solution.deleteMany({ where: { problemId: id } });
    }

    return tx.problem.update({
      where: { id },
      data: {
        ...rest,
        ...(tags && {
          problemTags: {
            create: tags.map(t => ({
              tagId: t.tagId,
              role: t.role,
              tagDifficulty: t.tagDifficulty,
              isInstructive: t.isInstructive,
            })),
          },
        }),
        ...(solutions && {
          solutions: {
            create: solutions.map(s => ({
              language: s.language,
              submissionUrl: s.submissionUrl,
              githubUrl: s.githubUrl,
              localPath: s.localPath,
            })),
          },
        }),
      },
      include: {
        platform: true,
        problemTags: { include: { tag: true } },
        solutions: true,
      },
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

export async function markDrilled(id: string) {
  const problem = await prisma.problem.update({
    where: { id },
    data: {
      drillCompletions: { increment: 1 },
      lastDrilledAt: new Date(),
    },
    include: {
      platform: true,
      problemTags: { include: { tag: true } },
      solutions: true,
    },
  });

  await createDatabaseBackup("problem-mark-drilled");
  return problem;
}

export async function undoDrilled(id: string) {
  const problem = await prisma.problem.findUnique({ where: { id } });
  if (!problem) throw new Error("Problem not found");
  
  const updatedProblem = await prisma.problem.update({
    where: { id },
    data: {
      drillCompletions: Math.max(0, problem.drillCompletions - 1),
    },
    include: {
      platform: true,
      problemTags: { include: { tag: true } },
      solutions: true,
    },
  });

  await createDatabaseBackup("problem-undo-drilled");
  return updatedProblem;
}
