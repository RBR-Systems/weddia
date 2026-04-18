"use client";

import React from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { useInitializeI18n } from "@/shared/i18n/useInitializeI18n";

interface I18nProviderProps {
  children: React.ReactNode;
}

export default function I18nProvider({ children }: I18nProviderProps) {
  // Initialize language on client mount (kept intentionally minimal)
  useInitializeI18n();

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
