"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useCrossTabSync } from "@/hooks/useCrossTabSync";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load theme from localStorage or default to dark
    const savedTheme = localStorage.getItem("fugue-theme") as Theme | null;
    if (savedTheme) {
      setThemeState(savedTheme);
    } else {
      // Default to dark mode
      setThemeState("dark");
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("fugue-theme", theme);
  }, [theme, mounted]);

  // Cross-tab: sync theme changes
  const handleCrossTabTheme = useCallback((action: string, payload?: unknown) => {
    if (action === "change" && (payload === "light" || payload === "dark")) {
      setThemeState(payload);
    }
  }, []);
  const { broadcast: broadcastTheme } = useCrossTabSync("theme", handleCrossTabTheme);

  const toggleTheme = () => {
    setThemeState((prev) => {
      const next = prev === "light" ? "dark" : "light";
      broadcastTheme("change", next);
      return next;
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    broadcastTheme("change", newTheme);
  };

  // Prevent flash of wrong theme
  if (!mounted) {
    return (
      <div className="dark">
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
