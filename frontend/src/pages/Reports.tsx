import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Download,
  FileText,
  BarChart3,
  DollarSign,
  Package,
  Users,
  TrendingUp,
  Clock,
  Loader2,
  CalendarRange,
  CalendarDays,
  CalendarClock,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DateCombobox } from '../components/ui/DateCombobox';
import { Combobox } from '../components/ui/Combobox';
import { invoicesApi, clearanceApi, productsApi, customersApi, companyApi } from '../services/api';
import { formatCurrency, formatDate, formatWeight } from '../utils/formatters';
import { generateReportPdf } from '../utils/reportPdf';
import type { ReportData } from '../utils/reportPdf';
import type { Invoice, Clearance, JewelleryItem, Customer } from '../types';
import toast from 'react-hot-toast';

type ReportPeriod = 'daily' | 'custom' | 'monthly' | 'yearly';

// Months list
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function Reports() {
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Data
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clearances, setClearances] = useState<Clearance[]>([]);
  const [products, setProducts] = useState<JewelleryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [company, setCompany] = useState<any>(null);

  // Period selectors
  const [dailyDate, setDailyDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [customFrom, setCustomFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customTo, setCustomTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [monthYear, setMonthYear] = useState(() => new Date().getFullYear());
  const [monthMonth, setMonthMonth] = useState(() => new Date().getMonth());
  const [yearValue, setYearValue] = useState(() => new Date().getFullYear());

  // Get date range based on period
  const getDateRange = useCallback((): { from: Date; to: Date; label: string } => {
    switch (period) {
      case 'daily': {
        const d = new Date(dailyDate);
        return { from: d, to: d, label: `Daily Report — ${formatDate(dailyDate)}` };
      }
      case 'custom': {
        return {
          from: new Date(customFrom),
          to: new Date(customTo),
          label: `Custom Report — ${formatDate(customFrom)} to ${formatDate(customTo)}`,
        };
      }
      case 'monthly': {
        const from = new Date(monthYear, monthMonth, 1);
        const to = new Date(monthYear, monthMonth + 1, 0);
        return {
          from,
          to,
          label: `Monthly Report — ${MONTHS[monthMonth]} ${monthYear}`,
        };
      }
      case 'yearly': {
        const from = new Date(yearValue, 0, 1);
        const to = new Date(yearValue, 11, 31);
        return { from, to, label: `Yearly Report — ${yearValue}` };
      }
    }
  }, [period, dailyDate, customFrom, customTo, monthYear, monthMonth, yearValue]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, clrRes, prodRes, custRes, compRes] = await Promise.all([
        invoicesApi.getAll({ limit: 9999 }),
        clearanceApi.getAll({ limit: 9999 }),
        productsApi.getAll({ limit: 9999 }),
        customersApi.getAll({ limit: 9999 }),
        companyApi.get(),
      ]);
      setInvoices(invRes.data || []);
      setClearances(clrRes.data || []);
      setProducts(prodRes.data || []);
      setCustomers(custRes.data || []);
      setCompany(compRes.data);
    } catch {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter data by date range
  const filterByDateRange = useCallback(
    (dateStr: string) => {
      if (!dateStr) return false;
      const { from, to } = getDateRange();
      const d = new Date(dateStr);
      const fromStart = new Date(from);
      fromStart.setHours(0, 0, 0, 0);
      const toEnd = new Date(to);
      toEnd.setHours(23, 59, 59, 999);
      return d >= fromStart && d <= toEnd;
    },
    [getDateRange]
  );

  // Filtered data
  const filteredInvoices = invoices.filter((inv) => filterByDateRange(inv.issueDate || inv.createdAt));
  const filteredClearances = clearances.filter((clr) => filterByDateRange(clr.issueDate || clr.createdAt));

  // Computed stats
  const totalInvoiceSales = filteredInvoices.reduce((s, i) => s + Number(i.total), 0);
  const totalClearanceSales = filteredClearances.reduce((s, c) => s + Number(c.total), 0);
  const totalRevenue = totalInvoiceSales + totalClearanceSales;
  const totalCollected =
    filteredInvoices.reduce((s, i) => s + Number(i.amountPaid), 0) +
    filteredClearances.reduce((s, c) => s + Number(c.amountPaid), 0);
  const totalOutstanding =
    filteredInvoices.reduce((s, i) => s + Number(i.balanceDue), 0) +
    filteredClearances.reduce((s, c) => s + Number(c.balanceDue), 0);
  const inventoryValue = products.reduce((s, p) => s + Number(p.sellingPrice) * Number(p.stockQuantity), 0);
  const inventoryItems = products.reduce((s, p) => s + Number(p.stockQuantity), 0);
  const totalTransactions = filteredInvoices.length + filteredClearances.length;

  // Generate PDF
  const handleDownloadPdf = async () => {
    setGenerating(true);
    try {
      const { from, to, label } = getDateRange();
      const reportData: ReportData = {
        company: {
          name: company?.name || 'Onelka Jewellery',
          tagline: company?.tagline,
          address: company?.address,
          city: company?.city,
          phone: company?.phone,
          email: company?.email,
        },
        periodLabel: label,
        dateFrom: formatDate(from.toISOString()),
        dateTo: formatDate(to.toISOString()),
        generatedAt: new Date().toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        invoices: filteredInvoices.map((inv) => ({
          invoiceNumber: inv.invoiceNumber,
          customerName: inv.customerName,
          issueDate: inv.issueDate || inv.createdAt,
          total: inv.total,
          amountPaid: inv.amountPaid,
          balanceDue: inv.balanceDue,
          status: inv.status,
          items: (inv.items || []).map((item) => ({
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            metalType: item.metalType,
            karat: item.karat,
            metalWeight: item.metalWeight,
          })),
        })),
        clearances: filteredClearances.map((clr) => ({
          clearanceNumber: clr.clearanceNumber,
          customerName: clr.customerName,
          issueDate: clr.issueDate || clr.createdAt,
          total: clr.total,
          amountPaid: clr.amountPaid,
          balanceDue: clr.balanceDue,
          status: clr.status,
          clearanceReason: clr.clearanceReason,
          items: (clr.items || []).map((item) => ({
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        })),
        products: products.map((p) => ({
          name: p.name,
          sku: p.sku,
          categoryName: p.categoryName,
          metalType: p.metalType,
          karat: p.karat,
          metalWeight: p.metalWeight,
          sellingPrice: p.sellingPrice,
          stockQuantity: p.stockQuantity,
        })),
        customers: customers.map((c) => ({
          name: c.name,
          phone: c.phone,
          city: c.city,
          customerType: c.customerType,
          totalPurchased: c.totalPurchased,
        })),
      };

      generateReportPdf(reportData);
      toast.success('Report downloaded successfully');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  // Years list for selectors — includes next year + 9 years back
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear + 1 - i);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-4 w-52 bg-slate-200 dark:bg-slate-700 rounded mt-2 animate-pulse" />
          </div>
        </div>
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 sm:p-5">
                <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse mb-3" />
                <div className="h-7 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1" />
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-12 bg-slate-100 dark:bg-slate-800/50 rounded-lg mb-3 animate-pulse" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">Reports</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Generate & download business reports as PDF</p>
        </div>
        <Button
          variant="gold"
          onClick={handleDownloadPdf}
          disabled={generating}
          className="whitespace-nowrap"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {generating ? 'Generating...' : 'Download PDF'}
        </Button>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-2 overflow-x-auto p-1">
        {[
          { key: 'daily' as ReportPeriod, label: 'Daily', icon: Calendar },
          { key: 'custom' as ReportPeriod, label: 'Custom Range', icon: CalendarRange },
          { key: 'monthly' as ReportPeriod, label: 'Monthly', icon: CalendarDays },
          { key: 'yearly' as ReportPeriod, label: 'Yearly', icon: CalendarClock },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={period === tab.key ? 'gold' : 'ghost'}
            onClick={() => setPeriod(tab.key)}
            className="shrink-0"
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Period Selectors */}
      <Card>
        <CardContent className="p-4">
          {period === 'daily' && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 shrink-0">Select Date:</label>
              <div className="w-full sm:w-56">
                <DateCombobox
                  value={dailyDate}
                  onChange={(v) => setDailyDate(v)}
                  placeholder="Pick a date"
                  clearable
                />
              </div>
              <span className="text-sm text-slate-500">{formatDate(dailyDate)}</span>
            </div>
          )}

          {period === 'custom' && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 shrink-0">From:</label>
              <div className="w-full sm:w-48">
                <DateCombobox
                  value={customFrom}
                  onChange={(v) => setCustomFrom(v)}
                  placeholder="Start date"
                  clearable
                />
              </div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 shrink-0">To:</label>
              <div className="w-full sm:w-48">
                <DateCombobox
                  value={customTo}
                  onChange={(v) => setCustomTo(v)}
                  placeholder="End date"
                  clearable
                />
              </div>
              <span className="text-sm text-slate-500">
                {formatDate(customFrom)} — {formatDate(customTo)}
              </span>
            </div>
          )}

          {period === 'monthly' && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 shrink-0">Month:</label>
              <div className="w-full sm:w-44">
                <Combobox
                  options={MONTHS.map((m, i) => ({ value: String(i), label: m }))}
                  value={String(monthMonth)}
                  onChange={(v) => setMonthMonth(Number(v))}
                  placeholder="Select month"
                  showFooter={false}
                />
              </div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 shrink-0">Year:</label>
              <div className="w-full sm:w-36">
                <Combobox
                  options={years.map((yr) => ({ value: String(yr), label: String(yr) }))}
                  value={String(monthYear)}
                  onChange={(v) => setMonthYear(Number(v))}
                  placeholder="Select year"
                  showFooter={false}
                />
              </div>
              <span className="text-sm text-slate-500">{MONTHS[monthMonth]} {monthYear}</span>
            </div>
          )}

          {period === 'yearly' && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 shrink-0">Year:</label>
              <div className="w-full sm:w-36">
                <Combobox
                  options={years.map((yr) => ({ value: String(yr), label: String(yr) }))}
                  value={String(yearValue)}
                  onChange={(v) => setYearValue(Number(v))}
                  placeholder="Select year"
                  showFooter={false}
                />
              </div>
              <span className="text-sm text-slate-500">Jan 1 — Dec 31, {yearValue}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(totalRevenue)}
            </p>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Total Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-blue-500/10">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{totalTransactions}</p>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-amber-500/10">
                <DollarSign className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(totalCollected)}
            </p>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Collected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-red-500/10">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(totalOutstanding)}
            </p>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Outstanding</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <FileText className="w-4 h-4 text-violet-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{filteredInvoices.length}</p>
                <p className="text-xs text-slate-500">Invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-500/10">
                <BarChart3 className="w-4 h-4 text-pink-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{filteredClearances.length}</p>
                <p className="text-xs text-slate-500">Clearances</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <Package className="w-4 h-4 text-cyan-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{inventoryItems}</p>
                <p className="text-xs text-slate-500">Stock Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-500/10">
                <Users className="w-4 h-4 text-teal-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{customers.length}</p>
                <p className="text-xs text-slate-500">Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Invoices List */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-blue-500" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Recent Invoices
              </h3>
              {filteredInvoices.length > 0 && (
                <span className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                  {filteredInvoices.length}
                </span>
              )}
            </div>
            <div className="space-y-2">
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500">No invoices in this period</p>
                </div>
              ) : (
                filteredInvoices.slice(0, 8).map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                          {inv.invoiceNumber}
                        </p>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase ${
                            inv.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : inv.status === 'partial'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{inv.customerName}</p>
                    </div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 shrink-0 ml-3">
                      {formatCurrency(inv.total)}
                    </p>
                  </div>
                ))
              )}
              {filteredInvoices.length > 8 && (
                <p className="text-xs text-center text-slate-500 pt-1">
                  +{filteredInvoices.length - 8} more in PDF
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Clearances List */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-pink-500" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Clearance Sales
              </h3>
              {filteredClearances.length > 0 && (
                <span className="text-xs bg-pink-500/10 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded-full">
                  {filteredClearances.length}
                </span>
              )}
            </div>
            <div className="space-y-2">
              {filteredClearances.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500">No clearances in this period</p>
                </div>
              ) : (
                filteredClearances.slice(0, 8).map((clr) => (
                  <div
                    key={clr.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                          {clr.clearanceNumber}
                        </p>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase ${
                            clr.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : clr.status === 'partial'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {clr.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{clr.customerName}</p>
                    </div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 shrink-0 ml-3">
                      {formatCurrency(clr.total)}
                    </p>
                  </div>
                ))
              )}
              {filteredClearances.length > 8 && (
                <p className="text-xs text-center text-slate-500 pt-1">
                  +{filteredClearances.length - 8} more in PDF
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory & Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Inventory by Category */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Inventory by Category</h3>
            </div>
            <div className="space-y-2">
              {(() => {
                const catMap: Record<string, { count: number; value: number }> = {};
                products.forEach((p) => {
                  const key = p.categoryName || 'Uncategorized';
                  if (!catMap[key]) catMap[key] = { count: 0, value: 0 };
                  catMap[key].count += p.stockQuantity || 0;
                  catMap[key].value += (p.sellingPrice || 0) * (p.stockQuantity || 0);
                });
                const entries = Object.entries(catMap).sort((a, b) => b[1].value - a[1].value);
                if (entries.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <Package className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                      <p className="text-sm text-slate-500">No inventory data</p>
                    </div>
                  );
                }
                return entries.map(([name, d]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div>
                      <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{name}</p>
                      <p className="text-xs text-slate-500">{d.count} items</p>
                    </div>
                    <p className="font-semibold text-sm text-amber-600 dark:text-amber-400">
                      {formatCurrency(d.value)}
                    </p>
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-violet-500" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Top Customers</h3>
            </div>
            <div className="space-y-2">
              {customers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500">No customer data</p>
                </div>
              ) : (
                [...customers]
                  .sort((a, b) => (b.totalPurchased || 0) - (a.totalPurchased || 0))
                  .slice(0, 8)
                  .map((cust, idx) => (
                    <div
                      key={cust.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                    >
                      <span className="w-6 h-6 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                          {cust.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {cust.city || cust.phone || '—'}
                        </p>
                      </div>
                      <p className="font-semibold text-sm text-violet-600 dark:text-violet-400 shrink-0">
                        {formatCurrency(cust.totalPurchased || 0)}
                      </p>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Balances */}
      {totalOutstanding > 0 && (
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-red-500" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Outstanding Balances</h3>
              <span className="text-xs bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-semibold">
                {formatCurrency(totalOutstanding)}
              </span>
            </div>
            <div className="space-y-2">
              {[
                ...filteredInvoices
                  .filter((i) => i.balanceDue > 0)
                  .map((i) => ({ type: 'Invoice', ref: i.invoiceNumber, customer: i.customerName, due: i.balanceDue })),
                ...filteredClearances
                  .filter((c) => c.balanceDue > 0)
                  .map((c) => ({ type: 'Clearance', ref: c.clearanceNumber, customer: c.customerName, due: c.balanceDue })),
              ]
                .sort((a, b) => b.due - a.due)
                .slice(0, 10)
                .map((item) => (
                  <div
                    key={item.ref}
                    className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/15"
                  >
                    <div>
                      <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                        {item.ref}
                        <span className="text-xs text-slate-500 ml-2">{item.type}</span>
                      </p>
                      <p className="text-xs text-slate-500">{item.customer}</p>
                    </div>
                    <p className="font-bold text-sm text-red-600 dark:text-red-400">{formatCurrency(item.due)}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* PDF Download CTA */}
      <Card className="border-dashed border-2 border-slate-300 dark:border-slate-600">
        <CardContent className="p-6 text-center">
          <Download className="w-10 h-10 mx-auto text-slate-400 mb-3" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Download Full Report as PDF
          </h3>
          <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
            The PDF includes all invoices, clearances, inventory breakdown, customer summary, payment analysis, and outstanding balances — professional black & white format.
          </p>
          <Button
            variant="gold"
            onClick={handleDownloadPdf}
            disabled={generating}
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {generating ? 'Generating PDF...' : 'Generate & Download PDF'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
