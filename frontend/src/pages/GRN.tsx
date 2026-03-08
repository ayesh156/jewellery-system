import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Printer,
  AlertTriangle,
  Calendar,
  Package,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Combobox } from '../components/ui/Combobox';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, MobileCard, MobileCardHeader, MobileCardContent, MobileCardRow, MobileCardActions, MobileCardsContainer } from '../components/ui/Table';
import { mockGRNs, mockSuppliers } from '../data/mockData';
import { formatCurrency, formatDate, formatWeight } from '../utils/formatters';
import type { GRN, GRNStatus } from '../types';

const grnStatuses: GRNStatus[] = ['draft', 'pending', 'received', 'partial', 'cancelled', 'returned'];

export function GRNPage() {
  const [grns, setGRNs] = useState<GRN[]>(mockGRNs);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState<GRN | null>(null);

  // Filter GRNs
  const filteredGRNs = useMemo(() => {
    return grns.filter((grn) => {
      const matchesSearch =
        grn.grnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        grn.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = !statusFilter || grn.status === statusFilter;
      const matchesSupplier = !supplierFilter || grn.supplierId === supplierFilter;

      return matchesSearch && matchesStatus && matchesSupplier;
    });
  }, [grns, searchQuery, statusFilter, supplierFilter]);

  // Stats
  const totalGRNs = grns.length;
  const receivedGRNs = grns.filter((g) => g.status === 'received').length;
  const pendingGRNs = grns.filter((g) => g.status === 'pending').length;
  const totalValue = grns.reduce((sum, g) => sum + g.total, 0);

  const getStatusBadge = (status: GRNStatus) => {
    switch (status) {
      case 'received':
        return <Badge variant="success">Received</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'partial':
        return <Badge variant="info">Partial</Badge>;
      case 'cancelled':
        return <Badge variant="error">Cancelled</Badge>;
      case 'returned':
        return <Badge variant="error">Returned</Badge>;
      case 'draft':
        return <Badge>Draft</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleUpdateStatus = (grnId: string, newStatus: GRNStatus) => {
    setGRNs((prev) =>
      prev.map((grn) =>
        grn.id === grnId
          ? {
              ...grn,
              status: newStatus,
              receivedDate: newStatus === 'received' ? new Date().toISOString().split('T')[0] : grn.receivedDate,
              updatedAt: new Date().toISOString(),
            }
          : grn
      )
    );
  };

  const handleDelete = () => {
    if (selectedGRN) {
      setGRNs((prev) => prev.filter((g) => g.id !== selectedGRN.id));
      setShowDeleteModal(false);
      setSelectedGRN(null);
    }
  };

  const openViewModal = (grn: GRN) => {
    setSelectedGRN(grn);
    setShowViewModal(true);
  };

  const openDeleteModal = (grn: GRN) => {
    setSelectedGRN(grn);
    setShowDeleteModal(true);
  };

  const handlePrint = (grn: GRN) => {
    // Open print preview in new window and trigger print dialog
    const printWindow = window.open(`/grn/${grn.id}/print`, '_blank');
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
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">Goods Received Notes</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Track supplier deliveries and inventory</p>
        </div>
        <Link to="/grn/create">
          <Button variant="gold">
            <Plus className="w-4 h-4" />
            Create GRN
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Truck className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total GRNs</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalGRNs}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Received</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{receivedGRNs}</p>
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
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{pendingGRNs}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10">
              <Package className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Value</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(totalValue)}</p>
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
                  placeholder="Search by GRN number or supplier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Combobox
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: '', label: 'All Status', icon: <Package className="w-4 h-4" /> },
                ...grnStatuses.map((status) => ({
                  value: status,
                  label: status.charAt(0).toUpperCase() + status.slice(1),
                  icon: status === 'received' ? <CheckCircle className="w-4 h-4" /> : status === 'pending' ? <Clock className="w-4 h-4" /> : status === 'cancelled' ? <XCircle className="w-4 h-4" /> : status === 'returned' ? <AlertTriangle className="w-4 h-4" /> : <Package className="w-4 h-4" />
                }))
              ]}
              placeholder="Filter by status..."
              className="lg:w-56"
            />
            <Combobox
              value={supplierFilter}
              onChange={setSupplierFilter}
              options={[
                { value: '', label: 'All Suppliers', icon: <Truck className="w-4 h-4" /> },
                ...mockSuppliers.map((supplier) => ({
                  value: supplier.id,
                  label: supplier.companyName,
                  icon: <Truck className="w-4 h-4" />
                }))
              ]}
              placeholder="Filter by supplier..."
              className="lg:w-64"
            />
          </div>
        </CardContent>
      </Card>

      {/* GRN Table */}
      <Card>
        <CardContent className="p-0 md:p-0">
          {/* Desktop Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>GRN</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGRNs.map((grn) => (
                <TableRow key={grn.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center">
                        <Truck className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{grn.grnNumber}</p>
                        {grn.purchaseOrderNumber && (
                          <p className="text-xs text-slate-600 dark:text-slate-400">PO: {grn.purchaseOrderNumber}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-700 dark:text-slate-300">{grn.supplierName}</TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">{formatDate(grn.createdAt)}</TableCell>
                  <TableCell className="text-center text-slate-700 dark:text-slate-300">{grn.items.length}</TableCell>
                  <TableCell className="text-right font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(grn.total)}
                  </TableCell>
                  <TableCell className="text-center">{getStatusBadge(grn.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openViewModal(grn)}
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePrint(grn)}
                        title="Print"
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                      {grn.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUpdateStatus(grn.id, 'received')}
                          title="Mark as Received"
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteModal(grn)}
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

          {/* Mobile Cards */}
          <MobileCardsContainer className="p-4">
            {filteredGRNs.map((grn) => (
              <MobileCard key={grn.id}>
                <MobileCardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center">
                      <Truck className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{grn.grnNumber}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{grn.supplierName}</p>
                    </div>
                  </div>
                  {getStatusBadge(grn.status)}
                </MobileCardHeader>
                <MobileCardContent>
                  {grn.purchaseOrderNumber && (
                    <MobileCardRow label="PO Number" value={grn.purchaseOrderNumber} />
                  )}
                  <MobileCardRow label="Date" value={formatDate(grn.createdAt)} />
                  <MobileCardRow label="Items" value={`${grn.items.length} items`} />
                  <MobileCardRow 
                    label="Total" 
                    value={<span className="text-amber-500 font-bold">{formatCurrency(grn.total)}</span>} 
                  />
                </MobileCardContent>
                <MobileCardActions>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openViewModal(grn)}>
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handlePrint(grn)}>
                    <Printer className="w-4 h-4" />
                  </Button>
                  {grn.status === 'pending' && (
                    <Button variant="ghost" size="icon" onClick={() => handleUpdateStatus(grn.id, 'received')} className="text-emerald-400 hover:text-emerald-300">
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => openDeleteModal(grn)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </MobileCardActions>
              </MobileCard>
            ))}
          </MobileCardsContainer>

          {filteredGRNs.length === 0 && (
            <div className="p-8 text-center">
              <Truck className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400">No GRNs found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View GRN Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="GRN Details"
        size="lg"
      >
        {selectedGRN && (
          <div className="px-5 sm:px-6 py-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{selectedGRN.grnNumber}</h3>
                <p className="text-slate-600 dark:text-slate-400">{formatDate(selectedGRN.createdAt)}</p>
              </div>
              {getStatusBadge(selectedGRN.status)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                <p className="text-sm text-slate-600 dark:text-slate-400">Supplier</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">{selectedGRN.supplierName}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                <p className="text-sm text-slate-600 dark:text-slate-400">Purchase Order</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedGRN.purchaseOrderNumber || 'N/A'}
                </p>
              </div>
              {selectedGRN.receivedDate && (
                <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 col-span-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Received Date</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{formatDate(selectedGRN.receivedDate)}</p>
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Items Received</h4>
              
              {/* Mobile Cards View */}
              <div className="space-y-3 sm:hidden">
                {selectedGRN.items.map((item, index) => (
                  <div key={index} className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{item.productName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{item.sku}</p>
                      </div>
                      <p className="text-lg font-bold text-amber-500 dark:text-amber-400 ml-3">{formatCurrency(item.total)}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-0.5">Qty</p>
                        <p className="font-medium text-slate-700 dark:text-slate-300">{item.quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-0.5">Weight</p>
                        <p className="font-medium text-slate-700 dark:text-slate-300">{item.metalWeight ? formatWeight(item.metalWeight) : '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-0.5">Unit Cost</p>
                        <p className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(item.unitCost)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <thead className="bg-slate-100 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Item</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase whitespace-nowrap">Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase whitespace-nowrap">Weight</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase whitespace-nowrap">Cost</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase whitespace-nowrap">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                      {selectedGRN.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <p className="text-slate-800 dark:text-slate-200">{item.productName}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{item.sku}</p>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {item.metalWeight ? formatWeight(item.metalWeight) : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {formatCurrency(item.unitCost)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-800 dark:text-slate-200 font-semibold whitespace-nowrap">
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                <span className="text-slate-800 dark:text-slate-200">{formatCurrency(selectedGRN.subtotal)}</span>
              </div>
              {(selectedGRN.shippingCharges ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Shipping</span>
                  <span className="text-slate-800 dark:text-slate-200">{formatCurrency(selectedGRN.shippingCharges || 0)}</span>
                </div>
              )}
              {(selectedGRN.tax ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Tax</span>
                  <span className="text-slate-800 dark:text-slate-200">{formatCurrency(selectedGRN.tax || 0)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-800 dark:text-slate-200">Total</span>
                <span className="text-amber-400">{formatCurrency(selectedGRN.total)}</span>
              </div>
            </div>

            {selectedGRN.notes && (
              <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Notes</p>
                <p className="text-slate-800 dark:text-slate-200">{selectedGRN.notes}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="ghost" onClick={() => setShowViewModal(false)}>
                Close
              </Button>
              <Button variant="outline" onClick={() => handlePrint(selectedGRN)}>
                <Printer className="w-4 h-4" />
                Print
              </Button>
              {selectedGRN.status === 'pending' && (
                <Button
                  variant="gold"
                  onClick={() => {
                    handleUpdateStatus(selectedGRN.id, 'received');
                    setShowViewModal(false);
                  }}
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Received
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete GRN"
      >
        <div className="px-5 sm:px-6 py-5 space-y-5">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-8 h-8 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">Are you sure?</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                This will permanently delete GRN "{selectedGRN?.grnNumber}". This action cannot be
                undone.
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
      </Modal>
    </div>
  );
}
