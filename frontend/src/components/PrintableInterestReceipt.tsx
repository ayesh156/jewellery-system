import { useEffect, useState } from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { formatTimeElapsed } from '../utils/pawnCalculations';
import type { InterestPayment, PawnTicket, PreciseInterestCalculation } from '../types';

interface PrintData {
  receipt: InterestPayment;
  ticket: PawnTicket;
  calculation: PreciseInterestCalculation;
  remainingToMaturity?: {
    remainingInterest: number;
    timeRemaining: { days: number; hours: number; minutes: number };
    breakdown: string[];
  };
}

export function PrintableInterestReceipt() {
  const [data, setData] = useState<PrintData | null>(null);

  useEffect(() => {
    const storedData = localStorage.getItem('printInterestReceipt');
    if (storedData) {
      setData(JSON.parse(storedData));
    }
  }, []);

  useEffect(() => {
    if (data) {
      // Trigger print after render
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [data]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-slate-600">Loading receipt data...</p>
      </div>
    );
  }

  const { receipt, ticket, calculation, remainingToMaturity } = data;

  return (
    <div className="print-container">
      <style>{`
        @media print {
          @page {
            size: A5 portrait;
            margin: 6mm 8mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
        
        .print-container {
          font-family: 'Courier New', monospace;
          width: 132mm;
          margin: 0 auto;
          padding: 5mm;
          background: white;
          color: black;
          font-size: 11px;
          line-height: 1.4;
        }
        
        .header {
          text-align: center;
          border-bottom: 1px dashed #000;
          padding-bottom: 8px;
          margin-bottom: 10px;
        }
        
        .company-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 2px;
        }
        
        .receipt-type {
          font-size: 13px;
          font-weight: bold;
          background: #000;
          color: #fff;
          padding: 3px 8px;
          display: inline-block;
          margin: 8px 0;
        }
        
        .section {
          margin-bottom: 10px;
        }
        
        .section-title {
          font-weight: bold;
          border-bottom: 1px solid #ccc;
          padding-bottom: 2px;
          margin-bottom: 5px;
          font-size: 11px;
        }
        
        .row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        
        .row .label {
          color: #555;
        }
        
        .row .value {
          font-weight: bold;
          text-align: right;
        }
        
        .highlight-box {
          border: 2px solid #000;
          padding: 8px;
          margin: 10px 0;
          text-align: center;
        }
        
        .highlight-box .amount {
          font-size: 18px;
          font-weight: bold;
        }
        
        .highlight-box .label {
          font-size: 10px;
          color: #555;
        }
        
        .divider {
          border-top: 1px dashed #000;
          margin: 10px 0;
        }
        
        .footer {
          text-align: center;
          font-size: 10px;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px dashed #000;
        }
        
        .footer p {
          margin: 3px 0;
        }
        
        .important-note {
          background: #f5f5f5;
          border: 1px solid #ddd;
          padding: 8px;
          margin: 10px 0;
          font-size: 10px;
        }
        
        .barcode {
          text-align: center;
          font-size: 14px;
          letter-spacing: 4px;
          margin: 10px 0;
        }
        
        .time-info {
          background: #f0f0f0;
          padding: 5px;
          text-align: center;
          margin: 5px 0;
        }
      `}</style>

      {/* Header */}
      <div className="header">
        <div className="company-name">ONELKA JEWELLERY</div>
        <div style={{ fontSize: '10px' }}>No. 123, Galle Road, Colombo 03</div>
        <div style={{ fontSize: '10px' }}>Tel: +94 11 234 5678</div>
        <div className="receipt-type">INTEREST PAYMENT RECEIPT</div>
        <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
          #{receipt.receiptNumber}
        </div>
      </div>

      {/* Payment Time */}
      <div className="time-info">
        <strong>Payment Date & Time:</strong><br />
        {formatDate(receipt.paymentDateTime)}{' '}
        {new Date(receipt.paymentDateTime).toLocaleTimeString('en-LK', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </div>

      {/* Customer Details */}
      <div className="section">
        <div className="section-title">CUSTOMER DETAILS</div>
        <div className="row">
          <span className="label">Name:</span>
          <span className="value">{receipt.customerName}</span>
        </div>
        <div className="row">
          <span className="label">NIC:</span>
          <span className="value">{receipt.customerNIC}</span>
        </div>
        <div className="row">
          <span className="label">Phone:</span>
          <span className="value">{receipt.customerPhone}</span>
        </div>
      </div>

      {/* Pawn Ticket Details */}
      <div className="section">
        <div className="section-title">PAWN TICKET DETAILS</div>
        <div className="row">
          <span className="label">Ticket No:</span>
          <span className="value">{receipt.ticketNumber}</span>
        </div>
        <div className="row">
          <span className="label">Principal:</span>
          <span className="value">{formatCurrency(receipt.principalAmount)}</span>
        </div>
        <div className="row">
          <span className="label">Interest Rate:</span>
          <span className="value">{receipt.interestRate}% / month</span>
        </div>
        <div className="row">
          <span className="label">Maturity Date:</span>
          <span className="value">{formatDate(ticket.maturityDate)}</span>
        </div>
      </div>

      {/* Interest Period */}
      <div className="section">
        <div className="section-title">INTEREST PERIOD COVERED</div>
        <div className="row">
          <span className="label">From:</span>
          <span className="value">
            {formatDate(receipt.periodStart)}{' '}
            {new Date(receipt.periodStart).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="row">
          <span className="label">To:</span>
          <span className="value">
            {formatDate(receipt.periodEnd)}{' '}
            {new Date(receipt.periodEnd).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="row">
          <span className="label">Duration:</span>
          <span className="value">
            {formatTimeElapsed(receipt.daysCharged, receipt.hoursCharged ? receipt.hoursCharged % 24 : 0, 0)}
          </span>
        </div>
      </div>

      <div className="divider" />

      {/* Payment Details */}
      <div className="section">
        <div className="section-title">PAYMENT DETAILS</div>
        <div className="row">
          <span className="label">Interest Due:</span>
          <span className="value">{formatCurrency(receipt.interestDue)}</span>
        </div>
        <div className="row">
          <span className="label">Payment Method:</span>
          <span className="value" style={{ textTransform: 'uppercase' }}>{receipt.paymentMethod}</span>
        </div>
      </div>

      {/* Amount Paid - Highlighted */}
      <div className="highlight-box">
        <div className="label">AMOUNT PAID</div>
        <div className="amount">{formatCurrency(receipt.amountPaid)}</div>
      </div>

      {/* Excess Amount */}
      {receipt.excessAmount && receipt.excessAmount > 0 && (
        <div className="row" style={{ marginTop: '5px' }}>
          <span className="label">Excess Amount (Credit):</span>
          <span className="value">{formatCurrency(receipt.excessAmount)}</span>
        </div>
      )}

      {/* Remaining Interest to Maturity */}
      {remainingToMaturity && remainingToMaturity.remainingInterest > 0 && (
        <div className="important-note">
          <strong>⚠ REMAINING INTEREST TO MATURITY</strong>
          <br />
          Time Remaining: {formatTimeElapsed(
            remainingToMaturity.timeRemaining.days,
            remainingToMaturity.timeRemaining.hours,
            remainingToMaturity.timeRemaining.minutes
          )}
          <br />
          Additional Interest: <strong>{formatCurrency(remainingToMaturity.remainingInterest)}</strong>
          <br />
          <em style={{ fontSize: '9px' }}>
            (Interest continues to accrue until full redemption)
          </em>
        </div>
      )}

      {/* Balance Summary */}
      <div className="section" style={{ marginTop: '10px' }}>
        <div className="section-title">BALANCE SUMMARY</div>
        <div className="row">
          <span className="label">Principal Outstanding:</span>
          <span className="value">{formatCurrency(receipt.principalAmount)}</span>
        </div>
        <div className="row">
          <span className="label">Interest Paid to Date:</span>
          <span className="value">{formatCurrency((ticket.interestPaid || 0) + receipt.amountPaid)}</span>
        </div>
        <div className="row" style={{ borderTop: '1px solid #000', paddingTop: '5px', marginTop: '5px' }}>
          <span className="label"><strong>To Fully Redeem Now:</strong></span>
          <span className="value"><strong>{formatCurrency(receipt.principalAmount)}</strong></span>
        </div>
      </div>

      {/* Notes */}
      {receipt.notes && (
        <div className="section">
          <div className="section-title">NOTES</div>
          <p style={{ fontSize: '10px' }}>{receipt.notes}</p>
        </div>
      )}

      {/* Barcode */}
      <div className="barcode">
        ||| {receipt.receiptNumber} |||
      </div>

      {/* Footer */}
      <div className="footer">
        <p><strong>IMPORTANT:</strong></p>
        <p>• Keep this receipt for your records</p>
        <p>• Interest accrues from payment time</p>
        <p>• Present this receipt at redemption</p>
        <p>• Maturity: {formatDate(ticket.maturityDate)}</p>
        <div style={{ marginTop: '10px', borderTop: '1px solid #ccc', paddingTop: '5px' }}>
          <p>Processed by: {receipt.processedBy}</p>
          <p>{new Date(receipt.createdAt).toLocaleString('en-LK')}</p>
        </div>
        <p style={{ marginTop: '10px', fontStyle: 'italic' }}>
          Thank you for your payment!
        </p>
      </div>
    </div>
  );
}
