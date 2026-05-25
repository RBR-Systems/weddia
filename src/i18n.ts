import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./locales/en";
import { es } from "./locales/es";

const SUPPORTED_LANGUAGES = ["en", "es"];
const STORAGE_KEY = "userLanguage";

i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  debug: process.env.NODE_ENV === "development",
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
});

export { SUPPORTED_LANGUAGES, STORAGE_KEY };
export default i18n;

