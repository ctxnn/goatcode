"use client";

import { useState } from "react";
import { trpc } from "../../providers";

export default function ProblemForm({ onSuccess }: { onSuccess: () => void }) {
  const { data: platforms } = trpc.platform.list.useQuery();
  const { data: tags } = trpc.tag.list.useQuery();
  const { data: unlinkedFiles } = trpc.solution.getUnlinkedFiles.useQuery();
  const createProblem = trpc.problem.create.useMutation({
    onSuccess,
  });

  const [formData, setFormData] = useState({
    platformId: "",
    title: "",
    url: "",
    platformProblemId: "",
    platformDifficulty: "",
    normalizedDifficulty: "",
    simplifiedStatement: "",
    notes: "",
    drillType: "",
    drillNotes: "",
    isGreatProblem: false,
    githubUrl: "",
    submissionUrl: "",
    localPath: "",
    language: "C++",
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tagId: string) => {
    setSelectedTags((current) =>
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId]
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.platformId || !formData.title || !formData.url) return;

    createProblem.mutate({
      platformId: formData.platformId,
      title: formData.title.trim(),
      url: formData.url.trim(),
      platformProblemId: formData.platformProblemId.trim() || undefined,
      platformDifficulty: formData.platformDifficulty.trim() || undefined,
      normalizedDifficulty: formData.normalizedDifficulty ? Number(formData.normalizedDifficulty) : undefined,
      simplifiedStatement: formData.simplifiedStatement.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      drillType: formData.drillType || null,
      drillNotes: formData.drillNotes.trim() || undefined,
      isGreatProblem: formData.isGreatProblem,
      tags: selectedTags.length
        ? selectedTags.map((tagId) => ({
            tagId,
            role: "core",
          }))
        : undefined,
      solutions: formData.githubUrl || formData.submissionUrl || formData.localPath
        ? [
            {
              language: formData.language.trim() || "C++",
              githubUrl: formData.githubUrl.trim() || undefined,
              submissionUrl: formData.submissionUrl.trim() || undefined,
              localPath: formData.localPath.trim() || undefined,
            },
          ]
        : undefined,
    });
  };

  return (
    <div className="problem-form-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">new entry</span>
          <h2>Add Problem</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="problem-form">
        <div className="form-grid form-grid-2">
          <div className="form-group">
            <label className="label">Platform *</label>
            <select
              className="select"
              value={formData.platformId}
              onChange={(event) => setFormData({ ...formData, platformId: event.target.value })}
              required
            >
              <option value="">Select Platform</option>
              {(platforms ?? []).map((platform) => (
                <option key={platform.id} value={platform.id}>
                  {platform.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label">Title *</label>
            <input
              type="text"
              className="input"
              value={formData.title}
              onChange={(event) => setFormData({ ...formData, title: event.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Problem URL *</label>
            <input
              type="url"
              className="input"
              value={formData.url}
              onChange={(event) => setFormData({ ...formData, url: event.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Platform Problem ID</label>
            <input
              type="text"
              className="input"
              placeholder="ABC 300 E, 1, 1200A"
              value={formData.platformProblemId}
              onChange={(event) => setFormData({ ...formData, platformProblemId: event.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="label">Platform Difficulty</label>
            <input
              type="text"
              className="input"
              placeholder="Medium, 1500, Div 2 B"
              value={formData.platformDifficulty}
              onChange={(event) => setFormData({ ...formData, platformDifficulty: event.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="label">Normalized Difficulty</label>
            <input
              type="number"
              className="input"
              min={1}
              max={10}
              placeholder="1-10"
              value={formData.normalizedDifficulty}
              onChange={(event) => setFormData({ ...formData, normalizedDifficulty: event.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="label">Simplified Statement</label>
          <input
            type="text"
            className="input"
            value={formData.simplifiedStatement}
            onChange={(event) => setFormData({ ...formData, simplifiedStatement: event.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="label">Notes / Aha Moment</label>
          <textarea
            className="textarea"
            rows={4}
            value={formData.notes}
            onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
          />
        </div>

        <div className="form-grid form-grid-2">
          <div className="form-group">
            <label className="label">Drill Type</label>
            <select
              className="select"
              value={formData.drillType}
              onChange={(event) => setFormData({ ...formData, drillType: event.target.value })}
            >
              <option value="">None</option>
              <option value="mindsolve">Mindsolve</option>
              <option value="implement">Implement</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label">Drill Notes</label>
            <input
              type="text"
              className="input"
              value={formData.drillNotes}
              onChange={(event) => setFormData({ ...formData, drillNotes: event.target.value })}
            />
          </div>
        </div>

        <div className="tag-picker">
          <div className="label">Tags</div>
          <div className="tag-picker-grid">
            {(tags ?? []).map((tag) => (
              <label key={tag.id} className={`tag-check ${selectedTags.includes(tag.id) ? "selected" : ""}`}>
                <input type="checkbox" checked={selectedTags.includes(tag.id)} onChange={() => toggleTag(tag.id)} />
                {tag.name}
              </label>
            ))}
            {(tags ?? []).length === 0 && <span className="muted-text">Create tags from the Tags tab to use them here.</span>}
          </div>
        </div>

        <div className="solution-block refined">
          <div className="solution-header">
            <span className="solution-number">Solution link</span>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={formData.isGreatProblem}
                onChange={(event) => setFormData({ ...formData, isGreatProblem: event.target.checked })}
              />
              Great problem
            </label>
          </div>
          <div className="form-grid form-grid-3">
            <div className="form-group">
              <label className="label">Language</label>
              <input
                type="text"
                className="input"
                value={formData.language}
                onChange={(event) => setFormData({ ...formData, language: event.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="label">Local File (Auto-detected)</label>
              <select
                className="select"
                value={formData.localPath}
                onChange={(event) => setFormData({ ...formData, localPath: event.target.value })}
              >
                <option value="">None (Select an unlinked file)</option>
                {(unlinkedFiles ?? []).map(file => (
                  <option key={file} value={file}>{file}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">GitHub URL</label>
              <input
                type="url"
                className="input"
                value={formData.githubUrl}
                onChange={(event) => setFormData({ ...formData, githubUrl: event.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="label">Submission URL</label>
              <input
                type="url"
                className="input"
                value={formData.submissionUrl}
                onChange={(event) => setFormData({ ...formData, submissionUrl: event.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={createProblem.isPending}>
            {createProblem.isPending ? "Saving..." : "Save Problem"}
          </button>
        </div>
      </form>
    </div>
  );
}
