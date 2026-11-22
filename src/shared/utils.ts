import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DATE_LOCALES: Record<string, string> = {
  en: "en-US",
  id: "id-ID",
  zh: "zh-CN",
  ar: "ar-EG",
  es: "es-ES",
  pt: "pt-BR",
};

/**
 * Formats a YYYY-MM-DD (or ISO) date string without UTC timezone rollback.
 */
export function formatDate(dateString: string, lang = "en"): string {
  try {
    const trimmed = (dateString || "").trim();
    let date: Date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split("-").map((n) => parseInt(n, 10));
      date = new Date(y, (m || 1) - 1, d || 1);
    } else {
      date = new Date(trimmed);
    }
    if (isNaN(date.getTime())) return dateString;
    const locale = DATE_LOCALES[lang.toLowerCase()] ?? "en-US";
    return new Intl.DateTimeFormat(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function generateId(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
}
