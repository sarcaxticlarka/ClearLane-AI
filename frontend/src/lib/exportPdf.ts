/** Renders a DOM node to a paginated PDF, splitting tall content across multiple A4 pages.
 * jspdf/html2canvas are dynamically imported so they don't bloat the main bundle —
 * they're only needed when a user actually clicks "Download PDF".
 */
export async function exportNodeToPdf(node: HTMLElement, filename: string) {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')]);

  const canvas = await html2canvas(node, {
    backgroundColor: '#0c0f18',
    scale: 2,
    useCORS: true,
  });

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;
  const imgData = canvas.toDataURL('image/png');

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}
