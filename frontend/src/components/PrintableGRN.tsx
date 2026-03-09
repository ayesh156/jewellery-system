import { forwardRef } from 'react';
import type { GRN, Supplier, CompanyInfo } from '../types/index';
import { formatCurrency, formatDate, formatWeight } from '../utils/formatters';

interface PrintableGRNProps {
  grn: GRN;
  supplier?: Supplier;
  company?: CompanyInfo;
}

// Default company info for the jewellery store
const defaultCompany: CompanyInfo = {
  name: 'Onelka Jewellery',
  tagline: 'Exquisite Craftsmanship Since 1985',
  address: 'No. 123, Galle Road',
  city: 'Colombo 03, Sri Lanka',
  country: 'Sri Lanka',
  phone: '+94 11 234 5678',
  phone2: '+94 77 123 4567',
  email: 'info@onelkajewellery.lk',
  website: 'www.onelkajewellery.lk',
  registrationNumber: 'REG-2024-001',
  taxNumber: 'TIN-123456789',
};

export const PrintableGRN = forwardRef<HTMLDivElement, PrintableGRNProps>(
  ({ grn, supplier, company = defaultCompany }, ref) => {
    // Calculate total metal weight
    const totalMetalWeight = grn.items.reduce((sum, item) => sum + item.metalWeight * item.quantity, 0);
    const totalQuantity = grn.items.reduce((sum, item) => sum + item.quantity, 0);

    return (
      <div ref={ref} className="print-grn-a5">
        <style>{`
          /* =========================================
             A5 GRN (Goods Received Note) Styles
             Jewellery System
             A5 Size: 148mm x 210mm
             ========================================= */
          
          /* System fonts - no external loading */
          
          @media print {
            @page {
              size: A4 portrait;
              margin: 25.4mm;
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
            
            .print-grn-a5 {
              width: 100%;
              max-width: 159mm;
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
          
          .print-grn-a5 {
            width: 210mm;
            min-height: 297mm;
            padding: 25.4mm;
            margin: 0 auto;
            background: white;
            color: #1a1a1a;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.5;
            box-sizing: border-box;
          }

          /* ========== Header Section ========== */
          .grn-header-a5 {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
            padding-bottom: 10px;
            border-bottom: 2px solid #333;
            position: relative;
          }

          .grn-header-a5::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, #333, transparent);
          }

          .company-info-grn {
            flex: 1;
          }

          .company-info-grn h1 {
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 24pt;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0 0 3px 0;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }

          .company-info-grn .tagline {
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 10pt;
            color: #666;
            font-style: italic;
            letter-spacing: 1px;
            margin-bottom: 6px;
          }

          .company-info-grn .details {
            font-size: 9pt;
            color: #666;
            line-height: 1.5;
          }

          .grn-title-a5 {
            text-align: right;
          }

          .grn-title-a5 h2 {
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 22pt;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0;
            letter-spacing: 1px;
          }

          .grn-title-a5 .grn-subtitle {
            font-size: 10pt;
            color: #64748b;
            margin-top: 2px;
          }

          .grn-title-a5 .grn-number {
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
          .grn-meta-a5 {
            display: flex;
            justify-content: space-between;
            margin-bottom: 16px;
            gap: 16px;
          }

          .meta-box-grn {
            flex: 1;
            padding: 10px 14px;
            background: white;
            border-left: 2.5px solid #333;
            border-radius: 0;
          }

          .meta-box-grn.right {
            border-left: none;
            border-right: 2.5px solid #333;
            border-radius: 0;
            text-align: right;
          }

          .meta-box-grn label {
            display: block;
            font-size: 9pt;
            font-weight: 700;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 5px;
          }

          .meta-box-grn .name {
            font-size: 13pt;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 3px;
          }

          .meta-box-grn .info {
            font-size: 10pt;
            color: #555;
            line-height: 1.5;
          }

          /* ========== Reference Box ========== */
          .reference-box-a5 {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
            flex-wrap: wrap;
          }

          .ref-item {
            flex: 1;
            min-width: 100px;
            padding: 8px 12px;
            background: white;
            border: 1px solid #999;
            border-radius: 4px;
            font-size: 10pt;
          }

          .ref-item label {
            display: block;
            font-size: 8.5pt;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
          }

          .ref-item .value {
            font-weight: 600;
            color: #334155;
          }

          /* ========== Items Table ========== */
          .items-table-grn {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
            font-size: 11pt;
          }

          .items-table-grn thead th {
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

          .items-table-grn thead th:first-child {
            width: 5%;
            text-align: center;
            border-radius: 3px 0 0 0;
          }

          .items-table-grn thead th:nth-child(2) {
            width: 30%;
          }

          .items-table-grn thead th:nth-child(3) {
            width: 10%;
            text-align: center;
          }

          .items-table-grn thead th:nth-child(4) {
            width: 10%;
            text-align: center;
          }

          .items-table-grn thead th:nth-child(5) {
            width: 7%;
            text-align: center;
          }

          .items-table-grn thead th:nth-child(6),
          .items-table-grn thead th:nth-child(7) {
            width: 14%;
            text-align: right;
          }

          .items-table-grn thead th:last-child {
            border-radius: 0 3px 0 0;
          }

          .items-table-grn tbody tr {
            border-bottom: 1px solid #ddd;
          }

          .items-table-grn tbody tr:nth-child(even) {
            background: white;
          }

          .items-table-grn tbody tr:hover {
            background: white;
          }

          .items-table-grn tbody td {
            padding: 8px;
            color: #333;
            vertical-align: middle;
          }

          .items-table-grn tbody td:first-child {
            text-align: center;
            color: #888;
            font-weight: 500;
          }

          .items-table-grn tbody td:nth-child(2) .item-name {
            font-weight: 600;
            color: #1a1a1a;
            font-size: 11pt;
          }

          .items-table-grn tbody td:nth-child(2) .item-details {
            font-size: 9pt;
            color: #777;
            margin-top: 2px;
          }

          .items-table-grn tbody td:nth-child(3),
          .items-table-grn tbody td:nth-child(4),
          .items-table-grn tbody td:nth-child(5) {
            text-align: center;
          }

          .items-table-grn tbody td:nth-child(6),
          .items-table-grn tbody td:nth-child(7) {
            text-align: right;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 10pt;
          }

          .items-table-grn tbody td:nth-child(7) {
            font-weight: 600;
            color: #1a1a1a;
          }

          /* Quality Badge */
          .quality-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 8px;
            font-size: 8pt;
            font-weight: 600;
            text-transform: uppercase;
          }

          .quality-new { background: white; color: #333; border: 1px solid #999; }
          .quality-good { background: white; color: #444; border: 1px solid #999; }
          .quality-fair { background: white; color: #555; border: 1px solid #999; }
          .quality-damaged { background: white; color: #555; border: 1px solid #999; }

          /* ========== Summary Section ========== */
          .summary-section-a5 {
            display: flex;
            gap: 12px;
            margin-bottom: 10px;
          }

          .weight-summary-a5 {
            flex: 1;
            padding: 8px 10px;
            background: white;
            border: 1px solid #999;
            border-radius: 4px;
          }

          .weight-summary-a5 label {
            display: block;
            font-size: 9pt;
            font-weight: 700;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }

          .weight-summary-a5 .weight-grid {
            display: flex;
            gap: 20px;
          }

          .weight-summary-a5 .weight-item {
            font-size: 11pt;
          }

          .weight-summary-a5 .weight-item span {
            color: #555;
          }

          .weight-summary-a5 .weight-item strong {
            color: #333;
            font-size: 12pt;
          }

          /* ========== Totals Section ========== */
          .totals-section-grn {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 10px;
          }

          .totals-box-grn {
            width: 55%;
          }

          .totals-row-grn {
            display: flex;
            justify-content: space-between;
            padding: 5px 10px;
            font-size: 11pt;
          }

          .totals-row-grn .label {
            color: #666;
          }

          .totals-row-grn .value {
            font-family: 'Consolas', 'Monaco', monospace;
            color: #333;
            font-weight: 500;
          }

          .totals-row-grn.subtotal {
            border-bottom: 1px solid #ddd;
          }

          .totals-row-grn.discount {
            color: #333;
          }

          .totals-row-grn.discount .value {
            color: #333;
          }

          .totals-row-grn.total {
            background: white;
            color: #1a1a1a;
            font-size: 13pt;
            font-weight: 700;
            margin-top: 6px;
            padding: 8px 10px;
            border-top: 2px solid #333;
            border-bottom: 2px solid #333;
          }

          .totals-row-grn.total .value {
            color: #1a1a1a;
            font-size: 14pt;
          }

          .totals-row-grn.total .label {
            color: #1a1a1a;
          }

          .totals-row-grn.balance {
            background: white;
            border: 1px solid #333;
            margin-top: 4px;
            border-radius: 3px;
          }

          .totals-row-grn.balance .label,
          .totals-row-grn.balance .value {
            color: #333;
            font-weight: 600;
          }

          /* ========== Status Badge ========== */
          .status-badge-grn {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 10px;
            font-size: 9pt;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }

          .status-received { background: white; color: #333; border: 1px solid #999; }
          .status-pending { background: white; color: #555; border: 1px solid #999; }
          .status-partial { background: white; color: #444; border: 1px solid #999; }
          .status-cancelled { background: white; color: #555; border: 1px solid #999; }
          .status-draft { background: white; color: #6b7280; border: 1px solid #999; }
          .status-returned { background: white; color: #444; border: 1px solid #999; }

          /* ========== Quality Check Section ========== */
          .quality-check-a5 {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
          }

          .qc-box {
            flex: 1;
            padding: 10px 14px;
            background: white;
            border: 1px solid #999;
            border-radius: 4px;
            font-size: 10pt;
          }

          .qc-box.pending {
            background: white;
            border-color: #666;
          }

          .qc-box label {
            display: block;
            font-size: 9pt;
            font-weight: 700;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
          }

          .qc-box.pending label {
            color: #555;
          }

          .qc-box .value {
            font-weight: 600;
            color: #1a1a1a;
          }

          .qc-box.pending .value {
            color: #555;
          }

          /* ========== Notes Section ========== */
          .notes-section-grn {
            background: white;
            border: 1px solid #999;
            border-radius: 4px;
            padding: 10px 14px;
            margin-bottom: 12px;
          }

          .notes-section-grn label {
            display: block;
            font-size: 9pt;
            font-weight: 700;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }

          .notes-section-grn p {
            font-size: 10pt;
            color: #444;
            margin: 0;
            line-height: 1.5;
          }

          /* ========== Signature Section ========== */
          .signature-section-a5 {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px dashed #ccc;
          }

          .signature-box {
            flex: 1;
            text-align: center;
          }

          .signature-box .line {
            border-top: 1px solid #333;
            margin-bottom: 4px;
            width: 80%;
            margin-left: auto;
            margin-right: auto;
          }

          .signature-box .label {
            font-size: 9pt;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          /* ========== Footer ========== */
          .footer-grn {
            border-top: 2px solid #333;
            padding-top: 8px;
            text-align: center;
            margin-top: 10px;
            position: relative;
          }

          .footer-grn::before {
            content: '';
            position: absolute;
            top: 2px;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, #333, transparent);
          }

          .footer-grn .doc-info {
            font-size: 9pt;
            color: #64748b;
            margin-bottom: 4px;
          }

          .footer-grn .contact {
            font-size: 10pt;
            color: #666;
          }

          .footer-grn .contact a {
            color: #333;
            text-decoration: none;
            font-weight: 500;
          }

          .footer-grn .tagline-footer {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #ddd;
            font-size: 9pt;
            color: #999;
            letter-spacing: 0.5px;
          }
        `}</style>

        {/* Header */}
        <div className="grn-header-a5">
          <div className="company-info-grn">
            <h1>{company.name}</h1>
            {company.tagline && <div className="tagline">{company.tagline}</div>}
            <div className="details">
              {company.address}, {company.city}<br />
              Tel: {company.phone} {company.phone2 && `| ${company.phone2}`}<br />
              Email: {company.email}
            </div>
          </div>
          <div className="grn-title-a5">
            <h2>GOODS RECEIVED NOTE</h2>
            <div className="grn-subtitle">Stock Inward Document</div>
            <div className="grn-number">{grn.grnNumber}</div>
          </div>
        </div>

        {/* Supplier & GRN Details */}
        <div className="grn-meta-a5">
          <div className="meta-box-grn">
            <label>Supplier Details</label>
            <div className="name">{grn.supplierName}</div>
            {supplier && (
              <div className="info">
                {supplier.companyName && <>{supplier.companyName}<br /></>}
                {supplier.address && <>{supplier.address}<br /></>}
                {supplier.phone && <>Tel: {supplier.phone}<br /></>}
                {supplier.email && <>{supplier.email}</>}
              </div>
            )}
            {!supplier && grn.supplierPhone && (
              <div className="info">
                Tel: {grn.supplierPhone}<br />
                {grn.supplierAddress}
              </div>
            )}
          </div>
          <div className="meta-box-grn right">
            <label>GRN Details</label>
            <div className="info">
              <strong>Received:</strong> {formatDate(grn.receivedDate)}<br />
              {grn.expectedDate && <><strong>Expected:</strong> {formatDate(grn.expectedDate)}<br /></>}
              <strong>Status:</strong>{' '}
              <span className={`status-badge-grn status-${grn.status}`}>
                {grn.status}
              </span>
            </div>
          </div>
        </div>

        {/* Reference Numbers */}
        {(grn.purchaseOrderNumber || grn.supplierInvoiceNumber) && (
          <div className="reference-box-a5">
            {grn.purchaseOrderNumber && (
              <div className="ref-item">
                <label>PO Number</label>
                <div className="value">{grn.purchaseOrderNumber}</div>
              </div>
            )}
            {grn.supplierInvoiceNumber && (
              <div className="ref-item">
                <label>Supplier Invoice</label>
                <div className="value">{grn.supplierInvoiceNumber}</div>
              </div>
            )}
            {grn.supplierInvoiceDate && (
              <div className="ref-item">
                <label>Invoice Date</label>
                <div className="value">{formatDate(grn.supplierInvoiceDate)}</div>
              </div>
            )}
            {grn.receivedBy && (
              <div className="ref-item">
                <label>Received By</label>
                <div className="value">{grn.receivedBy}</div>
              </div>
            )}
          </div>
        )}

        {/* Items Table */}
        <table className="items-table-grn">
          <thead>
            <tr>
              <th>#</th>
              <th>Item Description</th>
              <th>Weight</th>
              <th>Purity</th>
              <th>Qty</th>
              <th>Cost</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {grn.items.map((item, index) => (
              <tr key={item.id}>
                <td>{String(index + 1).padStart(2, '0')}</td>
                <td>
                  <div className="item-name">{item.productName}</div>
                  <div className="item-details">
                    {item.metalType.toUpperCase()}
                    {item.karat && ` • ${item.karat}`}
                    {item.sku && ` • SKU: ${item.sku}`}
                    {item.condition && (
                      <> • <span className={`quality-badge quality-${item.condition}`}>{item.condition}</span></>
                    )}
                  </div>
                </td>
                <td>{formatWeight(item.metalWeight)}</td>
                <td>{item.purityPercentage ? `${item.purityPercentage}%` : '-'}</td>
                <td>{item.quantity}</td>
                <td>{formatCurrency(item.unitCost)}</td>
                <td>{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Weight Summary */}
        <div className="summary-section-a5">
          <div className="weight-summary-a5">
            <label>Summary</label>
            <div className="weight-grid">
              <div className="weight-item">
                <span>Total Items: </span>
                <strong>{totalQuantity}</strong>
              </div>
              <div className="weight-item">
                <span>Total Weight: </span>
                <strong>{formatWeight(totalMetalWeight)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="totals-section-grn">
          <div className="totals-box-grn">
            <div className="totals-row-grn subtotal">
              <span className="label">Subtotal</span>
              <span className="value">{formatCurrency(grn.subtotal)}</span>
            </div>
            
            {grn.discount && grn.discount > 0 && (
              <div className="totals-row-grn discount">
                <span className="label">Discount</span>
                <span className="value">-{formatCurrency(grn.discount)}</span>
              </div>
            )}
            
            {grn.shippingCharges && grn.shippingCharges > 0 && (
              <div className="totals-row-grn">
                <span className="label">Shipping</span>
                <span className="value">{formatCurrency(grn.shippingCharges)}</span>
              </div>
            )}
            
            {grn.otherCharges && grn.otherCharges > 0 && (
              <div className="totals-row-grn">
                <span className="label">Other Charges</span>
                <span className="value">{formatCurrency(grn.otherCharges)}</span>
              </div>
            )}
            
            {grn.tax && grn.tax > 0 && (
              <div className="totals-row-grn">
                <span className="label">Tax {grn.taxRate && `(${grn.taxRate}%)`}</span>
                <span className="value">{formatCurrency(grn.tax)}</span>
              </div>
            )}
            
            <div className="totals-row-grn total">
              <span className="label">Total Amount</span>
              <span className="value">{formatCurrency(grn.total)}</span>
            </div>
            
            {grn.balanceDue > 0 && (
              <div className="totals-row-grn balance">
                <span className="label">Balance Due</span>
                <span className="value">{formatCurrency(grn.balanceDue)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quality Check Info */}
        <div className="quality-check-a5">
          <div className={`qc-box ${!grn.qualityCheckDone ? 'pending' : ''}`}>
            <label>Quality Check Status</label>
            <div className="value">
              {grn.qualityCheckDone ? '✓ Completed' : '⏳ Pending'}
            </div>
          </div>
          {grn.qualityCheckDone && grn.qualityCheckDate && (
            <div className="qc-box">
              <label>QC Date</label>
              <div className="value">{formatDate(grn.qualityCheckDate)}</div>
            </div>
          )}
          {grn.qualityCheckDone && grn.qualityCheckBy && (
            <div className="qc-box">
              <label>Checked By</label>
              <div className="value">{grn.qualityCheckBy}</div>
            </div>
          )}
        </div>

        {/* Notes */}
        {grn.notes && (
          <div className="notes-section-grn">
            <label>Notes / Remarks</label>
            <p>{grn.notes}</p>
          </div>
        )}

        {/* Signature Section */}
        <div className="signature-section-a5">
          <div className="signature-box">
            <div className="line"></div>
            <div className="label">Received By</div>
          </div>
          <div className="signature-box">
            <div className="line"></div>
            <div className="label">Checked By</div>
          </div>
          <div className="signature-box">
            <div className="line"></div>
            <div className="label">Approved By</div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer-grn">
          <div className="doc-info">
            This is a system-generated document • Generated on {formatDate(new Date().toISOString())}
          </div>
          <div className="contact">
            Questions? Contact us at <a href={`mailto:${company.email}`}>{company.email}</a> or call <a href={`tel:${company.phone}`}>{company.phone}</a>
          </div>
          <div className="tagline-footer">
            ◆ Quality Assured ◆ Authentic Products ◆ Trusted Suppliers ◆
          </div>
        </div>
      </div>
    );
  }
);

PrintableGRN.displayName = 'PrintableGRN';

export default PrintableGRN;
