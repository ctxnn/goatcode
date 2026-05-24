import { prisma } from "../prisma";
import { createDatabaseBackup } from "../db-backup";
import type { Prisma } from "@prisma/client";

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

export async function listTags() {
  return prisma.tag.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getTagById(id: string) {
  return prisma.tag.findUnique({
    where: { id },
  });
}

export async function createTag(data: { name: string; description?: string }) {
  const slug = generateSlug(data.name);
  const tag = await prisma.tag.create({
    data: {
      ...data,
      slug,
    },
  });

  await createDatabaseBackup("tag-create");
  return tag;
}

export async function updateTag(id: string, data: { name?: string; description?: string }) {
  const updateData: Prisma.TagUpdateInput = { ...data };
  if (data.name) {
    updateData.slug = generateSlug(data.name);
  }
  const tag = await prisma.tag.update({
    where: { id },
    data: updateData,
  });

  await createDatabaseBackup("tag-update");
  return tag;
}

export async function deleteTag(id: string) {
  const tag = await prisma.tag.delete({
    where: { id },
  });

  await createDatabaseBackup("tag-delete");
  return tag;
}
