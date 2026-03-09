import jsPDF from 'jspdf';
import { formatCurrency, formatDate, formatWeight } from './formatters';

// ─── Types ──────────────────────────────────────────────────────
interface CompanyInfo {
  name: string;
  tagline?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
}

interface ReportInvoice {
  invoiceNumber: string;
  customerName: string;
  issueDate: string;
  total: number;
  amountPaid: number;
  balanceDue: number;
  status: string;
  items: { productName: string; quantity: number; unitPrice: number; total: number; metalType?: string; karat?: string; metalWeight?: number }[];
}

interface ReportClearance {
  clearanceNumber: string;
  customerName: string;
  issueDate: string;
  total: number;
  amountPaid: number;
  balanceDue: number;
  status: string;
  clearanceReason?: string;
  items: { productName: string; quantity: number; unitPrice: number; total: number }[];
}

interface ReportProduct {
  name: string;
  sku: string;
  categoryName?: string;
  metalType: string;
  karat?: string;
  metalWeight: number;
  sellingPrice: number;
  stockQuantity: number;
}

interface ReportCustomer {
  name: string;
  phone: string;
  city?: string;
  customerType: string;
  totalPurchased: number;
}

export interface ReportData {
  company: CompanyInfo;
  periodLabel: string;
  dateFrom: string;
  dateTo: string;
  generatedAt: string;
  invoices: ReportInvoice[];
  clearances: ReportClearance[];
  products: ReportProduct[];
  customers: ReportCustomer[];
}

// ─── Constants ──────────────────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BLACK = '#000000';
const DARK = '#222222';
const GRAY = '#666666';
const LIGHT_GRAY = '#aaaaaa';
const LINE_COLOR = '#cccccc';
const BG_LIGHT = '#f8f8f8';

// ─── Helpers ────────────────────────────────────────────────────
function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_H - 20) {
    doc.addPage();
    return 20;
  }
  return y;
}

function drawLine(doc: jsPDF, y: number, x1 = MARGIN, x2 = PAGE_W - MARGIN) {
  doc.setDrawColor(LINE_COLOR);
  doc.setLineWidth(0.3);
  doc.line(x1, y, x2, y);
}

function drawThickLine(doc: jsPDF, y: number) {
  doc.setDrawColor(BLACK);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
}

