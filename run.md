# Run & Operate GoatCode

This guide covers setup, daily usage, the spaced-repetition workflow, backups, and operations.
For a feature overview, see [README.md](./README.md).

## Prerequisites

- Node.js 18+ (native `fetch` is used for the LeetCode pull-in)
- npm

## First-time setup

```bash
npm install
npx prisma db push      # create SQLite schema (adds the SRS columns + index)
npm run prisma:seed     # insert platforms + backfill any existing problems into the review queue
npm run dev             # start the app
```

Open **http://localhost:3000**. (`/admin` is a legacy route that 307-redirects to `/`.)

Data lives in `prisma/dev.db` (git-ignored). Backups are written to `backups/sqlite/`
automatically on every create / update / delete / review.

## Daily workflow (spaced repetition)

The Review tab is your **“what should I drill today?”** queue. “Due” means the problem is
**scheduled for re-practice now** (enough time passed since the last review, or it was just added),
not “a problem you solved recently.”

1. Open **Review** — see problems due today (sidebar badge = due count).
2. **Recall first.** From memory, reconstruct the approach / aha moment. *Do not open the link yet.*
3. Open the problem link / your notes to check how close you were.
4. **Grade the recall** (not the problem’s difficulty):

   | Grade  | Meaning            | What happens                                                                 |
   |--------|--------------------|------------------------------------------------------------------------------|
   | Again  | Blank / forgot    | Streak resets; due again in ~1 day; ease factor drops (min 1.3)              |
   | Hard   | Recalled w/ struggle | Shorter interval growth (×1.2); stays closer in the schedule               |
   | Good   | Solid recall      | Normal SM-2 growth (interval × ease); first success = 1 day, then 3 days…   |
   | Easy   | Trivial / instant | Longer interval (× ease × 1.3); ease nudges up                              |

5. The problem leaves the due queue and returns after its computed interval.
6. **Problems** tab shows each card’s SRS status (“Due” / “in 5d” / “Paused”), with compact
   grade buttons plus **Pause SRS** / **Resume SRS** / **Reset SRS**.
   - **Pause SRS** — stop scheduling this problem (excluded from due); Resume re-due’s it.
   - **Reset SRS** — back to a brand-new card (due immediately, streak 0).

> Grade by *how easily you recalled*, not by how hard the problem is. A “Hard” LeetCode problem
> you now recall instantly should be graded **Easy**.

## Adding a problem (platform pull-in)

1. Click **Add Problem** (or the Problems tab).
2. Paste a problem URL from a supported platform and click **Fetch Problem**:
   - **LeetCode** — `https://leetcode.com/problems/two-sum/` (also `leetcode.cn`, or a bare slug). Pulls title, difficulty, a short statement, and topic tags.
   - **Codeforces** — `https://codeforces.com/problemset/problem/1462/A` or `.../contest/1462/problem/A` (also bare `1462A`). Pulls title, rating, and tags.
   - **AtCoder** — `https://atcoder.jp/contests/abc123/tasks/abc123_a`. Pulls title, difficulty, and tags.
   - **CSES** — `https://cses.fi/problemset/task/1068/`. Pulls the title (no public difficulty/tags).
   - **USACO** — `https://usaco.org/index.php?page=viewproblem2&cpid=1`. Pulls the title when reachable.
3. The form autofills title, platform, difficulty, normalized difficulty, and **topic tags**
   (missing tags are auto-created; toggle off to disable).
4. Add your **Notes / Aha Moment** and solution links — these are the valuable part.
5. Save. The problem is enrolled in SRS and becomes **due immediately** (one-time first review).

> ### ⚠️ Why AtCoder and USACO auto-fetch often fail (read this)
>
> The fetch runs from the GoatCode **server** (Node `fetch`), not your browser. Two platforms sit
> behind anti-bot protection and will block that server-side request:
>
> - **AtCoder** — uses the `kenkoooo` v3 API (`kenkoooo.com/atcoder/api/v3/problem?id=...`) for
>   title / difficulty / tags. **That API returns 404 / is Cloudflare-blocked for server-side
>   fetches from many networks** (it failed from the dev sandbox). When blocked, the app throws a
>   clear error and you add the problem manually.
> - **USACO** — `usaco.org` serves a **Cloudflare challenge** page to automated requests, so the
>   server fetch can never read the problem. The app detects this and reports:
>   *"USACO blocked this request (Cloudflare challenge). Please add the problem manually."*
>
> **LeetCode, Codeforces, and CSES** currently allow server-side fetches and work reliably.
> **CSES and USACO also have no public difficulty/tags**, so even on success they only autofill
> the **title** (you set difficulty/tags yourself). A failed fetch **never writes to the
> database** — it only shows an error, and the URL you pasted is kept in the form.

Non-supported / invalid URLs show a clear error and never write to the database.
Other platforms can still be added manually (fill in the fields by hand).

## Backups & restore

Automatic on every write. Manual helpers:

```bash
npm run db:backup          # create a timestamped backup now
npm run db:backups:list    # list available backups
npm run db:restore         # restore the latest backup
```

## Tests

The SM-2 scheduler (`src/lib/srs.ts`) has dependency-free unit tests (runs via `tsx`, no extra deps):

```bash
npx tsx scripts/test-srs.ts
```

Covers grade→quality mapping, interval progression (1→3→… days), ease updates/clamping,
`formatNextReview`, and `isDue` logic.

## Quality gates

```bash
npm run lint     # eslint
npm run build    # production build + full TypeScript typecheck
```

## Database maintenance

```bash
npx prisma db push     # apply schema changes to prisma/dev.db
npm run prisma:seed    # re-seed platforms; also backfills NULL nextReviewAt -> due now
```

## Scripts reference

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start the dev server on :3000 |
| `npm run build` | Production build + typecheck |
| `npm run lint` | ESLint |
| `npx prisma db push` | Sync SQLite schema |
| `npm run prisma:seed` | Seed platforms + backfill review queue |
| `npm run db:backup` | Manual timestamped backup |
| `npm run db:backups:list` | List backups |
| `npm run db:restore` | Restore latest backup |
| `npx tsx scripts/test-srs.ts` | Run SRS unit tests |

## Architecture pointers

- **Scheduler (pure, no DB):** `src/lib/srs.ts`
- **LeetCode fetch:** `src/lib/services/leetcode.service.ts`
- **Problem service / SRS ops:** `src/lib/services/problem.service.ts`
- **tRPC routers:** `src/server/routers/problem.router.ts`
- **UI (single workspace):** `src/app/page.tsx`, `src/app/_components/`
