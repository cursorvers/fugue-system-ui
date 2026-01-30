"use client";

import { cn } from "@/lib/utils";

interface NavItem {
  icon: string;
  label: string;
  active?: boolean;
}

interface SidebarSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  logo?: string;
  sections: SidebarSection[];
  footer?: {
    name: string;
    email: string;
  };
  className?: string;
}

export function Sidebar({ logo = "FUGUE", sections, footer, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex flex-col w-[280px] h-full bg-[var(--sidebar)] border-r border-[var(--sidebar-border)]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-center h-[88px] px-8 py-6 border-b border-[var(--sidebar-border)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary)]" />
          <span className="font-primary text-lg font-bold text-[var(--primary)]">
            {logo}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-0 px-4 overflow-y-auto">
        {sections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="py-4">
            <h3 className="px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item, itemIdx) => (
                <li key={itemIdx}>
                  <a
                    href="#"
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      item.active
                        ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)]"
                        : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]"
                    )}
                  >
                    <span className="material-symbols" style={{ fontWeight: 100 }}>
                      {item.icon}
                    </span>
                    <span className="font-secondary">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {footer && (
        <div className="flex items-center gap-2 px-8 py-6">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-secondary text-[var(--sidebar-accent-foreground)] truncate">
              {footer.name}
            </p>
            <p className="text-sm font-secondary text-[var(--sidebar-foreground)] truncate">
              {footer.email}
            </p>
          </div>
          <span className="material-symbols text-[var(--sidebar-foreground)]" style={{ fontWeight: 100 }}>
            keyboard_arrow_down
          </span>
        </div>
      )}
    </aside>
  );
}
