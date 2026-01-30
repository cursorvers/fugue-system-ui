"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  icon: string;
  label: string;
  href: string;
}

interface SidebarSection {
  title: string;
  items: NavItem[];
}

const navigationSections: SidebarSection[] = [
  {
    title: "Orchestrator",
    items: [
      { icon: "dashboard", label: "Dashboard", href: "/" },
      { icon: "smart_toy", label: "Agents", href: "/agents" },
      { icon: "task_alt", label: "Tasks", href: "/tasks" },
      { icon: "receipt_long", label: "Logs", href: "/logs" },
      { icon: "chat", label: "Chat", href: "/chat" },
    ],
  },
  {
    title: "Execution Tier",
    items: [
      { icon: "code", label: "Codex", href: "#" },
      { icon: "psychology", label: "GLM-4.7", href: "#" },
      { icon: "stars", label: "Gemini", href: "#" },
      { icon: "design_services", label: "Pencil", href: "#" },
    ],
  },
];

interface SidebarProps {
  activePage?: "dashboard" | "agents" | "tasks" | "logs" | "chat";
  className?: string;
}

export function Sidebar({ activePage = "dashboard", className }: SidebarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === "/") return activePage === "dashboard";
    return href === `/${activePage}`;
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "flex flex-col w-[280px] h-full bg-[var(--sidebar)] border-r border-[var(--sidebar-border)]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-center h-[88px] px-8 py-6 border-b border-[var(--sidebar-border)]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary)]" />
          <span className="font-primary text-lg font-bold text-[var(--primary)]">
            FUGUE
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-0 px-4 overflow-y-auto">
        {navigationSections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="py-4">
            <h3 className="px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item, itemIdx) => {
                const active = isActive(item.href);
                return (
                  <li key={itemIdx}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        active
                          ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)]"
                          : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]"
                      )}
                    >
                      <span className="material-symbols-sharp text-xl">
                        {item.icon}
                      </span>
                      <span className="font-secondary">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-6 border-t border-[var(--sidebar-border)]">
        <div className="flex items-center gap-2 px-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-secondary text-[var(--sidebar-accent-foreground)] truncate">
              {user?.name || "Guest"}
            </p>
            <p className="text-xs font-secondary text-[var(--sidebar-foreground)] truncate">
              {user?.email || ""}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-[var(--sidebar-accent)] transition-colors"
            title="Logout"
          >
            <span className="material-symbols-sharp text-[var(--sidebar-foreground)]">
              logout
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
