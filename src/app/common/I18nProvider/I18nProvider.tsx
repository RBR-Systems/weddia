"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { SUPPORTED_LANGUAGES, STORAGE_KEY } from "@/i18n";

export default function I18nProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const browser = navigator.language.split("-")[0];
    const lang = saved && SUPPORTED_LANGUAGES.includes(saved)
      ? saved
      : SUPPORTED_LANGUAGES.includes(browser) ? browser : "en";
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
      localStorage.setItem(STORAGE_KEY, lang);
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
