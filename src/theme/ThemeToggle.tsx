"use client";
import { useTheme } from "@/theme/ThemeProvider";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useTranslation } from "react-i18next";

export function ThemeToggle() {
  const { mode, toggleTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <Button
      type="text"
      icon={mode === "light" ? <MoonOutlined /> : <SunOutlined />}
      onClick={toggleTheme}
      size="large"
      aria-label={t("common.toggleTheme")}
    />
  );
}

