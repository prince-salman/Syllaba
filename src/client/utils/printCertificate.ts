"use client";

const PRINT_STAGE_ID = "syllaba-print-stage";
const PRINTING_BODY_CLASS = "syllaba-printing-cert";

/**
 * Print ONLY a single certificate DOM element as a full-bleed, edge-to-edge
 * A4 landscape (297mm x 210mm) dark-gold diploma with zero white borders.
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
  clone.style.margin = "0";
  stage.appendChild(clone);

  document.body.appendChild(stage);
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
