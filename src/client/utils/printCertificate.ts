"use client";

const PRINT_STAGE_ID = "syllaba-print-stage";
const PRINTING_BODY_CLASS = "syllaba-printing-cert";

/**
 * Print ONLY a single certificate DOM element stretched gracefully across ONE full
 * A4 landscape diploma sheet (no dashboard clutter, no awkward empty bottom gap).
 */
export function printCertificateElement(
  element: HTMLElement | null,
  documentTitle = "Syllaba-Academic-Certificate"
): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  if (!element) {
    window.print();
    return;
  }

  const prevStage = document.getElementById(PRINT_STAGE_ID);
  if (prevStage) {
    prevStage.remove();
  }

  const stage = document.createElement("div");
  stage.id = PRINT_STAGE_ID;

  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('[data-no-print="true"]').forEach((node) => node.remove());

  // Measure offscreen at ~A4 landscape full printable width (1060px) to guard against rare ultra-long-title overflow
  stage.style.position = "fixed";
  stage.style.left = "-9999px";
  stage.style.top = "0";
  stage.style.width = "1060px";
  stage.style.display = "block";
  stage.style.visibility = "hidden";
  stage.appendChild(clone);
  document.body.appendChild(stage);

  const measuredHeight = clone.getBoundingClientRect().height;
  if (measuredHeight > 710) {
    const scale = Math.max(0.75, Math.floor((710 / measuredHeight) * 100) / 100);
    (clone.style as CSSStyleDeclaration & { zoom?: string }).zoom = String(scale);
  }

  // Hand layout control to @media print (full 192mm height x 100% width with space-between)
  stage.removeAttribute("style");
  document.body.classList.add(PRINTING_BODY_CLASS);

  const previousTitle = document.title;
  document.title = documentTitle.replace(/[^\w\-. ]+/g, "").trim() || "Syllaba-Certificate";

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    document.body.classList.remove(PRINTING_BODY_CLASS);
    const activeStage = document.getElementById(PRINT_STAGE_ID);
    if (activeStage) {
      activeStage.remove();
    }
    document.title = previousTitle;
    window.removeEventListener("afterprint", cleanup);
  };

  window.addEventListener("afterprint", cleanup, { once: true });

  window.requestAnimationFrame(() => {
    window.print();
    window.setTimeout(cleanup, 120_000);
  });
}
