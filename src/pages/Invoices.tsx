import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Printer,
  Download,
  AlertTriangle,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { mockInvoices, mockCustomers } from '../data/mockData';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { Invoice, InvoiceStatus, PaymentMethod } from '../types';

const invoiceStatuses: InvoiceStatus[] = ['draft', 'pending', 'partial', 'paid', 'cancelled'];
const paymentMethods: PaymentMethod[] = ['cash', 'card', 'bank-transfer', 'cheque', 'credit'];

export function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = !statusFilter || invoice.status === statusFilter;
      
      // Date filter
      let matchesDate = true;
      if (dateFilter) {
        const invoiceDate = new Date(invoice.createdAt);
        const today = new Date();
        switch (dateFilter) {
          case 'today':
            matchesDate = invoiceDate.toDateString() === today.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(today.setDate(today.getDate() - 7));
            matchesDate = invoiceDate >= weekAgo;
            break;
          case 'month':
            matchesDate =
              invoiceDate.getMonth() === today.getMonth() &&
              invoiceDate.getFullYear() === today.getFullYear();
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [invoices, searchQuery, statusFilter, dateFilter]);

  // Stats
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter((i) => i.status === 'paid');
  const pendingInvoices = invoices.filter((i) => i.status === 'pending' || i.status === 'partial');
  const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.total, 0);
  const pendingAmount = pendingInvoices.reduce((sum, i) => sum + i.balanceDue, 0);

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'partial':
        return <Badge variant="info">Partial</Badge>;
      case 'draft':
        return <Badge variant="default">Draft</Badge>;
      case 'cancelled':
        return <Badge variant="error">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handlePayment = () => {
    if (selectedInvoice && paymentAmount > 0) {
      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.id === selectedInvoice.id) {
            const newAmountPaid = inv.amountPaid + paymentAmount;
            const newBalanceDue = inv.total - newAmountPaid;
            return {
              ...inv,
              amountPaid: newAmountPaid,
              balanceDue: newBalanceDue,
              status: newBalanceDue <= 0 ? 'paid' : 'partial',
              paymentMethod: paymentMethod,
              updatedAt: new Date().toISOString(),
            };
          }
          return inv;
        })
      );
      setShowPaymentModal(false);
      setPaymentAmount(0);
      setSelectedInvoice(null);
    }
  };

  const handleDelete = () => {
    if (selectedInvoice) {
      setInvoices((prev) => prev.filter((i) => i.id !== selectedInvoice.id));
      setShowDeleteModal(false);
      setSelectedInvoice(null);
    }
  };

  const openViewModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.balanceDue);
    setShowPaymentModal(true);
  };

  const openDeleteModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDeleteModal(true);
  };

  const handlePrint = (invoice: Invoice) => {
    // Open print preview in new window and trigger print dialog
    const printWindow = window.open(`/invoices/${invoice.id}/print`, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-100">Invoices</h1>
          <p className="mt-1 text-slate-400">Manage sales and payments</p>
        </div>
        <Link to="/invoices/create">
          <Button variant="gold">
            <Plus className="w-4 h-4" />
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Invoices</p>
              <p className="text-2xl font-bold text-slate-100">{totalInvoices}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-100">{formatCurrency(totalRevenue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Pending</p>
              <p className="text-2xl font-bold text-slate-100">{pendingInvoices.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-500/10">
              <DollarSign className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Outstanding</p>
              <p className="text-2xl font-bold text-slate-100">{formatCurrency(pendingAmount)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by invoice number or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="lg:w-40"
            >
              <option value="">All Status</option>
              {invoiceStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </Select>
            <Select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="lg:w-40"
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-slate-400">{invoice.items.length} items</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300">{invoice.customerName}</TableCell>
                  <TableCell className="text-slate-400">{formatDate(invoice.createdAt)}</TableCell>
                  <TableCell className="text-right font-semibold text-slate-200">
                    {formatCurrency(invoice.total)}
                  </TableCell>
                  <TableCell className="text-right text-emerald-400">
                    {formatCurrency(invoice.amountPaid)}
                  </TableCell>
                  <TableCell className="text-right text-amber-400">
                    {formatCurrency(invoice.balanceDue)}
                  </TableCell>
                  <TableCell className="text-center">{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openViewModal(invoice)}
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePrint(invoice)}
                        title="Print"
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                      {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openPaymentModal(invoice)}
                          title="Record Payment"
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          <DollarSign className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteModal(invoice)}
                        title="Delete"
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredInvoices.length === 0 && (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No invoices found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Invoice Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Invoice Details"
        size="lg"
      >
        {selectedInvoice && (
          <div className="px-5 sm:px-6 py-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-100">{selectedInvoice.invoiceNumber}</h3>
                <p className="text-slate-400">{formatDate(selectedInvoice.createdAt)}</p>
              </div>
              {getStatusBadge(selectedInvoice.status)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-800/50">
                <p className="text-sm text-slate-400">Customer</p>
                <p className="font-medium text-slate-200">{selectedInvoice.customerName}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50">
                <p className="text-sm text-slate-400">Payment Method</p>
                <p className="font-medium text-slate-200">
                  {selectedInvoice.paymentMethod?.replace('_', ' ') || 'N/A'}
                </p>
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-3">Items</h4>
              <div className="rounded-lg border border-slate-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Item</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Price</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {selectedInvoice.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-slate-200">{item.productName}</td>
                        <td className="px-4 py-3 text-right text-slate-300">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-slate-300">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-200">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2 pt-4 border-t border-slate-700">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-slate-200">{formatCurrency(selectedInvoice.subtotal)}</span>
              </div>
              {selectedInvoice.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Discount</span>
                  <span className="text-red-400">-{formatCurrency(selectedInvoice.discount)}</span>
                </div>
              )}
              {selectedInvoice.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Tax</span>
                  <span className="text-slate-200">{formatCurrency(selectedInvoice.tax)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-3 border-t border-slate-700">
                <span className="text-slate-200">Total</span>
                <span className="text-amber-400">{formatCurrency(selectedInvoice.total)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2">
                <span className="text-slate-400">Paid</span>
                <span className="text-emerald-400">{formatCurrency(selectedInvoice.amountPaid)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Balance Due</span>
                <span className="text-amber-400">{formatCurrency(selectedInvoice.balanceDue)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
              <Button variant="ghost" onClick={() => setShowViewModal(false)}>
                Close
              </Button>
              <Button variant="outline" onClick={() => handlePrint(selectedInvoice)}>
                <Printer className="w-4 h-4" />
                Print
              </Button>
              {selectedInvoice.status !== 'paid' && selectedInvoice.status !== 'cancelled' && (
                <Button
                  variant="gold"
                  onClick={() => {
                    setShowViewModal(false);
                    openPaymentModal(selectedInvoice);
                  }}
                >
                  <DollarSign className="w-4 h-4" />
                  Record Payment
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Payment"
      >
        {selectedInvoice && (
          <div className="px-5 sm:px-6 py-5 space-y-5">
            <div className="p-4 rounded-lg bg-slate-800/50 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice</span>
                <span className="font-medium text-slate-200">{selectedInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Amount</span>
                <span className="font-medium text-slate-200">
                  {formatCurrency(selectedInvoice.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Already Paid</span>
                <span className="font-medium text-emerald-400">
                  {formatCurrency(selectedInvoice.amountPaid)}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-700">
                <span className="text-slate-400">Balance Due</span>
                <span className="font-bold text-amber-400">
                  {formatCurrency(selectedInvoice.balanceDue)}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Payment Amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                max={selectedInvoice.balanceDue}
              />
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Payment Method
                </label>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method.replace('_', ' ').charAt(0).toUpperCase() +
                        method.replace('_', ' ').slice(1)}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
              <Button variant="ghost" onClick={() => setShowPaymentModal(false)}>
                Cancel
              </Button>
              <Button variant="gold" onClick={handlePayment}>
                <CheckCircle className="w-4 h-4" />
                Confirm Payment
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Invoice"
      >
        <div className="px-5 sm:px-6 py-5 space-y-5">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-8 h-8 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-200">Are you sure?</p>
              <p className="text-sm text-slate-400 mt-1">
                This will permanently delete invoice "{selectedInvoice?.invoiceNumber}". This action
                cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
