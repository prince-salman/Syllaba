"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type AppLanguage = "en" | "id";

const STORAGE_LANG_KEY = "syllaba_ui_language";

interface LanguageContextValue {
  lang: AppLanguage;
  setLang: (next: AppLanguage) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    if (saved === "en" || saved === "id") {
      setLangState(saved);
    }
  }, []);

  const setLang = useCallback((next: AppLanguage) => {
    setLangState(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_LANG_KEY, next);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
