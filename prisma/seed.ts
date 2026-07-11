import { prisma } from "../src/lib/prisma";
import { backfillNullNextReview } from "../src/lib/services/problem.service";

const PLATFORMS = [
  { slug: "leetcode", name: "Leetcode" },
  { slug: "codeforces", name: "Codeforces" },
  { slug: "cses", name: "CSES" },
  { slug: "atcoder", name: "AtCoder" },
  { slug: "codechef", name: "Codechef" },
  { slug: "usaco", name: "USACO" },
  { slug: "spoj", name: "SPOJ" },
  { slug: "uva", name: "UVa" },
] as const;

async function main() {
  console.log("🌱 Seeding platforms...");

  for (const platform of PLATFORMS) {
    await prisma.platform.upsert({
      where: { slug: platform.slug },
      update: { name: platform.name },
      create: { slug: platform.slug, name: platform.name },
    });
    console.log(`  ✓ ${platform.name}`);
  }

  console.log("✅ Seed complete.");

  const backfilled = await backfillNullNextReview();
  if (backfilled > 0) {
    console.log(`🔁 Backfilled ${backfilled} existing problem(s) into the review queue (due now).`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
