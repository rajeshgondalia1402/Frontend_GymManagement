// Small helper for CSV & PDF export examples using jspdf + jspdf-autotable
// Install runtime deps: jspdf jspdf-autotable @types/jspdf-autotable
// TODO: Install packages before using: npm install jspdf jspdf-autotable @types/jspdf-autotable
// import { jsPDF } from 'jspdf';
// import autoTable from 'jspdf-autotable';

export function downloadCsv(rows: Array<Record<string, any>>, filename = 'export.csv') {
  if (!rows || !rows.length) {
    const blob = new Blob([''], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const header = Object.keys(rows[0]).join(',');
  const csv = [
    header,
    ...rows.map((r) =>
      Object.values(r)
        .map((v) => {
          if (v === null || v === undefined) return '';
          const s = String(v).replace(/"/g, '""');
          return `"${s}"`;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadPdfTable(_columns: string[], _rows: Array<Array<string | number | null>>, _filename = 'export.pdf') {
  // TODO: Install jspdf packages first: npm install jspdf jspdf-autotable @types/jspdf-autotable
  console.warn('PDF export requires jspdf packages. Please install them first.');
  // const doc = new jsPDF();
  // autoTable(doc, {
  //   head: [columns],
  //   body: rows,
  //   styles: { fontSize: 10 },
  //   theme: 'striped',
  // });
  // doc.save(filename);
}

/**
 * Export data to XLS format (Excel-compatible HTML table)
 * Uses native browser capabilities without external dependencies
 */
export function downloadXls(rows: Array<Record<string, any>>, filename = 'export.xls') {
  if (!rows || !rows.length) {
    console.warn('No data to export');
    return;
  }

  const headers = Object.keys(rows[0]);

  // Create HTML table that Excel can read
  let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
  html += '<head><meta charset="utf-8"><style>td,th{border:1px solid #ccc;padding:4px 8px;}th{background:#f0f0f0;font-weight:bold;}</style></head>';
  html += '<body><table>';

  // Header row
  html += '<tr>';
  headers.forEach((h) => {
    html += `<th>${escapeHtml(formatHeader(h))}</th>`;
  });
  html += '</tr>';

  // Data rows
  rows.forEach((row) => {
    html += '<tr>';
    headers.forEach((h) => {
      const val = row[h];
      html += `<td>${escapeHtml(formatValue(val))}</td>`;
    });
    html += '</tr>';
  });

  html += '</table></body></html>';

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Helper to escape HTML special characters
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Helper to format header names (camelCase to Title Case)
function formatHeader(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

// Helper to format values for display
function formatValue(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (val instanceof Date) return val.toLocaleDateString();
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}