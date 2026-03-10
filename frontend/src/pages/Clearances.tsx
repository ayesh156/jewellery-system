import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Tag,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Printer,
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
import { Modal, ModalContent, ModalFooter } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, MobileCard, MobileCardHeader, MobileCardContent, MobileCardRow, MobileCardActions, MobileCardsContainer } from '../components/ui/Table';
import { clearanceApi } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { cn } from '../utils/cn';
import type { Clearance, InvoiceStatus, PaymentMethod } from '../types';

const clearanceStatuses: InvoiceStatus[] = ['draft', 'pending', 'partial', 'paid', 'cancelled'];
const paymentMethods: PaymentMethod[] = ['cash', 'card', 'bank-transfer', 'cheque', 'credit'];

export function Clearances() {
  const navigate = useNavigate();
  const [clearances, setClearances] = useState<Clearance[]>([]);
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
  const [selectedClearance, setSelectedClearance] = useState<Clearance | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paying, setPaying] = useState(false);
  const [moreMenuId, setMoreMenuId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const mapClearance = (clr: any): Clearance => ({
    ...clr,
    subtotal: Number(clr.subtotal),
    discount: Number(clr.discount),
    tax: Number(clr.tax),
    taxRate: clr.taxRate ? Number(clr.taxRate) : undefined,
    total: Number(clr.total),
    amountPaid: Number(clr.amountPaid),
    balanceDue: Number(clr.balanceDue),
    items: (clr.items || []).map((item: any) => ({
      ...item,
      metalWeight: item.metalWeight ? Number(item.metalWeight) : 0,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
      discount: item.discount ? Number(item.discount) : undefined,
      total: Number(item.total),
    })),
  });

  const fetchClearances = useCallback(async () => {
    try {
      setLoading(true);
      const res = await clearanceApi.getAll({ limit: 100 });
      setClearances(res.data.map(mapClearance));
    } catch (err: any) {
      toast.error(err.message || 'Failed to load clearances');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClearances(); }, [fetchClearances]);

  const filteredClearances = useMemo(() => {
    return clearances.filter((clr) => {
      const matchesSearch =
        clr.clearanceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clr.customerName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = !statusFilter || clr.status === statusFilter;

      // Date range filter
      let matchesDate = true;
      if (dateFrom) {
        matchesDate = new Date(clr.issueDate) >= new Date(dateFrom);
      }
      if (matchesDate && dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        matchesDate = new Date(clr.issueDate) <= to;
      }

      // Payment method filter
      const matchesPayment = !paymentMethodFilter || clr.paymentMethod === paymentMethodFilter;

      // Amount range filter
      let matchesAmount = true;
      if (amountMin) matchesAmount = clr.total >= Number(amountMin);
      if (matchesAmount && amountMax) matchesAmount = clr.total <= Number(amountMax);

      return matchesSearch && matchesStatus && matchesDate && matchesPayment && matchesAmount;
    });
  }, [clearances, searchQuery, statusFilter, dateFrom, dateTo, paymentMethodFilter, amountMin, amountMax]);

  const activeFilterCount = [statusFilter, dateFrom, dateTo, paymentMethodFilter, amountMin, amountMax].filter(Boolean).length;

  // Stats
  const totalClearances = clearances.length;
  const paidClearances = clearances.filter((c) => c.status === 'paid');
  const pendingClearances = clearances.filter((c) => c.status === 'pending' || c.status === 'partial');
  const totalRevenue = paidClearances.reduce((sum, c) => sum + c.total, 0);
  const pendingAmount = pendingClearances.reduce((sum, c) => sum + c.balanceDue, 0);

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
    if (selectedClearance && paymentAmount > 0) {
      setPaying(true);
      try {
        await clearanceApi.recordPayment(selectedClearance.id, {
          id: `cpay-${Date.now()}`,
          amount: paymentAmount.toFixed(2),
          method: paymentMethod,
          date: new Date().toISOString().split('T')[0],
        });
        toast.success('Payment recorded successfully');
        setShowPaymentModal(false);
        setPaymentAmount(0);
        setSelectedClearance(null);
        fetchClearances();
      } catch (err: any) {
        toast.error(err.message || 'Failed to record payment');
      } finally {
        setPaying(false);
      }
    }
  };

  const handleDelete = async () => {
    if (selectedClearance) {
      setDeleting(true);
      try {
        await clearanceApi.delete(selectedClearance.id);
        toast.success('Clearance deleted');
        setShowDeleteModal(false);
        setSelectedClearance(null);
        fetchClearances();
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete clearance');
      } finally {
        setDeleting(false);
      }
    }
  };

  const openViewModal = (clr: Clearance) => {
    setSelectedClearance(clr);
    setShowViewModal(true);
  };

  const openPaymentModal = (clr: Clearance) => {
    setSelectedClearance(clr);
    setPaymentAmount(clr.balanceDue);
    setShowPaymentModal(true);
  };

  const openDeleteModal = (clr: Clearance) => {
    setSelectedClearance(clr);
    setShowDeleteModal(true);
  };

  const handlePrint = (clr: Clearance) => {
    localStorage.setItem('printClearance', JSON.stringify(clr));
    window.open(`/clearance/${clr.id}/print`, '_blank');
  };

  // Paginated clearances
  const paginatedClearances = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClearances.slice(start, start + pageSize);
  }, [filteredClearances, currentPage, pageSize]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFrom, dateTo, paymentMethodFilter, amountMin, amountMax]);

  // Skeleton loading
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="h-8 w-40 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-4 w-56 bg-slate-200 dark:bg-slate-700 rounded mt-2 animate-pulse" />
          </div>
          <div className="h-10 w-36 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        </div>
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
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              <div className="lg:w-56 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              <div className="lg:w-56 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0 md:p-0">
            <div className="hidden md:block">
              <div className="grid grid-cols-8 gap-4 px-6 py-3 border-b border-slate-200 dark:border-slate-700">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                ))}
              </div>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="grid grid-cols-8 gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 col-span-1">
                    <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      <div className="h-3 w-14 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                  </div>
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse self-center" />
                  ))}
                  <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse self-center mx-auto" />
                  <div className="flex items-center justify-center gap-1">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">Clearance Sales</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Manage clearance sales and payments</p>
        </div>
        <Link to="/clearance/create">
          <Button variant="gold">
            <Plus className="w-4 h-4" />
            Create Clearance
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Tag className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Clearances</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalClearances}</p>
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
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{pendingClearances.length}</p>
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
                placeholder="Search clearance # or customer..."
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
                  ...clearanceStatuses.map((status) => ({
                    value: status,
                    label: status.charAt(0).toUpperCase() + status.slice(1),
                    icon: status === 'paid' ? <CheckCircle className="w-4 h-4" /> : status === 'pending' ? <Clock className="w-4 h-4" /> : status === 'cancelled' ? <AlertTriangle className="w-4 h-4" /> : <Tag className="w-4 h-4" />
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

      {/* Clearances Table */}
      <Card>
        <CardContent className="p-0 md:p-0">
          {/* Desktop Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clearance</TableHead>
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
              {paginatedClearances.map((clr) => (
                <TableRow key={clr.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center">
                        <Tag className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <button
                          onClick={() => navigate(`/clearance/${clr.id}/edit`)}
                          className="font-medium text-slate-800 dark:text-slate-200 hover:text-amber-500 dark:hover:text-amber-400 transition-colors text-left"
                        >
                          {clr.clearanceNumber}
                        </button>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{clr.items.length} items</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-700 dark:text-slate-300">{clr.customerName}</TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">{formatDate(clr.issueDate)}</TableCell>
                  <TableCell className="text-right font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(clr.total)}
                  </TableCell>
                  <TableCell className="text-right text-emerald-400">
                    {formatCurrency(clr.amountPaid)}
                  </TableCell>
                  <TableCell className="text-right text-amber-400">
                    {formatCurrency(clr.balanceDue)}
                  </TableCell>
                  <TableCell className="text-center">{getStatusBadge(clr.status)}</TableCell>
                  <TableCell>
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMoreMenuId(moreMenuId === clr.id ? null : clr.id)}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      {moreMenuId === clr.id && (
                        <>
                          <div className="fixed inset-0 z-[60]" onClick={() => setMoreMenuId(null)} />
                          <div className="absolute right-0 bottom-full mb-1 z-[70] w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl py-1.5">
                            <button
                              onClick={() => { openViewModal(clr); setMoreMenuId(null); }}
                              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <Eye className="w-4 h-4" /> View
                            </button>
                            <button
                              onClick={() => { navigate(`/clearance/${clr.id}/edit`); setMoreMenuId(null); }}
                              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <Edit className="w-4 h-4" /> Edit
                            </button>
                            <button
                              onClick={() => { handlePrint(clr); setMoreMenuId(null); }}
                              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <Printer className="w-4 h-4" /> Print
                            </button>
                            {clr.status !== 'paid' && clr.status !== 'cancelled' && (
                              <button
                                onClick={() => { openPaymentModal(clr); setMoreMenuId(null); }}
                                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              >
                                <DollarSign className="w-4 h-4" /> Record Payment
                              </button>
                            )}
                            <button
                              onClick={() => { openDeleteModal(clr); setMoreMenuId(null); }}
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
            {paginatedClearances.map((clr) => (
              <MobileCard key={clr.id}>
                <MobileCardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center">
                      <Tag className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <button
                        onClick={() => navigate(`/clearance/${clr.id}/edit`)}
                        className="font-semibold text-slate-800 dark:text-slate-200 hover:text-amber-500 dark:hover:text-amber-400 transition-colors text-left"
                      >
                        {clr.clearanceNumber}
                      </button>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{clr.customerName}</p>
                    </div>
                  </div>
                  {getStatusBadge(clr.status)}
                </MobileCardHeader>
                <MobileCardContent>
                  <MobileCardRow label="Date" value={formatDate(clr.issueDate)} />
                  <MobileCardRow label="Items" value={`${clr.items.length} items`} />
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                    <div className="text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(clr.total)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Paid</p>
                      <p className="font-bold text-emerald-500">{formatCurrency(clr.amountPaid)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Balance</p>
                      <p className="font-bold text-amber-500">{formatCurrency(clr.balanceDue)}</p>
                    </div>
                  </div>
                </MobileCardContent>
                <MobileCardActions>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openViewModal(clr)}>
                    <Eye className="w-4 h-4" /> View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/clearance/${clr.id}/edit`)}>
                    <Edit className="w-4 h-4" /> Edit
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openDeleteModal(clr)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </MobileCardActions>
              </MobileCard>
            ))}
          </MobileCardsContainer>

          {filteredClearances.length === 0 && (
            <div className="p-8 text-center">
              <Tag className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400">No clearances found</p>
            </div>
          )}

          {filteredClearances.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-700">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredClearances.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Clearance Modal */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Clearance Details" size="lg">
        {selectedClearance && (
          <>
          <ModalContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{selectedClearance.clearanceNumber}</h3>
                <p className="text-slate-600 dark:text-slate-400">{formatDate(selectedClearance.issueDate)}</p>
              </div>
              {getStatusBadge(selectedClearance.status)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                <p className="text-sm text-slate-600 dark:text-slate-400">Customer</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">{selectedClearance.customerName}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                <p className="text-sm text-slate-600 dark:text-slate-400">Payment Method</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedClearance.paymentMethod?.replace('_', ' ') || 'N/A'}
                </p>
              </div>
            </div>

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
                    {selectedClearance.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{item.productName}</td>
                        <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-right text-slate-800 dark:text-slate-200">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                <span className="text-slate-800 dark:text-slate-200">{formatCurrency(selectedClearance.subtotal)}</span>
              </div>
              {selectedClearance.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Discount</span>
                  <span className="text-red-400">-{formatCurrency(selectedClearance.discount)}</span>
                </div>
              )}
              {selectedClearance.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Tax</span>
                  <span className="text-slate-800 dark:text-slate-200">{formatCurrency(selectedClearance.tax)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-800 dark:text-slate-200">Total</span>
                <span className="text-amber-400">{formatCurrency(selectedClearance.total)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2">
                <span className="text-slate-600 dark:text-slate-400">Paid</span>
                <span className="text-emerald-400">{formatCurrency(selectedClearance.amountPaid)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Balance Due</span>
                <span className="text-amber-400">{formatCurrency(selectedClearance.balanceDue)}</span>
              </div>
            </div>

          </ModalContent>
          <ModalFooter>
              <Button variant="ghost" onClick={() => setShowViewModal(false)}>Close</Button>
              <Button variant="outline" onClick={() => handlePrint(selectedClearance)}>
                <Printer className="w-4 h-4" /> Print
              </Button>
              {selectedClearance.status !== 'paid' && selectedClearance.status !== 'cancelled' && (
                <Button variant="gold" onClick={() => { setShowViewModal(false); openPaymentModal(selectedClearance); }}>
                  <DollarSign className="w-4 h-4" /> Record Payment
                </Button>
              )}
          </ModalFooter>
          </>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Record Payment">
        {selectedClearance && (
          <>
          <ModalContent className="space-y-5">
            <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Clearance</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{selectedClearance.clearanceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Total Amount</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{formatCurrency(selectedClearance.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Already Paid</span>
                <span className="font-medium text-emerald-400">{formatCurrency(selectedClearance.amountPaid)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Balance Due</span>
                <span className="font-bold text-amber-400">{formatCurrency(selectedClearance.balanceDue)}</span>
              </div>
            </div>
            <div className="space-y-4">
              <Input label="Payment Amount" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(parseFloat(e.target.value))} max={selectedClearance.balanceDue} />
              <div>
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-2">Payment Method</label>
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
          </ModalContent>
          <ModalFooter>
              <Button variant="ghost" onClick={() => setShowPaymentModal(false)} disabled={paying}>Cancel</Button>
              <Button variant="gold" onClick={handlePayment} disabled={paying}>
                {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Confirm Payment
              </Button>
          </ModalFooter>
          </>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Clearance">
        <ModalContent className="space-y-5">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-8 h-8 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">Are you sure?</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                This will permanently delete clearance "{selectedClearance?.clearanceNumber}". This action cannot be undone.
              </p>
            </div>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)} disabled={deleting}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
