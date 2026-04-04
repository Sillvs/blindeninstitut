import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

async function captureElement(el: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(el, {
    scale: 2,
    useCORS: true,
    logging: false,
  });
}

function addCanvasToPdf(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  margin: number,
  contentWidth: number,
  pageHeight: number
) {
  const imgData = canvas.toDataURL("image/jpeg", 0.98);
  const imgHeight = (canvas.height * contentWidth) / canvas.width;

  // If section fits on one page, just add it
  if (imgHeight <= pageHeight - margin * 2) {
    pdf.addImage(imgData, "JPEG", margin, margin, contentWidth, imgHeight);
    return;
  }

  // Section is taller than one page — split across pages
  const usableHeight = pageHeight - margin * 2;
  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, "JPEG", margin, position, contentWidth, imgHeight);
  heightLeft -= usableHeight;

  while (heightLeft > 0) {
    position = margin - (imgHeight - heightLeft);
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", margin, position, contentWidth, imgHeight);
    heightLeft -= usableHeight;
  }
}

export async function exportToPdf(
  elementId: string,
  filename: string
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element #${elementId} not found`);

  // Hide interactive/trust elements before capture
  const hideElements = element.querySelectorAll("[data-export-hide]");
  hideElements.forEach((el) => {
    (el as HTMLElement).dataset.prevDisplay = (el as HTMLElement).style.display;
    (el as HTMLElement).style.display = "none";
  });

  // Show the footer for PDF
  const footer = element.querySelector("[data-pdf-footer]") as HTMLElement | null;
  if (footer) footer.style.display = "block";

  try {
    const pdfWidth = 210;
    const pdfHeight = 297;
    const margin = 10;
    const contentWidth = pdfWidth - margin * 2;

    const pdf = new jsPDF("portrait", "mm", "a4");

    // Find all section markers. First section shares page with header.
    // Header = everything before the first data-pdf-section
    const sections = element.querySelectorAll("[data-pdf-section]");

    // Capture header area (everything before sections — we'll capture the whole
    // element but we need the header separately). Instead, capture specific children.
    // Header = first child elements up to first data-pdf-section
    const headerElements: HTMLElement[] = [];
    for (const child of Array.from(element.children)) {
      if (child.hasAttribute("data-pdf-section")) break;
      if ((child as HTMLElement).hasAttribute?.("data-export-hide")) continue;
      if ((child as HTMLElement).style?.display === "none") continue;
      headerElements.push(child as HTMLElement);
    }

    // Create a temporary wrapper for header capture
    const headerWrapper = document.createElement("div");
    headerWrapper.style.cssText = `width:${element.offsetWidth}px;position:absolute;left:-9999px;top:0;background:white;`;
    headerElements.forEach((el) => headerWrapper.appendChild(el.cloneNode(true)));
    document.body.appendChild(headerWrapper);

    // Capture header
    const headerCanvas = await captureElement(headerWrapper);
    document.body.removeChild(headerWrapper);

    const headerImgData = headerCanvas.toDataURL("image/jpeg", 0.98);
    const headerImgHeight = (headerCanvas.height * contentWidth) / headerCanvas.width;
    pdf.addImage(headerImgData, "JPEG", margin, margin, contentWidth, headerImgHeight);

    // Capture first section (Sensorik) on same page as header
    if (sections.length > 0) {
      const firstSectionCanvas = await captureElement(sections[0] as HTMLElement);
      const firstImgData = firstSectionCanvas.toDataURL("image/jpeg", 0.98);
      const firstImgHeight = (firstSectionCanvas.height * contentWidth) / firstSectionCanvas.width;
      const yOffset = margin + headerImgHeight + 4; // 4mm gap

      // Check if it fits on the same page
      if (yOffset + firstImgHeight <= pdfHeight - margin) {
        pdf.addImage(firstImgData, "JPEG", margin, yOffset, contentWidth, firstImgHeight);
      } else {
        // First section doesn't fit with header — start new page
        pdf.addPage();
        pdf.addImage(firstImgData, "JPEG", margin, margin, contentWidth, firstImgHeight);
      }
    }

    // Each remaining section (Motorik, Kognition+Anmerkungen) gets its own page
    for (let i = 1; i < sections.length; i++) {
      pdf.addPage();

      const isLast = i === sections.length - 1;

      if (isLast && footer) {
        // Append footer clone to the last section temporarily
        const sectionEl = sections[i] as HTMLElement;
        const footerClone = footer.cloneNode(true) as HTMLElement;
        footerClone.style.display = "block";
        sectionEl.appendChild(footerClone);

        const canvas = await captureElement(sectionEl);
        sectionEl.removeChild(footerClone);
        addCanvasToPdf(pdf, canvas, margin, contentWidth, pdfHeight);
      } else {
        const canvas = await captureElement(sections[i] as HTMLElement);
        addCanvasToPdf(pdf, canvas, margin, contentWidth, pdfHeight);
      }
    }

    pdf.save(filename);
  } finally {
    // Restore hidden elements
    hideElements.forEach((el) => {
      const prev = (el as HTMLElement).dataset.prevDisplay;
      (el as HTMLElement).style.display = prev || "";
      delete (el as HTMLElement).dataset.prevDisplay;
    });

    // Re-hide the footer
    if (footer) footer.style.display = "none";
  }
}
