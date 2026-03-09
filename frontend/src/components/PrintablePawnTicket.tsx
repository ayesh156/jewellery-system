import { forwardRef } from 'react';
import type { PawnTicket, CompanyInfo } from '../types/index';
import { formatCurrency, formatDate, formatWeight } from '../utils/formatters';
import { calculatePawnInterest, estimateInterestForPeriod } from '../utils/pawnCalculations';

interface PrintablePawnTicketProps {
  ticket: PawnTicket;
  company?: CompanyInfo;
}

// Default company info
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

export const PrintablePawnTicket = forwardRef<HTMLDivElement, PrintablePawnTicketProps>(
  ({ ticket, company = defaultCompany }, ref) => {

    // Calculate loan period in months
    const pawnDate = new Date(ticket.pawnDate);
    const maturityDate = new Date(ticket.maturityDate);
    const monthsDiff = (maturityDate.getFullYear() - pawnDate.getFullYear()) * 12 + 
                       (maturityDate.getMonth() - pawnDate.getMonth());

    // Interest estimate at maturity
    const interestEstimate = estimateInterestForPeriod(
      ticket.principalAmount,
      monthsDiff,
      ticket.interestRatePerMonth
    );

    return (
      <div ref={ref} className="print-pawn-ticket">
        <style>{`
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
            
            .print-pawn-ticket {
              width: 100%;
              max-width: 159mm;
              padding: 0;
              margin: 0 auto;
              background: white !important;
              color: #000 !important;
            }
            
            .no-print {
              display: none !important;
            }
          }
          
          .print-pawn-ticket {
            width: 210mm;
            min-height: 297mm;
            padding: 25.4mm;
            margin: 0 auto;
            background: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            font-size: 11pt;
            color: #000;
            line-height: 1.5;
          }
          
          .header {
            text-align: center;
            padding-bottom: 4mm;
            border-bottom: 1.5pt solid #000;
            margin-bottom: 5mm;
          }
          
          .company-name {
            font-size: 22pt;
            font-weight: 700;
            color: #000;
            margin: 0;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          
          .company-tagline {
            font-size: 10pt;
            color: #444;
            margin: 1px 0;
            font-style: italic;
          }
          
          .company-contact {
            font-size: 9pt;
            color: #333;
            margin-top: 2mm;
          }
          
          .document-title {
            text-align: center;
            padding: 2.5mm 0;
            font-size: 14pt;
            font-weight: 700;
            letter-spacing: 2px;
            margin: 4mm 0;
            border: 1.5pt solid #000;
          }
          
          .ticket-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4mm;
            padding: 2.5mm 3mm;
            border: 0.5pt solid #888;
          }
          
          .ticket-number {
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 13pt;
            font-weight: 700;
            color: #000;
          }
          
          .section {
            margin-bottom: 4mm;
          }
          
          .section-title {
            font-size: 10pt;
            font-weight: 700;
            color: #000;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            padding-bottom: 1.5mm;
            border-bottom: 0.75pt solid #000;
            margin-bottom: 2.5mm;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2mm 6mm;
          }
          
          .info-row {
            display: flex;
            gap: 2mm;
          }
          
          .info-label {
            font-size: 9.5pt;
            color: #555;
            min-width: 24mm;
          }
          
          .info-value {
            font-size: 10.5pt;
            color: #000;
            font-weight: 500;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 3mm 0;
            font-size: 9.5pt;
          }
          
          .items-table th {
            padding: 2mm 2.5mm;
            text-align: left;
            font-weight: 700;
            font-size: 8.5pt;
            color: #000;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            border-top: 1pt solid #000;
            border-bottom: 1pt solid #000;
          }
          
          .items-table td {
            padding: 2.5mm;
            border-bottom: 0.5pt solid #ccc;
            vertical-align: top;
          }
          
          .items-table .text-right {
            text-align: right;
          }
          
          .item-desc {
            font-size: 8.5pt;
            color: #555;
          }
          
          .totals-section {
            margin-top: 4mm;
            padding: 3mm;
            border: 0.5pt solid #888;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 1.5mm 0;
            font-size: 10pt;
          }
          
          .total-row.highlight {
            font-size: 13pt;
            font-weight: 700;
            color: #000;
            border-top: 1pt solid #000;
            padding-top: 2.5mm;
            margin-top: 1.5mm;
          }
          
          .interest-box {
            margin-top: 4mm;
            padding: 3mm;
            border: 1pt dashed #555;
          }
          
          .interest-title {
            font-size: 10pt;
            font-weight: 700;
            color: #000;
            margin-bottom: 2mm;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .interest-detail {
            font-size: 9.5pt;
            color: #333;
            margin: 1.5mm 0;
          }
          
          .terms-section {
            margin-top: 5mm;
            padding: 2.5mm 3mm;
            border: 0.5pt solid #aaa;
            font-size: 8.5pt;
            color: #444;
          }
          
          .terms-title {
            font-size: 9pt;
            font-weight: 700;
            color: #000;
            margin-bottom: 1.5mm;
            text-transform: uppercase;
          }
          
          .terms-list {
            margin: 0;
            padding-left: 4mm;
          }
          
          .terms-list li {
            margin: 0.5mm 0;
          }
          
          .signature-section {
            margin-top: 8mm;
            display: flex;
            justify-content: space-between;
          }
          
          .signature-box {
            width: 45%;
            text-align: center;
          }
          
          .signature-line {
            border-top: 0.75pt solid #000;
            margin-top: 18mm;
            padding-top: 1.5mm;
            font-size: 9pt;
            color: #555;
          }
          
          .footer {
            margin-top: 6mm;
            padding-top: 3mm;
            border-top: 0.75pt solid #aaa;
            text-align: center;
            font-size: 8.5pt;
            color: #888;
          }
          
          .customer-copy {
            font-size: 10pt;
            font-weight: 700;
            color: #000;
            text-align: center;
            margin-top: 3mm;
            padding: 2mm;
            border: 1pt solid #000;
          }
        `}</style>

        {/* Header */}
        <div className="header">
          <h1 className="company-name">{company.name}</h1>
          {company.tagline && <p className="company-tagline">{company.tagline}</p>}
          <div className="company-contact">
            {company.address}, {company.city} | Tel: {company.phone}
            {company.phone2 && ` / ${company.phone2}`}
            <br />
            {company.email} | {company.website}
          </div>
        </div>

        {/* Document Title */}
        <div className="document-title">PAWN TICKET</div>

        {/* Ticket Info */}
        <div className="ticket-info">
          <div>
            <span style={{ fontSize: '8.5pt', color: '#555' }}>Ticket No: </span>
            <span className="ticket-number">{ticket.ticketNumber}</span>
          </div>
          <div>
            <span style={{ fontSize: '8.5pt', color: '#555' }}>Date: </span>
            <span style={{ fontWeight: 700 }}>{formatDate(ticket.pawnDate)}</span>
          </div>
        </div>

        {/* Customer Details */}
        <div className="section">
          <div className="section-title">Customer Details</div>
          <div className="info-grid">
            <div className="info-row">
              <span className="info-label">Name:</span>
              <span className="info-value">{ticket.customerName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">NIC:</span>
              <span className="info-value">{ticket.customerNIC}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Phone:</span>
              <span className="info-value">{ticket.customerPhone}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Address:</span>
              <span className="info-value">{ticket.customerAddress}</span>
            </div>
          </div>
        </div>

        {/* Pawned Items */}
        <div className="section">
          <div className="section-title">Pawned Items</div>
          <table className="items-table">
            <thead>
              <tr>
                <th style={{ width: '5%' }}>#</th>
                <th style={{ width: '35%' }}>Item Description</th>
                <th style={{ width: '12%' }}>Karat</th>
                <th style={{ width: '15%' }} className="text-right">Gross Wt</th>
                <th style={{ width: '15%' }} className="text-right">Net Wt</th>
                <th style={{ width: '18%' }} className="text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {ticket.items.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>{item.itemType}</strong>
                    <div className="item-desc">{item.description}</div>
                    {item.hasGemstones && (
                      <div className="item-desc">
                        * {item.gemstoneDescription}
                      </div>
                    )}
                  </td>
                  <td>{item.karat}</td>
                  <td className="text-right">{formatWeight(item.grossWeight)}</td>
                  <td className="text-right">{formatWeight(item.netWeight)}</td>
                  <td className="text-right">{formatCurrency(item.valuedAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="totals-section">
          <div className="total-row">
            <span>Total Items:</span>
            <span>{ticket.items.length}</span>
          </div>
          <div className="total-row">
            <span>Total Gross Weight:</span>
            <span>{formatWeight(ticket.totalGrossWeight)}</span>
          </div>
          <div className="total-row">
            <span>Total Net Weight:</span>
            <span>{formatWeight(ticket.totalNetWeight)}</span>
          </div>
          <div className="total-row">
            <span>Total Valuation:</span>
            <span>{formatCurrency(ticket.totalValuation)}</span>
          </div>
          <div className="total-row">
            <span>LTV Ratio:</span>
            <span>{(ticket.loanToValueRatio * 100).toFixed(0)}%</span>
          </div>
          <div className="total-row highlight">
            <span>LOAN AMOUNT (PRINCIPAL):</span>
            <span>{formatCurrency(ticket.principalAmount)}</span>
          </div>
        </div>

        {/* Interest Information */}
        <div className="interest-box">
          <div className="interest-title">Interest Information</div>
          <div className="interest-detail">
            <strong>Interest Rate:</strong> {ticket.interestRatePerMonth}% per month
          </div>
          <div className="interest-detail">
            <strong>Loan Period:</strong> {monthsDiff} month(s)
          </div>
          <div className="interest-detail">
            <strong>Maturity Date:</strong> {formatDate(ticket.maturityDate)}
          </div>
          <div className="interest-detail">
            <strong>Grace Period:</strong> {ticket.gracePeriodDays} days after maturity
          </div>
          <div className="interest-detail" style={{ marginTop: '2mm', paddingTop: '2mm', borderTop: '1px dashed #888' }}>
            <strong>Estimated Amount at Maturity:</strong>
            <br />
            Principal: {formatCurrency(ticket.principalAmount)} + 
            Interest ({interestEstimate.effectiveRate}%): {formatCurrency(interestEstimate.totalInterest)} = 
            <strong> {formatCurrency(interestEstimate.totalPayable)}</strong>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="terms-section">
          <div className="terms-title">Terms & Conditions</div>
          <ol className="terms-list">
            <li>Interest of {ticket.interestRatePerMonth}% is charged per month, even for one day. Daily pro-rata applies after the first month.</li>
            <li>Items must be redeemed within the loan period plus grace period with original ticket and valid ID. Unredeemed items may be forfeited.</li>
          </ol>
        </div>

        {/* Signatures */}
        <div className="signature-section">
          <div className="signature-box">
            <div className="signature-line">Customer Signature</div>
          </div>
          <div className="signature-box">
            <div className="signature-line">Authorized Signature</div>
          </div>
        </div>

        {/* Customer Copy Notice */}
        <div className="customer-copy">CUSTOMER COPY - Please retain this ticket for redemption</div>

        {/* Footer */}
        <div className="footer">
          Printed on: {new Date().toLocaleString('en-GB')} | {company.registrationNumber}
          <br />
          This is a computer-generated document.
        </div>
      </div>
    );
  }
);

PrintablePawnTicket.displayName = 'PrintablePawnTicket';
