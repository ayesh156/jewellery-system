import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Package,
  FileText,
  Users,
  Truck,
  DollarSign,
  AlertTriangle,
  Plus,
  ArrowRight,
  Gem,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { mockProducts, mockInvoices, mockCustomers, mockGRNs } from '../data/mockData';
import { formatCurrency } from '../utils/formatters';

export function Dashboard() {
  // Calculate statistics
  const totalProducts = mockProducts.length;
  const lowStockProducts = mockProducts.filter((p) => p.stockQuantity <= (p.reorderLevel || 2)).length;
  const totalInventoryValue = mockProducts.reduce((sum, p) => sum + p.sellingPrice * p.stockQuantity, 0);
  
  const paidInvoices = mockInvoices.filter((i) => i.status === 'paid');
  const pendingInvoices = mockInvoices.filter((i) => i.status === 'pending' || i.status === 'partial');
  const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.total, 0);
  const pendingAmount = pendingInvoices.reduce((sum, i) => sum + i.balanceDue, 0);

  const totalCustomers = mockCustomers.length;
  const vipCustomers = mockCustomers.filter((c) => c.customerType === 'vip').length;

  const recentInvoices = [...mockInvoices].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);

  const recentGRNs = [...mockGRNs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 3);

  // Stats cards data
  const stats = [
    {
      title: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: DollarSign,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Pending Payments',
      value: formatCurrency(pendingAmount),
      change: `${pendingInvoices.length} invoices`,
      changeType: 'neutral' as const,
      icon: Clock,
      color: 'from-amber-500 to-yellow-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Total Products',
      value: totalProducts.toString(),
      change: lowStockProducts > 0 ? `${lowStockProducts} low stock` : 'All stocked',
      changeType: lowStockProducts > 0 ? ('warning' as const) : ('positive' as const),
      icon: Package,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Customers',
      value: totalCustomers.toString(),
      change: `${vipCustomers} VIP`,
      changeType: 'neutral' as const,
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-100">Dashboard</h1>
          <p className="mt-1 text-slate-400">Welcome back! Here's your business overview.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/invoices/create">
            <Button variant="gold">
              <Plus className="w-4 h-4" />
              New Invoice
            </Button>
          </Link>
          <Link to="/grn/create">
            <Button variant="outline">
              <Plus className="w-4 h-4" />
              New GRN
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} hover className="relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2`} />
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} style={{ color: stat.color.includes('emerald') ? '#10b981' : stat.color.includes('amber') ? '#f59e0b' : stat.color.includes('blue') ? '#3b82f6' : '#a855f7' }} />
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
                  <span className="text-slate-400 text-sm">{stat.change}</span>
                )}
              </div>
              <p className="text-sm text-slate-400 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
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
            <div className="divide-y divide-slate-700/50">
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-slate-400">{invoice.customerName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-200">{formatCurrency(invoice.total)}</p>
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
          </CardContent>
        </Card>

        {/* Quick Actions & Recent GRN */}
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
                <div className="p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-amber-500/30 transition-all cursor-pointer text-center">
                  <FileText className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-300">New Invoice</p>
                </div>
              </Link>
              <Link to="/grn/create">
                <div className="p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-amber-500/30 transition-all cursor-pointer text-center">
                  <Truck className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-300">New GRN</p>
                </div>
              </Link>
              <Link to="/products">
                <div className="p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-amber-500/30 transition-all cursor-pointer text-center">
                  <Package className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-300">Products</p>
                </div>
              </Link>
              <Link to="/reports">
                <div className="p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-amber-500/30 transition-all cursor-pointer text-center">
                  <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-300">Reports</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Recent GRN */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-500" />
                Recent GRN
              </CardTitle>
              <Link to="/grn">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentGRNs.map((grn) => (
                <div key={grn.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                  <div>
                    <p className="font-medium text-slate-200 text-sm">{grn.grnNumber}</p>
                    <p className="text-xs text-slate-400">{grn.supplierName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-200">{formatCurrency(grn.total)}</p>
                    <Badge variant={grn.status === 'received' ? 'success' : 'warning'} className="text-xs">
                      {grn.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Inventory Value Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Inventory Value</p>
              <p className="text-3xl font-bold text-slate-100">{formatCurrency(totalInventoryValue)}</p>
              <p className="text-sm text-slate-400 mt-2">
                Across {totalProducts} products
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
