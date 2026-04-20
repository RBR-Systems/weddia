"use client";
import { useEffect } from "react";
import i18n, { SUPPORTED_LANGUAGES, STORAGE_KEY } from "@/i18n";

/**
 * Custom hook that initializes i18n language on the client.
 * - Respects saved preference in localStorage (if available)
 * - Falls back to browser language (if supported)
 * - Defaults to 'en'
 */
export function useInitializeI18n(): void {
  useEffect(() => {
    const isLocalStorageAvailable = (): boolean => {
      try {
        if (typeof window === "undefined" || !globalThis.localStorage) return false;
        const testKey = "__i18n_test__";
        globalThis.localStorage.setItem(testKey, testKey);
        globalThis.localStorage.removeItem(testKey);
        return true;
      } catch {
        return false;
      }
    };

    const getSavedLanguage = (): string | null => {
      if (!isLocalStorageAvailable()) return null;
      try {
        return globalThis.localStorage.getItem(STORAGE_KEY);
      } catch {
        return null;
      }
    };

    const getBrowserLanguage = (): string | null => {
      try {
        if (typeof navigator === "undefined" || !navigator.language) return null;
        return navigator.language.split("-")[0];
      } catch {
        return null;
      }
    };

    (async () => {
      const saved = getSavedLanguage();
      const browser = getBrowserLanguage();
      const fallback = "en";
      const lang =
        saved && SUPPORTED_LANGUAGES.includes(saved)
          ? saved
          : browser && SUPPORTED_LANGUAGES.includes(browser)
          ? browser
          : fallback;

      if (i18n.language !== lang) {
        try {
          await i18n.changeLanguage(lang);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("i18n: failed to change language", err);
        }
      }

      if (isLocalStorageAvailable()) {
        try {
          globalThis.localStorage.setItem(STORAGE_KEY, lang);
        } catch {
          // ignore
        }
      }
    })();
  }, []);
}

