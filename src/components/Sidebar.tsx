"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useProject } from "@/contexts/ProjectContext";
import { Logo } from "@/components/Logo";
import { navigationSections, isActivePage, type ActivePage } from "@/config/navigation";

const SIDEBAR_KEY = "fugue-sidebar-collapsed";

interface SidebarProps {
  activePage?: ActivePage;
  className?: string;
}

export function Sidebar({ activePage = "overview", className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_KEY);
    if (saved === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setCreatingProject(false);
        setNewProjectName("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { projects, activeProject, setActiveProject, createProject, deleteProject } = useProject();
  const router = useRouter();

  const isActive = (href: string) => isActivePage(href, activePage);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    createProject(newProjectName.trim());
    setNewProjectName("");
    setCreatingProject(false);
    setDropdownOpen(false);
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteProject(id);
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] overflow-hidden transition-[width] duration-200 ease-out",
        collapsed ? "w-[56px]" : "w-[220px]",
        className
      )}
    >
      {/* Logo + collapse toggle */}
      <div className="flex items-center h-14 px-3 border-b border-[var(--sidebar-border)]">
        <Link href="/" className="flex items-center gap-2 flex-1 min-w-0">
          <Logo size="sm" showText={false} />
          {!collapsed && (
            <span className="font-primary font-semibold text-sm text-[var(--foreground)] truncate">
              FUGUE
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="p-1 rounded-[var(--radius-s)] hover:bg-[var(--sidebar-accent)] transition-colors flex-shrink-0"
          title={collapsed ? "サイドバーを展開" : "サイドバーを折りたたむ"}
        >
          <span className="material-symbols-sharp text-[16px] text-[var(--sidebar-foreground)]">
            {collapsed ? "chevron_right" : "chevron_left"}
          </span>
        </button>
      </div>

      {/* Project Selector */}
      <div className="px-2 py-2 border-b border-[var(--sidebar-border)] relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className={cn(
            "w-full min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-[var(--radius-m)] hover:bg-[var(--sidebar-accent)] transition-colors",
            collapsed ? "justify-center" : ""
          )}
          title={activeProject?.name || "プロジェクトを選択"}
        >
          <span className="material-symbols-sharp text-[20px] text-[var(--sidebar-foreground)] flex-shrink-0">
            folder_open
          </span>
          {!collapsed && (
            <>
              <span className="flex-1 text-left text-sm font-primary font-medium text-[var(--foreground)] truncate">
                {activeProject?.name || "プロジェクトなし"}
              </span>
              <span className={cn(
                "material-symbols-sharp text-[16px] text-[var(--sidebar-foreground)] transition-transform",
                dropdownOpen ? "rotate-180" : ""
              )}>
                expand_more
              </span>
            </>
          )}
        </button>

        {/* Dropdown */}
        {dropdownOpen && !collapsed && (
          <div className="absolute left-2 right-2 top-[calc(100%+4px)] bg-[var(--sidebar)] border border-[var(--border)] rounded-[var(--radius-m)] shadow-lg z-50 py-1 max-h-[300px] overflow-y-auto">
            {/* Project list */}
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => {
                  setActiveProject(project.id);
                  setDropdownOpen(false);
                }}
                className="group flex items-center gap-2 px-3 py-2 hover:bg-[var(--sidebar-accent)] cursor-pointer"
              >
                <span className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  activeProject?.id === project.id ? "bg-[var(--primary)]" : "bg-transparent"
                )} />
                <span className="flex-1 text-sm font-primary text-[var(--foreground)] truncate">
                  {project.name}
                </span>
                {project.id !== "default" && (
                  <button
                    onClick={(e) => handleDeleteProject(project.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-[var(--radius-s)] hover:bg-[var(--destructive)] hover:text-[var(--destructive-foreground)] transition-all"
                    title="プロジェクトを削除"
                  >
                    <span className="material-symbols-sharp text-[16px]">
                      delete
                    </span>
                  </button>
                )}
              </div>
            ))}

            {/* New Project section */}
            <div className="border-t border-[var(--border)] mt-1 pt-1">
              {creatingProject ? (
                <div className="px-3 py-2">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateProject();
                      if (e.key === "Escape") {
                        setCreatingProject(false);
                        setNewProjectName("");
                      }
                    }}
                    placeholder="プロジェクト名"
                    autoFocus
                    className="w-full px-2 py-1 text-sm font-primary bg-[var(--input)] border border-[var(--border)] rounded-[var(--radius-s)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={handleCreateProject}
                      className="flex-1 px-2 py-1 text-xs font-primary font-medium bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius-s)] hover:opacity-90 transition-opacity"
                    >
                      作成
                    </button>
                    <button
                      onClick={() => {
                        setCreatingProject(false);
                        setNewProjectName("");
                      }}
                      className="px-2 py-1 text-xs font-primary font-medium text-[var(--muted-foreground)] hover:bg-[var(--sidebar-accent)] rounded-[var(--radius-s)] transition-colors"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setCreatingProject(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--sidebar-accent)] transition-colors"
                >
                  <span className="material-symbols-sharp text-[18px] text-[var(--primary)]">
                    add
                  </span>
                  <span className="text-sm font-primary font-medium text-[var(--primary)]">
                    新規プロジェクト
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 overflow-y-auto">
        {navigationSections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="py-1">
            {!collapsed && (
              <div className="px-2 py-1.5">
                <span className="text-[10px] font-primary font-medium text-[var(--muted-foreground)] uppercase tracking-widest">
                  {section.title}
                </span>
              </div>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item, itemIdx) => {
                const active = isActive(item.href);
                return (
                  <li key={itemIdx}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-[var(--radius-m)] text-sm transition-all duration-150",
                        collapsed ? "justify-center px-0 py-2" : "px-3 py-2",
                        active
                          ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)]"
                          : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]"
                      )}
                      title={item.label}
                    >
                      <span className={cn(
                        "material-symbols-sharp text-[20px] flex-shrink-0",
                        active ? "text-[var(--primary)]" : ""
                      )}>
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <span className="font-primary text-[13px] truncate">{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Command palette hint */}
      {!collapsed ? (
        <div className="px-3 py-2 mx-2 mb-2 rounded-[var(--radius-m)] bg-[var(--muted)] flex items-center gap-2 cursor-pointer hover:bg-[var(--secondary)] transition-colors">
          <span className="material-symbols-sharp text-[16px] text-[var(--muted-foreground)]">search</span>
          <span className="text-xs font-primary text-[var(--muted-foreground)] flex-1">検索</span>
          <span className="kbd">&#8984;K</span>
        </div>
      ) : (
        <div className="flex justify-center mb-2">
          <button
            className="p-2 rounded-[var(--radius-m)] hover:bg-[var(--sidebar-accent)] transition-colors"
            title="検索 (⌘K)"
          >
            <span className="material-symbols-sharp text-[18px] text-[var(--muted-foreground)]">search</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="px-2 py-3 border-t border-[var(--sidebar-border)]">
        <div className={cn("flex items-center gap-2", collapsed ? "justify-center" : "px-1")}>
          {/* Avatar */}
          <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-primary font-semibold text-[var(--primary-foreground)]">
              {(user?.name || "G").charAt(0).toUpperCase()}
            </span>
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-primary font-medium text-[var(--foreground)] truncate">
                  {user?.name || "Guest"}
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-[var(--radius-s)] hover:bg-[var(--sidebar-accent)] transition-colors"
                title={theme === "dark" ? "ライトモード" : "ダークモード"}
              >
                <span className="material-symbols-sharp text-[16px] text-[var(--sidebar-foreground)]">
                  {theme === "dark" ? "light_mode" : "dark_mode"}
                </span>
              </button>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-[var(--radius-s)] hover:bg-[var(--sidebar-accent)] transition-colors"
                title="ログアウト"
              >
                <span className="material-symbols-sharp text-[16px] text-[var(--sidebar-foreground)]">
                  logout
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
