/**
 * Dependency-free unit tests for src/lib/srs.ts
 * Run with: npx tsx scripts/test-srs.ts
 */
import assert from "node:assert";
import {
  gradeToQuality,
  updateEaseFactor,
  applySm2,
  formatNextReview,
  isDue,
  DEFAULT_EASE,
  MIN_EASE,
  type SrsState,
} from "../src/lib/srs";

let passed = 0;
function test(name: string, fn: () => void): void {
  fn();
  passed++;
  console.log(`  ok - ${name}`);
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-07-11T12:00:00.000Z");

function freshState(): SrsState {
  return {
    srsRepetitions: 0,
    srsEaseFactor: DEFAULT_EASE,
    srsIntervalDays: 0,
    nextReviewAt: null,
    lastReviewGrade: null,
  };
}

console.log("Running srs.ts unit tests...\n");

test("gradeToQuality maps all four grades", () => {
  assert.strictEqual(gradeToQuality("again"), 1);
  assert.strictEqual(gradeToQuality("hard"), 3);
  assert.strictEqual(gradeToQuality("good"), 4);
  assert.strictEqual(gradeToQuality("easy"), 5);
});

test("first 'good' from fresh state -> 1d, reps 1", () => {
  const s = applySm2(freshState(), "good", now);
  assert.strictEqual(s.srsRepetitions, 1);
  assert.strictEqual(s.srsIntervalDays, 1);
  assert.strictEqual(s.lastReviewGrade, "good");
  assert.strictEqual(s.nextReviewAt!.getTime(), now.getTime() + MS_PER_DAY);
  assert.strictEqual(s.srsEaseFactor, DEFAULT_EASE);
});

test("'again' from learned state resets repetitions and decreases ease", () => {
  const learned: SrsState = {
    srsRepetitions: 2,
    srsEaseFactor: 2.0,
    srsIntervalDays: 6,
    nextReviewAt: addDaysLocal(now, 6),
    lastReviewGrade: "good",
  };
  const s = applySm2(learned, "again", now);
  assert.strictEqual(s.srsRepetitions, 0);
  assert.strictEqual(s.srsIntervalDays, 1);
  assert.strictEqual(s.srsEaseFactor, 1.8); // 2.0 - 0.2
  assert.strictEqual(s.nextReviewAt!.getTime(), now.getTime() + MS_PER_DAY);
  assert.strictEqual(s.lastReviewGrade, "again");
});

test("progression good, good, good -> 1, 3, 8 and ease stable at 2.5", () => {
  let s = freshState();
  s = applySm2(s, "good", now);
  assert.strictEqual(s.srsIntervalDays, 1);
  assert.strictEqual(s.srsRepetitions, 1);
  const easeAfterFirst = s.srsEaseFactor;

  s = applySm2(s, "good", now);
  assert.strictEqual(s.srsIntervalDays, 3);
  assert.strictEqual(s.srsRepetitions, 2);

  s = applySm2(s, "good", now);
  assert.strictEqual(s.srsIntervalDays, 8); // round(3 * 2.5) = 8
  assert.strictEqual(s.srsRepetitions, 3);

  // q=4 yields delta 0, so ease stays at the starting value.
  assert.strictEqual(s.srsEaseFactor, easeAfterFirst);
  assert.strictEqual(s.srsEaseFactor, DEFAULT_EASE);
});

test("'easy' yields longer interval than 'good' at same step", () => {
  const base: SrsState = {
    srsRepetitions: 2,
    srsEaseFactor: 2.5,
    srsIntervalDays: 5,
    nextReviewAt: addDaysLocal(now, 5),
    lastReviewGrade: "good",
  };
  const good = applySm2({ ...base }, "good", now);
  const easy = applySm2({ ...base }, "easy", now);
  assert.ok(easy.srsIntervalDays > good.srsIntervalDays);
  // good: round(5*2.5)=13, easy: round(5*2.5*1.3)=round(16.25)=16
  assert.strictEqual(good.srsIntervalDays, 13);
  assert.strictEqual(easy.srsIntervalDays, 16);
});

test("'hard' on second success -> 2 vs 3 for 'good'", () => {
  const base: SrsState = {
    srsRepetitions: 1,
    srsEaseFactor: 2.5,
    srsIntervalDays: 1,
    nextReviewAt: addDaysLocal(now, 1),
    lastReviewGrade: "good",
  };
  const hard = applySm2({ ...base }, "hard", now);
  const good = applySm2({ ...base }, "good", now);
  assert.strictEqual(hard.srsIntervalDays, 2);
  assert.strictEqual(good.srsIntervalDays, 3);
});

test("updateEaseFactor never below MIN_EASE (1.3)", () => {
  let ease = 1.3;
  for (let i = 0; i < 20; i++) {
    ease = updateEaseFactor(ease, 1); // worst quality repeatedly
    assert.ok(ease >= MIN_EASE, `ease dipped below min: ${ease}`);
  }
  assert.strictEqual(ease, MIN_EASE);
});

test("formatNextReview: null/past -> 'Due', ~3d -> 'in 3 days'", () => {
  assert.strictEqual(formatNextReview(null, now), "Due");
  assert.strictEqual(formatNextReview(addDaysLocal(now, -1), now), "Due");
  assert.strictEqual(formatNextReview(addDaysLocal(now, 3), now), "in 3 days");
  assert.strictEqual(formatNextReview(addDaysLocal(now, 1), now), "in 1 day");
});

test("isDue: disabled/past/future/null logic", () => {
  assert.strictEqual(isDue({ srsEnabled: false, nextReviewAt: null }, now), false);
  assert.strictEqual(isDue({ srsEnabled: true, nextReviewAt: null }, now), true);
  assert.strictEqual(
    isDue({ srsEnabled: true, nextReviewAt: addDaysLocal(now, -1) }, now),
    true
  );
  assert.strictEqual(
    isDue({ srsEnabled: true, nextReviewAt: addDaysLocal(now, 1) }, now),
    false
  );
  assert.strictEqual(
    isDue({ srsEnabled: false, nextReviewAt: addDaysLocal(now, 1) }, now),
    false
  );
});

function addDaysLocal(from: Date, days: number): Date {
  return new Date(from.getTime() + days * MS_PER_DAY);
}

console.log(`\nAll ${passed} tests passed.`);
