import { prisma } from "../prisma";
import { createDatabaseBackup } from "../db-backup";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export type SolutionInput = {
  problemId: string;
  language: string;
  submissionUrl?: string;
  githubUrl?: string;
  localPath?: string;
};

export async function getSolutionById(id: string) {
  return prisma.solution.findUnique({
    where: { id },
    include: { problem: true },
  });
}

export async function createSolution(data: SolutionInput) {
  const solution = await prisma.solution.create({
    data,
    include: { problem: true },
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

const SOLUTIONS_BASE_DIR = path.join(process.cwd(), "problems", "solutions");

// Scan directory recursively
async function getFilesRecursive(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const res = path.resolve(dir, entry.name);
    return entry.isDirectory() ? getFilesRecursive(res) : res;
  }));
  return files.flat();
}

export async function getUnlinkedFiles() {
  try {
    const allFilesAbsolute = await getFilesRecursive(SOLUTIONS_BASE_DIR);
    
    // Convert to relative paths based on SOLUTIONS_BASE_DIR
    const allFiles = allFilesAbsolute
      .map(file => path.relative(SOLUTIONS_BASE_DIR, file))
      .filter(file => !file.endsWith('.gitkeep') && !file.startsWith('.DS_Store'));

    // Get all linked local paths from DB
    const linkedSolutions = await prisma.solution.findMany({
      where: { localPath: { not: null } },
      select: { localPath: true },
    });

    const linkedPaths = new Set(linkedSolutions.map(s => s.localPath));

    // Return files that are not linked
    return allFiles.filter(file => !linkedPaths.has(file));
  } catch (error) {
    console.error("Error reading solutions directory:", error);
    return [];
  }
}

export async function readLocalFile(localPath: string) {
  try {
    // Basic security: prevent directory traversal
    const safePath = path.normalize(localPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.join(SOLUTIONS_BASE_DIR, safePath);
    
    // Ensure the final path is still within SOLUTIONS_BASE_DIR
    if (!fullPath.startsWith(SOLUTIONS_BASE_DIR)) {
      throw new Error("Invalid path");
    }

    const content = await fs.readFile(fullPath, 'utf-8');
    return content;
  } catch (error) {
    console.error("Error reading file:", error);
    throw new Error("Could not read file");
  }
}

export async function openInVSCode(localPath: string) {
  try {
    const safePath = path.normalize(localPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.join(SOLUTIONS_BASE_DIR, safePath);
    
    // Using `code` command assuming VS Code is in PATH
    await execAsync(`code "${fullPath}"`);
    return true;
  } catch (error) {
    console.error("Error opening VS Code:", error);
    throw new Error("Could not open VS Code. Make sure 'code' is in your PATH.");
  }
}
