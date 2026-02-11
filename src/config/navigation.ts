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
    title: "オーケストレーター",
    items: [
      { icon: "dashboard", label: "概要", href: "/" },
      { icon: "work", label: "ワーク", href: "/work" },
      { icon: "play_circle", label: "実行履歴", href: "/runs" },
      { icon: "chat", label: "チャット", href: "/chat" },
      { icon: "commit", label: "Git", href: "/git" },
    ],
  },
  {
    title: "システム",
    items: [
      { icon: "settings", label: "設定", href: "/settings" },
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
