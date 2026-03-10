import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Banknote,
  CreditCard,
  Loader2,
  X,
  DollarSign,
  FileText,
  Tag,
  CheckCircle,
  SlidersHorizontal,
  Calendar,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Combobox } from '../components/ui/Combobox';
import { DateCombobox } from '../components/ui/DateCombobox';
import { Modal, ModalContent, ModalFooter } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  MobileCard,
  MobileCardHeader,
  MobileCardContent,
  MobileCardActions,
  MobileCardsContainer,
} from '../components/ui/Table';
import { customersApi, countersApi, invoicesApi, clearanceApi } from '../services/api';
import { formatCurrency, formatDate, formatPhone } from '../utils/formatters';
import { cn } from '../utils/cn';
import type { Customer, PaymentMethod } from '../types';

const paymentMethods: PaymentMethod[] = ['cash', 'card', 'bank-transfer', 'cheque', 'credit'];

type SortField = 'name' | 'createdAt' | 'totalPurchased';
type SortOrder = 'asc' | 'desc';

interface FormData {
  name: string;
  businessName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  creditLimit: number;
  isActive: boolean;
}

const initialFormData: FormData = {
  name: '',
  businessName: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  creditLimit: 0,
  isActive: true,
};

// Outstanding item from invoices or clearances
interface OutstandingItem {
  id: string;
  number: string;
  type: 'invoice' | 'clearance';
  total: number;
  amountPaid: number;
  balanceDue: number;
  issueDate: string;
  status: string;
}

