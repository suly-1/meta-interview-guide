import { useState, useCallback } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export function usePdfExport() {
  const [exporting, setExporting] = useState(false);

  const exportToPdf = useCallback(async (contentId: string, filename: string) => {
    setExporting(true);
    try {
      const element = document.getElementById(contentId);
      if (!element) throw new Error(`Element #${contentId} not found`);

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 1100,
        onclone: (_clonedDoc: Document, clonedEl: HTMLElement) => {
          // Hide elements marked as PDF-only-hidden (e.g. buttons, interactive controls)
          clonedEl.querySelectorAll<HTMLElement>("[data-pdf-hide]").forEach((el) => {
            el.style.display = "none";
          });
          // Force collapsed accordion/overflow areas to be fully visible
          clonedEl.querySelectorAll<HTMLElement>(".overflow-hidden").forEach((el) => {
            el.style.overflow = "visible";
            el.style.maxHeight = "none";
            el.style.height = "auto";
          });
        },
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth  = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin     = 12; // mm
      const usableW    = pageWidth - margin * 2;
      const totalImgH  = (canvas.height * usableW) / canvas.width; // mm

      // Add header on every page
      const addHeader = (pageNum: number, totalPages: number) => {
        pdf.setFontSize(7);
        pdf.setTextColor(150, 150, 150);
        pdf.text("Staff Engineer Interview Guide — FAANG Edition — March 2026", margin, 7);
        pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, 7, { align: "right" });
        pdf.setDrawColor(220, 220, 220);
        pdf.line(margin, 9, pageWidth - margin, 9);
      };

      const usablePageH = pageHeight - margin * 2 - 10; // subtract header space
      const totalPages  = Math.ceil(totalImgH / usablePageH);

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();

        const yOffsetMm = page * usablePageH;
        const sliceHMm  = Math.min(usablePageH, totalImgH - yOffsetMm);

        // Convert mm slice back to canvas pixel coordinates
        const pxPerMm = canvas.width / usableW;
        const srcY    = yOffsetMm * pxPerMm;
        const srcH    = sliceHMm  * pxPerMm;

        // Draw this slice onto a temporary canvas
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width  = canvas.width;
        sliceCanvas.height = Math.ceil(srcH);
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

        addHeader(page + 1, totalPages);
        pdf.addImage(
          sliceCanvas.toDataURL("image/png"),
          "PNG",
          margin,
          12,        // top margin after header
          usableW,
          sliceHMm,
          undefined,
          "FAST"
        );
      }

      pdf.save(filename);
    } catch (err) {
      console.error("PDF export failed:", err);
      // Graceful fallback to browser print dialog
      window.print();
    } finally {
      setExporting(false);
    }
  }, []);

  return { exportToPdf, exporting };
}
