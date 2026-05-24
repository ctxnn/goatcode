import { useState } from "react";
import { trpc } from "../../providers";

export function LocalSolutionViewer({ localPath }: { localPath: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: fileContent, isLoading } = trpc.solution.readFile.useQuery(
    { localPath },
    { enabled: isOpen }
  );

  const openInEditor = trpc.solution.openInEditor.useMutation();

  return (
    <div className="local-solution">
      <div className="local-solution-actions" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <button 
          className="btn btn-xs btn-ghost" 
          onClick={() => setIsOpen(!isOpen)}
        >
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
        <div className="local-code-preview" style={{ marginTop: "8px", position: "relative" }}>
          {isLoading ? (
            <div className="muted-text">Loading code...</div>
          ) : (
            <pre style={{ 
              background: "rgba(0,0,0,0.4)", 
              padding: "16px", 
              borderRadius: "8px",
              overflowX: "auto",
              fontSize: "13px",
              border: "1px solid rgba(255,255,255,0.1)",
              maxHeight: "400px",
            }}>
              <code>{fileContent}</code>
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