// Map DB row → Customer
const mapCustomer = (c: any): Customer => ({
  ...c,
  totalPurchased: Number(c.totalPurchased || 0),
  creditLimit: c.creditLimit ? Number(c.creditLimit) : 0,
  creditBalance: c.creditBalance ? Number(c.creditBalance) : 0,
});

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [cityFilter, setCityFilter] = useState('');
  const [outstandingFilter, setOutstandingFilter] = useState<'all' | 'has' | 'none'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [moreMenuId, setMoreMenuId] = useState<string | null>(null);

  // Pay credit state
  const [outstandingItems, setOutstandingItems] = useState<OutstandingItem[]>([]);
  const [loadingOutstanding, setLoadingOutstanding] = useState(false);
  const [payingCredit, setPayingCredit] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Customer credit map (calculated from invoices + clearances)
  const [customerCredits, setCustomerCredits] = useState<Record<string, number>>({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Fetch customers + calculate real credits
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [custRes, invRes, clrRes] = await Promise.all([
        customersApi.getAll({ limit: 200 }),
        invoicesApi.getAll({ limit: 500 }),
        clearanceApi.getAll({ limit: 500 }),
      ]);
      const mappedCustomers = custRes.data.map(mapCustomer);
      setCustomers(mappedCustomers);

      // Calculate credits per customer
      const credits: Record<string, number> = {};
      invRes.data.forEach((inv: any) => {
        const bal = Number(inv.balanceDue || 0);
        if (bal > 0 && inv.customerId) {
          credits[inv.customerId] = (credits[inv.customerId] || 0) + bal;
        }
      });
      clrRes.data.forEach((clr: any) => {
        const bal = Number(clr.balanceDue || 0);
        if (bal > 0 && clr.customerId) {
          credits[clr.customerId] = (credits[clr.customerId] || 0) + bal;
        }
      });
      setCustomerCredits(credits);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter & sort
  const filteredCustomers = useMemo(() => {
    let result = customers.filter((customer) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery) ||
        (customer.businessName?.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCity = !cityFilter || customer.city?.toLowerCase() === cityFilter.toLowerCase();

      const credit = customerCredits[customer.id] || 0;
      const matchesOutstanding =
        outstandingFilter === 'all' ||
        (outstandingFilter === 'has' && credit > 0) ||
        (outstandingFilter === 'none' && credit === 0);

      let matchesDate = true;
      if (dateFrom) {
        matchesDate = new Date(customer.registrationDate) >= new Date(dateFrom);
      }
      if (matchesDate && dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        matchesDate = new Date(customer.registrationDate) <= to;
      }

      return matchesSearch && matchesCity && matchesOutstanding && matchesDate;
    });

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          cmp = new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime();
          break;
        case 'totalPurchased':
          cmp = a.totalPurchased - b.totalPurchased;
          break;
      }
      return sortOrder === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [customers, searchQuery, sortField, sortOrder, cityFilter, outstandingFilter, dateFrom, dateTo, customerCredits]);

  // Paginated
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, sortField, sortOrder, cityFilter, outstandingFilter, dateFrom, dateTo]);

  // Unique cities for filter
  const uniqueCities = useMemo(() => {
    const cities = [...new Set(customers.map((c) => c.city).filter(Boolean))];
    return cities.sort();
  }, [customers]);

  // Active filter count
  const activeFilterCount = [cityFilter, outstandingFilter !== 'all' ? 'x' : '', dateFrom, dateTo].filter(Boolean).length;

  // Stats
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.isActive).length;
  const totalOutstanding = Object.values(customerCredits).reduce((sum, v) => sum + v, 0);

  // Sort toggle
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />;
    return sortOrder === 'asc'
      ? <ArrowUp className="w-3.5 h-3.5 text-amber-500" />
      : <ArrowDown className="w-3.5 h-3.5 text-amber-500" />;
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Modal handlers
  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      businessName: customer.businessName || '',
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      city: customer.city,
      creditLimit: customer.creditLimit || 0,
      isActive: customer.isActive,
    });
    setEditMode(true);
    setShowAddModal(true);
    setMoreMenuId(null);
  };

  const openViewModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
    setMoreMenuId(null);
  };

  const openDeleteModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDeleteModal(true);
    setMoreMenuId(null);
  };

  // Pay credit modal - fetch outstanding invoices/clearances for this customer
  const openPayModal = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setMoreMenuId(null);
    setLoadingOutstanding(true);
    setShowPayModal(true);
    setPayAmount(0);
    setPayMethod('cash');
    setSelectedItemId(null);

    try {
      const [invRes, clrRes] = await Promise.all([
        invoicesApi.getAll({ search: customer.name, limit: 200 }),
        clearanceApi.getAll({ search: customer.name, limit: 200 }),
      ]);

      const items: OutstandingItem[] = [];

      invRes.data.forEach((inv: any) => {
        const bal = Number(inv.balanceDue || 0);
        if (bal > 0 && inv.customerId === customer.id) {
          items.push({
            id: inv.id,
            number: inv.invoiceNumber,
            type: 'invoice',
            total: Number(inv.total),
            amountPaid: Number(inv.amountPaid),
            balanceDue: bal,
            issueDate: inv.issueDate,
            status: inv.status,
          });
        }
      });

      clrRes.data.forEach((clr: any) => {
        const bal = Number(clr.balanceDue || 0);
        if (bal > 0 && clr.customerId === customer.id) {
          items.push({
            id: clr.id,
            number: clr.clearanceNumber || clr.invoiceNumber,
            type: 'clearance',
            total: Number(clr.total),
            amountPaid: Number(clr.amountPaid),
            balanceDue: bal,
            issueDate: clr.issueDate,
            status: clr.status,
          });
        }
      });

      // Sort by date (oldest first)
      items.sort((a, b) => new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime());
      setOutstandingItems(items);

      setPayAmount(0);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load outstanding items');
    } finally {
      setLoadingOutstanding(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditMode(false);
    setSelectedCustomer(null);
    setShowAddModal(false);
  };

  const handleInputChange = (field: keyof FormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) { toast.error('Customer name is required'); return; }
    if (!formData.phone.trim()) { toast.error('Phone number is required'); return; }

    setSaving(true);
    try {
      if (editMode && selectedCustomer) {
        const res = await customersApi.update(selectedCustomer.id, {
          name: formData.name,
          businessName: formData.businessName || null,
          phone: formData.phone,
          email: formData.email || null,
          address: formData.address || null,
          city: formData.city || null,
          creditLimit: formData.creditLimit ? String(formData.creditLimit) : '0',
          isActive: formData.isActive,
        });
        setCustomers((prev) =>
          prev.map((c) => (c.id === selectedCustomer.id ? mapCustomer(res.data) : c))
        );
        toast.success('Customer updated');
      } else {
        const shopCode = localStorage.getItem('shopCode') || 'A';
        const counterRes = await countersApi.getNext('customer', shopCode);
        const res = await customersApi.create({
          id: counterRes.data.formattedId.toLowerCase(),
          name: formData.name,
          businessName: formData.businessName || null,
          phone: formData.phone,
          email: formData.email || null,
          address: formData.address || null,
          city: formData.city || null,
          registrationDate: new Date().toISOString().split('T')[0],
          totalPurchased: '0',
          customerType: 'retail',
          creditLimit: formData.creditLimit ? String(formData.creditLimit) : '0',
          creditBalance: '0',
          isActive: formData.isActive,
        });
        setCustomers((prev) => [...prev, mapCustomer(res.data)]);
        toast.success('Customer added');
      }
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    setDeleting(true);
    try {
      await customersApi.delete(selectedCustomer.id);
      setCustomers((prev) => prev.filter((c) => c.id !== selectedCustomer.id));
      toast.success('Customer deleted');
      setShowDeleteModal(false);
      setSelectedCustomer(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };

  // Pay credit - pays selected item or distributes across all (oldest first)
  const handlePayCredit = async () => {
    if (!selectedCustomer || payAmount <= 0) return;

    // Determine which items to pay
    const itemsToPay = selectedItemId
      ? outstandingItems.filter((i) => i.id === selectedItemId)
      : outstandingItems;

    const maxPayable = itemsToPay.reduce((s, i) => s + i.balanceDue, 0);
    if (payAmount > maxPayable) {
      toast.error('Payment amount exceeds balance due');
      return;
    }

    setPayingCredit(true);
    try {
      let remaining = payAmount;

      for (const item of itemsToPay) {
        if (remaining <= 0) break;
        const payForThis = Math.min(remaining, item.balanceDue);
        remaining -= payForThis;

        const paymentData = {
          id: `pay-${Date.now()}-${item.id.slice(-4)}`,
          amount: payForThis.toFixed(2),
          method: payMethod,
          date: new Date().toISOString().split('T')[0],
        };

        if (item.type === 'invoice') {
          await invoicesApi.recordPayment(item.id, paymentData);
        } else {
          await clearanceApi.recordPayment(item.id, paymentData);
        }
      }

      toast.success(
        payAmount >= maxPayable
          ? (selectedItemId ? 'Item credit cleared!' : 'All credit cleared successfully!')
          : 'Partial payment recorded successfully!'
      );
      setShowPayModal(false);
      setSelectedCustomer(null);
      setOutstandingItems([]);
      setSelectedItemId(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to process payment');
    } finally {
      setPayingCredit(false);
    }
  };

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse">
                  <div className="w-6 h-6" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-7 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0 md:p-0">
            <div className="hidden md:block">
              <div className="grid grid-cols-7 gap-4 px-6 py-3 border-b border-slate-200 dark:border-slate-700">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                ))}
              </div>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="grid grid-cols-7 gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-1.5 self-center">
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  </div>
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse self-center" />
                  ))}
                </div>
              ))}
            </div>
            <div className="md:hidden p-4 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
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
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">Customers</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Manage your customer database</p>
        </div>
        <Button variant="gold" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Customers</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalCustomers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/10">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Active Customers</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{activeCustomers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10">
              <Banknote className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Outstanding</p>
              <p className={`text-2xl font-bold ${totalOutstanding > 0 ? 'text-amber-400' : 'text-slate-900 dark:text-slate-100'}`}>
                {formatCurrency(totalOutstanding)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full">
          {/* Search input expands left, filters right */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name, email, or phone..."
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
          <div className="flex items-center gap-2">
            <Combobox
              value={cityFilter}
              onChange={(val) => setCityFilter(val)}
              options={uniqueCities.map((city) => ({ value: city, label: city, icon: <MapPin className="w-4 h-4" /> }))}
              placeholder="All Cities"
              searchPlaceholder="Search cities..."
              defaultIcon={<MapPin className="w-4 h-4" />}
              showAllOption
              allOptionLabel="All Cities"
              clearable
              showFooter={false}
              className="w-[120px] sm:w-[160px]"
            />
            <Combobox
              value={outstandingFilter}
              onChange={(val) => setOutstandingFilter(val as 'all' | 'has' | 'none')}
              options={[
                { value: 'all', label: 'All Customers', icon: <Users className="w-4 h-4" /> },
                { value: 'has', label: 'Has Outstanding', icon: <DollarSign className="w-4 h-4" /> },
                { value: 'none', label: 'No Outstanding', icon: <CheckCircle className="w-4 h-4" /> },
              ]}
              placeholder="Outstanding..."
              showFooter={false}
              className="w-[120px] sm:w-[160px]"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all shrink-0',
                showFilters || activeFilterCount > 0
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-lg'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">More</span>
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

            {/* Expandable filter panel */}
            {showFilters && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                </div>

                {/* Active filter pills */}
                {activeFilterCount > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Active:</span>
                    {cityFilter && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-500/20">
                        <MapPin className="w-3 h-3" /> {cityFilter}
                        <button onClick={() => setCityFilter('')} className="ml-0.5 hover:text-blue-800 dark:hover:text-blue-200"><X className="w-3 h-3" /></button>
                      </span>
                    )}
                    {outstandingFilter !== 'all' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium border border-amber-500/20">
                        <DollarSign className="w-3 h-3" /> {outstandingFilter === 'has' ? 'Has Outstanding' : 'No Outstanding'}
                        <button onClick={() => setOutstandingFilter('all')} className="ml-0.5 hover:text-amber-800 dark:hover:text-amber-200"><X className="w-3 h-3" /></button>
                      </span>
                    )}
                    {dateFrom && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">
                        <Calendar className="w-3 h-3" /> From: {dateFrom}
                        <button onClick={() => setDateFrom('')} className="ml-0.5 hover:text-emerald-800 dark:hover:text-emerald-200"><X className="w-3 h-3" /></button>
                      </span>
                    )}
                    {dateTo && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">
                        <Calendar className="w-3 h-3" /> To: {dateTo}
                        <button onClick={() => setDateTo('')} className="ml-0.5 hover:text-emerald-800 dark:hover:text-emerald-200"><X className="w-3 h-3" /></button>
                      </span>
                    )}
                    <button
                      onClick={() => { setCityFilter(''); setOutstandingFilter('all'); setDateFrom(''); setDateTo(''); }}
                      className="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 font-medium ml-1"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            )}
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0 md:p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button onClick={() => toggleSort('name')} className="flex items-center gap-1.5 hover:text-amber-500 transition-colors">
                    Customer {getSortIcon('name')}
                  </button>
                </TableHead>
                <TableHead>City</TableHead>
                <TableHead className="text-right">
                  <button onClick={() => toggleSort('totalPurchased')} className="flex items-center gap-1.5 ml-auto hover:text-amber-500 transition-colors">
                    Total Purchased {getSortIcon('totalPurchased')}
                  </button>
                </TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>
                  <button onClick={() => toggleSort('createdAt')} className="flex items-center gap-1.5 hover:text-amber-500 transition-colors">
                    Registered {getSortIcon('createdAt')}
                  </button>
                </TableHead>
                <TableHead className="text-center w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.map((customer) => {
                const credit = customerCredits[customer.id] || 0;
                return (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-400">{getInitials(customer.name)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">{customer.name}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{formatPhone(customer.phone)}</p>
                          {customer.email && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">{customer.email}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300">
                      {customer.city || '—'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-slate-800 dark:text-slate-200">
                      {formatCurrency(customer.totalPurchased)}
                    </TableCell>
                    <TableCell className="text-right">
                      {credit > 0 ? (
                        <button
                          onClick={() => openPayModal(customer)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer"
                        >
                          <span className="text-amber-400 font-semibold text-sm">{formatCurrency(credit)}</span>
                          <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                        </button>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-500 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                      {formatDate(customer.registrationDate)}
                    </TableCell>
                    <TableCell>
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setMoreMenuId(moreMenuId === customer.id ? null : customer.id)}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                        {moreMenuId === customer.id && (
                          <>
                            <div className="fixed inset-0 z-[60]" onClick={() => setMoreMenuId(null)} />
                            <div className="absolute right-0 bottom-full mb-1 z-[70] w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl py-1.5">
                              <button
                                onClick={() => openViewModal(customer)}
                                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              >
                                <Eye className="w-4 h-4" /> View
                              </button>
                              <button
                                onClick={() => openEditModal(customer)}
                                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              >
                                <Edit className="w-4 h-4" /> Edit
                              </button>
                              {credit > 0 && (
                                <button
                                  onClick={() => openPayModal(customer)}
                                  className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors"
                                >
                                  <DollarSign className="w-4 h-4" /> Pay Credit
                                </button>
                              )}
                              <button
                                onClick={() => openDeleteModal(customer)}
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
                );
              })}
            </TableBody>
          </Table>

          {/* Mobile Cards */}
          <MobileCardsContainer className="p-4">
            {paginatedCustomers.map((customer) => {
              const credit = customerCredits[customer.id] || 0;
              return (
                <MobileCard key={customer.id}>
                  <MobileCardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/10 flex items-center justify-center">
                        <span className="text-lg font-semibold text-blue-400">
                          {getInitials(customer.name)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{customer.name}</p>
                        {customer.businessName && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">{customer.businessName}</p>
                        )}
                      </div>
                    </div>
                  </MobileCardHeader>
                  <MobileCardContent>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Phone className="w-4 h-4" />
                      {formatPhone(customer.phone)}
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                    {customer.city && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <MapPin className="w-4 h-4" />
                        {customer.city}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Total Purchased</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(customer.totalPurchased)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Outstanding</p>
                        <p className={`font-semibold ${credit > 0 ? 'text-amber-500' : 'text-slate-600 dark:text-slate-400'}`}>
                          {credit > 0 ? formatCurrency(credit) : '—'}
                        </p>
                      </div>
                    </div>
                  </MobileCardContent>
                  <MobileCardActions>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openViewModal(customer)}>
                      <Eye className="w-4 h-4" /> View
                    </Button>
                    {credit > 0 ? (
                      <Button variant="gold" size="sm" className="flex-1" onClick={() => openPayModal(customer)}>
                        <DollarSign className="w-4 h-4" /> Pay
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditModal(customer)}>
                        <Edit className="w-4 h-4" /> Edit
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => openDeleteModal(customer)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </MobileCardActions>
                </MobileCard>
              );
            })}
          </MobileCardsContainer>

          {filteredCustomers.length === 0 && (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400">No customers found</p>
            </div>
          )}

          {/* Pagination */}
          {filteredCustomers.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-700">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredCustomers.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={resetForm}
        title={editMode ? 'Edit Customer' : 'Add New Customer'}
        size="lg"
      >
        <ModalContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Kamal Perera"
              required
            />
            <Input
              label="Business Name"
              value={formData.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              placeholder="e.g., Silva Jewellers (optional)"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="e.g., 0771234567"
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="e.g., kamal@example.com"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Street address"
            />
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="e.g., Colombo"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Credit Limit"
              type="number"
              value={formData.creditLimit}
              onChange={(e) => handleInputChange('creditLimit', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="ghost" onClick={resetForm} disabled={saving}>
            Cancel
          </Button>
          <Button variant="gold" onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {editMode ? 'Update Customer' : 'Add Customer'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Customer Details"
        size="md"
      >
        {selectedCustomer && (() => {
          const credit = customerCredits[selectedCustomer.id] || 0;
          return (
            <ModalContent className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-blue-400">
                    {getInitials(selectedCustomer.name)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {selectedCustomer.name}
                  </h3>
                  {selectedCustomer.businessName && (
                    <p className="text-slate-600 dark:text-slate-400">{selectedCustomer.businessName}</p>
                  )}
                  <p className="text-sm text-slate-500 dark:text-slate-500">
                    Customer since {formatDate(selectedCustomer.registrationDate)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm mb-1">
                    <Phone className="w-4 h-4" /> Phone
                  </div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{formatPhone(selectedCustomer.phone)}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm mb-1">
                    <Mail className="w-4 h-4" /> Email
                  </div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{selectedCustomer.email || 'N/A'}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 col-span-2">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm mb-1">
                    <MapPin className="w-4 h-4" /> Address
                  </div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    {selectedCustomer.address ? `${selectedCustomer.address}, ${selectedCustomer.city}` : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-center min-w-0">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Purchased</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                    {formatCurrency(selectedCustomer.totalPurchased)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-center min-w-0">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Credit Limit</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                    {formatCurrency(selectedCustomer.creditLimit || 0)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-center min-w-0">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Outstanding</p>
                  <p className={`text-sm font-bold truncate ${credit > 0 ? 'text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    {formatCurrency(credit)}
                  </p>
                </div>
              </div>
            </ModalContent>
          );
        })()}
        {selectedCustomer && (
          <ModalFooter>
            <Button variant="ghost" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
            {(customerCredits[selectedCustomer.id] || 0) > 0 && (
              <Button
                variant="gold"
                onClick={() => {
                  setShowViewModal(false);
                  openPayModal(selectedCustomer);
                }}
              >
                <DollarSign className="w-4 h-4" /> Pay Credit
              </Button>
            )}
            <Button
              variant="primary"
              onClick={() => {
                setShowViewModal(false);
                openEditModal(selectedCustomer);
              }}
            >
              <Edit className="w-4 h-4" /> Edit
            </Button>
          </ModalFooter>
        )}
      </Modal>

      {/* Pay Credit Modal */}
      <Modal
        isOpen={showPayModal}
        onClose={() => { setShowPayModal(false); setOutstandingItems([]); }}
        title="Pay Outstanding Credit"
        size="lg"
      >
        {selectedCustomer && (
          <ModalContent className="space-y-5">
            {/* Customer info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-400">{getInitials(selectedCustomer.name)}</span>
              </div>
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200">{selectedCustomer.name}</p>
                <p className="text-xs text-slate-500">{formatPhone(selectedCustomer.phone)}</p>
              </div>
            </div>

            {loadingOutstanding ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                <span className="ml-2 text-sm text-slate-500">Loading outstanding items...</span>
              </div>
            ) : outstandingItems.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <p className="text-slate-600 dark:text-slate-400">No outstanding balance</p>
              </div>
            ) : (
              <>
                {/* Outstanding items list - click to select */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Outstanding Items ({outstandingItems.length})
                    </p>
                    {selectedItemId && (
                      <button
                        onClick={() => { setSelectedItemId(null); setPayAmount(0); }}
                        className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        Clear selection
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {outstandingItems.map((item) => {
                      const isSelected = selectedItemId === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedItemId(null);
                              setPayAmount(0);
                            } else {
                              setSelectedItemId(item.id);
                              setPayAmount(item.balanceDue);
                            }
                          }}
                          className={`flex items-center justify-between p-3 rounded-lg border w-full text-left transition-all ${
                            isSelected
                              ? 'border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/30'
                              : selectedItemId
                                ? 'border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/30 opacity-50'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:border-amber-500/30 hover:bg-amber-500/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg ${item.type === 'invoice' ? 'bg-blue-500/10' : 'bg-purple-500/10'}`}>
                              {item.type === 'invoice' ? (
                                <FileText className="w-4 h-4 text-blue-400" />
                              ) : (
                                <Tag className="w-4 h-4 text-purple-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.number}</p>
                              <p className="text-xs text-slate-500">
                                {item.type === 'invoice' ? 'Invoice' : 'Clearance'} &middot; {formatDate(item.issueDate)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-amber-400">{formatCurrency(item.balanceDue)}</p>
                            <p className="text-xs text-slate-500">of {formatCurrency(item.total)}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    {selectedItemId ? 'Selected item — pay this item only' : 'Click an item to pay it individually, or pay all below'}
                  </p>
                </div>

                {/* Summary */}
                <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 space-y-2">
                  {selectedItemId ? (() => {
                    const sel = outstandingItems.find((i) => i.id === selectedItemId);
                    return sel ? (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Selected Balance ({sel.number})</span>
                        <span className="font-bold text-amber-400">{formatCurrency(sel.balanceDue)}</span>
                      </div>
                    ) : null;
                  })() : (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Total Outstanding</span>
                      <span className="font-bold text-amber-400">
                        {formatCurrency(outstandingItems.reduce((s, i) => s + i.balanceDue, 0))}
                      </span>
                    </div>
                  )}
                </div>

                {/* Payment form */}
                <div className="space-y-4">
                  <Input
                    label="Payment Amount"
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                    max={selectedItemId
                      ? outstandingItems.find((i) => i.id === selectedItemId)?.balanceDue || 0
                      : outstandingItems.reduce((s, i) => s + i.balanceDue, 0)
                    }
                  />
                  <div>
                    <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-2">
                      Payment Method
                    </label>
                    <Combobox
                      value={payMethod}
                      onChange={(val) => setPayMethod(val as PaymentMethod)}
                      options={paymentMethods.map((m) => ({
                        value: m,
                        label: m.replace('-', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                        icon: m === 'cash' ? <Banknote className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />,
                      }))}
                      placeholder="Select payment method..."
                    />
                  </div>
                </div>
              </>
            )}
          </ModalContent>
        )}
        {selectedCustomer && outstandingItems.length > 0 && !loadingOutstanding && (
          <ModalFooter className="flex-wrap">
            <Button variant="ghost" onClick={() => { setShowPayModal(false); setOutstandingItems([]); setSelectedItemId(null); }} disabled={payingCredit}>
              Cancel
            </Button>
            <div className="flex-1" />
            {selectedItemId ? (
              <Button
                variant="outline"
                onClick={() => {
                  const sel = outstandingItems.find((i) => i.id === selectedItemId);
                  if (sel) setPayAmount(sel.balanceDue);
                }}
                disabled={payingCredit}
              >
                Pay Full Item
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setPayAmount(outstandingItems.reduce((s, i) => s + i.balanceDue, 0));
                }}
                disabled={payingCredit}
              >
                Pay All
              </Button>
            )}
            <Button variant="gold" onClick={handlePayCredit} disabled={payingCredit || payAmount <= 0}>
              {payingCredit ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Confirm Payment
            </Button>
          </ModalFooter>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Customer"
      >
        <ModalContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">Are you sure?</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                This will permanently delete &ldquo;{selectedCustomer?.name}&rdquo;. This action cannot be undone.
              </p>
            </div>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
