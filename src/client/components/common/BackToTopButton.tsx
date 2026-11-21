"use client";

import React, { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useLanguage } from "@/client/context/LanguageContext";

export function BackToTopButton() {
  const [visible, setVisible] = useState(false);
  const { lang } = useLanguage();

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 280);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label={lang === "id" ? "Kembali ke atas" : "Back to top"}
      title={lang === "id" ? "Kembali ke atas" : "Back to top"}
      className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 inline-flex items-center gap-1.5 rounded-full border border-[#FACC15]/60 bg-[#111111]/95 hover:bg-[#262626] text-[#FACC15] px-3.5 py-2.5 text-xs font-extrabold shadow-[0_12px_28px_-8px_rgba(0,0,0,0.45)] backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
    >
      <ArrowUp className="h-3.5 w-3.5 shrink-0" />
      <span>{lang === "id" ? "Ke Atas" : "Back to Top"}</span>
    </button>
  );
}
