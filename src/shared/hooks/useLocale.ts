import { useState, useEffect } from "react";
import esES from "antd/locale/es_ES";
import enUS from "antd/locale/en_US";
import { useTranslation } from "react-i18next";

export const useLocale = () => {
  const { i18n } = useTranslation();
  const [userLocale, setUserLocale] = useState(enUS);

  useEffect(() => {
    const lang = i18n.language || "en";
    setUserLocale(lang.startsWith("es") ? esES : enUS);
  }, [i18n.language]);

  return userLocale;
};

