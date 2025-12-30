import { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  FileText,
  Truck,
  Users,
  Calendar,
  Download,
  Filter,
  Gem,
  PieChart,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { mockInvoices, mockProducts, mockGRNs, mockCustomers, mockCategories } from '../data/mockData';
import { formatCurrency, formatWeight, formatDate } from '../utils/formatters';

type ReportPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';
type ReportType = 'sales' | 'inventory' | 'purchases' | 'customers';

export function Reports() {
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [reportType, setReportType] = useState<ReportType>('sales');

  // Filter data by period
  const filterByPeriod = (date: string) => {
    const itemDate = new Date(date);
    const now = new Date();

    switch (period) {
      case 'today':
        return itemDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        return itemDate >= weekAgo;
      case 'month':
        return (
          itemDate.getMonth() === new Date().getMonth() &&
          itemDate.getFullYear() === new Date().getFullYear()
        );
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        return itemDate >= quarterStart;
      case 'year':
        return itemDate.getFullYear() === new Date().getFullYear();
      default:
        return true;
    }
  };

  // Sales Report Data
  const salesData = useMemo(() => {
    const filteredInvoices = mockInvoices.filter((inv) => filterByPeriod(inv.createdAt));
    const totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidAmount = filteredInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const pendingAmount = filteredInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
    const invoiceCount = filteredInvoices.length;
    const avgInvoiceValue = invoiceCount > 0 ? totalSales / invoiceCount : 0;

    // Sales by status
    const byStatus = {
      paid: filteredInvoices.filter((i) => i.status === 'paid').length,
      pending: filteredInvoices.filter((i) => i.status === 'pending').length,
      partial: filteredInvoices.filter((i) => i.status === 'partial').length,
    };

    // Top selling products
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    filteredInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        if (!productSales[item.productName]) {
          productSales[item.productName] = { name: item.productName, quantity: 0, revenue: 0 };
        }
        productSales[item.productName].quantity += item.quantity;
        productSales[item.productName].revenue += item.total;
      });
    });
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalSales,
      paidAmount,
      pendingAmount,
      invoiceCount,
      avgInvoiceValue,
      byStatus,
      topProducts,
      recentInvoices: filteredInvoices.slice(0, 5),
    };
  }, [period]);

  // Inventory Report Data
  const inventoryData = useMemo(() => {
    const totalProducts = mockProducts.length;
    const totalValue = mockProducts.reduce((sum, p) => sum + p.sellingPrice * p.stockQuantity, 0);
    const totalCost = mockProducts.reduce((sum, p) => sum + p.costPrice * p.stockQuantity, 0);
    const totalWeight = mockProducts.reduce((sum, p) => sum + p.metalWeight * p.stockQuantity, 0);
    const lowStockProducts = mockProducts.filter(
      (p) => p.stockQuantity <= (p.reorderLevel || 2)
    );

    // By category
    const byCategory: Record<string, { count: number; value: number }> = {};
    mockProducts.forEach((p) => {
      const categoryKey = p.categoryName || p.categoryId;
      if (!byCategory[categoryKey]) {
        byCategory[categoryKey] = { count: 0, value: 0 };
      }
      byCategory[categoryKey].count += p.stockQuantity;
      byCategory[categoryKey].value += p.sellingPrice * p.stockQuantity;
    });

    // By metal type
    const byMetal: Record<string, { count: number; weight: number; value: number }> = {};
    mockProducts.forEach((p) => {
      if (!byMetal[p.metalType]) {
        byMetal[p.metalType] = { count: 0, weight: 0, value: 0 };
      }
      byMetal[p.metalType].count += p.stockQuantity;
      byMetal[p.metalType].weight += p.metalWeight * p.stockQuantity;
      byMetal[p.metalType].value += p.sellingPrice * p.stockQuantity;
    });

    return {
      totalProducts,
      totalValue,
      totalCost,
      totalWeight,
      lowStockProducts,
      byCategory: Object.entries(byCategory).map(([name, data]) => ({ name, ...data })),
      byMetal: Object.entries(byMetal).map(([name, data]) => ({ name, ...data })),
    };
  }, []);

  // Purchase Report Data
  const purchaseData = useMemo(() => {
    const filteredGRNs = mockGRNs.filter((grn) => filterByPeriod(grn.createdAt));
    const totalPurchases = filteredGRNs.reduce((sum, grn) => sum + grn.total, 0);
    const grnCount = filteredGRNs.length;
    const avgGRNValue = grnCount > 0 ? totalPurchases / grnCount : 0;

    // By supplier
    const bySupplier: Record<string, { name: string; count: number; value: number }> = {};
    filteredGRNs.forEach((grn) => {
      if (!bySupplier[grn.supplierId]) {
        bySupplier[grn.supplierId] = { name: grn.supplierName, count: 0, value: 0 };
      }
      bySupplier[grn.supplierId].count += 1;
      bySupplier[grn.supplierId].value += grn.total;
    });

    return {
      totalPurchases,
      grnCount,
      avgGRNValue,
      bySupplier: Object.values(bySupplier).sort((a, b) => b.value - a.value),
      recentGRNs: filteredGRNs.slice(0, 5),
    };
  }, [period]);

  // Customer Report Data
  const customerData = useMemo(() => {
    const totalCustomers = mockCustomers.length;
    const vipCustomers = mockCustomers.filter((c) => c.customerType === 'vip').length;
    const wholesaleCustomers = mockCustomers.filter((c) => c.customerType === 'wholesale').length;

    // Customer purchase data
    const customerPurchases = mockCustomers.map((customer) => {
      const customerInvoices = mockInvoices.filter((inv) => inv.customerId === customer.id);
      const totalSpent = customerInvoices.reduce((sum, inv) => sum + inv.total, 0);
      return {
        ...customer,
        invoiceCount: customerInvoices.length,
        totalSpent,
      };
    });

    const topCustomers = customerPurchases
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    return {
      totalCustomers,
      vipCustomers,
      wholesaleCustomers,
      topCustomers,
    };
  }, []);

  const renderSalesReport = () => (
    <div className="space-y-6">
      {/* Sales Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100 mt-3">
              {formatCurrency(salesData.totalSales)}
            </p>
            <p className="text-sm text-slate-400">Total Sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-100 mt-3">{salesData.invoiceCount}</p>
            <p className="text-sm text-slate-400">Invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <BarChart3 className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-100 mt-3">
              {formatCurrency(salesData.avgInvoiceValue)}
            </p>
            <p className="text-sm text-slate-400">Avg Invoice</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-red-500/10">
                <TrendingDown className="w-5 h-5 text-red-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-100 mt-3">
              {formatCurrency(salesData.pendingAmount)}
            </p>
            <p className="text-sm text-slate-400">Pending</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gem className="w-5 h-5 text-amber-400" />
              Top Selling Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {salesData.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center gap-4">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-medium text-amber-400">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-slate-200">{product.name}</p>
                    <p className="text-sm text-slate-400">{product.quantity} units</p>
                  </div>
                  <p className="font-semibold text-amber-400">{formatCurrency(product.revenue)}</p>
                </div>
              ))}
              {salesData.topProducts.length === 0 && (
                <p className="text-center text-slate-400 py-4">No sales data</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invoice Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-400" />
              Invoice Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10">
                <span className="text-slate-300">Paid</span>
                <Badge variant="success">{salesData.byStatus.paid}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10">
                <span className="text-slate-300">Pending</span>
                <Badge variant="warning">{salesData.byStatus.pending}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
                <span className="text-slate-300">Partial</span>
                <Badge variant="info">{salesData.byStatus.partial}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderInventoryReport = () => (
    <div className="space-y-6">
      {/* Inventory Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="p-2 rounded-lg bg-amber-500/10 w-fit">
              <Package className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100 mt-3">{inventoryData.totalProducts}</p>
            <p className="text-sm text-slate-400">Total Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="p-2 rounded-lg bg-emerald-500/10 w-fit">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100 mt-3">
              {formatCurrency(inventoryData.totalValue)}
            </p>
            <p className="text-sm text-slate-400">Stock Value</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="p-2 rounded-lg bg-blue-500/10 w-fit">
              <Gem className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100 mt-3">
              {formatWeight(inventoryData.totalWeight)}
            </p>
            <p className="text-sm text-slate-400">Total Weight</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="p-2 rounded-lg bg-red-500/10 w-fit">
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100 mt-3">
              {inventoryData.lowStockProducts.length}
            </p>
            <p className="text-sm text-slate-400">Low Stock</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Category */}
        <Card>
          <CardHeader>
            <CardTitle>Stock by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inventoryData.byCategory.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div>
                    <p className="font-medium text-slate-200">{cat.name}</p>
                    <p className="text-sm text-slate-400">{cat.count} items</p>
                  </div>
                  <p className="font-semibold text-amber-400">{formatCurrency(cat.value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* By Metal */}
        <Card>
          <CardHeader>
            <CardTitle>Stock by Metal Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inventoryData.byMetal.map((metal) => (
                <div key={metal.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div>
                    <p className="font-medium text-slate-200 capitalize">{metal.name}</p>
                    <p className="text-sm text-slate-400">{formatWeight(metal.weight)}</p>
                  </div>
                  <p className="font-semibold text-amber-400">{formatCurrency(metal.value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {inventoryData.lowStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-400">⚠️ Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {inventoryData.lowStockProducts.map((product) => (
                <div key={product.id} className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="font-medium text-slate-200">{product.name}</p>
                  <p className="text-sm text-slate-400">{product.sku}</p>
                  <Badge variant="error" className="mt-2">
                    Stock: {product.stockQuantity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderPurchaseReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="p-2 rounded-lg bg-blue-500/10 w-fit">
              <Truck className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100 mt-3">
              {formatCurrency(purchaseData.totalPurchases)}
            </p>
            <p className="text-sm text-slate-400">Total Purchases</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="p-2 rounded-lg bg-amber-500/10 w-fit">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100 mt-3">{purchaseData.grnCount}</p>
            <p className="text-sm text-slate-400">GRNs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="p-2 rounded-lg bg-emerald-500/10 w-fit">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100 mt-3">
              {formatCurrency(purchaseData.avgGRNValue)}
            </p>
            <p className="text-sm text-slate-400">Avg GRN Value</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchases by Supplier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {purchaseData.bySupplier.map((supplier) => (
              <div key={supplier.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                <div>
                  <p className="font-medium text-slate-200">{supplier.name}</p>
                  <p className="text-sm text-slate-400">{supplier.count} orders</p>
                </div>
                <p className="font-semibold text-amber-400">{formatCurrency(supplier.value)}</p>
              </div>
            ))}
            {purchaseData.bySupplier.length === 0 && (
              <p className="text-center text-slate-400 py-4">No purchase data</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCustomerReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="p-2 rounded-lg bg-blue-500/10 w-fit">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100 mt-3">
              {customerData.totalCustomers}
            </p>
            <p className="text-sm text-slate-400">Total Customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="p-2 rounded-lg bg-amber-500/10 w-fit">
              <Gem className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100 mt-3">{customerData.vipCustomers}</p>
            <p className="text-sm text-slate-400">VIP Customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="p-2 rounded-lg bg-purple-500/10 w-fit">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100 mt-3">
              {customerData.wholesaleCustomers}
            </p>
            <p className="text-sm text-slate-400">Wholesale</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {customerData.topCustomers.map((customer, index) => (
              <div key={customer.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50">
                <span className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-sm font-medium text-amber-400">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-slate-200">
                    {customer.name}
                  </p>
                  <p className="text-sm text-slate-400">{customer.invoiceCount} orders</p>
                </div>
                <Badge
                  variant={
                    customer.customerType === 'vip'
                      ? 'gold'
                      : customer.customerType === 'wholesale'
                      ? 'info'
                      : 'default'
                  }
                >
                  {customer.customerType}
                </Badge>
                <p className="font-semibold text-amber-400">
                  {formatCurrency(customer.totalSpent)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-100">Reports</h1>
          <p className="mt-1 text-slate-400">Business analytics and insights</p>
        </div>
        <div className="flex gap-3">
          <Select value={period} onChange={(e) => setPeriod(e.target.value as ReportPeriod)}>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </Select>
          <Button variant="outline" className="whitespace-nowrap">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'sales', label: 'Sales', icon: DollarSign },
          { key: 'inventory', label: 'Inventory', icon: Package },
          { key: 'purchases', label: 'Purchases', icon: Truck },
          { key: 'customers', label: 'Customers', icon: Users },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={reportType === tab.key ? 'gold' : 'ghost'}
            onClick={() => setReportType(tab.key as ReportType)}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Report Content */}
      {reportType === 'sales' && renderSalesReport()}
      {reportType === 'inventory' && renderInventoryReport()}
      {reportType === 'purchases' && renderPurchaseReport()}
      {reportType === 'customers' && renderCustomerReport()}
    </div>
  );
}
