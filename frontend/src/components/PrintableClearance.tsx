import { forwardRef } from 'react';
import type { Clearance, Customer, CompanyInfo } from '../types/index';
import { formatCurrency, formatDate, formatWeight } from '../utils/formatters';

interface PrintableClearanceProps {
  clearance: Clearance;
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

export const PrintableClearance = forwardRef<HTMLDivElement, PrintableClearanceProps>(
  ({ clearance, customer, company = defaultCompany }, ref) => {
    // Calculate totals
    const calculateItemDiscounts = () => {
      return clearance.items.reduce((sum, item) => {
        const origPrice = item.originalPrice || item.unitPrice;
        const discount = (origPrice - item.unitPrice) * item.quantity;
        return sum + (discount > 0 ? discount : 0);
      }, 0);
    };

    const itemDiscounts = calculateItemDiscounts();

    return (
      <div ref={ref} className="print-clearance-a5">
        <style>{`
          /* =========================================
             A5 Clearance Styles - Jewellery System
             A5 Size: 148mm x 210mm
             ========================================= */
          
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
            
            .print-clearance-a5 {
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
          
          .print-clearance-a5 {
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
          .clr-header-a5 {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
            padding-bottom: 10px;
            border-bottom: 2px solid #333;
            position: relative;
          }

          .clr-header-a5::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, #333, transparent);
          }

          .clr-company-info-a5 {
            flex: 1;
          }

          .clr-company-info-a5 h1 {
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 24pt;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0 0 3px 0;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }

          .clr-company-info-a5 .tagline {
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 10pt;
            color: #666;
            font-style: italic;
            letter-spacing: 1px;
            margin-bottom: 6px;
          }

          .clr-company-info-a5 .details {
            font-size: 9pt;
            color: #666;
            line-height: 1.5;
          }

          .clr-title-a5 {
            text-align: right;
          }

          .clr-title-a5 h2 {
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 22pt;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0;
            letter-spacing: 2px;
          }

          .clr-title-a5 .clr-number {
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
          .clr-meta-a5 {
            display: flex;
            justify-content: space-between;
            margin-bottom: 16px;
            gap: 16px;
          }

          .clr-meta-box-a5 {
            flex: 1;
            padding: 10px 14px;
            background: white;
            border-left: 2.5px solid #333;
            border-radius: 0;
          }

          .clr-meta-box-a5.right {
            border-left: none;
            border-right: 2.5px solid #333;
            border-radius: 0;
            text-align: right;
          }

          .clr-meta-box-a5 label {
            display: block;
            font-size: 9pt;
            font-weight: 700;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 5px;
          }

          .clr-meta-box-a5 .name {
            font-size: 13pt;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 3px;
          }

          .clr-meta-box-a5 .info {
            font-size: 10pt;
            color: #555;
            line-height: 1.5;
          }

          /* ========== Items Table ========== */
          .clr-items-table-a5 {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
            font-size: 11pt;
          }

          .clr-items-table-a5 thead th {
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

          .clr-items-table-a5 thead th:first-child {
            width: 6%;
            text-align: center;
            border-radius: 3px 0 0 0;
          }

          .clr-items-table-a5 thead th:nth-child(2) {
            width: 35%;
          }

          .clr-items-table-a5 thead th:nth-child(3) {
            width: 12%;
            text-align: center;
          }

          .clr-items-table-a5 thead th:nth-child(4) {
            width: 8%;
            text-align: center;
          }

          .clr-items-table-a5 thead th:nth-child(5),
          .clr-items-table-a5 thead th:nth-child(6) {
            width: 18%;
            text-align: right;
          }

          .clr-items-table-a5 thead th:last-child {
            border-radius: 0 3px 0 0;
          }

          .clr-items-table-a5 tbody tr {
            border-bottom: 1px solid #ddd;
          }

          .clr-items-table-a5 tbody tr:nth-child(even) {
            background: white;
          }

          .clr-items-table-a5 tbody td {
            padding: 8px;
            color: #333;
            vertical-align: middle;
          }

          .clr-items-table-a5 tbody td:first-child {
            text-align: center;
            color: #888;
            font-weight: 500;
          }

          .clr-items-table-a5 tbody td:nth-child(2) .item-name {
            font-weight: 600;
            color: #1a1a1a;
            font-size: 11pt;
          }

          .clr-items-table-a5 tbody td:nth-child(2) .item-details {
            font-size: 9pt;
            color: #777;
            margin-top: 2px;
          }

          .clr-items-table-a5 tbody td:nth-child(3),
          .clr-items-table-a5 tbody td:nth-child(4) {
            text-align: center;
          }

          .clr-items-table-a5 tbody td:nth-child(5),
          .clr-items-table-a5 tbody td:nth-child(6) {
            text-align: right;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 10pt;
          }

          .clr-items-table-a5 tbody td:nth-child(6) {
            font-weight: 600;
            color: #1a1a1a;
          }

          /* ========== Totals Section ========== */
          .clr-totals-section-a5 {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 10px;
          }

          .clr-totals-box-a5 {
            width: 50%;
          }

          .clr-totals-row-a5 {
            display: flex;
            justify-content: space-between;
            padding: 5px 10px;
            font-size: 11pt;
          }

          .clr-totals-row-a5 .label {
            color: #666;
          }

          .clr-totals-row-a5 .value {
            font-family: 'Consolas', 'Monaco', monospace;
            color: #333;
            font-weight: 500;
          }

          .clr-totals-row-a5.subtotal {
            border-bottom: 1px solid #ddd;
          }

          .clr-totals-row-a5.discount .value {
            color: #333;
          }

          .clr-totals-row-a5.total {
            background: white;
            color: #1a1a1a;
            font-size: 13pt;
            font-weight: 700;
            margin-top: 6px;
            padding: 8px 10px;
            border-top: 2px solid #333;
            border-bottom: 2px solid #333;
          }

          .clr-totals-row-a5.total .value {
            color: #1a1a1a;
            font-size: 14pt;
          }

          .clr-totals-row-a5.total .label {
            color: #1a1a1a;
          }

          .clr-totals-row-a5.balance {
            background: white;
            border: 1px solid #333;
            margin-top: 4px;
            border-radius: 3px;
          }

          .clr-totals-row-a5.balance .label,
          .clr-totals-row-a5.balance .value {
            color: #333;
            font-weight: 600;
          }

          /* ========== Payment Info ========== */
          .clr-payment-info-a5 {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
          }

          .clr-payment-box-a5 {
            flex: 1;
            padding: 10px 14px;
            background: white;
            border: 1px solid #999;
            border-radius: 4px;
            font-size: 11pt;
          }

          .clr-payment-box-a5 label {
            display: block;
            font-size: 9pt;
            font-weight: 700;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
          }

          .clr-payment-box-a5 .value {
            font-weight: 600;
            color: #1a1a1a;
            font-size: 12pt;
          }

          /* ========== Status Badge ========== */
          .clr-status-badge-a5 {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 10px;
            font-size: 9pt;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }

          .clr-status-paid { background: white; color: #333; border: 1px solid #999; }
          .clr-status-pending { background: white; color: #555; border: 1px solid #999; }
          .clr-status-partial { background: white; color: #444; border: 1px solid #999; }
          .clr-status-cancelled { background: white; color: #555; border: 1px solid #999; }
          .clr-status-draft { background: white; color: #6b7280; border: 1px solid #999; }

          /* ========== Notes Section ========== */
          .clr-notes-section-a5 {
            background: white;
            border: 1px solid #999;
            border-radius: 4px;
            padding: 10px 14px;
            margin-bottom: 12px;
          }

          .clr-notes-section-a5 label {
            display: block;
            font-size: 9pt;
            font-weight: 700;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }

          .clr-notes-section-a5 p {
            font-size: 10pt;
            color: #444;
            margin: 0;
            line-height: 1.5;
          }

          /* ========== Terms Section ========== */
          .clr-terms-section-a5 {
            background: white;
            border: 1px solid #999;
            border-radius: 4px;
            padding: 10px 14px;
            margin-bottom: 14px;
          }

          .clr-terms-section-a5 label {
            display: block;
            font-size: 9pt;
            font-weight: 700;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }

          .clr-terms-section-a5 ul {
            margin: 0;
            padding-left: 16px;
            font-size: 9pt;
            color: #666;
            line-height: 1.6;
          }

          .clr-terms-section-a5 ul li {
            margin-bottom: 1px;
          }

          /* ========== Footer ========== */
          .clr-footer-a5 {
            border-top: 2px solid #333;
            padding-top: 8px;
            text-align: center;
            position: relative;
          }

          .clr-footer-a5::before {
            content: '';
            position: absolute;
            top: 2px;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, #333, transparent);
          }

          .clr-footer-a5 .thank-you {
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 14pt;
            font-weight: 600;
            color: #333;
            margin-bottom: 6px;
          }

          .clr-footer-a5 .contact {
            font-size: 10pt;
            color: #666;
          }

          .clr-footer-a5 .contact a {
            color: #333;
            text-decoration: none;
            font-weight: 500;
          }

          .clr-footer-a5 .tagline-footer {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #ddd;
            font-size: 9pt;
            color: #999;
            letter-spacing: 0.5px;
          }

          /* ========== Accent Decorations ========== */
          .clr-gold-diamond {
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
        <div className="clr-header-a5">
          <div className="clr-company-info-a5">
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
          <div className="clr-title-a5">
            <h2>CLEARANCE SALE</h2>
            <div className="clr-number">{clearance.clearanceNumber}</div>
          </div>
        </div>

        {/* Bill To & Clearance Details */}
        <div className="clr-meta-a5">
          <div className="clr-meta-box-a5">
            <label>Bill To</label>
            <div className="name">{clearance.customerName}</div>
            {customer && (
              <div className="info">
                {customer.businessName && <>{customer.businessName}<br /></>}
                {customer.address && <>{customer.address}<br /></>}
                {customer.phone && <>Tel: {customer.phone}<br /></>}
                {customer.email && <>{customer.email}</>}
              </div>
            )}
            {!customer && clearance.customerPhone && (
              <div className="info">
                Tel: {clearance.customerPhone}<br />
                {clearance.customerAddress}
              </div>
            )}
          </div>
          <div className="clr-meta-box-a5 right">
            <label>Clearance Details</label>
            <div className="info">
              <strong>Date:</strong> {formatDate(clearance.issueDate)}<br />
              {clearance.clearanceReason && <><strong>Reason:</strong> {clearance.clearanceReason}<br /></>}
              <strong>Status:</strong>{' '}
              <span className={`clr-status-badge-a5 clr-status-${clearance.status}`}>
                {clearance.status}
              </span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="clr-items-table-a5">
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
            {clearance.items.map((item, index) => (
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
        <div className="clr-totals-section-a5">
          <div className="clr-totals-box-a5">
            <div className="clr-totals-row-a5 subtotal">
              <span className="label">Subtotal</span>
              <span className="value">{formatCurrency(clearance.subtotal)}</span>
            </div>
            
            {itemDiscounts > 0 && (
              <div className="clr-totals-row-a5 discount">
                <span className="label">Item Discounts</span>
                <span className="value">-{formatCurrency(itemDiscounts)}</span>
              </div>
            )}
            
            {clearance.discount > 0 && (
              <div className="clr-totals-row-a5 discount">
                <span className="label">
                  Discount {clearance.discountType === 'percentage' && `(${clearance.discount}%)`}
                </span>
                <span className="value">-{formatCurrency(clearance.discount)}</span>
              </div>
            )}
            
            {clearance.tax > 0 && (
              <div className="clr-totals-row-a5">
                <span className="label">Tax {clearance.taxRate && `(${clearance.taxRate}%)`}</span>
                <span className="value">{formatCurrency(clearance.tax)}</span>
              </div>
            )}
            
            <div className="clr-totals-row-a5 total">
              <span className="label">Total Amount</span>
              <span className="value">{formatCurrency(clearance.total)}</span>
            </div>
            
            {clearance.balanceDue > 0 && (
              <div className="clr-totals-row-a5 balance">
                <span className="label">Balance Due</span>
                <span className="value">{formatCurrency(clearance.balanceDue)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Info */}
        {clearance.amountPaid > 0 && (
          <div className="clr-payment-info-a5">
            <div className="clr-payment-box-a5">
              <label>Amount Paid</label>
              <div className="value">{formatCurrency(clearance.amountPaid)}</div>
            </div>
            {clearance.paymentMethod && (
              <div className="clr-payment-box-a5">
                <label>Payment Method</label>
                <div className="value">{clearance.paymentMethod.replace('-', ' ').toUpperCase()}</div>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {clearance.notes && (
          <div className="clr-notes-section-a5">
            <label>Notes</label>
            <p>{clearance.notes}</p>
          </div>
        )}

        {/* Terms */}
        <div className="clr-terms-section-a5">
          <label>Terms & Conditions</label>
          <ul>
            {company?.clearanceTerms
              ? company.clearanceTerms.split('\n').filter(t => t.trim()).map((term, i) => (
                  <li key={i}>{term}</li>
                ))
              : (
                <>
                  <li>All clearance sale items are sold as-is.</li>
                  <li>All clearance sales are final. No returns or exchanges.</li>
                  <li>All jewellery items are hallmarked and certified.</li>
                </>
              )}
          </ul>
        </div>

        {/* Footer */}
        <div className="clr-footer-a5">
          <div className="thank-you">
            <span className="clr-gold-diamond"></span>
            Thank You for Your Patronage
            <span className="clr-gold-diamond"></span>
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

PrintableClearance.displayName = 'PrintableClearance';

export default PrintableClearance;
