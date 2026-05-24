"use client";

import { keepPreviousData } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import ProblemForm from "./_components/problem-form";
import { LocalSolutionViewer } from "./_components/local-solution-viewer";
import { trpc } from "../providers";

type AdminTab = "problems" | "tags" | "platforms";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("problems");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [platformFilter, setPlatformFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [greatOnly, setGreatOnly] = useState(false);
  const [tagForm, setTagForm] = useState({ name: "", description: "" });
  const [platformForm, setPlatformForm] = useState({ name: "", slug: "" });
  const [statusMessage, setStatusMessage] = useState("");

  const { data: platforms, refetch: refetchPlatforms } = trpc.platform.list.useQuery();
  const { data: tags, refetch: refetchTags } = trpc.tag.list.useQuery();
  const { data: allProblems } = trpc.problem.listPaged.useQuery({ pageSize: 1 });
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
  const taggedCount = visibleProblems.filter((problem) => (problem.tags?.length ?? 0) > 0).length;

  const deleteProblem = trpc.problem.delete.useMutation({
    onSuccess: () => {
      setStatusMessage("Problem deleted. A database backup was created.");
      refetchProblems();
    },
  });

  const markDrilled = trpc.problem.markDrilled.useMutation({
    onSuccess: () => {
      setStatusMessage("Drill count updated. A database backup was created.");
      refetchProblems();
    },
  });

  const undoDrilled = trpc.problem.undoDrilled.useMutation({
    onSuccess: () => {
      setStatusMessage("Drill count rolled back. A database backup was created.");
      refetchProblems();
    },
  });

  const createTag = trpc.tag.create.useMutation({
    onSuccess: () => {
      setTagForm({ name: "", description: "" });
      setStatusMessage("Tag created. A database backup was created.");
      refetchTags();
    },
  });

  const deleteTag = trpc.tag.delete.useMutation({
    onSuccess: () => {
      setStatusMessage("Tag deleted. A database backup was created.");
      refetchTags();
      refetchProblems();
    },
  });

  const createPlatform = trpc.platform.create.useMutation({
    onSuccess: () => {
      setPlatformForm({ name: "", slug: "" });
      setStatusMessage("Platform created. A database backup was created.");
      refetchPlatforms();
    },
  });

  const deletePlatform = trpc.platform.delete.useMutation({
    onSuccess: () => {
      setStatusMessage("Platform deleted. A database backup was created.");
      refetchPlatforms();
      refetchProblems();
    },
  });

  const submitTag = (event: React.FormEvent) => {
    event.preventDefault();
    if (!tagForm.name.trim()) return;

    createTag.mutate({
      name: tagForm.name.trim(),
      description: tagForm.description.trim() || undefined,
    });
  };

  const submitPlatform = (event: React.FormEvent) => {
    event.preventDefault();
    const name = platformForm.name.trim();
    const slug = platformForm.slug.trim() || slugify(name);
    if (!name || !slug) return;

    createPlatform.mutate({ name, slug });
  };

  return (
    <div className="app-shell">
      <header className="nav">
        <Link href="/" className="nav-logo">
          <span className="nav-logo-icon">🐐</span> GoatCode Admin
        </Link>
        <div className="nav-links">
          <Link href="/" className="nav-link">
            Back to Home
          </Link>
        </div>
      </header>

      <main className="container admin-shell">
        <section className="admin-header">
          <div>
            <span className="eyebrow">control room</span>
            <h1 className="page-title">Training Dashboard</h1>
            <p className="page-subtitle">Add problems, shape your tag library, and keep review-worthy insights close.</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setActiveTab("problems");
              setShowCreateForm((value) => !value);
            }}
          >
            {activeTab === "problems" && showCreateForm ? "Close Form" : "Add Problem"}
          </button>
        </section>

        <section className="metric-grid admin-metrics">
          <div className="metric-card accent-blue">
            <span className="metric-value">{allProblems?.total ?? 0}</span>
            <span className="metric-label">Total Problems</span>
          </div>
          <div className="metric-card accent-amber">
            <span className="metric-value">{visibleProblems.filter((problem) => problem.isGreatProblem).length}</span>
            <span className="metric-label">Great In View</span>
          </div>
          <div className="metric-card accent-teal">
            <span className="metric-value">{taggedCount}</span>
            <span className="metric-label">Tagged In View</span>
          </div>
          <div className="metric-card accent-rose">
            <span className="metric-value">{platforms?.length ?? 0}</span>
            <span className="metric-label">Platforms</span>
          </div>
        </section>

        {statusMessage && <div className="status-banner">{statusMessage}</div>}

        <div className="admin-layout">
          <aside className="admin-sidebar">
            <button className={`side-tab ${activeTab === "problems" ? "active" : ""}`} onClick={() => setActiveTab("problems")}>
              <span>Problems</span>
              <strong>{problems?.total ?? 0}</strong>
            </button>
            <button className={`side-tab ${activeTab === "tags" ? "active" : ""}`} onClick={() => setActiveTab("tags")}>
              <span>Tags</span>
              <strong>{tags?.length ?? 0}</strong>
            </button>
            <button className={`side-tab ${activeTab === "platforms" ? "active" : ""}`} onClick={() => setActiveTab("platforms")}>
              <span>Platforms</span>
              <strong>{platforms?.length ?? 0}</strong>
            </button>
          </aside>

          <section className="admin-workspace">
            {activeTab === "problems" && showCreateForm && (
              <ProblemForm
                onSuccess={() => {
                  setShowCreateForm(false);
                  setStatusMessage("Problem saved. A database backup was created.");
                  refetchProblems();
                }}
              />
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
                  <select className="select" value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value)}>
                    <option value="">All Platforms</option>
                    {(platforms ?? []).map((platform) => (
                      <option key={platform.id} value={platform.id}>
                        {platform.name}
                      </option>
                    ))}
                  </select>
                  <select className="select" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
                    <option value="">All Tags</option>
                    {(tags ?? []).map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                  <label className="toggle-row">
                    <input type="checkbox" checked={greatOnly} onChange={(event) => setGreatOnly(event.target.checked)} />
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
                          </div>

                          <div className="problem-meta">
                            {problem.tags?.length ? (
                              problem.tags.map((tag) => (
                                <span key={tag.tagId} className="badge badge-tag">
                                  {tag.name}
                                  {tag.tagDifficulty ? ` ${tag.tagDifficulty}/10` : ""}
                                </span>
                              ))
                            ) : (
                              <span className="muted-text">No tags yet</span>
                            )}
                          </div>
                        </div>

                        <div className="problem-score">
                          <strong>{problem.drillCompletions}</strong>
                          <span>drills</span>
                        </div>
                      </div>

                      {problem.simplifiedStatement && <p className="problem-summary">{problem.simplifiedStatement}</p>}
                      {problem.notes && <div className="problem-notes">{problem.notes}</div>}

                      <div className="problem-footer">
                        <div className="problem-solutions" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {problem.solutions?.length ? (
                            problem.solutions.map((solution) => (
                              <div key={solution.id} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
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
                                {solution.localPath && (
                                  <LocalSolutionViewer localPath={solution.localPath} />
                                )}
                              </div>
                            ))
                          ) : (
                            <span className="muted-text">No solution link</span>
                          )}
                        </div>

                        <div className="problem-actions">
                          <button
                            className="btn btn-xs btn-ghost"
                            onClick={() => markDrilled.mutate({ id: problem.id })}
                            disabled={markDrilled.isPending}
                          >
                            Mark Drilled
                          </button>
                          <button
                            className="btn btn-xs btn-ghost"
                            onClick={() => undoDrilled.mutate({ id: problem.id })}
                            disabled={undoDrilled.isPending || problem.drillCompletions === 0}
                          >
                            Undo
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
                    </article>
                  ))}

                  {visibleProblems.length === 0 && (
                    <div className="empty-state elevated">
                      <div className="empty-state-icon">+</div>
                      <div className="empty-state-text">No problems match this view.</div>
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

                <form className="management-form" onSubmit={submitTag}>
                  <input
                    className="input"
                    value={tagForm.name}
                    onChange={(event) => setTagForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Dynamic Programming"
                  />
                  <input
                    className="input"
                    value={tagForm.description}
                    onChange={(event) => setTagForm((current) => ({ ...current, description: event.target.value }))}
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
                          if (confirm("Delete this tag?")) {
                            deleteTag.mutate({ id: tag.id });
                          }
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

                <form className="management-form" onSubmit={submitPlatform}>
                  <input
                    className="input"
                    value={platformForm.name}
                    onChange={(event) => setPlatformForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Kattis"
                  />
                  <input
                    className="input"
                    value={platformForm.slug}
                    onChange={(event) => setPlatformForm((current) => ({ ...current, slug: event.target.value }))}
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
                          if (confirm(`Delete ${platform.name}? Problems on this platform will block deletion.`)) {
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
