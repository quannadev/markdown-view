import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportPDF(
  filename: string,
  htmlContent: string,
  title: string
): Promise<void> {
  // Create a temporary container for rendering
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '210mm';
  container.style.backgroundColor = 'white';
  container.innerHTML = `
    <div style="padding: 15px; font-family: Arial, sans-serif; color: #000000; font-size: 12px;">
      <h1 style="margin: 0 0 8px 0; font-size: 20px; color: #000000; font-weight: bold;">${title}</h1>
      <hr style="margin: 0 0 12px 0; border: none; border-top: 1px solid #333;" />
      <div style="color: #000000; line-height: 1.4;">
        ${htmlContent}
      </div>
    </div>
  `;
  
  // Add CSS styles for better PDF rendering
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    div h1, div h2, div h3, div h4, div h5, div h6 {
      color: #000000 !important;
      font-weight: bold !important;
      margin: 8px 0 6px 0 !important;
    }
    div h1 { font-size: 18px !important; }
    div h2 { font-size: 16px !important; }
    div h3 { font-size: 14px !important; }
    div h4 { font-size: 13px !important; }
    div h5 { font-size: 12px !important; }
    div h6 { font-size: 11px !important; }
    div p {
      color: #000000 !important;
      margin: 6px 0 !important;
      font-size: 11px !important;
    }
    div li {
      color: #000000 !important;
      margin: 2px 0 !important;
      font-size: 11px !important;
    }
    div code {
      color: #000000 !important;
      background-color: #f5f5f5 !important;
      padding: 2px 4px !important;
      font-size: 10px !important;
    }
    div pre {
      background-color: #f5f5f5 !important;
      color: #000000 !important;
      padding: 8px !important;
      font-size: 10px !important;
      margin: 6px 0 !important;
    }
    div blockquote {
      border-left: 3px solid #333 !important;
      padding-left: 10px !important;
      margin-left: 0 !important;
      color: #000000 !important;
    }
  `;
  
  document.head.appendChild(styleSheet);
  document.body.appendChild(container);

  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(container, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: 'white',
      logging: false,
    });

    // Get canvas dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Calculate number of pages
    let heightLeft = imgHeight;
    let position = 0;

    // Add image to PDF with proper scaling
    const imgData = canvas.toDataURL('image/png');
    const imgWidthMM = 190; // Leave 10mm margins
    const imgHeightMM = (canvas.height * imgWidthMM) / canvas.width;

    while (heightLeft > 0) {
      pdf.addImage(imgData, 'PNG', 10, position, imgWidthMM, imgHeightMM);
      heightLeft -= pageHeight;
      position = heightLeft - imgHeightMM;
      
      if (heightLeft > 0) {
        pdf.addPage();
      }
    }

    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw new Error('Failed to export PDF');
  } finally {
    // Clean up
    document.body.removeChild(container);
    document.head.removeChild(styleSheet);
  }
}
