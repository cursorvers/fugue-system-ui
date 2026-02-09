"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Logo } from "@/components/Logo";
import { navigationSections, isActivePage, type ActivePage } from "@/config/navigation";

interface MobileNavProps {
  activePage?: ActivePage;
  className?: string;
}

export function MobileNav({ activePage = "overview", className }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const isActive = (href: string) => isActivePage(href, activePage);

  const handleLogout = () => {
    logout();
    router.push("/login");
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <header
        className={cn(
          "lg:hidden flex items-center justify-between p-3 border-b border-[var(--border)] bg-[var(--sidebar)]",
          className
        )}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg hover:bg-[var(--sidebar-accent)] transition-colors"
          aria-label="Open menu"
        >
          <span className="material-symbols-sharp text-[var(--foreground)]">menu</span>
        </button>

        <Link href="/">
          <Logo size="sm" />
        </Link>

        <Link
          href="/notifications"
          className="p-2 rounded-lg hover:bg-[var(--sidebar-accent)] transition-colors relative"
        >
          <span className="material-symbols-sharp text-[var(--foreground)]">notifications</span>
        </Link>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 h-full w-[280px] bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] z-50 transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-[64px] px-4 border-b border-[var(--sidebar-border)]">
          <Link href="/" onClick={() => setIsOpen(false)}>
            <Logo size="md" />
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-[var(--sidebar-accent)] transition-colors"
            aria-label="Close menu"
          >
            <span className="material-symbols-sharp text-[var(--foreground)]">close</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 px-3 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navigationSections.map((section, sectionIdx) => (
            <div key={sectionIdx} className="py-3">
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
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                          active
                            ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)]"
                            : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]"
                        )}
                      >
                        <span className="material-symbols-sharp text-xl">{item.icon}</span>
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
        <div className="absolute bottom-0 left-0 right-0 px-4 py-4 border-t border-[var(--sidebar-border)] bg-[var(--sidebar)]">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-secondary text-[var(--sidebar-accent-foreground)] truncate">
                {user?.name || "Guest"}
              </p>
              <p className="text-xs font-secondary text-[var(--sidebar-foreground)] truncate">
                {user?.email || ""}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[var(--sidebar-accent)] transition-colors"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span className="material-symbols-sharp text-[var(--sidebar-foreground)]">
                {theme === "dark" ? "light_mode" : "dark_mode"}
              </span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-[var(--sidebar-accent)] transition-colors"
              title="Logout"
            >
              <span className="material-symbols-sharp text-[var(--sidebar-foreground)]">logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
