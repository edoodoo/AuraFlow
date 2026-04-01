"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("theme") as Theme | null;
    return stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  });

  const debugLog = (hypothesisId: string, location: string, message: string, data: Record<string, unknown>) => {
    // #region agent log
    fetch("http://127.0.0.1:7523/ingest/511b69e4-c6c0-4d1e-a391-0b0a3aa1b688", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "3c2895" },
      body: JSON.stringify({
        sessionId: "3c2895",
        runId: "pre-fix",
        hypothesisId,
        location,
        message,
        data,
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    const rect = buttonRef.current?.getBoundingClientRect();
    debugLog("H5", "components/theme-toggle.tsx:31", "theme-applied", {
      theme,
      documentDark: document.documentElement.classList.contains("dark"),
      storedTheme: localStorage.getItem("theme"),
      rectTop: rect?.top ?? null,
      rectBottom: rect?.bottom ?? null,
      rectRight: rect?.right ?? null,
    });
  }, [theme]);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const rect = buttonRef.current?.getBoundingClientRect();
    debugLog("H5", "components/theme-toggle.tsx:40", "theme-click", {
      themeBeforeClick: theme,
      themeAfterClick: next,
      rectTop: rect?.top ?? null,
      rectBottom: rect?.bottom ?? null,
      rectRight: rect?.right ?? null,
    });
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return (
    <button
      ref={buttonRef}
      onPointerDown={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        debugLog("H2", "components/theme-toggle.tsx:44", "theme-pointerdown", {
          theme,
          clientX: event.clientX,
          clientY: event.clientY,
          rectTop: rect.top,
          rectBottom: rect.bottom,
          rectRight: rect.right,
        });
      }}
      onClick={toggle}
      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
      aria-label="Alternar tema"
      title="Alternar tema"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

