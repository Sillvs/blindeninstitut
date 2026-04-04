import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { createRoot } from "react-dom/client";
import { createElement } from "react";
import { PdfLayout } from "@/components/pdf-layout";
import { ElternInfobogen } from "@/lib/types";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PAGE_MARGIN_MM = 8;
const A4_WIDTH_PX = 794; // 210mm at 96dpi
const SCALE = 2;

/**
 * Block-aware PDF export.
 *
 * 1. Renders PdfLayout off-screen
 * 2. Captures the full layout as one big canvas
 * 3. Reads `data-pdf-block` element positions to find safe cut points
 * 4. Slices the canvas BETWEEN blocks — never through a block
 * 5. Places each slice on its own PDF page
 */
export async function exportToPdf(
  report: ElternInfobogen,
  anmerkungen: string,
  filename: string
): Promise<void> {
  // 1. Create off-screen container
  const container = document.createElement("div");
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: ${A4_WIDTH_PX}px;
    background: white;
    z-index: -1;
  `;
  document.body.appendChild(container);

  // 2. Render PdfLayout into container
  const root = createRoot(container);
  root.render(createElement(PdfLayout, { report, anmerkungen }));

  // 3. Wait for render + images to load
  await new Promise((resolve) => setTimeout(resolve, 500));
  const images = container.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) resolve();
          else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        })
    )
  );

  try {
    // 4. Collect block boundaries (px positions relative to container top)
    const blocks = container.querySelectorAll("[data-pdf-block]");
    const containerTop = container.getBoundingClientRect().top;
    const breakPoints: number[] = [0]; // always start at 0

    blocks.forEach((block) => {
      const rect = (block as HTMLElement).getBoundingClientRect();
      const top = rect.top - containerTop;
      breakPoints.push(top);
    });

    // Add the full container height as the final boundary
    const totalHeight = container.scrollHeight;
    breakPoints.push(totalHeight);

    // Deduplicate and sort
    const uniqueBreaks = [...new Set(breakPoints)].sort((a, b) => a - b);

    // 5. Capture the entire container as one big canvas
    const fullCanvas = await html2canvas(container, {
      scale: SCALE,
      useCORS: true,
      logging: false,
      width: A4_WIDTH_PX,
      windowWidth: A4_WIDTH_PX,
    });

    // 6. Calculate page capacity in CSS pixels
    const contentWidthMM = A4_WIDTH_MM - PAGE_MARGIN_MM * 2;
    const contentHeightMM = A4_HEIGHT_MM - PAGE_MARGIN_MM * 2;
    // How many CSS pixels fit in the content area of one page?
    const pxPerMM = A4_WIDTH_PX / A4_WIDTH_MM;
    const pageCapacityPx = contentHeightMM * pxPerMM;

    // 7. Group blocks into pages — greedy bin packing
    // Each page is defined by [startPx, endPx) in the original layout
    const pages: Array<{ start: number; end: number }> = [];
    let pageStart = 0;

    for (let i = 1; i < uniqueBreaks.length; i++) {
      const blockEnd = uniqueBreaks[i];
      const pageHeight = blockEnd - pageStart;

      if (pageHeight > pageCapacityPx && i > 1 && uniqueBreaks[i - 1] > pageStart) {
        // This block would overflow — start a new page at the previous break point
        pages.push({ start: pageStart, end: uniqueBreaks[i - 1] });
        pageStart = uniqueBreaks[i - 1];
      }
    }
    // Push the last page
    if (pageStart < totalHeight) {
      pages.push({ start: pageStart, end: totalHeight });
    }

    // 8. Create PDF and render each page
    const pdf = new jsPDF("portrait", "mm", "a4");

    for (let p = 0; p < pages.length; p++) {
      if (p > 0) pdf.addPage();

      const { start, end } = pages[p];
      const sliceHeightPx = end - start;

      // Canvas pixels (scaled)
      const srcY = Math.round(start * SCALE);
      const srcH = Math.round(sliceHeightPx * SCALE);
      const srcW = fullCanvas.width;

      // Create a slice canvas
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = srcW;
      pageCanvas.height = srcH;

      const ctx = pageCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, srcW, srcH);
        ctx.drawImage(fullCanvas, 0, srcY, srcW, srcH, 0, 0, srcW, srcH);
      }

      // Convert to image and place on PDF
      const imgData = pageCanvas.toDataURL("image/jpeg", 0.95);
      const imgWidthMM = contentWidthMM;
      const imgHeightMM = (sliceHeightPx / A4_WIDTH_PX) * A4_WIDTH_MM;

      pdf.addImage(imgData, "JPEG", PAGE_MARGIN_MM, PAGE_MARGIN_MM, imgWidthMM, imgHeightMM);

      // Page number
      pdf.setFontSize(8);
      pdf.setTextColor(160, 160, 160);
      pdf.text(`Seite ${p + 1}`, A4_WIDTH_MM / 2, A4_HEIGHT_MM - 5, { align: "center" });
    }

    pdf.save(filename);
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}
