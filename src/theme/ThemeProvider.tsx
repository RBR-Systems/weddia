"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { App, ConfigProvider, theme as antTheme } from "antd";
import { lightTheme, darkTheme } from "./themeConfig";
import { useLocale } from "@/app/hooks/useLocale";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<ThemeMode>("light");
  const locale = useLocale();

  // Sync data-theme attribute on <html> for CSS variables
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  // Persist preference
  useEffect(() => {
    const saved = localStorage.getItem("theme") as ThemeMode | null;
    if (saved) setMode(saved);
  }, []);

  const toggleTheme = () => {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    localStorage.setItem("theme", next);
  };

  const setTheme = (m: ThemeMode) => {
    setMode(m);
    localStorage.setItem("theme", m);
  };

  const currentTheme =
    mode === "light"
      ? lightTheme
      : {
          ...darkTheme,
          algorithm: antTheme.darkAlgorithm,
        };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setTheme }}>
      <ConfigProvider theme={currentTheme} locale={locale}>
        <App>{children}</App>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