function sectionTitle(doc: jsPDF, y: number, title: string): number {
  y = ensureSpace(doc, y, 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(BLACK);
  doc.text(title.toUpperCase(), MARGIN, y);
  y += 1.5;
  drawLine(doc, y);
  return y + 5;
}

function addFooter(doc: jsPDF, pageNum: number, totalPages: number, companyName: string) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(LIGHT_GRAY);
  doc.text(`${companyName}`, MARGIN, PAGE_H - 8);
  doc.text(`Page ${pageNum} of ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 8, { align: 'right' });
}

// ─── PDF Generator ──────────────────────────────────────────────
export function generateReportPdf(data: ReportData): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  let y = 0;

  // ── COVER / HEADER ──
  // Company name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(BLACK);
  doc.text(data.company.name || 'Onelka Jewellery', MARGIN, 16);

  // Tagline
  if (data.company.tagline) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(GRAY);
    doc.text(data.company.tagline, MARGIN, 22);
  }

  // Report title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(BLACK);
  doc.text('BUSINESS REPORT', PAGE_W - MARGIN, 14, { align: 'right' });

  // Period
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(GRAY);
  doc.text(data.periodLabel, PAGE_W - MARGIN, 21, { align: 'right' });

  // Date range
  doc.setFontSize(7);
  doc.text(`${data.dateFrom}  —  ${data.dateTo}`, PAGE_W - MARGIN, 27, { align: 'right' });

  // Generated at
  doc.setFontSize(6.5);
  doc.setTextColor(LIGHT_GRAY);
  doc.text(`Generated: ${data.generatedAt}`, PAGE_W - MARGIN, 32, { align: 'right' });

  // Separator line
  drawLine(doc, 36);

  // Company info line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(GRAY);
  const infoLine = [data.company.address, data.company.city, data.company.phone, data.company.email]
    .filter(Boolean)
    .join('  |  ');
  doc.text(infoLine, PAGE_W / 2, 42, { align: 'center' });

  y = 50;

  // ── EXECUTIVE SUMMARY ──
  y = sectionTitle(doc, y, 'Executive Summary');

  const totalInvoiceSales = data.invoices.reduce((s, i) => s + i.total, 0);
  const totalClearanceSales = data.clearances.reduce((s, c) => s + c.total, 0);
  const totalRevenue = totalInvoiceSales + totalClearanceSales;
  const totalCollected = data.invoices.reduce((s, i) => s + i.amountPaid, 0) + data.clearances.reduce((s, c) => s + c.amountPaid, 0);
  const totalOutstanding = data.invoices.reduce((s, i) => s + i.balanceDue, 0) + data.clearances.reduce((s, c) => s + c.balanceDue, 0);
  const totalInventoryValue = data.products.reduce((s, p) => s + p.sellingPrice * p.stockQuantity, 0);
  const totalInventoryItems = data.products.reduce((s, p) => s + p.stockQuantity, 0);
  const totalWeight = data.products.reduce((s, p) => s + p.metalWeight * p.stockQuantity, 0);

  // Summary — compact table-like layout
  const summaryItems = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue) },
    { label: 'Collected', value: formatCurrency(totalCollected) },
    { label: 'Outstanding', value: formatCurrency(totalOutstanding) },
    { label: 'Invoice Sales', value: formatCurrency(totalInvoiceSales) },
    { label: 'Clearance Sales', value: formatCurrency(totalClearanceSales) },
    { label: 'Inventory Value', value: formatCurrency(totalInventoryValue) },
  ];

  const colW = CONTENT_W / 3;
  summaryItems.forEach((item, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const bx = MARGIN + col * colW;
    const by = y + row * 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(GRAY);
    doc.text(item.label, bx + 2, by + 4);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(DARK);
    doc.text(item.value, bx + 2, by + 9.5);
  });

  y += 2 * 12 + 4;

  // Quick stats row
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(GRAY);
  const quickStats = [
    `${data.invoices.length} Invoices`,
    `${data.clearances.length} Clearances`,
    `${totalInventoryItems} Stock Items`,
    `${formatWeight(totalWeight)} Metal`,
    `${data.customers.length} Customers`,
  ].join('    •    ');
  doc.text(quickStats, PAGE_W / 2, y, { align: 'center' });
  y += 8;

  // ── SALES REPORT — INVOICES ──
  if (data.invoices.length > 0) {
    y = sectionTitle(doc, y, `Invoices (${data.invoices.length})`);

    // Table header
    y = ensureSpace(doc, y, 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(DARK);
    doc.text('#', MARGIN + 2, y);
    doc.text('Invoice', MARGIN + 10, y);
    doc.text('Customer', MARGIN + 38, y);
    doc.text('Date', MARGIN + 82, y);
    doc.text('Status', MARGIN + 108, y);
    doc.text('Total', MARGIN + 130, y, { align: 'right' });
    doc.text('Paid', MARGIN + 152, y, { align: 'right' });
    doc.text('Due', MARGIN + CONTENT_W - 2, y, { align: 'right' });
    y += 1.5;
    drawLine(doc, y);
    y += 3.5;

    data.invoices.forEach((inv, idx) => {
      y = ensureSpace(doc, y, 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(DARK);
      doc.text(String(idx + 1), MARGIN + 2, y);
      doc.setFont('helvetica', 'bold');
      doc.text(inv.invoiceNumber, MARGIN + 10, y);
      doc.setFont('helvetica', 'normal');
      doc.text(inv.customerName.substring(0, 22), MARGIN + 38, y);
      doc.setTextColor(GRAY);
      doc.text(formatDate(inv.issueDate), MARGIN + 82, y);
      doc.setTextColor(DARK);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.text(inv.status.toUpperCase(), MARGIN + 108, y);
      doc.setFontSize(6.5);
      doc.setTextColor(DARK);
      doc.text(formatCurrency(inv.total), MARGIN + 130, y, { align: 'right' });
      doc.text(formatCurrency(inv.amountPaid), MARGIN + 152, y, { align: 'right' });
      doc.text(formatCurrency(inv.balanceDue), MARGIN + CONTENT_W - 2, y, { align: 'right' });
      y += 5;
    });

    // Invoice totals
    y += 0.5;
    drawLine(doc, y);
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(DARK);
    doc.text('INVOICE TOTALS', MARGIN + 2, y);
    doc.text(formatCurrency(totalInvoiceSales), MARGIN + 130, y, { align: 'right' });
    doc.text(formatCurrency(data.invoices.reduce((s, i) => s + i.amountPaid, 0)), MARGIN + 152, y, { align: 'right' });
    const invDue = data.invoices.reduce((s, i) => s + i.balanceDue, 0);
    doc.text(formatCurrency(invDue), MARGIN + CONTENT_W - 2, y, { align: 'right' });
    y += 8;
  }

  // ── CLEARANCE SALES ──
  if (data.clearances.length > 0) {
    y = sectionTitle(doc, y, `Clearance Sales (${data.clearances.length})`);

    y = ensureSpace(doc, y, 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(DARK);
    doc.text('#', MARGIN + 2, y);
    doc.text('Clearance', MARGIN + 10, y);
    doc.text('Customer', MARGIN + 40, y);
    doc.text('Date', MARGIN + 82, y);
    doc.text('Reason', MARGIN + 105, y);
    doc.text('Total', MARGIN + 145, y, { align: 'right' });
    doc.text('Due', MARGIN + CONTENT_W - 2, y, { align: 'right' });
    y += 1.5;
    drawLine(doc, y);
    y += 3.5;

    data.clearances.forEach((clr, idx) => {
      y = ensureSpace(doc, y, 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(DARK);
      doc.text(String(idx + 1), MARGIN + 2, y);
      doc.setFont('helvetica', 'bold');
      doc.text(clr.clearanceNumber, MARGIN + 10, y);
      doc.setFont('helvetica', 'normal');
      doc.text(clr.customerName.substring(0, 22), MARGIN + 40, y);
      doc.setTextColor(GRAY);
      doc.text(formatDate(clr.issueDate), MARGIN + 82, y);
      doc.setFontSize(6);
      doc.text((clr.clearanceReason || '—').substring(0, 18), MARGIN + 105, y);
      doc.setFontSize(6.5);
      doc.setTextColor(DARK);
      doc.text(formatCurrency(clr.total), MARGIN + 145, y, { align: 'right' });
      doc.text(formatCurrency(clr.balanceDue), MARGIN + CONTENT_W - 2, y, { align: 'right' });
      y += 5;
    });

    // Clearance totals
    y += 0.5;
    drawLine(doc, y);
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(DARK);
    doc.text('CLEARANCE TOTALS', MARGIN + 2, y);
    doc.text(formatCurrency(totalClearanceSales), MARGIN + 145, y, { align: 'right' });
    const clrDue = data.clearances.reduce((s, c) => s + c.balanceDue, 0);
    doc.text(formatCurrency(clrDue), MARGIN + CONTENT_W - 2, y, { align: 'right' });
    y += 8;
  }

  // ── INVENTORY OVERVIEW ──
  y = sectionTitle(doc, y, 'Inventory Overview');

  // Category breakdown
  const categoryMap: Record<string, { count: number; value: number; weight: number }> = {};
  data.products.forEach((p) => {
    const key = p.categoryName || 'Uncategorized';
    if (!categoryMap[key]) categoryMap[key] = { count: 0, value: 0, weight: 0 };
    categoryMap[key].count += p.stockQuantity;
    categoryMap[key].value += p.sellingPrice * p.stockQuantity;
    categoryMap[key].weight += p.metalWeight * p.stockQuantity;
  });
  const categories = Object.entries(categoryMap).sort((a, b) => b[1].value - a[1].value);

  if (categories.length > 0) {
    y = ensureSpace(doc, y, 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(DARK);
    doc.text('Category', MARGIN + 2, y);
    doc.text('Items', MARGIN + 80, y, { align: 'right' });
    doc.text('Weight', MARGIN + 115, y, { align: 'right' });
    doc.text('Value', MARGIN + CONTENT_W - 2, y, { align: 'right' });
    y += 1.5;
    drawLine(doc, y);
    y += 3.5;

    categories.forEach(([name, d]) => {
      y = ensureSpace(doc, y, 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(DARK);
      doc.text(name, MARGIN + 2, y);
      doc.text(String(d.count), MARGIN + 80, y, { align: 'right' });
      doc.setTextColor(GRAY);
      doc.text(formatWeight(d.weight), MARGIN + 115, y, { align: 'right' });
      doc.setTextColor(DARK);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(d.value), MARGIN + CONTENT_W - 2, y, { align: 'right' });
      y += 5;
    });

    y += 0.5;
    drawLine(doc, y);
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(DARK);
    doc.text('TOTAL INVENTORY', MARGIN + 2, y);
    doc.text(String(totalInventoryItems), MARGIN + 80, y, { align: 'right' });
    doc.text(formatWeight(totalWeight), MARGIN + 115, y, { align: 'right' });
    doc.text(formatCurrency(totalInventoryValue), MARGIN + CONTENT_W - 2, y, { align: 'right' });
    y += 8;
  }

  // Metal breakdown
  const metalMap: Record<string, { count: number; weight: number; value: number }> = {};
  data.products.forEach((p) => {
    const key = p.karat ? `${p.metalType} ${p.karat}` : p.metalType;
    if (!metalMap[key]) metalMap[key] = { count: 0, weight: 0, value: 0 };
    metalMap[key].count += p.stockQuantity;
    metalMap[key].weight += p.metalWeight * p.stockQuantity;
    metalMap[key].value += p.sellingPrice * p.stockQuantity;
  });
  const metals = Object.entries(metalMap).sort((a, b) => b[1].value - a[1].value);

  if (metals.length > 0) {
    y = ensureSpace(doc, y, 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(DARK);
    doc.text('By Metal Type', MARGIN, y);
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text('Metal', MARGIN + 2, y);
    doc.text('Pcs', MARGIN + 80, y, { align: 'right' });
    doc.text('Weight', MARGIN + 115, y, { align: 'right' });
    doc.text('Value', MARGIN + CONTENT_W - 2, y, { align: 'right' });
    y += 1.5;
    drawLine(doc, y);
    y += 3.5;

    metals.forEach(([name, d]) => {
      y = ensureSpace(doc, y, 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(DARK);
      const capitalizedName = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      doc.text(capitalizedName, MARGIN + 2, y);
      doc.text(String(d.count), MARGIN + 80, y, { align: 'right' });
      doc.setTextColor(GRAY);
      doc.text(formatWeight(d.weight), MARGIN + 115, y, { align: 'right' });
      doc.setTextColor(DARK);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(d.value), MARGIN + CONTENT_W - 2, y, { align: 'right' });
      y += 5;
    });
    y += 6;
  }

  // ── TOP CUSTOMERS ──
  if (data.customers.length > 0) {
    y = sectionTitle(doc, y, `Customer Summary (${data.customers.length})`);

    // Customer type breakdown
    const typeMap: Record<string, number> = {};
    data.customers.forEach((c) => {
      typeMap[c.customerType] = (typeMap[c.customerType] || 0) + 1;
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(GRAY);
    const typeStr = Object.entries(typeMap)
      .map(([t, n]) => `${t.charAt(0).toUpperCase() + t.slice(1)}: ${n}`)
      .join('    •    ');
    doc.text(typeStr, MARGIN, y);
    y += 5;

    // Top customers table
    const topCustomers = [...data.customers]
      .sort((a, b) => b.totalPurchased - a.totalPurchased)
      .slice(0, 15);

    y = ensureSpace(doc, y, 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(DARK);
    doc.text('#', MARGIN + 2, y);
    doc.text('Customer', MARGIN + 10, y);
    doc.text('Phone', MARGIN + 65, y);
    doc.text('City', MARGIN + 100, y);
    doc.text('Type', MARGIN + 130, y);
    doc.text('Total Purchased', MARGIN + CONTENT_W - 2, y, { align: 'right' });
    y += 1.5;
    drawLine(doc, y);
    y += 3.5;

    topCustomers.forEach((cust, idx) => {
      y = ensureSpace(doc, y, 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(DARK);
      doc.text(String(idx + 1), MARGIN + 2, y);
      doc.setFont('helvetica', 'bold');
      doc.text(cust.name.substring(0, 28), MARGIN + 10, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(GRAY);
      doc.text(cust.phone || '—', MARGIN + 65, y);
      doc.text((cust.city || '—').substring(0, 15), MARGIN + 100, y);
      doc.setFontSize(6);
      doc.text(cust.customerType.toUpperCase(), MARGIN + 130, y);
      doc.setFontSize(6.5);
      doc.setTextColor(DARK);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(cust.totalPurchased), MARGIN + CONTENT_W - 2, y, { align: 'right' });
      y += 5;
    });
    y += 6;
  }

  // ── PAYMENT ANALYSIS ──
  y = sectionTitle(doc, y, 'Payment Analysis');

  const allSales = [
    ...data.invoices.map(i => ({ type: 'Invoice', number: i.invoiceNumber, total: i.total, paid: i.amountPaid, due: i.balanceDue, status: i.status })),
    ...data.clearances.map(c => ({ type: 'Clearance', number: c.clearanceNumber, total: c.total, paid: c.amountPaid, due: c.balanceDue, status: c.status })),
  ];

  const paidCount = allSales.filter(s => s.status === 'paid').length;
  const partialCount = allSales.filter(s => s.status === 'partial').length;
  const pendingCount = allSales.filter(s => s.status === 'pending').length;
  const cancelledCount = allSales.filter(s => s.status === 'cancelled').length;
  const collectionRate = totalRevenue > 0 ? ((totalCollected / totalRevenue) * 100).toFixed(1) : '0.0';

  const paymentStats = [
    { label: 'Fully Paid', value: String(paidCount) },
    { label: 'Partial', value: String(partialCount) },
    { label: 'Pending', value: String(pendingCount) },
    { label: 'Cancelled', value: String(cancelledCount) },
    { label: 'Collection Rate', value: `${collectionRate}%` },
  ];

  const psColW = CONTENT_W / 5;
  paymentStats.forEach((ps, i) => {
    const bx = MARGIN + i * psColW;
    y = ensureSpace(doc, y, 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(GRAY);
    doc.text(ps.label, bx + psColW / 2, y + 4, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(DARK);
    doc.text(ps.value, bx + psColW / 2, y + 10, { align: 'center' });
  });
  y += 14;

  // Outstanding invoices
  const outstandingSales = allSales.filter(s => s.due > 0).sort((a, b) => b.due - a.due);
  if (outstandingSales.length > 0) {
    y = ensureSpace(doc, y, 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(DARK);
    doc.text(`Outstanding Balances (${outstandingSales.length})`, MARGIN, y);
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text('Type', MARGIN + 2, y);
    doc.text('Reference', MARGIN + 28, y);
    doc.text('Total', MARGIN + 90, y, { align: 'right' });
    doc.text('Paid', MARGIN + 125, y, { align: 'right' });
    doc.text('Balance Due', MARGIN + CONTENT_W - 2, y, { align: 'right' });
    y += 1.5;
    drawLine(doc, y);
    y += 3.5;

    outstandingSales.slice(0, 20).forEach((s) => {
      y = ensureSpace(doc, y, 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(GRAY);
      doc.text(s.type, MARGIN + 2, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(DARK);
      doc.text(s.number, MARGIN + 28, y);
      doc.setFont('helvetica', 'normal');
      doc.text(formatCurrency(s.total), MARGIN + 90, y, { align: 'right' });
      doc.text(formatCurrency(s.paid), MARGIN + 125, y, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(s.due), MARGIN + CONTENT_W - 2, y, { align: 'right' });
      y += 5;
    });
    y += 4;
  }

  // ── GRAND TOTALS ──
  y = ensureSpace(doc, y, 18);
  y += 2;
  drawLine(doc, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(BLACK);
  doc.text('GRAND TOTALS', MARGIN + 2, y);
  doc.setFontSize(7);
  doc.text(`Revenue: ${formatCurrency(totalRevenue)}`, MARGIN + 2, y + 6);
  doc.text(`Collected: ${formatCurrency(totalCollected)}`, MARGIN + 65, y + 6);
  doc.text(`Outstanding: ${formatCurrency(totalOutstanding)}`, MARGIN + 125, y + 6);

  // ── Add page numbers ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages, data.company.name || 'Onelka Jewellery');
  }

  // ── Save ──
  const safePeriod = data.periodLabel.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '_');
  doc.save(`Report_${safePeriod}.pdf`);
}
