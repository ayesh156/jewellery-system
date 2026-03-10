import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  CreditCard,
  Loader2,
  X,
  MoreVertical,
  SlidersHorizontal,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Combobox } from '../components/ui/Combobox';
import { DateCombobox } from '../components/ui/DateCombobox';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, MobileCard, MobileCardHeader, MobileCardContent, MobileCardRow, MobileCardActions, MobileCardsContainer } from '../components/ui/Table';
import { invoicesApi } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { cn } from '../utils/cn';
import type { Invoice, InvoiceStatus, PaymentMethod } from '../types';

const invoiceStatuses: InvoiceStatus[] = ['draft', 'pending', 'partial', 'paid', 'cancelled'];
const paymentMethods: PaymentMethod[] = ['cash', 'card', 'bank-transfer', 'cheque', 'credit'];

export function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [moreMenuId, setMoreMenuId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Helper to convert DB numeric strings to numbers
  const mapInvoice = (inv: any): Invoice => ({
    ...inv,
    subtotal: Number(inv.subtotal),
    discount: Number(inv.discount),
    tax: Number(inv.tax),
    taxRate: inv.taxRate ? Number(inv.taxRate) : undefined,
    total: Number(inv.total),
    amountPaid: Number(inv.amountPaid),
    balanceDue: Number(inv.balanceDue),
    items: (inv.items || []).map((item: any) => ({
      ...item,
      metalWeight: item.metalWeight ? Number(item.metalWeight) : 0,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
      discount: item.discount ? Number(item.discount) : undefined,
      total: Number(item.total),
    })),
  });

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await invoicesApi.getAll({ limit: 100 });
      setInvoices(res.data.map(mapInvoice));
    } catch (err: any) {
      toast.error(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = !statusFilter || invoice.status === statusFilter;
      
      // Date range filter
      let matchesDate = true;
      if (dateFrom) {
        matchesDate = new Date(invoice.issueDate) >= new Date(dateFrom);
      }
      if (matchesDate && dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        matchesDate = new Date(invoice.issueDate) <= to;
      }

      // Payment method filter
      const matchesPayment = !paymentMethodFilter || invoice.paymentMethod === paymentMethodFilter;

      // Amount range filter
      let matchesAmount = true;
      if (amountMin) matchesAmount = invoice.total >= Number(amountMin);
      if (matchesAmount && amountMax) matchesAmount = invoice.total <= Number(amountMax);

      return matchesSearch && matchesStatus && matchesDate && matchesPayment && matchesAmount;
    });
  }, [invoices, searchQuery, statusFilter, dateFrom, dateTo, paymentMethodFilter, amountMin, amountMax]);

  const activeFilterCount = [statusFilter, dateFrom, dateTo, paymentMethodFilter, amountMin, amountMax].filter(Boolean).length;

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

  const handlePayment = async () => {
    if (selectedInvoice && paymentAmount > 0) {
      setPaying(true);
      try {
        await invoicesApi.recordPayment(selectedInvoice.id, {
          id: `pay-${Date.now()}`,
          amount: paymentAmount.toFixed(2),
          method: paymentMethod,
          date: new Date().toISOString().split('T')[0],
        });
        toast.success('Payment recorded successfully');
        setShowPaymentModal(false);
        setPaymentAmount(0);
        setSelectedInvoice(null);
        fetchInvoices();
      } catch (err: any) {
        toast.error(err.message || 'Failed to record payment');
      } finally {
        setPaying(false);
      }
    }
  };

  const handleDelete = async () => {
    if (selectedInvoice) {
      setDeleting(true);
      try {
        await invoicesApi.delete(selectedInvoice.id);
        toast.success('Invoice deleted');
        setShowDeleteModal(false);
        setSelectedInvoice(null);
        fetchInvoices();
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete invoice');
      } finally {
        setDeleting(false);
      }
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
    localStorage.setItem('printInvoice', JSON.stringify(invoice));
    window.open(`/invoices/${invoice.id}/print`, '_blank');
  };

  // Paginated invoices
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, currentPage, pageSize]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFrom, dateTo, paymentMethodFilter, amountMin, amountMax]);

  // Skeleton loading
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="h-8 w-40 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-4 w-56 bg-slate-200 dark:bg-slate-700 rounded mt-2 animate-pulse" />
          </div>
          <div className="h-10 w-36 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse">
                  <div className="w-6 h-6" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-7 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters skeleton */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              <div className="lg:w-56 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              <div className="lg:w-56 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            </div>
          </CardContent>
        </Card>

        {/* Table skeleton */}
        <Card>
          <CardContent className="p-0 md:p-0">
            <div className="hidden md:block">
              {/* Header row */}
              <div className="grid grid-cols-8 gap-4 px-6 py-3 border-b border-slate-200 dark:border-slate-700">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                ))}
              </div>
              {/* Data rows */}
              {[...Array(6)].map((_, i) => (
                <div key={i} className="grid grid-cols-8 gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex items-center gap-3 col-span-1">
                    <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      <div className="h-3 w-14 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse self-center" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse self-center" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse self-center" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse self-center" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse self-center" />
                  <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse self-center mx-auto" />
                  <div className="flex items-center justify-center gap-1">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {/* Mobile skeleton */}
            <div className="md:hidden p-4 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
                      <div className="space-y-1.5">
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                        <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="text-center space-y-1.5">
                        <div className="h-3 w-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mx-auto" />
                        <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mx-auto" />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                    <div className="flex-1 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                    <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                    <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">Invoices</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Manage sales and payments</p>
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
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Invoices</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalInvoices}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(totalRevenue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Pending</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{pendingInvoices.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-500/10">
              <DollarSign className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Outstanding</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(pendingAmount)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          {/* Search + first 2 filters + toggle row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search invoice # or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-9"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Combobox
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: '', label: 'All Status', icon: <Filter className="w-4 h-4" /> },
                  ...invoiceStatuses.map((status) => ({
                    value: status,
                    label: status.charAt(0).toUpperCase() + status.slice(1),
                    icon: status === 'paid' ? <CheckCircle className="w-4 h-4" /> : status === 'pending' ? <Clock className="w-4 h-4" /> : status === 'cancelled' ? <AlertTriangle className="w-4 h-4" /> : <FileText className="w-4 h-4" />
                  }))
                ]}
                placeholder="Status"
                className="w-[120px] sm:w-[160px]"
              />
              <Combobox
                value={paymentMethodFilter}
                onChange={setPaymentMethodFilter}
                options={[
                  { value: '', label: 'All Methods', icon: <CreditCard className="w-4 h-4" /> },
                  ...paymentMethods.map((m) => ({
                    value: m,
                    label: m.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                    icon: <CreditCard className="w-4 h-4" />
                  }))
                ]}
                placeholder="Payment method"
                className="w-[120px] sm:w-[160px]"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'flex items-center gap-2 shrink-0 transition-colors',
                  activeFilterCount > 0 && 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                )}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">More</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-medium">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Expandable filter panel */}
          <div className={cn(
            'grid transition-all duration-300 ease-in-out',
            showFilters ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'
          )}>
            <div className="overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <DateCombobox
                  value={dateFrom}
                  onChange={(val) => setDateFrom(val)}
                  placeholder="From date"
                  clearable
                />
                <DateCombobox
                  value={dateTo}
                  onChange={(val) => setDateTo(val)}
                  placeholder="To date"
                  clearable
                />
                <Input
                  placeholder="Min amount"
                  type="number"
                  value={amountMin}
                  onChange={(e) => setAmountMin(e.target.value)}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <Input
                  placeholder="Max amount"
                  type="number"
                  value={amountMax}
                  onChange={(e) => setAmountMax(e.target.value)}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </div>

          {/* Active filter pills */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active:</span>
              {statusFilter && (
                <button onClick={() => setStatusFilter('')} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors">
                  Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                  <X className="w-3 h-3" />
                </button>
              )}
              {paymentMethodFilter && (
                <button onClick={() => setPaymentMethodFilter('')} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                  Method: {paymentMethodFilter.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  <X className="w-3 h-3" />
                </button>
              )}
              {dateFrom && (
                <button onClick={() => setDateFrom('')} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors">
                  From: {dateFrom}
                  <X className="w-3 h-3" />
                </button>
              )}
              {dateTo && (
                <button onClick={() => setDateTo('')} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors">
                  To: {dateTo}
                  <X className="w-3 h-3" />
                </button>
              )}
              {amountMin && (
                <button onClick={() => setAmountMin('')} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
                  Min: Rs. {Number(amountMin).toLocaleString()}
                  <X className="w-3 h-3" />
                </button>
              )}
              {amountMax && (
                <button onClick={() => setAmountMax('')} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
                  Max: Rs. {Number(amountMax).toLocaleString()}
                  <X className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => { setStatusFilter(''); setPaymentMethodFilter(''); setDateFrom(''); setDateTo(''); setAmountMin(''); setAmountMax(''); }}
                className="text-xs text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 underline transition-colors ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0 md:p-0">
          {/* Desktop Table */}
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
                <TableHead className="text-center w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <button
                          onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
                          className="font-medium text-slate-800 dark:text-slate-200 hover:text-amber-500 dark:hover:text-amber-400 transition-colors text-left"
                        >
                          {invoice.invoiceNumber}
                        </button>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{invoice.items.length} items</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-700 dark:text-slate-300">{invoice.customerName}</TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">{formatDate(invoice.issueDate)}</TableCell>
                  <TableCell className="text-right font-semibold text-slate-800 dark:text-slate-200">
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
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMoreMenuId(moreMenuId === invoice.id ? null : invoice.id)}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      {moreMenuId === invoice.id && (
                        <>
                          <div className="fixed inset-0 z-[60]" onClick={() => setMoreMenuId(null)} />
                          <div className="absolute right-0 bottom-full mb-1 z-[70] w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl py-1.5">
                            <button
                              onClick={() => { openViewModal(invoice); setMoreMenuId(null); }}
                              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <Eye className="w-4 h-4" /> View
                            </button>
                            <button
                              onClick={() => { navigate(`/invoices/${invoice.id}/edit`); setMoreMenuId(null); }}
                              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <Edit className="w-4 h-4" /> Edit
                            </button>
                            <button
                              onClick={() => { handlePrint(invoice); setMoreMenuId(null); }}
                              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <Printer className="w-4 h-4" /> Print
                            </button>
                            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                              <button
                                onClick={() => { openPaymentModal(invoice); setMoreMenuId(null); }}
                                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              >
                                <DollarSign className="w-4 h-4" /> Record Payment
                              </button>
                            )}
                            <button
                              onClick={() => { openDeleteModal(invoice); setMoreMenuId(null); }}
                              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Mobile Cards */}
          <MobileCardsContainer className="p-4">
            {paginatedInvoices.map((invoice) => (
              <MobileCard key={invoice.id}>
                <MobileCardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <button
                        onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
                        className="font-semibold text-slate-800 dark:text-slate-200 hover:text-amber-500 dark:hover:text-amber-400 transition-colors text-left"
                      >
                        {invoice.invoiceNumber}
                      </button>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{invoice.customerName}</p>
                    </div>
                  </div>
                  {getStatusBadge(invoice.status)}
                </MobileCardHeader>
                <MobileCardContent>
                  <MobileCardRow label="Date" value={formatDate(invoice.issueDate)} />
                  <MobileCardRow label="Items" value={`${invoice.items.length} items`} />
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                    <div className="text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(invoice.total)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Paid</p>
                      <p className="font-bold text-emerald-500">{formatCurrency(invoice.amountPaid)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Balance</p>
                      <p className="font-bold text-amber-500">{formatCurrency(invoice.balanceDue)}</p>
                    </div>
                  </div>
                </MobileCardContent>
                <MobileCardActions>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openViewModal(invoice)}>
                    <Eye className="w-4 h-4" /> View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/invoices/${invoice.id}/edit`)}>
                    <Edit className="w-4 h-4" /> Edit
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openDeleteModal(invoice)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </MobileCardActions>
              </MobileCard>
            ))}
          </MobileCardsContainer>

          {filteredInvoices.length === 0 && (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400">No invoices found</p>
            </div>
          )}

          {/* Pagination */}
          {filteredInvoices.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-700">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredInvoices.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
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
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{selectedInvoice.invoiceNumber}</h3>
                <p className="text-slate-600 dark:text-slate-400">{formatDate(selectedInvoice.issueDate)}</p>
              </div>
              {getStatusBadge(selectedInvoice.status)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                <p className="text-sm text-slate-600 dark:text-slate-400">Customer</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">{selectedInvoice.customerName}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                <p className="text-sm text-slate-600 dark:text-slate-400">Payment Method</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedInvoice.paymentMethod?.replace('_', ' ') || 'N/A'}
                </p>
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Items</h4>
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-100 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Item</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Price</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                    {selectedInvoice.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{item.productName}</td>
                        <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-800 dark:text-slate-200">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                <span className="text-slate-800 dark:text-slate-200">{formatCurrency(selectedInvoice.subtotal)}</span>
              </div>
              {selectedInvoice.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Discount</span>
                  <span className="text-red-400">-{formatCurrency(selectedInvoice.discount)}</span>
                </div>
              )}
              {selectedInvoice.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Tax</span>
                  <span className="text-slate-800 dark:text-slate-200">{formatCurrency(selectedInvoice.tax)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-800 dark:text-slate-200">Total</span>
                <span className="text-amber-400">{formatCurrency(selectedInvoice.total)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2">
                <span className="text-slate-600 dark:text-slate-400">Paid</span>
                <span className="text-emerald-400">{formatCurrency(selectedInvoice.amountPaid)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Balance Due</span>
                <span className="text-amber-400">{formatCurrency(selectedInvoice.balanceDue)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
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
            <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Invoice</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{selectedInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Total Amount</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {formatCurrency(selectedInvoice.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Already Paid</span>
                <span className="font-medium text-emerald-400">
                  {formatCurrency(selectedInvoice.amountPaid)}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Balance Due</span>
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
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-2">
                  Payment Method
                </label>
                <Combobox
                  value={paymentMethod}
                  onChange={(val) => setPaymentMethod(val as PaymentMethod)}
                  options={paymentMethods.map((method) => ({
                    value: method,
                    label: method.replace('-', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                    icon: method === 'cash' ? <DollarSign className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />
                  }))}
                  placeholder="Select payment method..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="ghost" onClick={() => setShowPaymentModal(false)} disabled={paying}>
                Cancel
              </Button>
              <Button variant="gold" onClick={handlePayment} disabled={paying}>
                {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
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
              <p className="font-medium text-slate-800 dark:text-slate-200">Are you sure?</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                This will permanently delete invoice "{selectedInvoice?.invoiceNumber}". This action
                cannot be undone.
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </Button>
          </div>
      </Modal>
    </div>
  );
}
