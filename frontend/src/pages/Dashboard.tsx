import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Package,
  FileText,
  Users,
  DollarSign,
  AlertTriangle,
  Plus,
  ArrowRight,
  Gem,
  Clock,
  Tag,
  BarChart3,
  ShoppingBag,
  CreditCard,
  Percent,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { invoicesApi, clearanceApi, productsApi, customersApi, categoriesApi } from '../services/api';
import { formatCurrency, formatWeight } from '../utils/formatters';
import type { Invoice, Clearance, JewelleryItem, Customer } from '../types';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clearances, setClearances] = useState<Clearance[]>([]);
  const [products, setProducts] = useState<JewelleryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, clrRes, prodRes, custRes, catRes] = await Promise.all([
        invoicesApi.getAll({ limit: 9999 }),
        clearanceApi.getAll({ limit: 9999 }),
        productsApi.getAll({ limit: 9999 }),
        customersApi.getAll({ limit: 9999 }),
        categoriesApi.getAll(),
      ]);
      setInvoices(invRes.data ?? []);
      setClearances(clrRes.data ?? []);
      setProducts(prodRes.data ?? []);
      setCustomers(custRes.data ?? []);
      setCategories(catRes.data ?? []);
    } catch {
      // silently fail — dashboard shows zeros
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ========== Computed Stats ==========
  const stats = useMemo(() => {
    const allSales = [...invoices, ...clearances];

    // Revenue
    const paidInvoices = invoices.filter((i) => i.status === 'paid');
    const paidClearances = clearances.filter((c) => c.status === 'paid');
    const invoiceRevenue = paidInvoices.reduce((s, i) => s + Number(i.total), 0);
    const clearanceRevenue = paidClearances.reduce((s, c) => s + Number(c.total), 0);
    const totalRevenue = invoiceRevenue + clearanceRevenue;

    // Pending
    const pendingSales = allSales.filter((s) => s.status === 'pending' || s.status === 'partial');
    const pendingAmount = pendingSales.reduce((s, i) => s + Number(i.balanceDue), 0);

    // Products
    const totalProducts = products.length;
    const lowStockProducts = products.filter((p) => Number(p.stockQuantity) <= (p.reorderLevel || 2)).length;
    const totalInventoryValue = products.reduce((s, p) => s + Number(p.sellingPrice) * Number(p.stockQuantity), 0);
    const totalMetalWeight = products.reduce((s, p) => s + Number(p.metalWeight) * Number(p.stockQuantity), 0);

    // Customers
    const totalCustomers = customers.length;
    const vipCustomers = customers.filter((c) => c.customerType === 'vip').length;
    const creditCustomers = customers.filter((c) => c.customerType === 'credit').length;

    // Collection rate
    const totalBilled = allSales.reduce((s, i) => s + Number(i.total), 0);
    const totalCollected = allSales.reduce((s, i) => s + Number(i.amountPaid), 0);
    const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

    // Today's sales
    const today = new Date().toISOString().split('T')[0];
    const todayInvoices = invoices.filter((i) => i.issueDate?.startsWith(today));
    const todayClearances = clearances.filter((c) => c.issueDate?.startsWith(today));
    const todayRevenue = [...todayInvoices, ...todayClearances].reduce((s, i) => s + Number(i.total), 0);
    const todayCount = todayInvoices.length + todayClearances.length;

    // This month's sales
    const monthStr = today.slice(0, 7); // YYYY-MM
    const monthInvoices = invoices.filter((i) => i.issueDate?.startsWith(monthStr));
    const monthClearances = clearances.filter((c) => c.issueDate?.startsWith(monthStr));
    const monthRevenue = [...monthInvoices, ...monthClearances].reduce((s, i) => s + Number(i.total), 0);

    // Top categories by stock value
    const categoryMap = new Map<string, { name: string; value: number; count: number }>();
    for (const p of products) {
      const catName = p.categoryName || categories.find((c) => c.id === p.categoryId)?.name || 'Uncategorized';
      const existing = categoryMap.get(catName) || { name: catName, value: 0, count: 0 };
      existing.value += Number(p.sellingPrice) * Number(p.stockQuantity);
      existing.count += Number(p.stockQuantity);
      categoryMap.set(catName, existing);
    }
    const topCategories = [...categoryMap.values()].sort((a, b) => b.value - a.value).slice(0, 5);

    // Top customers by total purchases
    const customerPurchases = new Map<string, { name: string; total: number; count: number }>();
    for (const sale of allSales) {
      if (sale.status === 'cancelled') continue;
      const existing = customerPurchases.get(sale.customerId) || { name: sale.customerName, total: 0, count: 0 };
      existing.total += Number(sale.total);
      existing.count += 1;
      customerPurchases.set(sale.customerId, existing);
    }
    const topCustomers = [...customerPurchases.values()].sort((a, b) => b.total - a.total).slice(0, 5);

    // Recent Invoices & Clearances
    const recentInvoices = [...invoices]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    const recentClearances = [...clearances]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);

    // Outstanding balances (overdue/pending)
    const outstandingInvoices = invoices
      .filter((i) => i.balanceDue > 0 && i.status !== 'cancelled')
      .sort((a, b) => b.balanceDue - a.balanceDue)
      .slice(0, 5);

    return {
      totalRevenue, invoiceRevenue, clearanceRevenue,
      pendingAmount, pendingSales: pendingSales.length,
      totalProducts, lowStockProducts, totalInventoryValue, totalMetalWeight,
      totalCustomers, vipCustomers, creditCustomers,
      collectionRate,
      todayRevenue, todayCount, monthRevenue,
      topCategories, topCustomers,
      recentInvoices, recentClearances, outstandingInvoices,
    };
  }, [invoices, clearances, products, customers, categories]);

  // Stats cards
  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      change: `${invoices.filter((i) => i.status === 'paid').length + clearances.filter((c) => c.status === 'paid').length} paid sales`,
      changeType: 'positive' as const,
      icon: DollarSign,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500/10',
      iconColor: '#10b981',
    },
    {
      title: 'Pending Payments',
      value: formatCurrency(stats.pendingAmount),
      change: `${stats.pendingSales} pending`,
      changeType: 'neutral' as const,
      icon: Clock,
      color: 'from-amber-500 to-yellow-500',
      bgColor: 'bg-amber-500/10',
      iconColor: '#f59e0b',
    },
    {
      title: 'Total Products',
      value: stats.totalProducts.toString(),
      change: stats.lowStockProducts > 0 ? `${stats.lowStockProducts} low stock` : 'All stocked',
      changeType: stats.lowStockProducts > 0 ? ('warning' as const) : ('positive' as const),
      icon: Package,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      iconColor: '#3b82f6',
    },
    {
      title: 'Customers',
      value: stats.totalCustomers.toString(),
      change: `${stats.vipCustomers} VIP`,
      changeType: 'neutral' as const,
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      iconColor: '#a855f7',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="h-8 w-40 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded mt-2 animate-pulse" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-10 w-36 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
                <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
                <div className="h-7 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-3" />
                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-6" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-1.5 text-right">
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse ml-auto" />
                    <div className="h-5 w-14 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse ml-auto" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="space-y-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-800/30 mb-3">
                      <div className="space-y-1.5">
                        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                        <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      </div>
                      <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Welcome back! Here's your business overview.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/invoices/create">
            <Button variant="gold">
              <Plus className="w-4 h-4" />
              New Invoice
            </Button>
          </Link>
          <Link to="/clearance/create">
            <Button variant="outline">
              <Plus className="w-4 h-4" />
              New Clearance
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} hover className="relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2`} />
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className="w-5 h-5" style={{ color: stat.iconColor }} />
                </div>
                {stat.changeType === 'positive' && (
                  <span className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
                    <TrendingUp className="w-4 h-4" />
                    {stat.change}
                  </span>
                )}
                {stat.changeType === 'warning' && (
                  <span className="flex items-center gap-1 text-amber-400 text-sm font-medium">
                    <AlertTriangle className="w-4 h-4" />
                    {stat.change}
                  </span>
                )}
                {stat.changeType === 'neutral' && (
                  <span className="text-slate-600 dark:text-slate-400 text-sm">{stat.change}</span>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card hover className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400 to-yellow-500 opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <BarChart3 className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Today's Sales</p>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(stats.todayRevenue)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stats.todayCount} transaction{stats.todayCount !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>
        <Card hover className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400 to-cyan-500 opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">This Month</p>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(stats.monthRevenue)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Invoices: {formatCurrency(stats.invoiceRevenue)} &middot; Clearance: {formatCurrency(stats.clearanceRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card hover className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Percent className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Collection Rate</p>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{stats.collectionRate.toFixed(1)}%</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {stats.creditCustomers} credit customer{stats.creditCustomers !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              Recent Invoices
            </CardTitle>
            <Link to="/invoices">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {stats.recentInvoices.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No invoices yet</div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700/50">
                {stats.recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{invoice.customerName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(invoice.total)}</p>
                      <Badge
                        variant={
                          invoice.status === 'paid' ? 'success' :
                          invoice.status === 'pending' ? 'warning' :
                          invoice.status === 'partial' ? 'info' : 'error'
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Recent Clearances */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gem className="w-5 h-5 text-amber-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Link to="/invoices/create">
                <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50 hover:border-amber-500/30 transition-all cursor-pointer text-center">
                  <FileText className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-700 dark:text-slate-300">New Invoice</p>
                </div>
              </Link>
              <Link to="/clearance/create">
                <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50 hover:border-amber-500/30 transition-all cursor-pointer text-center">
                  <Tag className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-700 dark:text-slate-300">New Clearance</p>
                </div>
              </Link>
              <Link to="/products">
                <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50 hover:border-amber-500/30 transition-all cursor-pointer text-center">
                  <Package className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-700 dark:text-slate-300">Products</p>
                </div>
              </Link>
              <Link to="/reports">
                <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50 hover:border-amber-500/30 transition-all cursor-pointer text-center">
                  <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-700 dark:text-slate-300">Reports</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Clearances */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-orange-500" />
                Recent Clearances
              </CardTitle>
              <Link to="/clearance">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.recentClearances.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No clearances yet</p>
              ) : (
                stats.recentClearances.map((clr) => (
                  <div key={clr.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-800/30">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{clr.clearanceNumber}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{clr.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(clr.total)}</p>
                      <Badge variant={clr.status === 'paid' ? 'success' : clr.status === 'partial' ? 'info' : 'warning'} className="text-xs">
                        {clr.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Row 2: Category Breakdown + Top Customers + Outstanding */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-500" />
              Inventory by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.topCategories.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No products yet</p>
            ) : (
              stats.topCategories.map((cat, i) => {
                const maxVal = stats.topCategories[0]?.value || 1;
                const pct = (cat.value / maxVal) * 100;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{cat.name}</span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 ml-2 whitespace-nowrap">{formatCurrency(cat.value)}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{cat.count} item{cat.count !== 1 ? 's' : ''} in stock</p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              Top Customers
            </CardTitle>
            <Link to="/customers">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.topCustomers.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No sales yet</p>
            ) : (
              stats.topCustomers.map((cust, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-800/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-sm font-bold text-purple-500">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{cust.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{cust.count} order{cust.count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(cust.total)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Outstanding Balances */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-red-500" />
              Outstanding Balances
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.outstandingInvoices.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">All clear!</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No outstanding balances</p>
              </div>
            ) : (
              stats.outstandingInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-800/30">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{inv.invoiceNumber}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{inv.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">{formatCurrency(inv.balanceDue)}</p>
                    <Badge variant={inv.status === 'partial' ? 'info' : 'warning'} className="text-xs">
                      {inv.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inventory Value Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Inventory Value</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(stats.totalInventoryValue)}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                {stats.totalProducts} products &middot; {formatWeight(stats.totalMetalWeight)} total metal weight
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10">
              <Gem className="w-12 h-12 text-amber-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
