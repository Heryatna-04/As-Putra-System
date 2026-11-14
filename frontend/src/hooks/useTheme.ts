"use client";

import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "as_putra_theme";
const THEME_CHANGE_EVENT = "as_putra_theme_change";

function applyDocumentTheme(nextTheme: "light" | "dark") {
  const isDark = nextTheme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = nextTheme;
}

export function useTheme() {
  const [theme, setThemeState] = useState<"light" | "dark">("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const isDark = saved === "dark" || (!saved && prefersDark);
      const activeTheme: "light" | "dark" = isDark ? "dark" : "light";
      setThemeState(activeTheme);
      applyDocumentTheme(activeTheme);
    } catch {
      // ignore
    }

    const handleThemeChange = (event: Event) => {
      if (event instanceof CustomEvent && (event.detail === "light" || event.detail === "dark")) {
        setThemeState(event.detail);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY && (event.newValue === "light" || event.newValue === "dark")) {
        setThemeState(event.newValue);
        applyDocumentTheme(event.newValue);
      }
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const setTheme = (newTheme: "light" | "dark") => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      applyDocumentTheme(newTheme);
      window.dispatchEvent(new CustomEvent<"light" | "dark">(THEME_CHANGE_EVENT, { detail: newTheme }));
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return { theme, setTheme, toggleTheme, isDark: theme === "dark" };
}
