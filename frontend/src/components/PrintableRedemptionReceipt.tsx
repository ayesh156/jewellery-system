import { forwardRef } from 'react';
import type { PawnRedemption, PawnTicket, CompanyInfo } from '../types/index';
import { formatCurrency, formatDate, formatWeight } from '../utils/formatters';

interface PrintableRedemptionReceiptProps {
  redemption: PawnRedemption;
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

const paymentMethodLabels: Record<string, string> = {
  'cash': 'Cash',
  'card': 'Card',
  'bank-transfer': 'Bank Transfer',
  'cheque': 'Cheque',
  'credit': 'Credit',
  'upi': 'UPI',
  'other': 'Other',
};

export const PrintableRedemptionReceipt = forwardRef<HTMLDivElement, PrintableRedemptionReceiptProps>(
  ({ redemption, ticket, company = defaultCompany }, ref) => {

    const calc = redemption.interestCalculation;

    return (
      <div ref={ref} className="print-redemption-receipt">
        <style>{`
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
            
            .print-redemption-receipt {
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
          }
          
          .print-redemption-receipt {
            width: 210mm;
            min-height: 297mm;
            padding: 25.4mm;
            margin: 0 auto;
            background: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            font-size: 10pt;
            color: #1a1a1a;
            line-height: 1.5;
          }
          
          .header {
            text-align: center;
            padding-bottom: 5mm;
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
            margin: 2px 0;
            font-style: italic;
          }
          
          .company-contact {
            font-size: 9.5pt;
            color: #333;
            margin-top: 2mm;
          }
          
          .document-title {
            text-align: center;
            padding: 3mm 0;
            font-size: 15pt;
            font-weight: 700;
            letter-spacing: 2px;
            margin: 4mm 0;
            border: 1.5pt solid #000;
          }
          
          .receipt-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4mm;
            padding: 3mm;
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
            font-size: 11pt;
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
            font-size: 10pt;
            color: #555;
            min-width: 28mm;
          }
          
          .info-value {
            font-size: 11pt;
            color: #000;
            font-weight: 500;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 3mm 0;
            font-size: 10pt;
          }
          
          .items-table th {
            padding: 2mm 3mm;
            text-align: left;
            font-weight: 700;
            font-size: 9pt;
            color: #000;
            text-transform: uppercase;
            border-top: 1pt solid #000;
            border-bottom: 1pt solid #000;
          }
          
          .items-table td {
            padding: 2.5mm 3mm;
            border-bottom: 0.5pt solid #ccc;
            vertical-align: top;
          }
          
          .items-table .text-right {
            text-align: right;
          }
          
          .item-desc {
            font-size: 9pt;
            color: #555;
          }
          
          .interest-breakdown {
            margin-top: 4mm;
            padding: 3mm;
            border: 0.5pt solid #888;
          }
          
          .breakdown-title {
            font-size: 11pt;
            font-weight: 700;
            color: #000;
            margin-bottom: 2.5mm;
            padding-bottom: 1.5mm;
            border-bottom: 1px dashed #888;
          }
          
          .breakdown-row {
            display: flex;
            justify-content: space-between;
            padding: 1.5mm 0;
            font-size: 10pt;
          }
          
          .breakdown-row.sub {
            padding-left: 4mm;
            color: #555;
            font-size: 9.5pt;
          }
          
          .breakdown-row.total {
            font-weight: 700;
            font-size: 11pt;
            border-top: 1pt solid #000;
            padding-top: 2.5mm;
            margin-top: 1.5mm;
          }
          
          .payment-section {
            margin-top: 4mm;
            padding: 4mm;
            border: 1.5pt solid #000;
          }
          
          .payment-title {
            font-size: 12pt;
            font-weight: 700;
            color: #000;
            margin-bottom: 2.5mm;
            text-transform: uppercase;
          }
          
          .payment-row {
            display: flex;
            justify-content: space-between;
            padding: 1.5mm 0;
            font-size: 11pt;
          }
          
          .payment-row.highlight {
            font-size: 14pt;
            font-weight: 700;
            color: #000;
            padding-top: 3mm;
            border-top: 1pt dashed #000;
            margin-top: 2.5mm;
          }
          
          .status-badge {
            display: inline-block;
            padding: 2mm 5mm;
            border: 1.5pt solid #000;
            font-size: 10pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .acknowledgment {
            margin-top: 5mm;
            padding: 3mm;
            border: 0.5pt solid #888;
            font-size: 10pt;
            color: #333;
          }
          
          .acknowledgment-title {
            font-weight: 700;
            color: #000;
            margin-bottom: 2mm;
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
            padding-top: 2mm;
            font-size: 9pt;
            color: #555;
          }
          
          .footer {
            margin-top: 6mm;
            padding-top: 3mm;
            border-top: 0.75pt solid #aaa;
            text-align: center;
            font-size: 9pt;
            color: #888;
          }
          
          .completion-badge {
            text-align: center;
            margin-top: 4mm;
            padding: 3mm;
            border: 1.5pt solid #000;
            font-size: 11pt;
            font-weight: 700;
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
        <div className="document-title">PAWN REDEMPTION RECEIPT</div>

        {/* Receipt Info */}
        <div className="receipt-info">
          <div>
            <span style={{ fontSize: '7.5pt', color: '#666' }}>Receipt No: </span>
            <span className="ticket-number">{redemption.id.toUpperCase()}</span>
          </div>
          <div>
            <span style={{ fontSize: '7.5pt', color: '#666' }}>Date: </span>
            <span style={{ fontWeight: 600 }}>{formatDate(redemption.redemptionDate)}</span>
          </div>
        </div>

        {/* Original Ticket Reference */}
        <div className="section">
          <div className="section-title">Original Pawn Ticket</div>
          <div className="info-grid">
            <div className="info-row">
              <span className="info-label">Ticket Number:</span>
              <span className="info-value" style={{ color: '#b8860b', fontFamily: 'monospace' }}>
                {redemption.ticketNumber}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Pawn Date:</span>
              <span className="info-value">{formatDate(redemption.pawnDate)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Customer Name:</span>
              <span className="info-value">{redemption.customerName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">NIC:</span>
              <span className="info-value">{redemption.customerNIC}</span>
            </div>
          </div>
        </div>

        {/* Items Returned */}
        <div className="section">
          <div className="section-title">Items Returned</div>
          <table className="items-table">
            <thead>
              <tr>
                <th style={{ width: '5%' }}>#</th>
                <th style={{ width: '40%' }}>Item Description</th>
                <th style={{ width: '15%' }}>Karat</th>
                <th style={{ width: '20%' }} className="text-right">Net Weight</th>
                <th style={{ width: '20%' }} className="text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {ticket.items.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>{item.itemType}</strong>
                    <div className="item-desc">{item.description}</div>
                  </td>
                  <td>{item.karat}</td>
                  <td className="text-right">{formatWeight(item.netWeight)}</td>
                  <td className="text-right">{formatCurrency(item.valuedAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: 'right', fontSize: '8pt', color: '#666', marginTop: '1mm' }}>
            Total Items: {ticket.items.length} | Total Weight: {formatWeight(ticket.totalNetWeight)}
          </div>
        </div>

        {/* Interest Calculation Breakdown */}
        <div className="interest-breakdown">
          <div className="breakdown-title">Interest Calculation Breakdown</div>
          
          <div className="breakdown-row">
            <span>Days Elapsed:</span>
            <span>{calc.daysElapsed} day(s)</span>
          </div>
          <div className="breakdown-row">
            <span>Complete Months:</span>
            <span>{calc.monthsCompleted}</span>
          </div>
          <div className="breakdown-row">
            <span>Remaining Days:</span>
            <span>{calc.remainingDays}</span>
          </div>
          <div className="breakdown-row">
            <span>Interest Rate:</span>
            <span>{calc.interestRatePerMonth}% per month</span>
          </div>
          
          <div style={{ borderTop: '1px dashed #ccc', marginTop: '2mm', paddingTop: '2mm' }}>
            <div className="breakdown-row">
              <span>Principal Amount:</span>
              <span>{formatCurrency(calc.principalAmount)}</span>
            </div>
            <div className="breakdown-row sub">
              <span>First Month Interest ({calc.interestRatePerMonth}%):</span>
              <span>{formatCurrency(calc.firstMonthInterest)}</span>
            </div>
            {calc.additionalMonthsInterest > 0 && (
              <div className="breakdown-row sub">
                <span>Additional Months Interest:</span>
                <span>{formatCurrency(calc.additionalMonthsInterest)}</span>
              </div>
            )}
            {calc.proratedDailyInterest > 0 && (
              <div className="breakdown-row sub">
                <span>Pro-rated Interest ({calc.remainingDays} days @ {calc.dailyRate.toFixed(4)}%/day):</span>
                <span>{formatCurrency(calc.proratedDailyInterest)}</span>
              </div>
            )}
            <div className="breakdown-row total">
              <span>Total Interest:</span>
              <span style={{ color: '#228b22' }}>{formatCurrency(calc.totalInterest)}</span>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div className="payment-section">
          <div className="payment-title">Payment Details</div>
          
          <div className="payment-row">
            <span>Principal Amount:</span>
            <span>{formatCurrency(redemption.principalAmount)}</span>
          </div>
          <div className="payment-row">
            <span>Total Interest:</span>
            <span>{formatCurrency(calc.totalInterest)}</span>
          </div>
          <div className="payment-row highlight">
            <span>Total Payable:</span>
            <span>{formatCurrency(redemption.totalPayable)}</span>
          </div>
          
          <div style={{ borderTop: '1px solid #90ee90', marginTop: '2mm', paddingTop: '2mm' }}>
            <div className="payment-row">
              <span>Amount Received:</span>
              <span>{formatCurrency(redemption.amountReceived)}</span>
            </div>
            <div className="payment-row">
              <span>Payment Method:</span>
              <span>{paymentMethodLabels[redemption.paymentMethod] || redemption.paymentMethod}</span>
            </div>
            {redemption.changeGiven > 0 && (
              <div className="payment-row">
                <span>Change Returned:</span>
                <span>{formatCurrency(redemption.changeGiven)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Completion Badge */}
        <div className="completion-badge">
          ✓ REDEMPTION COMPLETED - ALL ITEMS RETURNED
        </div>

        {/* Acknowledgment */}
        <div className="acknowledgment">
          <div className="acknowledgment-title">Customer Acknowledgment</div>
          I, <strong>{redemption.customerName}</strong> (NIC: {redemption.customerNIC}), hereby acknowledge that I have received 
          all the items listed above in satisfactory condition. I confirm that the interest calculation is correct and 
          I have paid the full redemption amount. This transaction is complete and I have no further claims.
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

        {/* Footer */}
        <div className="footer">
          Processed by: {redemption.processedBy} | {new Date(redemption.createdAt).toLocaleString('en-GB')}
          <br />
          {company.registrationNumber} | This is a computer-generated document.
          {redemption.notes && (
            <>
              <br />
              <em>Note: {redemption.notes}</em>
            </>
          )}
        </div>
      </div>
    );
  }
);

PrintableRedemptionReceipt.displayName = 'PrintableRedemptionReceipt';
