"use client";

import React, { useMemo } from "react";
import { generateQrMatrix } from "@/shared/utils/qrCode";

interface ScannableQrCodeProps {
  value: string;
  accentHex?: string;
  title?: string;
}

/**
 * Renders an ISO/IEC 18004 standard scannable QR code wrapped in an interactive
 * verification link with crisp edges and quiet zone margin.
 */
export function ScannableQrCode({
  value,
  accentHex = "#FACC15",
  title = "Scan QR or click to verify credential",
}: ScannableQrCodeProps) {
  const { size, pathData } = useMemo(() => {
    const grid = generateQrMatrix(value);
    const n = grid.length;
    const quiet = 3;
    const parts: string[] = [];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (grid[r][c]) {
          parts.push(`M${c + quiet} ${r + quiet}h1v1h-1z`);
        }
      }
    }
    return { size: n + quiet * 2, pathData: parts.join("") };
  }, [value]);

  return (
    <a
      href={value}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className="shrink-0 hover:scale-105 transition-transform inline-block"
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        shapeRendering="crispEdges"
        style={{ borderColor: accentHex }}
        className="w-24 h-24 rounded-lg bg-white border-2 shadow-sm shrink-0"
        aria-label="Scannable Verification QR Code"
      >
        <rect x={0} y={0} width={size} height={size} fill="#FFFFFF" />
        <path d={pathData} fill="#111111" />
      </svg>
    </a>
  );
}
