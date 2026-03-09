import { companyInfo as defaultCompanyInfo } from '../data/mockData';
import { formatCurrency, formatDate, formatWeight } from '../utils/formatters';
import type { RepairJob, CompanyInfo } from '../types';

interface PrintableRepairReceiptProps {
  job: RepairJob;
  company?: CompanyInfo;
}

export function PrintableRepairReceipt({ job, company }: PrintableRepairReceiptProps) {
  const companyInfo = company || defaultCompanyInfo;

  const totalWeight = job.items.reduce((sum, item) => sum + item.initialWeight, 0);

  return (
    <div className="min-h-screen bg-white p-4 print:p-0">
      <div className="max-w-[800px] mx-auto bg-white">
        {/* Header */}
        <div className="border-b-2 border-gray-600 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{companyInfo.name}</h1>
              {companyInfo.tagline && (
                <p className="text-base text-gray-500 italic">{companyInfo.tagline}</p>
              )}
              <div className="mt-2 text-base text-gray-600">
                <p>{companyInfo.address}</p>
                <p>{companyInfo.city}, {companyInfo.country}</p>
                <p>Tel: {companyInfo.phone}</p>
                {companyInfo.email && <p>Email: {companyInfo.email}</p>}
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block px-4 py-2 bg-white border border-gray-400 rounded-lg">
                <h2 className="text-xl font-bold text-gray-800">REPAIR RECEIPT</h2>
                <p className="text-2xl font-mono font-bold text-gray-900">{job.jobNumber}</p>
              </div>
              <div className="mt-3 text-base text-gray-600">
                <p>Date: <span className="font-semibold">{formatDate(job.receivedDate)}</span></p>
                {job.estimatedCompletionDate && (
                  <p>Est. Ready: <span className="font-semibold text-gray-700">{formatDate(job.estimatedCompletionDate)}</span></p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="mb-6 p-4 bg-white border border-gray-300 rounded-lg">
          <h3 className="text-base font-bold text-gray-700 uppercase tracking-wider mb-3">Customer Details</h3>
          <div className="grid grid-cols-2 gap-4 text-base">
            <div>
              <p className="text-gray-500">Name</p>
              <p className="font-semibold text-gray-900">{job.customerName}</p>
            </div>
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-semibold text-gray-900">{job.customerPhone}</p>
            </div>
            {job.customerNIC && (
              <div>
                <p className="text-gray-500">NIC Number</p>
                <p className="font-semibold text-gray-900">{job.customerNIC}</p>
              </div>
            )}
            {job.customerAddress && (
              <div>
                <p className="text-gray-500">Address</p>
                <p className="font-semibold text-gray-900">{job.customerAddress}</p>
              </div>
            )}
          </div>
        </div>

        {/* Items for Repair */}
        <div className="mb-6">
          <h3 className="text-base font-bold text-gray-700 uppercase tracking-wider mb-3">Items Received for Repair</h3>
          <table className="w-full text-base border border-gray-300">
            <thead className="bg-white">
              <tr>
                <th className="px-3 py-2 border-b border-r border-gray-300 text-left">#</th>
                <th className="px-3 py-2 border-b border-r border-gray-300 text-left">Item Description</th>
                <th className="px-3 py-2 border-b border-r border-gray-300 text-left">Metal/Karat</th>
                <th className="px-3 py-2 border-b border-r border-gray-300 text-right">Weight</th>
                <th className="px-3 py-2 border-b border-gray-300 text-left">Issue/Repair Required</th>
              </tr>
            </thead>
            <tbody>
              {job.items.map((item, idx) => (
                <tr key={item.id} className="bg-white">
                  <td className="px-3 py-2 border-b border-r border-gray-300">{idx + 1}</td>
                  <td className="px-3 py-2 border-b border-r border-gray-300">
                    <p className="font-medium">{item.itemType}</p>
                    {item.itemDescription && (
                      <p className="text-sm text-gray-500">{item.itemDescription}</p>
                    )}
                    {item.hasGemstones && (
                      <p className="text-sm text-gray-600">
                        ✦ {item.gemstoneCount} stone(s): {item.gemstoneDescription}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2 border-b border-r border-gray-300">
                    <span className="capitalize">{item.metalType}</span>
                    {item.karat && <span className="ml-1 font-semibold text-gray-700">({item.karat})</span>}
                  </td>
                  <td className="px-3 py-2 border-b border-r border-gray-300 text-right font-mono font-semibold text-gray-700">
                    {formatWeight(item.initialWeight)}
                  </td>
                  <td className="px-3 py-2 border-b border-gray-300">
                    <p className="text-gray-700">{item.issueDescription}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.repairTypes.map((type, i) => (
                        <span key={i} className="inline-block px-2 py-0.5 bg-white border border-gray-400 text-gray-800 text-sm rounded capitalize">
                          {type.replace('-', ' ')}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-white">
              <tr>
                <td colSpan={3} className="px-3 py-2 border-t border-gray-300 text-right font-bold">
                  Total Weight:
                </td>
                <td className="px-3 py-2 border-t border-l border-gray-300 text-right font-mono font-bold text-gray-700">
                  {formatWeight(totalWeight)}
                </td>
                <td className="px-3 py-2 border-t border-l border-gray-300"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Estimate (if provided) */}
        {job.estimate && (
          <div className="mb-6 p-4 bg-white border border-gray-300 rounded-lg">
            <h3 className="text-base font-bold text-gray-800 uppercase tracking-wider mb-3">Estimated Cost</h3>
            <div className="grid grid-cols-2 gap-2 text-base">
              <div className="flex justify-between">
                <span className="text-gray-600">Labor Cost:</span>
                <span className="font-semibold">{formatCurrency(job.estimate.laborCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Material Cost:</span>
                <span className="font-semibold">{formatCurrency(job.estimate.materialCost)}</span>
              </div>
              {job.estimate.additionalMetalCost && job.estimate.additionalMetalCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Additional Metal:</span>
                  <span className="font-semibold">{formatCurrency(job.estimate.additionalMetalCost)}</span>
                </div>
              )}
              {job.estimate.gemstoneReplacementCost && job.estimate.gemstoneReplacementCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Stone Replacement:</span>
                  <span className="font-semibold">{formatCurrency(job.estimate.gemstoneReplacementCost)}</span>
                </div>
              )}
              {job.estimate.otherCosts && job.estimate.otherCosts > 0 && (
                <div className="flex justify-between col-span-2">
                  <span className="text-gray-600">Other Costs:</span>
                  <span className="font-semibold">{formatCurrency(job.estimate.otherCosts)}</span>
                </div>
              )}
              <div className="flex justify-between col-span-2 pt-2 border-t border-gray-300 mt-2">
                <span className="font-bold text-gray-800">Total Estimate:</span>
                <span className="font-bold text-lg text-gray-800">{formatCurrency(job.estimate.totalEstimate)}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-3 italic">
              * This is an estimated cost. Final amount may vary based on actual work required.
            </p>
          </div>
        )}

        {/* Payment & Status */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="p-4 bg-white border border-gray-300 rounded-lg">
            <h3 className="text-base font-bold text-gray-800 uppercase tracking-wider mb-2">Advance Payment</h3>
            <p className="text-3xl font-bold text-gray-800">{formatCurrency(job.advancePayment)}</p>
            {job.estimate && job.advancePayment > 0 && (
              <p className="text-base text-gray-600 mt-1">
                Balance Due: {formatCurrency(job.estimate.totalEstimate - job.advancePayment)}
              </p>
            )}
          </div>
          <div className="p-4 bg-white border border-gray-300 rounded-lg">
            <h3 className="text-base font-bold text-gray-800 uppercase tracking-wider mb-2">Job Status</h3>
            <p className="text-xl font-bold text-gray-700 capitalize">
              {job.status.replace('-', ' ')}
            </p>
            <p className="text-base text-gray-600 capitalize">{job.priority} Priority</p>
          </div>
        </div>

        {/* Customer Notes */}
        {job.customerNotes && (
          <div className="mb-6 p-4 bg-white border border-gray-300 rounded-lg">
            <h3 className="text-base font-bold text-gray-700 uppercase tracking-wider mb-2">Special Instructions</h3>
            <p className="text-base text-gray-700">{job.customerNotes}</p>
          </div>
        )}

        {/* Terms & Conditions */}
        <div className="mb-6 p-4 bg-white border border-gray-300 rounded-lg text-sm text-gray-600">
          <h3 className="font-bold text-gray-700 uppercase tracking-wider mb-2">Terms & Conditions</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>This receipt must be presented when collecting the repaired item(s). Items held for 30 days after completion.</li>
            <li>Estimated completion dates are approximate. Additional charges may apply if extra work is required.</li>
          </ol>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mb-6 pt-8">
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2">
              <p className="text-base text-gray-600">Customer Signature</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2">
              <p className="text-base text-gray-600">Received By: {job.receivedBy}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center border-t border-gray-300 pt-4 text-sm text-gray-500">
          <p className="font-semibold text-gray-700">Thank you for choosing {companyInfo.name}!</p>
          <p>For inquiries, please call: {companyInfo.phone}</p>
          {companyInfo.website && <p>{companyInfo.website}</p>}
          <p className="mt-2 text-gray-400">Printed on: {new Date().toLocaleString()}</p>
        </div>

        {/* Duplicate Copy (for shop) - Only visible in print */}
        <div className="page-break-before mt-8 pt-8 border-t-2 border-dashed border-gray-400 print:block hidden">
          <p className="text-center text-base text-gray-500 mb-4">--- SHOP COPY ---</p>
          
          {/* Compact version for shop */}
          <div className="border border-gray-300 rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-bold text-xl">{job.jobNumber}</h2>
                <p className="text-base text-gray-600">{job.customerName} | {job.customerPhone}</p>
              </div>
              <div className="text-right text-base">
                <p>Received: {formatDate(job.receivedDate)}</p>
                <p className="font-semibold text-gray-700">Ready: {job.estimatedCompletionDate ? formatDate(job.estimatedCompletionDate) : 'TBD'}</p>
              </div>
            </div>
            
            <table className="w-full text-sm border border-gray-300 mb-3">
              <thead className="bg-white">
                <tr>
                  <th className="px-2 py-1 border-r text-left">Item</th>
                  <th className="px-2 py-1 border-r text-left">Metal</th>
                  <th className="px-2 py-1 border-r text-right">Weight</th>
                  <th className="px-2 py-1 text-left">Work</th>
                </tr>
              </thead>
              <tbody>
                {job.items.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-2 py-1 border-r">
                      {item.itemType}
                      {item.hasGemstones && <span className="text-gray-600"> ✦</span>}
                    </td>
                    <td className="px-2 py-1 border-r">{item.metalType} {item.karat}</td>
                    <td className="px-2 py-1 border-r text-right font-mono">{formatWeight(item.initialWeight)}</td>
                    <td className="px-2 py-1">{item.repairTypes.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between text-base">
              <span>Total: <strong>{formatWeight(totalWeight)}</strong></span>
              {job.estimate && <span>Est: <strong>{formatCurrency(job.estimate.totalEstimate)}</strong></span>}
              <span>Advance: <strong className="text-gray-700">{formatCurrency(job.advancePayment)}</strong></span>
            </div>

            {job.internalNotes && (
              <div className="mt-3 p-2 bg-white border border-gray-300 rounded text-sm">
                <strong>Internal Notes:</strong> {job.internalNotes}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print Styles */}
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
          .min-h-screen {
            min-height: auto !important;
            width: 100%;
            max-width: 159mm;
            padding: 0 !important;
            margin: 0 auto;
          }
          .max-w-\\[800px\\] {
            max-width: 159mm !important;
          }
          .page-break-before {
            page-break-before: always;
          }
          .no-print {
            display: none !important;
          }
          table {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
