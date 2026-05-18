"use client";
import { useMemo, useCallback } from "react";
import { GlobalOutlined } from "@ant-design/icons";
import { Select } from "antd";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { value: "en", label: "🇺🇸 EN" },
  { value: "es", label: "🇲🇽 ES" },
] as const;

type Language = (typeof LANGUAGES)[number]["value"];

const SELECT_STYLE = { width: 95 } as const;

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const current = useMemo<Language>(() => {
    const code = i18n.language?.split?.("-")?.[0] ?? "en";
    return code === "es" ? "es" : "en";
  }, [i18n.language]);

  const handleChange = useCallback(
    (value: string) => {
      i18n.changeLanguage(value);
    },
    [i18n],
  );

  return (
    <Select
      value={current}
      onChange={handleChange}
      options={LANGUAGES.map(({ value, label }) => ({ value, label }))}
      suffixIcon={<GlobalOutlined />}
      style={SELECT_STYLE}
      aria-label="Language selector"
      variant="borderless"
    />
  );
}
