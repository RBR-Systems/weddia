"use client";

import { GlobalOutlined } from "@ant-design/icons";
import { Select } from "antd";
import { useTranslation } from "react-i18next";

const languages = [
  { value: "en", label: "🇺🇸 EN" },
  { value: "es", label: "🇪🇸 ES" },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  return (
    <Select
      value={i18n.language?.startsWith("es") ? "es" : "en"}
      onChange={handleChange}
      options={languages}
      suffixIcon={<GlobalOutlined />}
      variant="borderless"
      style={{ width: 95 }}
    />
  );
}
