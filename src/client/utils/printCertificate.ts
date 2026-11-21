"use client";

const PRINT_STAGE_ID = "syllaba-print-stage";
const PRINTING_BODY_CLASS = "syllaba-printing-cert";

/**
 * Print ONLY a single certificate DOM element in clean A4 landscape orientation,
 * isolating it in a top-level portal container outside the dashboard layout so
 * desktop and mobile browsers never print the entire webpage/sidebar.
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
  clone.style.margin = "0 auto";
  clone.style.width = "100%";
  clone.style.maxWidth = "1000px";
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

  // Wait one animation frame so browsers attach styles to the cloned node cleanly
  window.requestAnimationFrame(() => {
    window.print();
    // Generous fallback for browsers that do not reliably fire afterprint
    window.setTimeout(cleanup, 120_000);
  });
}
