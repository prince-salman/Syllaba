/**
 * Proportionally preserves every page/slide section of a large PDF or deck
 * so later pages are never silently dropped by naive leading `.slice(0, N)`.
 */
export function compactDocumentForPrompt(
  rawText: string,
  maxChars = 48000
): string {
  const normalized = (rawText || "").trim();
  if (normalized.length <= maxChars) {
    return normalized;
  }

  const sections = normalized
    .split(/\n{2,}(?=(?:Slide|Page|Halaman|Bab|Chapter|Module|Section)\s*\d+)/i)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sections.length <= 1) {
    const half = Math.floor(maxChars * 0.65);
    const tail = maxChars - half - 40;
    return `${normalized.slice(0, half)}\n\n[...middle condensed...]\n\n${normalized.slice(
      normalized.length - Math.max(0, tail)
    )}`;
  }

  const perSectionBudget = Math.max(
    180,
    Math.floor((maxChars - sections.length * 4) / sections.length)
  );

  const compacted = sections.map((sec) => {
    if (sec.length <= perSectionBudget) return sec;
    const lines = sec.split("\n");
    const head = lines[0] || "";
    const bodyBudget = Math.max(80, perSectionBudget - head.length - 8);
    const body = lines.slice(1).join("\n").slice(0, bodyBudget).trim();
    return body ? `${head}\n${body}...` : head.slice(0, perSectionBudget);
  });

  return compacted.join("\n\n").slice(0, maxChars);
}
