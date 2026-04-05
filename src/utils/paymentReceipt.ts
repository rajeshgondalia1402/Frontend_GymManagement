import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { BalancePayment } from '@/types';
import { formatPhoneForWhatsApp } from '@/utils/whatsapp';

interface ReceiptData {
  gymName: string;
  memberName: string;
  memberId?: string;
  memberPhone?: string;
  payment: BalancePayment;
}

/**
 * Generate a styled PDF payment receipt
 */
function generateReceiptPDF(data: ReceiptData): jsPDF {
  const { gymName, memberName, memberId, payment } = data;

  const doc = new jsPDF({ unit: 'mm', format: 'a5' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  let y = 12;

  // ── Header Background ──
  doc.setFillColor(30, 58, 138); // deep blue
  doc.rect(0, 0, pageWidth, 36, 'F');

  // Gym Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(gymName, pageWidth / 2, y + 8, { align: 'center' });

  // "Payment Receipt" subtitle
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('PAYMENT RECEIPT', pageWidth / 2, y + 16, { align: 'center' });

  // Receipt No badge
  doc.setFontSize(9);
  doc.text(`Receipt No: ${payment.receiptNo || 'N/A'}`, pageWidth / 2, y + 23, { align: 'center' });

  y = 44;

  // ── Member & Payment Info Table ──
  doc.setTextColor(0, 0, 0);

  const paymentDate = payment.paymentDate
    ? format(new Date(payment.paymentDate), 'dd MMM yyyy')
    : 'N/A';
  const nextDue = payment.nextPaymentDate
    ? format(new Date(payment.nextPaymentDate), 'dd MMM yyyy')
    : 'N/A';

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35, textColor: [80, 80, 80] },
      1: { cellWidth: 'auto' },
    },
    body: [
      ['Member Name', memberName],
      ['Member ID', memberId || 'N/A'],
      ['Payment Date', paymentDate],
      ['Payment For', payment.paymentFor === 'PT' ? 'Personal Training' : 'Regular Membership'],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  // ── Amount Box ──
  const boxWidth = pageWidth - margin * 2;
  doc.setFillColor(240, 253, 244); // light green bg
  doc.setDrawColor(34, 197, 94); // green border
  doc.roundedRect(margin, y, boxWidth, 18, 2, 2, 'FD');

  doc.setFontSize(10);
  doc.setTextColor(22, 101, 52);
  doc.setFont('helvetica', 'bold');
  doc.text('Amount Paid', margin + 6, y + 7);

  doc.setFontSize(16);
  doc.text(`Rs. ${payment.paidFees.toLocaleString('en-IN')}`, pageWidth - margin - 6, y + 11, {
    align: 'right',
  });

  // Payment mode under amount
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Payment Mode: ${payment.payMode}`, margin + 6, y + 14);

  y += 24;

  // ── Additional Details Table ──
  const additionalRows: string[][] = [
    ['Next Due Date', nextDue],
  ];
  if (payment.notes) {
    additionalRows.push(['Notes', payment.notes]);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35, textColor: [80, 80, 80] },
      1: { cellWidth: 'auto' },
    },
    body: additionalRows,
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ── Divider ──
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ── Thank You ──
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for your payment!', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(gymName, pageWidth / 2, y, { align: 'center' });

  // ── Footer ──
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(245, 245, 245);
  doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text(`Generated on ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, pageWidth / 2, pageHeight - 4, { align: 'center' });

  return doc;
}

/**
 * Generate PDF receipt and share via WhatsApp using Web Share API.
 * Falls back to downloading the PDF + opening WhatsApp with text message.
 */
export async function sharePaymentReceiptPDF(data: ReceiptData): Promise<{ success: boolean; error?: string }> {
  const { memberName, memberPhone, payment, gymName } = data;

  try {
    const doc = generateReceiptPDF(data);
    const pdfBlob = doc.output('blob');
    const fileName = `Receipt_${payment.receiptNo || 'payment'}_${memberName.replace(/\s+/g, '_')}.pdf`;

    // Try Web Share API with file (works on mobile & some desktop browsers)
    if (navigator.share && navigator.canShare) {
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      const shareData = { files: [file] };

      if (navigator.canShare(shareData)) {
        await navigator.share({
          files: [file],
          title: 'Payment Receipt',
          text: `Payment Receipt - ${gymName}`,
        });
        return { success: true };
      }
    }

    // Fallback: Download PDF + open WhatsApp with text message
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    // Also open WhatsApp with a text message pointing to the receipt
    const formattedPhone = formatPhoneForWhatsApp(memberPhone);
    if (formattedPhone) {
      const paymentDate = payment.paymentDate ? format(new Date(payment.paymentDate), 'dd MMM yyyy') : 'N/A';
      const message =
        `*💳 Payment Receipt - ${gymName}*\n` +
        `─────────────────\n` +
        `*Receipt No:* ${payment.receiptNo || 'N/A'}\n` +
        `*Member:* ${memberName}\n` +
        `*Date:* ${paymentDate}\n` +
        `*Amount Paid:* ₹${payment.paidFees.toLocaleString('en-IN')}\n` +
        `*Payment Mode:* ${payment.payMode}\n` +
        `─────────────────\n` +
        `📎 PDF receipt downloaded. Please attach and send.\n` +
        `Thank you! 🙏`;
      const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }

    return { success: true };
  } catch (err: any) {
    // User cancelled share dialog — not an error
    if (err?.name === 'AbortError') {
      return { success: true };
    }
    return { success: false, error: err?.message || 'Failed to generate receipt' };
  }
}
