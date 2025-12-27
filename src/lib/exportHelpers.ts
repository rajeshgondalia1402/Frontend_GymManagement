import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// PDF export color constants - matching the primary theme color
const PDF_COLORS = {
  primary: [59, 130, 246] as [number, number, number], // Primary blue - matches hsl(221.2 83.2% 53.3%)
  alternateRow: [249, 250, 251] as [number, number, number], // Light gray background
  textWhite: 255,
};

/**
 * Export data as CSV file
 * 
 * Example usage:
 * ```ts
 * const data = [
 *   { name: 'John Doe', email: 'john@example.com', age: 30 },
 *   { name: 'Jane Smith', email: 'jane@example.com', age: 25 }
 * ];
 * downloadCsv(data, 'users.csv');
 * ```
 */
export function downloadCsv(
  data: Record<string, any>[],
  filename: string = 'export.csv'
): void {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Extract headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape values that contain commas, quotes, or newlines
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
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Export data as PDF table
 * 
 * Example usage:
 * ```ts
 * const columns = ['Name', 'Email', 'Age'];
 * const rows = [
 *   ['John Doe', 'john@example.com', '30'],
 *   ['Jane Smith', 'jane@example.com', '25']
 * ];
 * downloadPdfTable(columns, rows, 'users.pdf');
 * ```
 */
export function downloadPdfTable(
  columns: string[],
  rows: (string | number)[][],
  filename: string = 'export.pdf',
  title?: string
): void {
  if (!columns || columns.length === 0) {
    console.warn('No columns specified for PDF export');
    return;
  }

  if (!rows || rows.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Create new PDF document
  const doc = new jsPDF();

  // Add title if provided
  if (title) {
    doc.setFontSize(16);
    doc.text(title, 14, 15);
  }

  // Generate table
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: title ? 25 : 15,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.textWhite,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: PDF_COLORS.alternateRow,
    },
  });

  // Save the PDF
  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

/**
 * Helper function to convert array of objects to rows format for PDF export
 * 
 * Example usage:
 * ```ts
 * const data = [
 *   { name: 'John Doe', email: 'john@example.com', age: 30 },
 *   { name: 'Jane Smith', email: 'jane@example.com', age: 25 }
 * ];
 * const columns = ['Name', 'Email', 'Age'];
 * const rows = convertToTableRows(data, ['name', 'email', 'age']);
 * downloadPdfTable(columns, rows, 'users.pdf');
 * ```
 */
export function convertToTableRows(
  data: Record<string, any>[],
  keys: string[]
): (string | number)[][] {
  return data.map(item =>
    keys.map(key => {
      const value = item[key];
      if (value === null || value === undefined) return '';
      return value;
    })
  );
}
