"use client";

import { useState } from "react";
import { trpc } from "../providers";

export function LocalSolutionViewer({ localPath }: { localPath: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: fileContent, isLoading } = trpc.solution.readFile.useQuery(
    { localPath },
    { enabled: isOpen }
  );

  const openInEditor = trpc.solution.openInEditor.useMutation();

  return (
    <div className="local-solution">
      <div className="local-solution-actions">
        <button className="btn btn-xs btn-ghost" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? "Hide Code" : "View Code"}
        </button>
        <button
          className="btn btn-xs btn-primary"
          onClick={() => openInEditor.mutate({ localPath })}
          disabled={openInEditor.isPending}
        >
          {openInEditor.isPending ? "Opening..." : "Open in VS Code"}
        </button>
        <span className="muted-text text-sm">{localPath}</span>
      </div>

      {isOpen && (
        <div className="local-code-preview">
          {isLoading ? (
            <div className="muted-text">Loading code...</div>
          ) : (
            <pre className="local-code-block">
              <code>{fileContent}</code>
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
