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
  name: 'Royal Gems & Jewellers',
  tagline: 'Exquisite Craftsmanship Since 1985',
  address: 'No. 123, Galle Road',
  city: 'Colombo 03, Sri Lanka',
  country: 'Sri Lanka',
  phone: '+94 11 234 5678',
  phone2: '+94 77 123 4567',
  email: 'info@royalgems.lk',
  website: 'www.royalgems.lk',
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
          
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
          
          @media print {
            @page {
              size: A5 portrait;
              margin: 6mm 8mm;
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
              max-width: 132mm;
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
            width: 148mm;
            min-height: 210mm;
            padding: 8mm 10mm;
            margin: 0 auto;
            background: white;
            color: #1a1a1a;
            font-family: 'Inter', -apple-system, sans-serif;
            font-size: 8pt;
            line-height: 1.35;
            box-sizing: border-box;
          }

          /* ========== Header Section ========== */
          .grn-header-a5 {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
            padding-bottom: 10px;
            border-bottom: 2px solid #1e40af;
            position: relative;
          }

          .grn-header-a5::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, #1e40af, transparent);
          }

          .company-info-grn {
            flex: 1;
          }

          .company-info-grn h1 {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 18pt;
            font-weight: 700;
            color: #1e3a5f;
            margin: 0 0 2px 0;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }

          .company-info-grn .tagline {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 7pt;
            color: #3b82f6;
            font-style: italic;
            letter-spacing: 1px;
            margin-bottom: 6px;
          }

          .company-info-grn .details {
            font-size: 6.5pt;
            color: #666;
            line-height: 1.4;
          }

          .grn-title-a5 {
            text-align: right;
          }

          .grn-title-a5 h2 {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 16pt;
            font-weight: 700;
            color: #1e3a5f;
            margin: 0;
            letter-spacing: 1px;
          }

          .grn-title-a5 .grn-subtitle {
            font-size: 7pt;
            color: #64748b;
            margin-top: 2px;
          }

          .grn-title-a5 .grn-number {
            font-size: 9pt;
            font-weight: 600;
            color: #333;
            margin-top: 4px;
            background: linear-gradient(135deg, #eff6ff, #dbeafe);
            padding: 3px 8px;
            border-radius: 3px;
            border: 1px solid #93c5fd;
          }

          /* ========== Meta Section ========== */
          .grn-meta-a5 {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            gap: 12px;
          }

          .meta-box-grn {
            flex: 1;
            padding: 8px 10px;
            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            border-left: 3px solid #1e40af;
            border-radius: 0 4px 4px 0;
          }

          .meta-box-grn.right {
            border-left: none;
            border-right: 3px solid #1e40af;
            border-radius: 4px 0 0 4px;
            text-align: right;
          }

          .meta-box-grn label {
            display: block;
            font-size: 6pt;
            font-weight: 700;
            color: #1e40af;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 4px;
          }

          .meta-box-grn .name {
            font-size: 9pt;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 2px;
          }

          .meta-box-grn .info {
            font-size: 6.5pt;
            color: #555;
            line-height: 1.4;
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
            min-width: 80px;
            padding: 5px 8px;
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            font-size: 6.5pt;
          }

          .ref-item label {
            display: block;
            font-size: 5.5pt;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }

          .ref-item .value {
            font-weight: 600;
            color: #334155;
          }

          /* ========== Items Table ========== */
          .items-table-grn {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 7pt;
          }

          .items-table-grn thead th {
            background: linear-gradient(135deg, #1e3a5f, #1e40af);
            color: white;
            font-size: 6pt;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            padding: 6px 5px;
            text-align: left;
            border: none;
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
            border-bottom: 1px solid #e2e8f0;
          }

          .items-table-grn tbody tr:nth-child(even) {
            background: #f8fafc;
          }

          .items-table-grn tbody tr:hover {
            background: #f1f5f9;
          }

          .items-table-grn tbody td {
            padding: 5px;
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
            font-size: 7pt;
          }

          .items-table-grn tbody td:nth-child(2) .item-details {
            font-size: 5.5pt;
            color: #777;
            margin-top: 1px;
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
            font-size: 6.5pt;
          }

          .items-table-grn tbody td:nth-child(7) {
            font-weight: 600;
            color: #1a1a1a;
          }

          /* Quality Badge */
          .quality-badge {
            display: inline-block;
            padding: 1px 5px;
            border-radius: 8px;
            font-size: 5pt;
            font-weight: 600;
            text-transform: uppercase;
          }

          .quality-new { background: #dcfce7; color: #166534; }
          .quality-good { background: #dbeafe; color: #1d4ed8; }
          .quality-fair { background: #fef3c7; color: #92400e; }
          .quality-damaged { background: #fee2e2; color: #dc2626; }

          /* ========== Summary Section ========== */
          .summary-section-a5 {
            display: flex;
            gap: 12px;
            margin-bottom: 10px;
          }

          .weight-summary-a5 {
            flex: 1;
            padding: 8px 10px;
            background: linear-gradient(135deg, #fef3c7, #fde68a);
            border: 1px solid #f59e0b;
            border-radius: 4px;
          }

          .weight-summary-a5 label {
            display: block;
            font-size: 5.5pt;
            font-weight: 700;
            color: #92400e;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }

          .weight-summary-a5 .weight-grid {
            display: flex;
            gap: 15px;
          }

          .weight-summary-a5 .weight-item {
            font-size: 7pt;
          }

          .weight-summary-a5 .weight-item span {
            color: #78350f;
          }

          .weight-summary-a5 .weight-item strong {
            color: #92400e;
            font-size: 8pt;
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
            padding: 4px 8px;
            font-size: 7pt;
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
            border-bottom: 1px solid #e2e8f0;
          }

          .totals-row-grn.discount {
            color: #16a34a;
          }

          .totals-row-grn.discount .value {
            color: #16a34a;
          }

          .totals-row-grn.total {
            background: linear-gradient(135deg, #1e3a5f, #1e40af);
            color: white;
            font-size: 9pt;
            font-weight: 700;
            margin-top: 4px;
            padding: 6px 8px;
            border-radius: 3px;
          }

          .totals-row-grn.total .value {
            color: white;
            font-size: 10pt;
          }

          .totals-row-grn.total .label {
            color: white;
          }

          .totals-row-grn.balance {
            background: #fee2e2;
            border: 1px solid #fca5a5;
            margin-top: 4px;
            border-radius: 3px;
          }

          .totals-row-grn.balance .label,
          .totals-row-grn.balance .value {
            color: #dc2626;
            font-weight: 600;
          }

          /* ========== Status Badge ========== */
          .status-badge-grn {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 6pt;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }

          .status-received { background: #dcfce7; color: #166534; }
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-partial { background: #dbeafe; color: #1d4ed8; }
          .status-cancelled { background: #fee2e2; color: #dc2626; }
          .status-draft { background: #f3f4f6; color: #6b7280; }
          .status-returned { background: #fae8ff; color: #a855f7; }

          /* ========== Quality Check Section ========== */
          .quality-check-a5 {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
          }

          .qc-box {
            flex: 1;
            padding: 6px 8px;
            background: #f0fdf4;
            border: 1px solid #86efac;
            border-radius: 4px;
            font-size: 6.5pt;
          }

          .qc-box.pending {
            background: #fef3c7;
            border-color: #fcd34d;
          }

          .qc-box label {
            display: block;
            font-size: 5.5pt;
            font-weight: 700;
            color: #166534;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }

          .qc-box.pending label {
            color: #92400e;
          }

          .qc-box .value {
            font-weight: 600;
            color: #166534;
          }

          .qc-box.pending .value {
            color: #92400e;
          }

          /* ========== Notes Section ========== */
          .notes-section-grn {
            background: #eff6ff;
            border: 1px solid #93c5fd;
            border-radius: 4px;
            padding: 6px 8px;
            margin-bottom: 8px;
          }

          .notes-section-grn label {
            display: block;
            font-size: 5.5pt;
            font-weight: 700;
            color: #1d4ed8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
          }

          .notes-section-grn p {
            font-size: 6.5pt;
            color: #1e40af;
            margin: 0;
            line-height: 1.4;
          }

          /* ========== Signature Section ========== */
          .signature-section-a5 {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px dashed #cbd5e1;
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
            font-size: 6pt;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          /* ========== Footer ========== */
          .footer-grn {
            border-top: 2px solid #1e40af;
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
            background: linear-gradient(90deg, transparent, #1e40af, transparent);
          }

          .footer-grn .doc-info {
            font-size: 6pt;
            color: #64748b;
            margin-bottom: 4px;
          }

          .footer-grn .contact {
            font-size: 6pt;
            color: #666;
          }

          .footer-grn .contact a {
            color: #1e40af;
            text-decoration: none;
            font-weight: 500;
          }

          .footer-grn .tagline-footer {
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1px solid #e2e8f0;
            font-size: 5.5pt;
            color: #999;
            letter-spacing: 0.3px;
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
