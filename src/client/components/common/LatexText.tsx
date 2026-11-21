"use client";

import React, { useEffect, useMemo, useState } from "react";

declare global {
  interface Window {
    katex?: {
      renderToString: (
        tex: string,
        options?: {
          displayMode?: boolean;
          throwOnError?: boolean;
          strict?: boolean | string;
        }
      ) => string;
    };
  }
}

let katexLoadPromise: Promise<boolean> | null = null;

function ensureKatexLoaded(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.katex) return Promise.resolve(true);
  if (katexLoadPromise) return katexLoadPromise;

  katexLoadPromise = new Promise<boolean>((resolve) => {
    const existing = document.querySelector('script[data-katex-cdn="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.katex)));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js";
    script.async = true;
    script.setAttribute("data-katex-cdn", "true");
    script.onload = () => resolve(Boolean(window.katex));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return katexLoadPromise;
}

const UNICODE_LATEX_MAP: Array<[RegExp, string]> = [
  [/\\alpha\b/g, "α"],
  [/\\beta\b/g, "β"],
  [/\\gamma\b/g, "γ"],
  [/\\delta\b/g, "δ"],
  [/\\epsilon\b/g, "ϵ"],
  [/\\varepsilon\b/g, "ε"],
  [/\\theta\b/g, "θ"],
  [/\\Theta\b/g, "Θ"],
  [/\\lambda\b/g, "λ"],
  [/\\mu\b/g, "μ"],
  [/\\pi\b/g, "π"],
  [/\\sigma\b/g, "σ"],
  [/\\Sigma\b/g, "Σ"],
  [/\\tau\b/g, "τ"],
  [/\\phi\b/g, "ϕ"],
  [/\\omega\b/g, "ω"],
  [/\\Omega\b/g, "Ω"],
  [/\\Delta\b/g, "Δ"],
  [/\\partial\b/g, "∂"],
  [/\\nabla\b/g, "∇"],
  [/\\infty\b/g, "∞"],
  [/\\sum\b/g, "∑"],
  [/\\prod\b/g, "∏"],
  [/\\int\b/g, "∫"],
  [/\\leq\b|\\le\b/g, "≤"],
  [/\\geq\b|\\ge\b/g, "≥"],
  [/\\neq\b|\\ne\b/g, "≠"],
  [/\\approx\b/g, "≈"],
  [/\\equiv\b/g, "≡"],
  [/\\pm\b/g, "±"],
  [/\\times\b/g, "×"],
  [/\\cdot\b/g, "·"],
  [/\\rightarrow\b|\\to\b/g, "→"],
  [/\\leftarrow\b/g, "←"],
  [/\\Rightarrow\b/g, "⇒"],
  [/\\Leftrightarrow\b/g, "⇔"],
  [/\\in\b/g, "∈"],
  [/\\notin\b/g, "∉"],
  [/\\subset\b/g, "⊂"],
  [/\\subseteq\b/g, "⊆"],
  [/\\forall\b/g, "∀"],
  [/\\exists\b/g, "∃"],
  [/\\log\b/g, "log"],
  [/\\ln\b/g, "ln"],
  [/\\sin\b/g, "sin"],
  [/\\cos\b/g, "cos"],
  [/\\tan\b/g, "tan"],
  [/\\lim\b/g, "lim"],
  [/\\max\b/g, "max"],
  [/\\min\b/g, "min"],
];

function formatFallbackLatex(tex: string): string {
  let out = tex.trim();
  out = out.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)");
  out = out.replace(/\\sqrt\{([^{}]+)\}/g, "√($1)");
  out = out.replace(/\\mathcal\{([^{}]+)\}/g, "$1");
  out = out.replace(/\\mathrm\{([^{}]+)\}/g, "$1");
  out = out.replace(/\\text\{([^{}]+)\}/g, "$1");
  out = out.replace(/\\mathbf\{([^{}]+)\}/g, "$1");
  for (const [pattern, replacement] of UNICODE_LATEX_MAP) {
    out = out.replace(pattern, replacement);
  }
  out = out.replace(/\\([_{}%#$&])/g, "$1");
  out = out.replace(/\\\s+/g, " ");
  out = out.replace(/[{}]/g, "");
  return out;
}

interface Segment {
  type: "text" | "math";
  content: string;
  displayMode: boolean;
}

function tokenizeMathSegments(input: string): Segment[] {
  if (!input) return [];

  // Match $$...$$, \[...\], \(...\), or inline $...$
  const regex =
    /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$([^$\n]+?)\$/g;
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: input.slice(lastIndex, match.index),
        displayMode: false,
      });
    }

    const displayTex = match[1] ?? match[2];
    const inlineTex = match[3] ?? match[4];

    if (displayTex !== undefined) {
      segments.push({
        type: "math",
        content: displayTex.trim(),
        displayMode: true,
      });
    } else if (inlineTex !== undefined) {
      segments.push({
        type: "math",
        content: inlineTex.trim(),
        displayMode: false,
      });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < input.length) {
    segments.push({
      type: "text",
      content: input.slice(lastIndex),
      displayMode: false,
    });
  }

  return segments;
}

export function LatexText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const [katexReady, setKatexReady] = useState<boolean>(
    typeof window !== "undefined" && Boolean(window.katex)
  );

  const hasMath = useMemo(
    () =>
      Boolean(
        text &&
          (text.includes("$") ||
            text.includes("\\(") ||
            text.includes("\\[") ||
            /\\(frac|sqrt|sum|int|partial|alpha|beta|theta|Theta|Omega|Delta|leq|geq|times|cdot|log)\b/.test(
              text
            ))
      ),
    [text]
  );

  useEffect(() => {
    if (!hasMath || katexReady) return;
    let mounted = true;
    ensureKatexLoaded().then((loaded) => {
      if (mounted && loaded) {
        setKatexReady(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, [hasMath, katexReady]);

  const segments = useMemo(() => {
    if (!text) return [];
    // If string has raw LaTeX commands without $ delimiters, wrap those expressions
    let normalized = text;
    if (
      !normalized.includes("$") &&
      !normalized.includes("\\(") &&
      !normalized.includes("\\[") &&
      /\\(frac|sqrt|sum|int|partial|Theta|Omega|Delta|leq|geq)\b/.test(normalized)
    ) {
      normalized = normalized.replace(
        /(\\(?:frac\{[^{}]+\}\{[^{}]+\}|sqrt\{[^{}]+\}|sum(?:_\{?[^{}\s]+\}?)?(?:\^\{?[^{}\s]+\}?)?|int(?:_\{?[^{}\s]+\}?)?(?:\^\{?[^{}\s]+\}?)?|partial|Theta|Omega|Delta|leq|geq)[\w^_{}()+\-=/*]*)/g,
        "$$$1$$"
      );
    }
    return tokenizeMathSegments(normalized);
  }, [text]);

  if (!hasMath || segments.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {segments.map((seg, idx) => {
        if (seg.type === "text") {
          return <React.Fragment key={idx}>{seg.content}</React.Fragment>;
        }

        if (katexReady && typeof window !== "undefined" && window.katex) {
          try {
            const html = window.katex.renderToString(seg.content, {
              displayMode: seg.displayMode,
              throwOnError: false,
              strict: "ignore",
            });
            return (
              <span
                key={idx}
                className={
                  seg.displayMode
                    ? "block my-1.5 overflow-x-auto"
                    : "inline-block align-baseline mx-0.5"
                }
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            // Fallback below
          }
        }

        return (
          <code
            key={idx}
            className="mx-0.5 rounded bg-[#FEF3C7]/70 px-1.5 py-0.2 font-serif italic text-[0.95em] font-semibold text-[#111111] border border-[#FACC15]/40"
          >
            {formatFallbackLatex(seg.content)}
          </code>
        );
      })}
    </span>
  );
}
