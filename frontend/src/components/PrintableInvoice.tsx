import { forwardRef } from 'react';
import type { Invoice, Customer, CompanyInfo } from '../types/index';
import { formatCurrency, formatDate, formatWeight } from '../utils/formatters';

interface PrintableInvoiceProps {
  invoice: Invoice;
  customer?: Customer;
  company?: CompanyInfo;
}

// Default company info for the jewellery store
const defaultCompany: CompanyInfo = {
  name: 'Onelka Jewellery',
  tagline: 'Exquisite Craftsmanship Since 1985',
  address: 'Makandura, Matara.',
  city: 'Matara',
  country: 'Sri Lanka',
  phone: '0770400789',
  email: 'onelkajewellery95@gmail.com',
};

export const PrintableInvoice = forwardRef<HTMLDivElement, PrintableInvoiceProps>(
  ({ invoice, customer, company = defaultCompany }, ref) => {
    // Calculate totals
    const calculateItemDiscounts = () => {
      return invoice.items.reduce((sum, item) => {
        const origPrice = item.originalPrice || item.unitPrice;
        const discount = (origPrice - item.unitPrice) * item.quantity;
        return sum + (discount > 0 ? discount : 0);
      }, 0);
    };

    const itemDiscounts = calculateItemDiscounts();

    return (
      <div ref={ref} className="print-invoice-a5">
        <style>{`
          /* =========================================
             A5 Invoice Styles - Jewellery System
             A5 Size: 148mm x 210mm
             ========================================= */
          
          /* System fonts - no external loading */
          
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            body {
              margin: 0;
              padding: 0;
              background: white;
            }
            
            .print-invoice-a5 {
              width: 100%;
              max-width: none;
              padding: 0;
              margin: 0 auto;
              background: white !important;
              color: #1a1a1a !important;
            }
            
            .no-print {
              display: none !important;
            }

            table {
              page-break-inside: avoid;
            }
          }
          
          .print-invoice-a5 {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm 20mm;
            margin: 0 auto;
            background: white;
            color: #1a1a1a;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.5;
            box-sizing: border-box;
          }

          /* ========== Header Section ========== */
          .invoice-header-a5 {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
            padding-bottom: 10px;
            border-bottom: 2px solid #333;
            position: relative;
          }

          .invoice-header-a5::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, #333, transparent);
          }

          .company-info-a5 {
            flex: 1;
          }

          .company-info-a5 h1 {
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 24pt;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0 0 3px 0;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }

          .company-info-a5 .tagline {
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 10pt;
            color: #666;
            font-style: italic;
            letter-spacing: 1px;
            margin-bottom: 6px;
          }

          .company-info-a5 .details {
            font-size: 9pt;
            color: #666;
            line-height: 1.5;
          }

          .invoice-title-a5 {
            text-align: right;
          }

          .invoice-title-a5 h2 {
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 28pt;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0;
            letter-spacing: 2px;
          }

          .invoice-title-a5 .invoice-number {
            font-size: 12pt;
            font-weight: 600;
            color: #333;
            margin-top: 6px;
            background: white;
            padding: 4px 12px;
            border-radius: 3px;
            border: 1.5px solid #999;
          }

          /* ========== Meta Section ========== */
          .invoice-meta-a5 {
            display: flex;
            justify-content: space-between;
            margin-bottom: 16px;
            gap: 16px;
          }

          .meta-box-a5 {
            flex: 1;
            padding: 10px 14px;
            background: white;
            border-left: 2.5px solid #333;
            border-radius: 0;
          }

          .meta-box-a5.right {
            border-left: none;
            border-right: 2.5px solid #333;
            border-radius: 0;
            text-align: right;
          }

          .meta-box-a5 label {
            display: block;
            font-size: 9pt;
            font-weight: 700;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 5px;
          }

          .meta-box-a5 .name {
            font-size: 13pt;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 3px;
          }

          .meta-box-a5 .info {
            font-size: 10pt;
            color: #555;
            line-height: 1.5;
          }

          /* ========== Items Table ========== */
          .items-table-a5 {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
            font-size: 11pt;
          }

          .items-table-a5 thead th {
            background: white;
            color: #1a1a1a;
            font-size: 9pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            padding: 8px 8px;
            text-align: left;
            border-bottom: 2px solid #333;
            border-top: 1px solid #333;
          }

          .items-table-a5 thead th:first-child {
            width: 6%;
            text-align: center;
            border-radius: 3px 0 0 0;
          }

          .items-table-a5 thead th:nth-child(2) {
            width: 35%;
          }

          .items-table-a5 thead th:nth-child(3) {
            width: 12%;
            text-align: center;
          }

          .items-table-a5 thead th:nth-child(4) {
            width: 8%;
            text-align: center;
          }

          .items-table-a5 thead th:nth-child(5),
          .items-table-a5 thead th:nth-child(6) {
            width: 18%;
            text-align: right;
          }

          .items-table-a5 thead th:last-child {
            border-radius: 0 3px 0 0;
          }

          .items-table-a5 tbody tr {
            border-bottom: 1px solid #ddd;
          }

          .items-table-a5 tbody tr:nth-child(even) {
            background: white;
          }

          .items-table-a5 tbody tr:hover {
            background: white;
          }

          .items-table-a5 tbody td {
            padding: 8px;
            color: #333;
            vertical-align: middle;
          }

          .items-table-a5 tbody td:first-child {
            text-align: center;
            color: #888;
            font-weight: 500;
          }

          .items-table-a5 tbody td:nth-child(2) .item-name {
            font-weight: 600;
            color: #1a1a1a;
            font-size: 11pt;
          }

          .items-table-a5 tbody td:nth-child(2) .item-details {
            font-size: 9pt;
            color: #777;
            margin-top: 2px;
          }

          .items-table-a5 tbody td:nth-child(3),
          .items-table-a5 tbody td:nth-child(4) {
            text-align: center;
          }

          .items-table-a5 tbody td:nth-child(5),
          .items-table-a5 tbody td:nth-child(6) {
            text-align: right;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 10pt;
          }

          .items-table-a5 tbody td:nth-child(6) {
            font-weight: 600;
            color: #1a1a1a;
          }

          /* ========== Totals Section ========== */
          .totals-section-a5 {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 10px;
          }

          .totals-box-a5 {
            width: 50%;
          }

          .totals-row-a5 {
            display: flex;
            justify-content: space-between;
            padding: 5px 10px;
            font-size: 11pt;
          }

          .totals-row-a5 .label {
            color: #666;
          }

          .totals-row-a5 .value {
            font-family: 'Consolas', 'Monaco', monospace;
            color: #333;
            font-weight: 500;
          }

          .totals-row-a5.subtotal {
            border-bottom: 1px solid #ddd;
          }

          .totals-row-a5.discount {
            color: #333;
          }

          .totals-row-a5.discount .value {
            color: #333;
          }

          .totals-row-a5.total {
            background: white;
            color: #1a1a1a;
            font-size: 13pt;
            font-weight: 700;
            margin-top: 6px;
            padding: 8px 10px;
            border-top: 2px solid #333;
            border-bottom: 2px solid #333;
          }

          .totals-row-a5.total .value {
            color: #1a1a1a;
            font-size: 14pt;
          }

          .totals-row-a5.total .label {
            color: #1a1a1a;
          }

          .totals-row-a5.balance {
            background: white;
            border: 1px solid #333;
            margin-top: 4px;
            border-radius: 3px;
          }

          .totals-row-a5.balance .label,
          .totals-row-a5.balance .value {
            color: #333;
            font-weight: 600;
          }

          /* ========== Payment Info ========== */
          .payment-info-a5 {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
          }

          .payment-box-a5 {
            flex: 1;
            padding: 10px 14px;
            background: white;
            border: 1px solid #999;
            border-radius: 4px;
            font-size: 11pt;
          }

          .payment-box-a5 label {
            display: block;
            font-size: 9pt;
            font-weight: 700;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
          }

          .payment-box-a5 .value {
            font-weight: 600;
            color: #1a1a1a;
            font-size: 12pt;
          }

          /* ========== Status Badge ========== */
          .status-badge-a5 {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 10px;
            font-size: 9pt;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }

          .status-paid { background: white; color: #333; border: 1px solid #999; }
          .status-pending { background: white; color: #555; border: 1px solid #999; }
          .status-partial { background: white; color: #444; border: 1px solid #999; }
          .status-cancelled { background: white; color: #555; border: 1px solid #999; }
          .status-draft { background: white; color: #6b7280; border: 1px solid #999; }

          /* ========== Notes Section ========== */
          .notes-section-a5 {
            background: white;
            border: 1px solid #999;
            border-radius: 4px;
            padding: 10px 14px;
            margin-bottom: 12px;
          }

          .notes-section-a5 label {
            display: block;
            font-size: 9pt;
            font-weight: 700;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }

          .notes-section-a5 p {
            font-size: 10pt;
            color: #444;
            margin: 0;
            line-height: 1.5;
          }

          /* ========== Terms Section ========== */
          .terms-section-a5 {
            background: white;
            border: 1px solid #999;
            border-radius: 4px;
            padding: 10px 14px;
            margin-bottom: 14px;
          }

          .terms-section-a5 label {
            display: block;
            font-size: 9pt;
            font-weight: 700;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }

          .terms-section-a5 ul {
            margin: 0;
            padding-left: 16px;
            font-size: 9pt;
            color: #666;
            line-height: 1.6;
          }

          .terms-section-a5 ul li {
            margin-bottom: 1px;
          }

          /* ========== Footer ========== */
          .footer-a5 {
            border-top: 2px solid #333;
            padding-top: 8px;
            text-align: center;
            position: relative;
          }

          .footer-a5::before {
            content: '';
            position: absolute;
            top: 2px;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, #333, transparent);
          }

          .footer-a5 .thank-you {
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 14pt;
            font-weight: 600;
            color: #333;
            margin-bottom: 6px;
          }

          .footer-a5 .contact {
            font-size: 10pt;
            color: #666;
          }

          .footer-a5 .contact a {
            color: #333;
            text-decoration: none;
            font-weight: 500;
          }

          .footer-a5 .tagline-footer {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #ddd;
            font-size: 9pt;
            color: #999;
            letter-spacing: 0.5px;
          }

          /* ========== Accent Decorations ========== */
          .gold-diamond {
            display: inline-block;
            width: 4px;
            height: 4px;
            background: white;
            border: 1px solid #333;
            transform: rotate(45deg);
            margin: 0 4px;
          }
        `}</style>

        {/* Header */}
        <div className="invoice-header-a5">
          <div className="company-info-a5">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <img src="/logo.jpg" alt="Logo" style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '4px' }} />
              <h1>{company.name}</h1>
            </div>
            {company.tagline && <div className="tagline">{company.tagline}</div>}
            <div className="details">
              {company.address}, {company.city}<br />
              Tel: {company.phone} {company.phone2 && `| ${company.phone2}`}<br />
              Email: {company.email}
              {company.website && <> | Web: {company.website}</>}
            </div>
          </div>
          <div className="invoice-title-a5">
            <h2>INVOICE</h2>
            <div className="invoice-number">{invoice.invoiceNumber}</div>
          </div>
        </div>

        {/* Bill To & Invoice Details */}
        <div className="invoice-meta-a5">
          <div className="meta-box-a5">
            <label>Bill To</label>
            <div className="name">{invoice.customerName}</div>
            {customer && (
              <div className="info">
                {customer.businessName && <>{customer.businessName}<br /></>}
                {customer.address && <>{customer.address}<br /></>}
                {customer.phone && <>Tel: {customer.phone}<br /></>}
                {customer.email && <>{customer.email}</>}
              </div>
            )}
            {!customer && invoice.customerPhone && (
              <div className="info">
                Tel: {invoice.customerPhone}<br />
                {invoice.customerAddress}
              </div>
            )}
          </div>
          <div className="meta-box-a5 right">
            <label>Invoice Details</label>
            <div className="info">
              <strong>Date:</strong> {formatDate(invoice.issueDate)}<br />
              {invoice.dueDate && <><strong>Due:</strong> {formatDate(invoice.dueDate)}<br /></>}
              <strong>Status:</strong>{' '}
              <span className={`status-badge-a5 status-${invoice.status}`}>
                {invoice.status}
              </span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="items-table-a5">
          <thead>
            <tr>
              <th>#</th>
              <th>Item Description</th>
              <th>Weight</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={item.id}>
                <td>{String(index + 1).padStart(2, '0')}</td>
                <td>
                  <div className="item-name">{item.productName}</div>
                  <div className="item-details">
                    {item.metalType.toUpperCase()}
                    {item.karat && ` • ${item.karat}`}
                    {item.sku && ` • SKU: ${item.sku}`}
                  </div>
                </td>
                <td>{formatWeight(item.metalWeight)}</td>
                <td>{item.quantity}</td>
                <td>{formatCurrency(item.unitPrice)}</td>
                <td>{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="totals-section-a5">
          <div className="totals-box-a5">
            <div className="totals-row-a5 subtotal">
              <span className="label">Subtotal</span>
              <span className="value">{formatCurrency(invoice.subtotal)}</span>
            </div>
            
            {itemDiscounts > 0 && (
              <div className="totals-row-a5 discount">
                <span className="label">Item Discounts</span>
                <span className="value">-{formatCurrency(itemDiscounts)}</span>
              </div>
            )}
            
            {invoice.discount > 0 && (
              <div className="totals-row-a5 discount">
                <span className="label">
                  Discount {invoice.discountType === 'percentage' && `(${invoice.discount}%)`}
                </span>
                <span className="value">-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            
            {invoice.tax > 0 && (
              <div className="totals-row-a5">
                <span className="label">Tax {invoice.taxRate && `(${invoice.taxRate}%)`}</span>
                <span className="value">{formatCurrency(invoice.tax)}</span>
              </div>
            )}
            
            <div className="totals-row-a5 total">
              <span className="label">Total Amount</span>
              <span className="value">{formatCurrency(invoice.total)}</span>
            </div>
            
            {invoice.balanceDue > 0 && (
              <div className="totals-row-a5 balance">
                <span className="label">Balance Due</span>
                <span className="value">{formatCurrency(invoice.balanceDue)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Info */}
        {invoice.amountPaid > 0 && (
          <div className="payment-info-a5">
            <div className="payment-box-a5">
              <label>Amount Paid</label>
              <div className="value">{formatCurrency(invoice.amountPaid)}</div>
            </div>
            {invoice.paymentMethod && (
              <div className="payment-box-a5">
                <label>Payment Method</label>
                <div className="value">{invoice.paymentMethod.replace('-', ' ').toUpperCase()}</div>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="notes-section-a5">
            <label>Notes</label>
            <p>{invoice.notes}</p>
          </div>
        )}

        {/* Terms */}
        <div className="terms-section-a5">
          <label>Terms & Conditions</label>
          <ul>
            <li>All jewellery items are hallmarked and certified.</li>
            <li>Exchange within 7 days with original receipt. No refunds on custom-made items.</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="footer-a5">
          <div className="thank-you">
            <span className="gold-diamond"></span>
            Thank You for Your Patronage
            <span className="gold-diamond"></span>
          </div>
          <div className="contact">
            Questions? Contact us at <a href={`mailto:${company.email}`}>{company.email}</a> or call <a href={`tel:${company.phone}`}>{company.phone}</a>
          </div>
          <div className="tagline-footer">
            ✦ Premium Quality ✦ Expert Craftsmanship ✦ Lifetime Warranty ✦
          </div>
        </div>
      </div>
    );
  }
);

PrintableInvoice.displayName = 'PrintableInvoice';

export default PrintableInvoice;
