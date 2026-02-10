"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Project } from "@/types/project";

interface ProjectContextType {
  readonly projects: readonly Project[];
  readonly activeProject: Project | null;
  readonly setActiveProject: (id: string) => void;
  readonly createProject: (name: string) => Project;
  readonly deleteProject: (id: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const PROJECTS_KEY = "fugue-projects";
const ACTIVE_PROJECT_KEY = "fugue-active-project-id";

function makeDefaultProject(): Project {
  const now = new Date().toISOString();
  return {
    id: "default",
    name: "Default",
    createdAt: now,
    updatedAt: now,
  };
}

function loadProjects(): readonly Project[] {
  try {
    const saved = localStorage.getItem(PROJECTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as readonly Project[];
      if (parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  const defaultProject = makeDefaultProject();
  localStorage.setItem(PROJECTS_KEY, JSON.stringify([defaultProject]));
  return [defaultProject];
}

function loadActiveProjectId(projects: readonly Project[]): string {
  const saved = localStorage.getItem(ACTIVE_PROJECT_KEY);
  if (saved && projects.some((p) => p.id === saved)) return saved;
  return projects[0]?.id ?? "default";
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<readonly Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>("");

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadProjects();
    setProjects(loaded);
    setActiveProjectId(loadActiveProjectId(loaded));
  }, []);

  // Persist projects
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    }
  }, [projects]);

  // Persist active project id
  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem(ACTIVE_PROJECT_KEY, activeProjectId);
    }
  }, [activeProjectId]);

  const activeProject =
    projects.find((p) => p.id === activeProjectId) ?? null;

  const setActiveProject = useCallback((id: string) => {
    setActiveProjectId(id);
  }, []);

  const createProject = useCallback((name: string): Project => {
    const now = new Date().toISOString();
    const project: Project = {
      id: `proj-${Date.now()}`,
      name,
      createdAt: now,
      updatedAt: now,
    };
    setProjects((prev) => [...prev, project]);
    setActiveProjectId(project.id);
    return project;
  }, []);

  const deleteProject = useCallback(
    (id: string) => {
      if (id === "default") return; // prevent deleting default
      setProjects((prev) => {
        const next = prev.filter((p) => p.id !== id);
        return next.length > 0 ? next : prev;
      });
      if (activeProjectId === id) {
        setActiveProjectId((prev) => {
          const remaining = projects.filter((p) => p.id !== id);
          return remaining[0]?.id ?? prev;
        });
      }
    },
    [activeProjectId, projects]
  );

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        setActiveProject,
        createProject,
        deleteProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
