"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  AppLanguage,
  LANGUAGE_OPTIONS,
  TranslationCopy,
  getCopy,
} from "@/client/i18n/translations";

export type { AppLanguage };

const STORAGE_LANG_KEY = "syllaba_ui_language";
const VALID_CODES = new Set<AppLanguage>(["en", "id", "zh", "ar", "es", "pt"]);

interface LanguageContextValue {
  lang: AppLanguage;
  dir: "ltr" | "rtl";
  copy: TranslationCopy;
  setLang: (next: AppLanguage) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  dir: "ltr",
  copy: getCopy("en"),
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>("en");

  const applyDocumentAttributes = useCallback((code: AppLanguage) => {
    if (typeof document === "undefined") return;
    const meta = LANGUAGE_OPTIONS.find((item) => item.code === code);
    document.documentElement.lang = code;
    document.documentElement.dir = meta?.dir ?? "ltr";
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(STORAGE_LANG_KEY) as AppLanguage | null;
    if (saved && VALID_CODES.has(saved)) {
      setLangState(saved);
      applyDocumentAttributes(saved);
    }
  }, [applyDocumentAttributes]);

  const setLang = useCallback(
    (next: AppLanguage) => {
      setLangState(next);
      applyDocumentAttributes(next);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_LANG_KEY, next);
      }
    },
    [applyDocumentAttributes]
  );

  const currentMeta = LANGUAGE_OPTIONS.find((item) => item.code === lang);

  return (
    <LanguageContext.Provider
      value={{
        lang,
        dir: currentMeta?.dir ?? "ltr",
        copy: getCopy(lang),
        setLang,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
