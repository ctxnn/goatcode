"use client";

import Link from "next/link";
import { trpc } from "./providers";

export default function Home() {
  const { data: platforms } = trpc.platform.list.useQuery();
  const { data: tags } = trpc.tag.list.useQuery();
  const { data: recentProblems } = trpc.problem.listPaged.useQuery({ pageSize: 6 });
  const { data: greatProblems } = trpc.problem.listPaged.useQuery({
    pageSize: 1,
    greatOnly: true,
  });

  const problems = recentProblems?.items ?? [];
  const latestProblem = problems[0];

  return (
    <div className="app-shell">
      <header className="nav">
        <Link href="/" className="nav-logo">
          <span className="nav-logo-icon">🐐</span> GoatCode
        </Link>
        <div className="nav-links">
          <Link href="/admin" className="nav-link nav-link-primary">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="container dashboard-shell">
        <section className="dashboard-hero">
          <div className="dashboard-hero-copy">
            <span className="eyebrow">training vault</span>
            <h1 className="dashboard-title">GoatCode</h1>
            <p className="dashboard-subtitle">
              Track problems, capture the insight, and build a review bank that survives both forgetfulness and hard drives.
            </p>
            <div className="hero-actions">
              <Link href="/admin" className="btn btn-primary">
                Manage Problems
              </Link>
              {latestProblem && (
                <a href={latestProblem.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                  Resume Latest
                </a>
              )}
            </div>
          </div>

          <div className="dashboard-focus-panel">
            <span className="panel-kicker">latest entry</span>
            {latestProblem ? (
              <>
                <h2>{latestProblem.title}</h2>
                <div className="problem-meta">
                  <span className={`badge badge-${latestProblem.platform.slug}`}>{latestProblem.platform.name}</span>
                  {latestProblem.platformDifficulty && <span className="badge">{latestProblem.platformDifficulty}</span>}
                  {latestProblem.isGreatProblem && <span className="badge badge-great">Great</span>}
                </div>
                {latestProblem.notes && <p className="panel-note">{latestProblem.notes}</p>}
              </>
            ) : (
              <>
                <h2>Ready for your first problem</h2>
                <p className="panel-note">
                  Add a problem with its core idea, difficulty, tags, and solution links. GoatCode will keep it in SQLite and back it up after writes.
                </p>
              </>
            )}
          </div>
        </section>

        <section className="metric-grid">
          <div className="metric-card accent-blue">
            <span className="metric-value">{recentProblems?.total ?? 0}</span>
            <span className="metric-label">Problems</span>
          </div>
          <div className="metric-card accent-amber">
            <span className="metric-value">{greatProblems?.total ?? 0}</span>
            <span className="metric-label">Great Picks</span>
          </div>
          <div className="metric-card accent-teal">
            <span className="metric-value">{platforms?.length ?? 0}</span>
            <span className="metric-label">Platforms</span>
          </div>
          <div className="metric-card accent-rose">
            <span className="metric-value">{tags?.length ?? 0}</span>
            <span className="metric-label">Tags</span>
          </div>
        </section>

        <section className="content-grid">
          <div className="workspace-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">queue</span>
                <h2>Recent Problems</h2>
              </div>
              <Link href="/admin" className="text-link">
                Open admin
              </Link>
            </div>

            <div className="problem-list compact">
              {problems.map((problem) => (
                <article key={problem.id} className="problem-row">
                  <div>
                    <a href={problem.url} target="_blank" rel="noopener noreferrer" className="problem-row-title">
                      {problem.title}
                    </a>
                    <div className="problem-meta">
                      <span className={`badge badge-${problem.platform.slug}`}>{problem.platform.name}</span>
                      {problem.platformDifficulty && <span className="badge">{problem.platformDifficulty}</span>}
                      {problem.tags?.slice(0, 3).map((tag) => (
                        <span key={tag.tagId} className="badge badge-tag">
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="row-count">{problem.solutions?.length ?? 0} code</span>
                </article>
              ))}

              {problems.length === 0 && (
                <div className="empty-state elevated">
                  <div className="empty-state-icon">+</div>
                  <div className="empty-state-text">No problems yet. Start the vault from the admin dashboard.</div>
                </div>
              )}
            </div>
          </div>

          <aside className="workspace-panel platform-strip">
            <div className="section-heading">
              <div>
                <span className="eyebrow">sources</span>
                <h2>Platforms</h2>
              </div>
            </div>
            <div className="platform-grid">
              {(platforms ?? []).map((platform) => (
                <span key={platform.id} className={`platform-pill platform-${platform.slug}`}>
                  {platform.name}
                </span>
              ))}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
