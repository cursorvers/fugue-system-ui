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
      {/* Mobile Header — minimal */}
      <header
        className={cn(
          "md:hidden flex items-center justify-between px-4 h-12 border-b border-[var(--border)] bg-[var(--background)]",
          className
        )}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[var(--radius-s)] hover:bg-[var(--secondary)] transition-colors"
          aria-label="メニューを開く"
        >
          <span className="material-symbols-sharp text-[20px] text-[var(--foreground)]">menu</span>
        </button>

        <Link href="/">
          <Logo size="sm" />
        </Link>

        <button
          className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[var(--radius-s)] hover:bg-[var(--secondary)] transition-colors"
          aria-label="検索"
        >
          <span className="material-symbols-sharp text-[20px] text-[var(--foreground)]">search</span>
        </button>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <aside
        className={cn(
          "md:hidden fixed top-0 left-0 h-full w-[260px] max-w-[85vw] bg-[var(--card)] border-r border-[var(--border)] z-50 transform transition-transform duration-200 ease-out shadow-[var(--shadow-l)]",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-12 px-4 border-b border-[var(--border)]">
          <Link href="/" onClick={() => setIsOpen(false)}>
            <Logo size="sm" />
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-[var(--radius-s)] hover:bg-[var(--secondary)] transition-colors"
            aria-label="メニューを閉じる"
          >
            <span className="material-symbols-sharp text-[18px] text-[var(--foreground)]">close</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 px-2 overflow-y-auto max-h-[calc(100vh-120px)]">
          {navigationSections.map((section, sectionIdx) => (
            <div key={sectionIdx} className="py-1">
              <h3 className="px-3 py-1.5 text-[10px] font-primary font-medium text-[var(--muted-foreground)] uppercase tracking-widest">
                {section.title}
              </h3>
              <ul className="space-y-0.5">
                {section.items.map((item, itemIdx) => {
                  const active = isActive(item.href);
                  return (
                    <li key={itemIdx}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-m)] text-sm transition-all duration-150",
                          active
                            ? "bg-[var(--secondary)] text-[var(--foreground)]"
                            : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                        )}
                      >
                        <span className={cn(
                          "material-symbols-sharp text-[20px]",
                          active ? "text-[var(--primary)]" : ""
                        )}>
                          {item.icon}
                        </span>
                        <span className="font-primary text-[13px]">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-3 border-t border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-primary font-semibold text-[var(--primary-foreground)]">
                {(user?.name || "G").charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-primary font-medium text-[var(--foreground)] truncate">
                {user?.name || "Guest"}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-[var(--radius-s)] hover:bg-[var(--secondary)] transition-colors"
              title={theme === "dark" ? "ライトモード" : "ダークモード"}
            >
              <span className="material-symbols-sharp text-[16px] text-[var(--muted-foreground)]">
                {theme === "dark" ? "light_mode" : "dark_mode"}
              </span>
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-[var(--radius-s)] hover:bg-[var(--secondary)] transition-colors"
              title="ログアウト"
            >
              <span className="material-symbols-sharp text-[16px] text-[var(--muted-foreground)]">logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
