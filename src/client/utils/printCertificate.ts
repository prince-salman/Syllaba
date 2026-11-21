"use client";

const PRINT_STAGE_ID = "syllaba-print-stage";
const PRINTING_BODY_CLASS = "syllaba-printing-cert";

/**
 * Print ONLY a single certificate DOM element on ONE clean A4 landscape page,
 * isolating it in a top-level portal container outside the dashboard layout and
 * auto-scaling to fit printable height so it never spills onto a second page.
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

  // Measure offscreen at A4 landscape content width (~960px) to guarantee 1-page fit
  stage.style.position = "fixed";
  stage.style.left = "-9999px";
  stage.style.top = "0";
  stage.style.width = "960px";
  stage.style.display = "block";
  stage.style.visibility = "hidden";

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.margin = "0 auto";
  clone.style.width = "100%";
  clone.style.maxWidth = "960px";
  clone.querySelectorAll('[data-no-print="true"]').forEach((node) => node.remove());
  stage.appendChild(clone);

  document.body.appendChild(stage);

  // Target printable A4 landscape height (~640px leaves comfortable safety margin even with browser headers/footers)
  const measuredHeight = clone.getBoundingClientRect().height;
  if (measuredHeight > 630) {
    const scale = Math.max(0.68, Math.floor((630 / measuredHeight) * 100) / 100);
    (clone.style as CSSStyleDeclaration & { zoom?: string }).zoom = String(scale);
  }

  // Clear temporary offscreen measurement styles so @media print rules control print layout
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
