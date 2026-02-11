"use client";

import { cn } from "@/lib/utils";
import { useProject } from "@/contexts/ProjectContext";

export function ProjectTabs() {
  const { projects, activeProject, setActiveProject } = useProject();

  if (projects.length < 2) return null;

  return (
    <div className="flex items-center gap-1 px-4 lg:px-8 pb-1 overflow-hidden border-b border-[var(--border)]">
      <span className="material-symbols-sharp text-[14px] text-[var(--muted-foreground)] mr-1 flex-shrink-0">
        folder_open
      </span>
      <div
        className="flex items-center gap-0.5 overflow-x-auto scrollbar-none flex-1 min-w-0"
        role="tablist"
        aria-label="プロジェクト"
      >
        {projects.map((project) => {
          const isActive = project.id === activeProject?.id;
          return (
            <button
              key={project.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveProject(project.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-m)] text-[11px] font-primary font-medium whitespace-nowrap transition-colors flex-shrink-0 min-h-[44px]",
                isActive
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full flex-shrink-0",
                  isActive
                    ? "bg-[var(--primary-foreground)]"
                    : "bg-[var(--color-success-foreground)]"
                )}
              />
              <span className="truncate max-w-[120px]">{project.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
