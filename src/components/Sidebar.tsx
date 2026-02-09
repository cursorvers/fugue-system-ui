"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Logo } from "@/components/Logo";
import { navigationSections, isActivePage, type ActivePage } from "@/config/navigation";

const SIDEBAR_KEY = "fugue-sidebar-collapsed";

interface SidebarProps {
  activePage?: ActivePage;
  className?: string;
}

export function Sidebar({ activePage = "overview", className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SIDEBAR_KEY) === "true";
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(collapsed));
  }, [collapsed]);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const isActive = (href: string) => isActivePage(href, activePage);

  const handleLogout = () => {
    logout();
    router.push("/login");
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
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="material-symbols-sharp text-[16px] text-[var(--sidebar-foreground)]">
            {collapsed ? "chevron_right" : "chevron_left"}
          </span>
        </button>
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
          <span className="text-xs font-primary text-[var(--muted-foreground)] flex-1">Search</span>
          <span className="kbd">&#8984;K</span>
        </div>
      ) : (
        <div className="flex justify-center mb-2">
          <button
            className="p-2 rounded-[var(--radius-m)] hover:bg-[var(--sidebar-accent)] transition-colors"
            title="Search (⌘K)"
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
                title={theme === "dark" ? "Light mode" : "Dark mode"}
              >
                <span className="material-symbols-sharp text-[16px] text-[var(--sidebar-foreground)]">
                  {theme === "dark" ? "light_mode" : "dark_mode"}
                </span>
              </button>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-[var(--radius-s)] hover:bg-[var(--sidebar-accent)] transition-colors"
                title="Logout"
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
