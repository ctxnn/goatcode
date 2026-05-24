import { prisma } from "../prisma";
import { createDatabaseBackup } from "../db-backup";

export async function getSolutionById(id: string) {
  return prisma.solution.findUnique({
    where: { id },
  });
}

export async function createSolution(data: {
  problemId: string;
  language: string;
  submissionUrl?: string;
  githubUrl?: string;
}) {
  const solution = await prisma.solution.create({
    data,
  });

  await createDatabaseBackup("solution-create");
  return solution;
}

export async function deleteSolution(id: string) {
  const solution = await prisma.solution.delete({
    where: { id },
  });

  await createDatabaseBackup("solution-delete");
  return solution;
}
