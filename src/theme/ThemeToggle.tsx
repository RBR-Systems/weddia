"use client";

import { useTheme } from "@/theme/ThemeProvider";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Button } from "antd";

export function ThemeToggle() {
  const { mode, toggleTheme } = useTheme();

  return (
    <Button
      type="text"
      icon={mode === "light" ? <MoonOutlined /> : <SunOutlined />}
      onClick={toggleTheme}
      size="large"
      aria-label="Toggle theme"
    />
  );
}
