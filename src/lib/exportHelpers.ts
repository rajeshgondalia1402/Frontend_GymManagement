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