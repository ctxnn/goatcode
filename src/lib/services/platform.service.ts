import { prisma } from "../prisma";
import { createDatabaseBackup } from "../db-backup";

export async function listPlatforms() {
  return prisma.platform.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getPlatformById(id: string) {
  return prisma.platform.findUnique({
    where: { id },
  });
}

export async function createPlatform(data: { name: string; slug: string }) {
  const platform = await prisma.platform.create({
    data,
  });

  await createDatabaseBackup("platform-create");
  return platform;
}

export async function updatePlatform(id: string, data: { name?: string; slug?: string }) {
  const platform = await prisma.platform.update({
    where: { id },
    data,
  });

  await createDatabaseBackup("platform-update");
  return platform;
}

export async function deletePlatform(id: string) {
  const platform = await prisma.platform.delete({
    where: { id },
  });

  await createDatabaseBackup("platform-delete");
  return platform;
}
