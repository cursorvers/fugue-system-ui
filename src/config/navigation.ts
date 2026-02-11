export interface NavItem {
  icon: string;
  label: string;
  href: string;
}

export interface SidebarSection {
  title: string;
  items: NavItem[];
}

// SSOT: Single navigation definition for Sidebar + MobileNav
export const navigationSections: SidebarSection[] = [
  {
    title: "Orchestrator",
    items: [
      { icon: "dashboard", label: "Overview", href: "/" },
      { icon: "work", label: "Work", href: "/work" },
      { icon: "play_circle", label: "Runs", href: "/runs" },
      { icon: "chat", label: "Chat", href: "/chat" },
      { icon: "commit", label: "Git", href: "/git" },
    ],
  },
  {
    title: "System",
    items: [
      { icon: "settings", label: "Settings", href: "/settings" },
    ],
  },
];

export type ActivePage =
  | "overview"
  | "work"
  | "runs"
  | "chat"
  | "git"
  | "settings";

export function isActivePage(href: string, activePage: ActivePage): boolean {
  if (href === "/") return activePage === "overview";
  return href === `/${activePage}`;
}
