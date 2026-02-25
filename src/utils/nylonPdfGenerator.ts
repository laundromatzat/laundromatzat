import { jsPDF } from "jspdf";
import { NylonProject } from "@/pages/tools/NylonFabricDesignerPage/hooks/useProjectState";

// Helper to load image from URL to Base64
const loadImage = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Failed to get canvas context"));
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};

export const generateNylonProjectPDF = async (project: NylonProject) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  // --- Title & Header ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(50, 50, 50);
  doc.text("Nylon Fabric Project", margin, y);
  y += 10;

  doc.setFontSize(16);
  doc.setTextColor(100, 100, 100);
  doc.text(project.brief.description || "Untitled Project", margin, y);
  y += 10;

  // Project Specs
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(
    `Size: ${project.brief.size.height}x${project.brief.size.width} ${project.brief.size.unit}`,
    margin,
    y,
  );
  y += 5;
  doc.text(`Closure: ${project.brief.closure}`, margin, y);
  y += 15;

  // --- Concept Image ---
  if (project.selectedConcept?.sketch.imageUrl) {
    try {
      const imgData = await loadImage(project.selectedConcept.sketch.imageUrl);
      const imgHeight = (contentWidth * 9) / 16; // 16:9 ratio
      doc.addImage(imgData, "JPEG", margin, y, contentWidth, imgHeight);
      y += imgHeight + 10;
    } catch (e) {
      console.warn("Failed to load concept image", e);
    }
  }

  // --- Material Plan ---
  if (project.materialPlan) {
    // New Page for Materials if low space
    if (y > pageHeight - 100) {
      doc.addPage();
      y = margin;
    }

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    doc.text("Materials & Tools", margin, y);
    y += 10;

    // Materials
    doc.setFontSize(12);
    doc.text("Materials:", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    project.materialPlan.materials.forEach((m) => {
      const text = `• ${m.name} (${m.quantity})${m.notes ? ` - ${m.notes}` : ""}`;
      const splitText = doc.splitTextToSize(text, contentWidth);
      doc.text(splitText, margin, y);
      y += splitText.length * 5;
    });
    y += 5;

    // Tools
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Tools:", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    project.materialPlan.tools.forEach((t) => {
      const text = `• ${t.name}${t.notes ? ` - ${t.notes}` : ""}`;
      const splitText = doc.splitTextToSize(text, contentWidth);
      doc.text(splitText, margin, y);
      y += splitText.length * 5;
    });

    // Cut Diagram
    if (project.materialPlan.cutDiagramUrl) {
      if (y > pageHeight - 80) {
        doc.addPage();
        y = margin;
      }
      y += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Cut Diagram:", margin, y);
      y += 10;
      try {
        const diagamData = await loadImage(project.materialPlan.cutDiagramUrl);
        const imgHeight = 80;
        doc.addImage(diagamData, "JPEG", margin, y, contentWidth, imgHeight);
        y += imgHeight + 10;
      } catch (e) {
        console.warn("Failed to load cut diagram", e);
      }
    }
  }

  // --- Step-by-Step Instructions ---
  if (project.steps.length > 0) {
    doc.addPage();
    y = margin;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    doc.text("Assembly Guide", margin, y);
    y += 15;

    for (const step of project.steps) {
      if (y > pageHeight - 80) {
        doc.addPage();
        y = margin;
      }

      // Step Title
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`Step ${step.number}: ${step.title}`, margin, y);
      y += 8;

      // Instructions
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      const splitInst = doc.splitTextToSize(step.instructions, contentWidth);
      doc.text(splitInst, margin, y);
      y += splitInst.length * 6; // Line height

      // Tips
      if (step.tips.length > 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(80, 80, 80);
        step.tips.forEach((tip) => {
          const tipText = `Tip: ${tip}`;
          const splitTip = doc.splitTextToSize(tipText, contentWidth - 10);
          doc.text(splitTip, margin + 5, y);
          y += splitTip.length * 5;
        });
        y += 5;
      }

      // Image
      if (step.imageUrl) {
        if (y > pageHeight - 70) {
          doc.addPage();
          y = margin;
        }
        try {
          const stepImg = await loadImage(step.imageUrl);
          const imgH = 60; // Fixed height for step images
          const imgW = (16 / 9) * imgH; // Keep aspect ratio roughly
          // Center image
          const x = (pageWidth - imgW) / 2;

          doc.addImage(stepImg, "JPEG", x, y, imgW, imgH);
          y += imgH + 10;
        } catch (e) {
          console.warn(`Failed to load image for step ${step.number}`, e);
        }
      }

      y += 10; // Spacing between steps

      // Divider line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;
    }
  }

  // Footer
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, {
      align: "right",
    });
    doc.text(
      "Generated by Laundromatzat Nylon Fabric Designer",
      margin,
      pageHeight - 10,
    );
  }

  // Save
  doc.save(
    `nylon-project-${project.brief.description.slice(0, 15).replace(/\s+/g, "-")}.pdf`,
  );
};
