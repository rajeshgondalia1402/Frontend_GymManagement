import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export data to CSV file
 * @param data Array of objects to export
 * @param filename Name of the CSV file (without extension)
 */
export function downloadCsv(data: Record<string, any>[], filename: string) {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that contain commas, quotes, or newlines
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Export table data to PDF file
 * @param data Array of objects to export
 * @param columns Column definitions with header and dataKey
 * @param filename Name of the PDF file (without extension)
 * @param title Optional title for the PDF document
 */
export function downloadPdfTable(
  data: Record<string, any>[],
  columns: { header: string; dataKey: string }[],
  filename: string,
  title?: string
) {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const doc = new jsPDF();
  
  // Add title if provided
  if (title) {
    doc.setFontSize(16);
    doc.text(title, 14, 15);
  }

  // Generate table
  autoTable(doc, {
    head: [columns.map(col => col.header)],
    body: data.map(row => 
      columns.map(col => {
        const value = row[col.dataKey];
        return (value ?? '').toString();
      })
    ),
    startY: title ? 25 : 15,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    alternateRowStyles: { fillColor: [249, 250, 251] },
  });

  doc.save(`${filename}.pdf`);
}
