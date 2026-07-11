"use client";

import type { ReviewGrade } from "../../lib/srs";

const GRADES: Array<{ grade: ReviewGrade; label: string; hint: string; className: string }> = [
  { grade: "again", label: "Again", hint: "Forgot", className: "btn-grade btn-grade-again" },
  { grade: "hard", label: "Hard", hint: "Struggle", className: "btn-grade btn-grade-hard" },
  { grade: "good", label: "Good", hint: "Solid", className: "btn-grade btn-grade-good" },
  { grade: "easy", label: "Easy", hint: "Trivial", className: "btn-grade btn-grade-easy" },
];

export function GradeButtons({
  onGrade,
  disabled,
  compact,
}: {
  onGrade: (grade: ReviewGrade) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`grade-buttons ${compact ? "grade-buttons-compact" : ""}`}>
      {GRADES.map((item) => (
        <button
          key={item.grade}
          type="button"
          className={`btn btn-xs ${item.className}`}
          disabled={disabled}
          onClick={() => onGrade(item.grade)}
          title={item.hint}
        >
          <span>{item.label}</span>
          {!compact && <small>{item.hint}</small>}
        </button>
      ))}
    </div>
  );
}
