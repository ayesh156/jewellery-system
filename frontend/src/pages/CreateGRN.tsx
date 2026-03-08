import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Gem,
  Truck,
  FileText,
  Save,
  X,
  Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Combobox } from '../components/ui/Combobox';
import { Badge } from '../components/ui/Badge';
import { mockProducts, mockSuppliers } from '../data/mockData';
import { formatCurrency, formatWeight } from '../utils/formatters';
import type { JewelleryItem, Supplier, GRN, GRNItem, MetalType, GoldKarat } from '../types';

const metalTypes: MetalType[] = ['gold', 'silver', 'platinum', 'palladium', 'white-gold', 'rose-gold'];
const karats: GoldKarat[] = ['24K', '22K', '18K', '14K', '10K', '9K'];

export function CreateGRN() {
  const navigate = useNavigate();

  // Supplier selection
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [showSupplierSearch, setShowSupplierSearch] = useState(false);

  // GRN items
  const [grnItems, setGRNItems] = useState<GRNItem[]>([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  // New item form
  const [newItem, setNewItem] = useState<Partial<GRNItem>>({
    productName: '',
    sku: '',
    quantity: 1,
    unitCost: 0,
    metalType: 'gold',
    karat: '22K',
    metalWeight: 0,
    purityPercentage: 0,
    total: 0,
  });

  // GRN details
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState('');

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return mockSuppliers.filter((supplier) =>
      supplier.companyName.toLowerCase().includes(supplierSearchQuery.toLowerCase()) ||
      supplier.contactPerson?.toLowerCase().includes(supplierSearchQuery.toLowerCase())
    );
  }, [supplierSearchQuery]);

  // Calculate totals
  const subtotal = grnItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + shippingCost + taxAmount;

  const handleSelectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowSupplierSearch(false);
    setSupplierSearchQuery('');
  };

  const handleAddItem = () => {
    if (!newItem.productName || !newItem.unitCost) {
      return;
    }

    const item: GRNItem = {
      id: `item-${Date.now()}`,
      productId: `TEMP-${Date.now()}`,
      sku: newItem.sku || `SKU-${Date.now()}`,
      productName: newItem.productName,
      quantity: newItem.quantity || 1,
      unitCost: newItem.unitCost,
      total: (newItem.quantity || 1) * newItem.unitCost,
      metalType: newItem.metalType || 'gold',
      karat: newItem.karat,
      metalWeight: newItem.metalWeight || 0,
      purityPercentage: newItem.purityPercentage,
    };

    setGRNItems((prev) => [...prev, item]);
    setNewItem({
      productName: '',
      sku: '',
      quantity: 1,
      unitCost: 0,
      metalType: 'gold',
      karat: '22K',
      metalWeight: 0,
      purityPercentage: 0,
      total: 0,
    });
    setShowAddItemModal(false);
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      setGRNItems((prev) => prev.filter((_, i) => i !== index));
    } else {
      setGRNItems((prev) =>
        prev.map((item, i) =>
          i === index
            ? { ...item, quantity: quantity, total: quantity * item.unitCost }
            : item
        )
      );
    }
  };

  const handleRemoveItem = (index: number) => {
    setGRNItems((prev) => prev.filter((_, i) => i !== index));
  };

  const generateGRNNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `GRN-${year}${month}-${random}`;
  };

  const handleSaveGRN = (status: 'pending' | 'received') => {
    if (!selectedSupplier || grnItems.length === 0) {
      toast.error('Please select a supplier and add at least one item');
      return;
    }

    const grnId = `GRN${Date.now()}`;
    const grn: GRN = {
      id: grnId,
      grnNumber: generateGRNNumber(),
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.companyName,
      purchaseOrderNumber: purchaseOrderNumber || undefined,
      items: grnItems,
      subtotal,
      shippingCharges: shippingCost,
      tax: taxAmount,
      total,
      amountPaid: 0,
      balanceDue: total,
      status,
      receivedDate: status === 'received' ? new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      receivedBy: status === 'received' ? 'Admin User' : undefined,
      qualityCheckDone: false,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('GRN created:', grn);

    // Store GRN in localStorage for print page to access
    localStorage.setItem('printGRN', JSON.stringify(grn));

    // Open print preview and trigger print dialog
    const printWindow = window.open(`/grn/${grnId}/print`, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }

    navigate('/grn');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/grn')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">Create GRN</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Record a new goods received note</p>
          </div>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => handleSaveGRN('pending')}>
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save as Pending</span>
            <span className="sm:hidden">Pending</span>
          </Button>
          <Button variant="gold" size="sm" className="flex-1 sm:flex-none" onClick={() => handleSaveGRN('received')}>
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Mark as Received</span>
            <span className="sm:hidden">Received</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supplier Selection */}
          <Card className="relative z-30 overflow-visible">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-400" />
                Supplier
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSupplier ? (
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{selectedSupplier.companyName}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {selectedSupplier.city}, {selectedSupplier.country}
                      </p>
                      {selectedSupplier.contactPerson && (
                        <p className="text-xs text-slate-500">
                          Contact: {selectedSupplier.contactPerson}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedSupplier(null)}>
                    <X className="w-4 h-4" />
                    Change
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                  <Input
                    placeholder="Search supplier by name..."
                    value={supplierSearchQuery}
                    onChange={(e) => {
                      setSupplierSearchQuery(e.target.value);
                      setShowSupplierSearch(true);
                    }}
                    onFocus={() => setShowSupplierSearch(true)}
                    onBlur={() => setTimeout(() => setShowSupplierSearch(false), 200)}
                    className="pl-10"
                  />
                  {showSupplierSearch && supplierSearchQuery && (
                    <div className="absolute z-[9999] w-full mt-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl max-h-64 overflow-y-auto">
                      {filteredSuppliers.length > 0 ? (
                        filteredSuppliers.map((supplier) => (
                          <button
                            key={supplier.id}
                            className="w-full flex items-center gap-3 p-4 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left border-b border-slate-200 dark:border-slate-700/50 last:border-b-0"
                            onClick={() => handleSelectSupplier(supplier)}
                          >
                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                              <Building2 className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{supplier.companyName}</p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {supplier.city}, {supplier.country}
                              </p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-6 text-center text-slate-600 dark:text-slate-400">
                          <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No suppliers found</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Gem className="w-5 h-5 text-amber-400" />
                Items
              </CardTitle>
              <Button variant="outline" onClick={() => setShowAddItemModal(true)}>
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              {grnItems.length > 0 ? (
                <div className="space-y-3">
                  {grnItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50"
                    >
                      <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Gem className="w-6 h-6 text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{item.productName}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {item.metalType?.charAt(0).toUpperCase() + item.metalType?.slice(1)}{' '}
                          {item.karat} • {item.metalWeight ? formatWeight(item.metalWeight) : 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center text-slate-800 dark:text-slate-200">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                      <div className="w-24 text-right">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(item.total)}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">@ {formatCurrency(item.unitCost)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                  <Gem className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">Add items to this GRN</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Purchase Order #"
                value={purchaseOrderNumber}
                onChange={(e) => setPurchaseOrderNumber(e.target.value)}
                placeholder="Optional PO number"
              />
              <Input
                label="Shipping Cost"
                type="number"
                value={shippingCost}
                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
              />
              <Input
                label="Tax Rate (%)"
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              />
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                  <span className="text-slate-800 dark:text-slate-200">{formatCurrency(subtotal)}</span>
                </div>
                {shippingCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Shipping</span>
                    <span className="text-slate-800 dark:text-slate-200">{formatCurrency(shippingCost)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Tax ({taxRate}%)</span>
                    <span className="text-slate-800 dark:text-slate-200">{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-3 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-800 dark:text-slate-200">Total</span>
                  <span className="text-amber-400">{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 resize-none"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes to this GRN..."
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Add Item</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAddItemModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <Input
                label="Item Name"
                value={newItem.productName}
                onChange={(e) => setNewItem((prev) => ({ ...prev, productName: e.target.value }))}
                placeholder="e.g., Gold Chain"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="SKU"
                  value={newItem.sku}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, sku: e.target.value }))}
                  placeholder="Optional"
                />
                <Input
                  label="Weight (g)"
                  type="number"
                  step="0.01"
                  value={newItem.metalWeight}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, metalWeight: parseFloat(e.target.value) }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Metal Type
                  </label>
                  <Combobox
                    value={newItem.metalType || ''}
                    onChange={(val) =>
                      setNewItem((prev) => ({ ...prev, metalType: val as MetalType }))
                    }
                    options={metalTypes.map((metal) => ({
                      value: metal,
                      label: metal.charAt(0).toUpperCase() + metal.slice(1),
                      icon: <Gem className="w-4 h-4" />
                    }))}
                    placeholder="Select metal..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Karat</label>
                  <Combobox
                    value={newItem.karat || ''}
                    onChange={(val) =>
                      setNewItem((prev) => ({ ...prev, karat: val as GoldKarat }))
                    }
                    options={karats.map((k) => ({
                      value: k,
                      label: k,
                      icon: <Gem className="w-4 h-4" />
                    }))}
                    placeholder="Select karat..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Quantity"
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      quantity: parseInt(e.target.value) || 1,
                    }))
                  }
                />
                <Input
                  label="Unit Cost"
                  type="number"
                  value={newItem.unitCost}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))
                  }
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                <Button variant="ghost" onClick={() => setShowAddItemModal(false)}>
                  Cancel
                </Button>
                <Button variant="gold" onClick={handleAddItem}>
                  <Plus className="w-4 h-4" />
                  Add Item
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
