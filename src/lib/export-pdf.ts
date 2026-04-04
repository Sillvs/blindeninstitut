import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { createRoot } from "react-dom/client";
import { createElement } from "react";
import { PdfLayout } from "@/components/pdf-layout";
import { ElternInfobogen } from "@/lib/types";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 0; // PdfLayout handles its own padding
const A4_WIDTH_PX = 794; // 210mm at 96dpi

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
  root.render(
    createElement(PdfLayout, { report, anmerkungen })
  );

  // 3. Wait for render + images to load
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Wait for all images
  const images = container.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Continue even if image fails
          }
        })
    )
  );

  try {
    // 4. Capture with html2canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: A4_WIDTH_PX,
      windowWidth: A4_WIDTH_PX,
    });

    // 5. Create PDF and paginate
    const pdf = new jsPDF("portrait", "mm", "a4");
    const contentWidth = A4_WIDTH_MM - MARGIN_MM * 2;
    const imgHeight = (canvas.height * contentWidth) / canvas.width;
    const pageHeight = A4_HEIGHT_MM;
    const usableHeight = pageHeight - MARGIN_MM * 2;

    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    if (imgHeight <= usableHeight) {
      // Fits on one page
      pdf.addImage(imgData, "JPEG", MARGIN_MM, MARGIN_MM, contentWidth, imgHeight);
    } else {
      // Multiple pages — slice the canvas
      const pxPerPage = (usableHeight / imgHeight) * canvas.height;
      let pageIndex = 0;
      let yOffset = 0;

      while (yOffset < canvas.height) {
        if (pageIndex > 0) pdf.addPage();

        const sliceHeight = Math.min(pxPerPage, canvas.height - yOffset);
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;

        const ctx = pageCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            yOffset,
            canvas.width,
            sliceHeight,
            0,
            0,
            canvas.width,
            sliceHeight
          );
        }

        const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.95);
        const pageImgHeight = (sliceHeight * contentWidth) / canvas.width;
        pdf.addImage(pageImgData, "JPEG", MARGIN_MM, MARGIN_MM, contentWidth, pageImgHeight);

        // Add page number
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Seite ${pageIndex + 1}`,
          A4_WIDTH_MM / 2,
          A4_HEIGHT_MM - 5,
          { align: "center" }
        );

        yOffset += pxPerPage;
        pageIndex++;
      }
    }

    pdf.save(filename);
  } finally {
    // 6. Clean up
    root.unmount();
    document.body.removeChild(container);
  }
}
