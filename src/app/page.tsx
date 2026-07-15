"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import ProblemForm, { type EditProblemInput } from "./_components/problem-form";
import { LocalSolutionViewer } from "./_components/local-solution-viewer";
import { GradeButtons } from "./_components/grade-buttons";
import { trpc } from "./providers";
import { formatNextReview, type ReviewGrade } from "../lib/srs";
import Link from "next/link";

type WorkspaceTab = "review" | "problems" | "tags" | "platforms";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

function asDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function srsLabel(problem: { srsEnabled: boolean; nextReviewAt: unknown }) {
  if (!problem.srsEnabled) return "Paused";
  return formatNextReview(asDate(problem.nextReviewAt));
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("review");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProblem, setEditingProblem] = useState<EditProblemInput | null>(null);
  const [platformFilter, setPlatformFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [greatOnly, setGreatOnly] = useState(false);
  const [tagForm, setTagForm] = useState({ name: "", description: "" });
  const [platformForm, setPlatformForm] = useState({ name: "", slug: "" });
  const [statusMessage, setStatusMessage] = useState("");

  const { data: platforms, refetch: refetchPlatforms } = trpc.platform.list.useQuery();
  const { data: tags, refetch: refetchTags } = trpc.tag.list.useQuery();
  const { data: srsStats, refetch: refetchSrsStats } = trpc.problem.srsStats.useQuery();
  const { data: dueProblems, refetch: refetchDue } = trpc.problem.listDue.useQuery({ limit: 50 });
  const { data: upcoming } = trpc.problem.listUpcoming.useQuery({ days: 7, limit: 8 });

  const { data: problems, refetch: refetchProblems } = trpc.problem.listPaged.useQuery(
    {
      pageSize: 50,
      platformId: platformFilter || undefined,
      tagId: tagFilter || undefined,
      greatOnly: greatOnly || undefined,
    },
    { placeholderData: keepPreviousData }
  );

  const visibleProblems = problems?.items ?? [];
  const dueList = dueProblems ?? [];

  const review = trpc.problem.review.useMutation({
    onSuccess: (problem) => {
      const next = asDate(problem.nextReviewAt);
      setStatusMessage(
        `Graded “${problem.title}”. Next review: ${formatNextReview(next)} (interval ${problem.srsIntervalDays}d).`
      );
      refetchDue();
      refetchProblems();
      refetchSrsStats();
    },
  });

  const setSrsEnabled = trpc.problem.setSrsEnabled.useMutation({
    onSuccess: (problem) => {
      setStatusMessage(problem.srsEnabled ? `SRS resumed for “${problem.title}”.` : `SRS paused for “${problem.title}”.`);
      refetchDue();
      refetchProblems();
      refetchSrsStats();
    },
  });

  const resetSrs = trpc.problem.resetSrs.useMutation({
    onSuccess: (problem) => {
      setStatusMessage(`SRS reset for “${problem.title}” — due now.`);
      refetchDue();
      refetchProblems();
      refetchSrsStats();
    },
  });

  const deleteProblem = trpc.problem.delete.useMutation({
    onSuccess: () => {
      setStatusMessage("Problem deleted. A database backup was created.");
      refetchProblems();
      refetchDue();
      refetchSrsStats();
    },
  });

  const createTag = trpc.tag.create.useMutation({
    onSuccess: () => {
      setTagForm({ name: "", description: "" });
      setStatusMessage("Tag created.");
      refetchTags();
    },
  });

  const deleteTag = trpc.tag.delete.useMutation({
    onSuccess: () => {
      setStatusMessage("Tag deleted.");
      refetchTags();
      refetchProblems();
    },
  });

  const createPlatform = trpc.platform.create.useMutation({
    onSuccess: () => {
      setPlatformForm({ name: "", slug: "" });
      setStatusMessage("Platform created.");
      refetchPlatforms();
    },
  });

  const deletePlatform = trpc.platform.delete.useMutation({
    onSuccess: () => {
      setStatusMessage("Platform deleted.");
      refetchPlatforms();
      refetchProblems();
    },
  });

  const gradeBusy = review.isPending;

  const onGrade = (id: string, grade: ReviewGrade) => {
    review.mutate({ id, grade });
  };

  const dueCount = srsStats?.dueCount ?? dueList.length;

  const emptyDueHint = useMemo(
    () =>
      (srsStats?.totalProblems ?? 0) === 0
        ? "Add a problem after you solve it. It will show up here as due so you can schedule the next re-practice."
        : "Nothing due right now. Come back when scheduled reviews mature, or add a new problem.",
    [srsStats?.totalProblems]
  );

  return (
    <div className="app-shell">
      <header className="nav">
        <Link href="/" className="nav-logo">
          <span className="nav-logo-icon">🐐</span> GoatCode
        </Link>
        <div className="nav-links">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setActiveTab("problems");
              setEditingProblem(null);
              setShowCreateForm((value) => !value);
            }}
          >
            {showCreateForm && activeTab === "problems" ? "Close Form" : "Add Problem"}
          </button>
        </div>
      </header>

      <main className="container admin-shell">
        <section className="admin-header">
          <div>
            <span className="eyebrow">personal training vault</span>
            <h1 className="page-title">GoatCode</h1>
            <p className="page-subtitle">
              Save problems after you solve them. Review what is <strong>due</strong> — meaning scheduled for re-practice
              today, not “new solves since a date.”
            </p>
          </div>
        </section>

        <section className="metric-grid admin-metrics">
          <div className="metric-card accent-rose">
            <span className="metric-value">{dueCount}</span>
            <span className="metric-label">Due for review</span>
          </div>
          <div className="metric-card accent-blue">
            <span className="metric-value">{srsStats?.totalProblems ?? 0}</span>
            <span className="metric-label">Problems</span>
          </div>
          <div className="metric-card accent-amber">
            <span className="metric-value">{srsStats?.learningCount ?? 0}</span>
            <span className="metric-label">Learning (&lt;2 successes)</span>
          </div>
          <div className="metric-card accent-teal">
            <span className="metric-value">{(tags ?? []).length}</span>
            <span className="metric-label">Tags</span>
          </div>
        </section>

        {statusMessage && <div className="status-banner">{statusMessage}</div>}

        <div className="admin-layout">
          <aside className="admin-sidebar">
            <button className={`side-tab ${activeTab === "review" ? "active" : ""}`} onClick={() => setActiveTab("review")}>
              <span>Review</span>
              <strong>{dueCount}</strong>
            </button>
            <button
              className={`side-tab ${activeTab === "problems" ? "active" : ""}`}
              onClick={() => setActiveTab("problems")}
            >
              <span>Problems</span>
              <strong>{problems?.total ?? 0}</strong>
            </button>
            <button className={`side-tab ${activeTab === "tags" ? "active" : ""}`} onClick={() => setActiveTab("tags")}>
              <span>Tags</span>
              <strong>{(tags ?? []).length}</strong>
            </button>
            <button
              className={`side-tab ${activeTab === "platforms" ? "active" : ""}`}
              onClick={() => setActiveTab("platforms")}
            >
              <span>Platforms</span>
              <strong>{(platforms ?? []).length}</strong>
            </button>
          </aside>

          <section className="admin-workspace">
            {activeTab === "problems" && showCreateForm && (
              <ProblemForm
                key={editingProblem?.id ?? "new"}
                problem={editingProblem ?? undefined}
                onCancel={() => {
                  setEditingProblem(null);
                  setShowCreateForm(false);
                }}
                onSuccess={() => {
                  const wasEditing = !!editingProblem;
                  setShowCreateForm(false);
                  setEditingProblem(null);
                  setStatusMessage(
                    wasEditing
                      ? "Problem updated."
                      : "Problem saved — it is now due for review so you can schedule the next re-practice."
                  );
                  refetchProblems();
                  refetchDue();
                  refetchSrsStats();
                  if (!wasEditing) setActiveTab("review");
                }}
              />
            )}

            {activeTab === "review" && (
              <div className="workspace-panel animate-fadeIn">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">spaced repetition</span>
                    <h2>Due for re-practice</h2>
                    <p className="panel-note review-explain">
                      These are problems you already saved. They appear here when enough time has passed since the last
                      review (or right after you add them). Open the link, try to recall the approach, then grade yourself.
                    </p>
                  </div>
                  <span className="results-count">{dueCount} due</span>
                </div>

                <div className="problem-list">
                  {dueList.map((problem) => (
                    <article key={problem.id} className="problem-card upgraded-card review-card">
                      <div className="problem-card-main">
                        <div>
                          <div className="problem-title">
                            <a href={problem.url} target="_blank" rel="noopener noreferrer">
                              {problem.title}
                            </a>
                            {problem.isGreatProblem && <span className="badge badge-great">Great</span>}
                            <span className={`badge badge-${problem.platform.slug}`}>{problem.platform.name}</span>
                            {problem.platformDifficulty && <span className="badge">{problem.platformDifficulty}</span>}
                            <span className="badge badge-due">Due</span>
                          </div>
                          <div className="problem-meta">
                            {problem.tags?.length ? (
                              problem.tags.map((tag) => (
                                <span key={tag.tagId} className="badge badge-tag">
                                  {tag.name}
                                </span>
                              ))
                            ) : (
                              <span className="muted-text">No tags</span>
                            )}
                          </div>
                        </div>
                        <div className="problem-score">
                          <strong>{problem.srsIntervalDays}d</strong>
                          <span>interval</span>
                        </div>
                      </div>

                      <div className="review-meta-row">
                        <span className="muted-text text-sm">
                          {problem.lastReviewGrade ? `last grade: ${problem.lastReviewGrade}` : ""}
                          {problem.lastReviewGrade ? ` · ` : ""}
                          {`ease ${problem.srsEaseFactor.toFixed(2)}`}
                        </span>
                      </div>

                      <div className="problem-footer review-footer">
                        <GradeButtons
                          disabled={gradeBusy}
                          onGrade={(grade) => onGrade(problem.id, grade)}
                        />
                        <div className="problem-actions">
                          <button
                            className="btn btn-xs btn-ghost"
                            onClick={() => setSrsEnabled.mutate({ id: problem.id, enabled: false })}
                            disabled={setSrsEnabled.isPending}
                          >
                            Pause SRS
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}

                  {dueList.length === 0 && (
                    <div className="empty-state elevated">
                      <div className="empty-state-icon">✓</div>
                      <div className="empty-state-text">{emptyDueHint}</div>
                    </div>
                  )}
                </div>

                {(upcoming?.length ?? 0) > 0 && (
                  <div className="upcoming-block">
                    <h3 className="upcoming-title">Upcoming (7 days)</h3>
                    <ul className="upcoming-list">
                      {upcoming!.map((problem) => (
                        <li key={problem.id}>
                          <span>{problem.title}</span>
                          <span className="muted-text">{srsLabel(problem)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "problems" && (
              <div className="workspace-panel animate-fadeIn">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">library</span>
                    <h2>Problems</h2>
                  </div>
                  <span className="results-count">{problems?.total ?? 0} matching</span>
                </div>

                <div className="filters-bar elevated-filters">
                  <select className="select" value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}>
                    <option value="">All Platforms</option>
                    {(platforms ?? []).map((platform) => (
                      <option key={platform.id} value={platform.id}>
                        {platform.name}
                      </option>
                    ))}
                  </select>
                  <select className="select" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
                    <option value="">All Tags</option>
                    {(tags ?? []).map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                  <label className="toggle-row">
                    <input type="checkbox" checked={greatOnly} onChange={(e) => setGreatOnly(e.target.checked)} />
                    Great only
                  </label>
                </div>

                <div className="problem-list">
                  {visibleProblems.map((problem) => (
                    <article key={problem.id} className="problem-card upgraded-card">
                      <div className="problem-card-main">
                        <div>
                          <div className="problem-title">
                            <a href={problem.url} target="_blank" rel="noopener noreferrer">
                              {problem.title}
                            </a>
                            {problem.isGreatProblem && <span className="badge badge-great">Great</span>}
                            <span className={`badge badge-${problem.platform.slug}`}>{problem.platform.name}</span>
                            {problem.platformDifficulty && <span className="badge">{problem.platformDifficulty}</span>}
                            <span className={`badge ${problem.srsEnabled ? "badge-srs" : "badge-paused"}`}>
                              {srsLabel(problem)}
                            </span>
                          </div>
                          <div className="problem-meta">
                            {problem.tags?.length ? (
                              problem.tags.map((tag) => (
                                <span key={tag.tagId} className="badge badge-tag">
                                  {tag.name}
                                </span>
                              ))
                            ) : (
                              <span className="muted-text">No tags yet</span>
                            )}
                          </div>
                        </div>
                        <div className="problem-score">
                          <strong>{problem.srsIntervalDays}d</strong>
                          <span>interval</span>
                        </div>
                      </div>

                      {problem.simplifiedStatement && <p className="problem-summary">{problem.simplifiedStatement}</p>}
                      {problem.notes && <div className="problem-notes">{problem.notes}</div>}

                      <div className="problem-footer">
                        <div className="problem-solutions">
                          {problem.solutions?.length ? (
                            problem.solutions.map((solution) => (
                              <div key={solution.id} className="solution-row">
                                <div className="solution-row-links">
                                  <span className="badge">Code ({solution.language})</span>
                                  {(solution.githubUrl || solution.submissionUrl) && (
                                    <a
                                      href={solution.githubUrl || solution.submissionUrl || "#"}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-link text-sm"
                                    >
                                      External Link ↗
                                    </a>
                                  )}
                                </div>
                                {solution.localPath && <LocalSolutionViewer localPath={solution.localPath} />}
                              </div>
                            ))
                          ) : (
                            <span className="muted-text">No solution link</span>
                          )}
                        </div>

                        <div className="problem-actions column-actions">
                          <GradeButtons
                            compact
                            disabled={gradeBusy || !problem.srsEnabled}
                            onGrade={(grade) => onGrade(problem.id, grade)}
                          />
                          <div className="action-row">
                            <button
                              className="btn btn-xs btn-ghost"
                              onClick={() => {
                                setEditingProblem(problem);
                                setActiveTab("problems");
                                setShowCreateForm(true);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-xs btn-ghost"
                              onClick={() =>
                                setSrsEnabled.mutate({ id: problem.id, enabled: !problem.srsEnabled })
                              }
                              disabled={setSrsEnabled.isPending}
                            >
                              {problem.srsEnabled ? "Pause SRS" : "Resume SRS"}
                            </button>
                            <button
                              className="btn btn-xs btn-ghost"
                              onClick={() => {
                                if (confirm("Reset spaced-repetition schedule for this problem?")) {
                                  resetSrs.mutate({ id: problem.id });
                                }
                              }}
                              disabled={resetSrs.isPending}
                            >
                              Reset SRS
                            </button>
                            <button
                              className="btn btn-xs btn-danger"
                              onClick={() => {
                                if (confirm("Delete this problem?")) {
                                  deleteProblem.mutate({ id: problem.id });
                                }
                              }}
                              disabled={deleteProblem.isPending}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}

                  {visibleProblems.length === 0 && (
                    <div className="empty-state elevated">
                      <div className="empty-state-icon">+</div>
                      <div className="empty-state-text">No problems yet. Click Add Problem to start your vault.</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "tags" && (
              <div className="workspace-panel animate-fadeIn">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">taxonomy</span>
                    <h2>Tags</h2>
                  </div>
                </div>

                <form
                  className="management-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!tagForm.name.trim()) return;
                    createTag.mutate({
                      name: tagForm.name.trim(),
                      description: tagForm.description.trim() || undefined,
                    });
                  }}
                >
                  <input
                    className="input"
                    value={tagForm.name}
                    onChange={(e) => setTagForm((c) => ({ ...c, name: e.target.value }))}
                    placeholder="Dynamic Programming"
                  />
                  <input
                    className="input"
                    value={tagForm.description}
                    onChange={(e) => setTagForm((c) => ({ ...c, description: e.target.value }))}
                    placeholder="Optional description"
                  />
                  <button className="btn btn-primary" type="submit" disabled={createTag.isPending}>
                    Add Tag
                  </button>
                </form>

                <div className="collection-grid">
                  {(tags ?? []).map((tag) => (
                    <article key={tag.id} className="collection-card">
                      <div>
                        <strong>{tag.name}</strong>
                        <span>{tag.description || "No description"}</span>
                      </div>
                      <button
                        className="btn btn-xs btn-danger"
                        onClick={() => {
                          if (confirm("Delete this tag?")) deleteTag.mutate({ id: tag.id });
                        }}
                        disabled={deleteTag.isPending}
                      >
                        Delete
                      </button>
                    </article>
                  ))}
                  {(tags ?? []).length === 0 && <div className="empty-state elevated">No tags yet.</div>}
                </div>
              </div>
            )}

            {activeTab === "platforms" && (
              <div className="workspace-panel animate-fadeIn">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">catalog</span>
                    <h2>Platforms</h2>
                  </div>
                </div>

                <form
                  className="management-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const name = platformForm.name.trim();
                    const slug = platformForm.slug.trim() || slugify(name);
                    if (!name || !slug) return;
                    createPlatform.mutate({ name, slug });
                  }}
                >
                  <input
                    className="input"
                    value={platformForm.name}
                    onChange={(e) => setPlatformForm((c) => ({ ...c, name: e.target.value }))}
                    placeholder="Kattis"
                  />
                  <input
                    className="input"
                    value={platformForm.slug}
                    onChange={(e) => setPlatformForm((c) => ({ ...c, slug: e.target.value }))}
                    placeholder="Slug auto-generates"
                  />
                  <button className="btn btn-primary" type="submit" disabled={createPlatform.isPending}>
                    Add Platform
                  </button>
                </form>

                <div className="collection-grid">
                  {(platforms ?? []).map((platform) => (
                    <article key={platform.id} className="collection-card">
                      <div>
                        <strong>{platform.name}</strong>
                        <span>{platform.slug}</span>
                      </div>
                      <button
                        className="btn btn-xs btn-danger"
                        onClick={() => {
                          if (confirm(`Delete ${platform.name}?`)) {
                            deletePlatform.mutate({ id: platform.id });
                          }
                        }}
                        disabled={deletePlatform.isPending || (platforms?.length ?? 0) === 1}
                      >
                        Delete
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
