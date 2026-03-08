import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Gem,
  User,
  FileText,
  Printer,
  Save,
  X,
  Scale,
  Sparkles,
  Calculator,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { mockProducts, mockCustomers, mockGoldRates, mockCategories } from '../data/mockData';
import { formatCurrency, formatWeight } from '../utils/formatters';
import type { 
  Customer, 
  Invoice, 
  PaymentMethod,
  GoldKarat,
  MetalType,
  EnhancedInvoiceItem,
  GemstoneDetail,
  GoldRate,
} from '../types';

const paymentMethods: PaymentMethod[] = ['cash', 'card', 'bank-transfer', 'cheque', 'credit'];

const gemstoneTypes = [
  'diamond', 'ruby', 'sapphire', 'emerald', 'pearl', 
  'topaz', 'amethyst', 'opal', 'garnet', 'citrine', 'other'
];

const metalTypes: MetalType[] = ['gold', 'silver', 'platinum', 'white-gold', 'rose-gold'];
const goldKarats: GoldKarat[] = ['24K', '22K', '21K', '18K', '14K', '10K', '9K'];

interface ItemFormData {
  productName: string;
  metalType: MetalType;
  karat: GoldKarat;
  metalWeight: number;
  wastagePercentage: number;
  makingCharges: number;
  makingChargeType: 'per-gram' | 'fixed' | 'percentage';
  hasGemstones: boolean;
  gemstones: GemstoneDetail[];
  quantity: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
}

const defaultItemForm: ItemFormData = {
  productName: '',
  metalType: 'gold',
  karat: '22K',
  metalWeight: 0,
  wastagePercentage: 8,
  makingCharges: 0,
  makingChargeType: 'per-gram',
  hasGemstones: false,
  gemstones: [],
  quantity: 1,
  discount: 0,
  discountType: 'percentage',
};

export function CreateSalesInvoice() {
  const navigate = useNavigate();

  // Customer selection
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);

  // Current gold rates (would be fetched from backend in real app)
  const [goldRates] = useState<GoldRate[]>(mockGoldRates);
  const [showRateInfo, setShowRateInfo] = useState(false);

  // Invoice items
  const [invoiceItems, setInvoiceItems] = useState<EnhancedInvoiceItem[]>([]);
  
  // Item creation modal
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemForm, setItemForm] = useState<ItemFormData>(defaultItemForm);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Gemstone modal
  const [showGemstoneModal, setShowGemstoneModal] = useState(false);
  const [currentGemstone, setCurrentGemstone] = useState<Partial<GemstoneDetail>>({});

  // Invoice details
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [taxRate, setTaxRate] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');

  // Get current gold rate for a specific karat
  const getGoldRate = useCallback((karat: GoldKarat): number => {
    const rate = goldRates.find(r => r.karat === karat);
    return rate?.sellingRate || 0;
  }, [goldRates]);

  // Calculate item totals
  const calculateItemTotal = useCallback((item: ItemFormData): Omit<EnhancedInvoiceItem, 'id'> => {
    const metalRate = getGoldRate(item.karat);
    const metalValue = item.metalWeight * metalRate;
    const wastageWeight = (item.metalWeight * item.wastagePercentage) / 100;
    
    let makingChargesValue = 0;
    if (item.makingChargeType === 'per-gram') {
      makingChargesValue = (item.metalWeight + wastageWeight) * item.makingCharges;
    } else if (item.makingChargeType === 'percentage') {
      makingChargesValue = (metalValue * item.makingCharges) / 100;
    } else {
      makingChargesValue = item.makingCharges;
    }

    const wastageValue = wastageWeight * metalRate;
    const totalGemstoneValue = item.gemstones.reduce((sum, g) => sum + g.totalPrice, 0);
    const unitPrice = metalValue + wastageValue + makingChargesValue + totalGemstoneValue;
    
    let discountAmount = 0;
    if (item.discountType === 'percentage') {
      discountAmount = (unitPrice * item.discount) / 100;
    } else {
      discountAmount = item.discount;
    }

    const total = (unitPrice - discountAmount) * item.quantity;

    return {
      productId: undefined,
      sku: undefined,
      productName: item.productName,
      metalType: item.metalType,
      karat: item.karat,
      metalWeight: item.metalWeight,
      metalRate,
      metalValue,
      wastagePercentage: item.wastagePercentage,
      wastageWeight,
      makingCharges: makingChargesValue,
      makingChargeType: item.makingChargeType,
      hasGemstones: item.hasGemstones,
      gemstones: item.gemstones,
      totalGemstoneValue,
      quantity: item.quantity,
      unitPrice,
      discount: discountAmount,
      discountType: item.discountType,
      total,
    };
  }, [getGoldRate]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return mockCustomers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        customer.phone?.includes(customerSearchQuery) ||
        customer.nic?.includes(customerSearchQuery)
      );
    });
  }, [customerSearchQuery]);

  // Calculate totals
  const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
  const totalMetalWeight = invoiceItems.reduce((sum, item) => sum + (item.metalWeight * item.quantity), 0);
  const discountAmount = discountType === 'percentage' ? (subtotal * discount) / 100 : discount;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * taxRate) / 100;
  const total = taxableAmount + taxAmount;
  const balanceDue = total - paidAmount;

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerSearch(false);
    setCustomerSearchQuery('');
  };

  const handleAddGemstone = () => {
    if (!currentGemstone.type || !currentGemstone.carat || !currentGemstone.pricePerCarat) {
      return;
    }

    const newGemstone: GemstoneDetail = {
      id: `gem-${Date.now()}`,
      type: currentGemstone.type,
      name: currentGemstone.name || currentGemstone.type,
      carat: currentGemstone.carat,
      clarity: currentGemstone.clarity,
      color: currentGemstone.color,
      cut: currentGemstone.cut,
      origin: currentGemstone.origin,
      certified: currentGemstone.certified || false,
      certificateNumber: currentGemstone.certificateNumber,
      pricePerCarat: currentGemstone.pricePerCarat,
      totalPrice: currentGemstone.carat * currentGemstone.pricePerCarat,
    };

    setItemForm(prev => ({
      ...prev,
      gemstones: [...prev.gemstones, newGemstone],
      hasGemstones: true,
    }));
    setCurrentGemstone({});
    setShowGemstoneModal(false);
  };

  const handleRemoveGemstone = (gemId: string) => {
    setItemForm(prev => ({
      ...prev,
      gemstones: prev.gemstones.filter(g => g.id !== gemId),
      hasGemstones: prev.gemstones.length > 1,
    }));
  };

  const handleAddItem = () => {
    if (!itemForm.productName || itemForm.metalWeight <= 0) {
      toast.error('Please enter product name and valid metal weight');
      return;
    }

    const calculatedItem = calculateItemTotal(itemForm);
    const newItem: EnhancedInvoiceItem = {
      id: `item-${Date.now()}`,
      ...calculatedItem,
    };

    setInvoiceItems(prev => [...prev, newItem]);
    setItemForm(defaultItemForm);
    setShowAddItem(false);
  };

  const handleRemoveItem = (itemId: string) => {
    setInvoiceItems(prev => prev.filter(item => item.id !== itemId));
    setExpandedItems(prev => prev.filter(id => id !== itemId));
  };

  const toggleItemExpand = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}-${random}`;
  };

  const handleSaveInvoice = (status: 'draft' | 'pending') => {
    if (!selectedCustomer || invoiceItems.length === 0) {
      toast.error('Please select a customer and add at least one item');
      return;
    }

    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: generateInvoiceNumber(),
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      customerAddress: selectedCustomer.address,
      items: invoiceItems.map(item => ({
        id: item.id,
        productId: item.productId || '',
        sku: item.sku || '',
        productName: item.productName,
        description: `${item.metalType} ${item.karat || ''} - ${formatWeight(item.metalWeight)} | Making: ${formatCurrency(item.makingCharges)} | Wastage: ${item.wastagePercentage}%`,
        metalType: item.metalType,
        karat: item.karat,
        metalWeight: item.metalWeight,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        total: item.total,
      })),
      subtotal,
      discount: discountAmount,
      discountType,
      tax: taxAmount,
      taxRate,
      total,
      amountPaid: paidAmount,
      balanceDue,
      paymentMethod,
      issueDate: new Date().toISOString().split('T')[0],
      status,
      notes,
      createdAt: new Date().toISOString(),
    };

    // Store invoice for printing
    localStorage.setItem('printInvoice', JSON.stringify(invoice));
    
    if (status === 'pending') {
      navigate(`/invoices/${invoice.id}/print`);
    } else {
      navigate('/invoices');
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Create Sales Invoice</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Sri Lankan Jewellery Sales with Gold Rate Calculation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowRateInfo(true)}>
            <RefreshCw className="w-4 h-4" />
            Today's Rates
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer & Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-amber-400" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-amber-500 dark:text-amber-400">
                        {selectedCustomer.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-100">{selectedCustomer.name}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{selectedCustomer.phone}</p>
                      {selectedCustomer.nic && (
                        <p className="text-xs text-slate-500">NIC: {selectedCustomer.nic}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedCustomer.customerType === 'vip' ? 'success' : 'default'}>
                      {selectedCustomer.customerType.toUpperCase()}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder="Search customer by name, phone or NIC..."
                    value={customerSearchQuery}
                    onChange={(e) => {
                      setCustomerSearchQuery(e.target.value);
                      setShowCustomerSearch(true);
                    }}
                    onFocus={() => setShowCustomerSearch(true)}
                    icon={<Search className="w-4 h-4" />}
                  />
                  {showCustomerSearch && customerSearchQuery && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                          <button
                            key={customer.id}
                            onClick={() => handleSelectCustomer(customer)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left"
                          >
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                              <span className="text-sm font-medium text-amber-500 dark:text-amber-400">
                                {customer.name.charAt(0)}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-slate-800 dark:text-slate-200">{customer.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{customer.phone}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {customer.customerType}
                            </Badge>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                          No customers found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Gem className="w-5 h-5 text-amber-400" />
                Invoice Items
              </CardTitle>
              <Button onClick={() => setShowAddItem(true)}>
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              {invoiceItems.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <Scale className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No items added yet</p>
                  <p className="text-sm mt-1">Click "Add Item" to start adding jewellery items</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoiceItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-100 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600/50 overflow-hidden"
                    >
                      {/* Item Header */}
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors"
                        onClick={() => toggleItemExpand(item.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center">
                            <Gem className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800 dark:text-slate-100">{item.productName}</h4>
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                              <span>{item.metalType}</span>
                              {item.karat && <Badge variant="outline" className="text-xs">{item.karat}</Badge>}
                              <span>•</span>
                              <span>{formatWeight(item.metalWeight)}</span>
                              {item.hasGemstones && (
                                <>
                                  <span>•</span>
                                  <Sparkles className="w-3 h-3 text-pink-400" />
                                  <span>{item.gemstones?.length} stone(s)</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-amber-500 dark:text-amber-400">{formatCurrency(item.total)}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Qty: {item.quantity}</p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveItem(item.id); }}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {expandedItems.includes(item.id) ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Item Details (Expanded) */}
                      {expandedItems.includes(item.id) && (
                        <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-600/50 pt-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-slate-500 dark:text-slate-400">Gold Rate</p>
                              <p className="text-slate-800 dark:text-slate-200">{formatCurrency(item.metalRate)}/g</p>
                            </div>
                            <div>
                              <p className="text-slate-500 dark:text-slate-400">Metal Value</p>
                              <p className="text-slate-800 dark:text-slate-200">{formatCurrency(item.metalValue)}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 dark:text-slate-400">Wastage ({item.wastagePercentage}%)</p>
                              <p className="text-slate-800 dark:text-slate-200">{formatWeight(item.wastageWeight)} = {formatCurrency(item.wastageWeight * item.metalRate)}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 dark:text-slate-400">Making Charges</p>
                              <p className="text-slate-800 dark:text-slate-200">{formatCurrency(item.makingCharges)}</p>
                            </div>
                          </div>
                          
                          {item.hasGemstones && item.gemstones && item.gemstones.length > 0 && (
                            <div className="mt-4">
                              <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">Gemstones</p>
                              <div className="space-y-2">
                                {item.gemstones.map((gem) => (
                                  <div key={gem.id} className="flex items-center justify-between bg-slate-200 dark:bg-slate-800/50 p-2 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <Sparkles className="w-4 h-4 text-pink-400" />
                                      <span className="text-slate-800 dark:text-slate-200 capitalize">{gem.name}</span>
                                      <Badge variant="outline" className="text-xs">{gem.carat} ct</Badge>
                                      {gem.certified && <Badge variant="success" className="text-xs">Certified</Badge>}
                                    </div>
                                    <span className="text-amber-500 dark:text-amber-400">{formatCurrency(gem.totalPrice)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600/50 flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Total Gemstone Value:</span>
                            <span className="text-slate-800 dark:text-slate-200">{formatCurrency(item.totalGemstoneValue)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                Additional Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter any additional notes for the invoice..."
                className="w-full h-24 px-4 py-3 bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Price Breakdown */}
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-400" />
                Invoice Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Weight Summary */}
              <div className="p-4 bg-gradient-to-br from-amber-50 dark:from-amber-500/10 to-yellow-50 dark:to-yellow-500/5 rounded-lg border border-amber-200 dark:border-amber-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600 dark:text-slate-400">Total Metal Weight</span>
                  <span className="text-xl font-bold text-amber-500 dark:text-amber-400">{formatWeight(totalMetalWeight)}</span>
                </div>
                <p className="text-xs text-slate-500">Combined weight of all items</p>
              </div>

              {/* Financial Summary */}
              <div className="space-y-3">
                <div className="flex justify-between text-slate-700 dark:text-slate-300">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                {/* Discount */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      placeholder="0"
                      className="text-right"
                    />
                  </div>
                  <Select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                    className="w-24"
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">Rs.</option>
                  </Select>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}

                {/* Tax */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">Tax Rate (%)</span>
                  <Input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    placeholder="0"
                    className="w-24 text-right"
                  />
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between text-slate-700 dark:text-slate-300">
                    <span>Tax ({taxRate}%)</span>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                )}

                <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                  <div className="flex justify-between text-lg font-bold text-slate-800 dark:text-slate-100">
                    <span>Total</span>
                    <span className="text-amber-500 dark:text-amber-400">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Payment Method</label>
                  <Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  >
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>
                        {method.charAt(0).toUpperCase() + method.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Amount Paid</label>
                  <Input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    placeholder="0.00"
                  />
                </div>

                <div className="flex justify-between text-lg font-semibold">
                  <span className={balanceDue > 0 ? 'text-red-400' : 'text-green-400'}>
                    Balance Due
                  </span>
                  <span className={balanceDue > 0 ? 'text-red-400' : 'text-green-400'}>
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-4">
                <Button
                  className="w-full"
                  onClick={() => handleSaveInvoice('pending')}
                  disabled={!selectedCustomer || invoiceItems.length === 0}
                >
                  <Printer className="w-4 h-4" />
                  Save & Print
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSaveInvoice('draft')}
                  disabled={!selectedCustomer || invoiceItems.length === 0}
                >
                  <Save className="w-4 h-4" />
                  Save as Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={showAddItem}
        onClose={() => {
          setShowAddItem(false);
          setItemForm(defaultItemForm);
        }}
        title="Add Jewellery Item"
        size="lg"
      >
        <div className="px-5 sm:px-6 py-5 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Item Name / Description"
                value={itemForm.productName}
                onChange={(e) => setItemForm(prev => ({ ...prev, productName: e.target.value }))}
                placeholder="e.g., 22K Gold Wedding Ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Metal Type</label>
              <Select
                value={itemForm.metalType}
                onChange={(e) => setItemForm(prev => ({ ...prev, metalType: e.target.value as MetalType }))}
              >
                {metalTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Karat</label>
              <Select
                value={itemForm.karat}
                onChange={(e) => setItemForm(prev => ({ ...prev, karat: e.target.value as GoldKarat }))}
              >
                {goldKarats.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* Weight & Rate */}
          <div className="p-4 bg-slate-100 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600/50">
            <h4 className="text-sm font-medium text-amber-500 dark:text-amber-400 mb-3 flex items-center gap-2">
              <Scale className="w-4 h-4" />
              Weight & Gold Rate
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Input
                  label="Metal Weight (grams)"
                  type="number"
                  step="0.001"
                  value={itemForm.metalWeight || ''}
                  onChange={(e) => setItemForm(prev => ({ ...prev, metalWeight: Number(e.target.value) }))}
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Rate</label>
                <div className="px-4 py-2 bg-slate-200 dark:bg-slate-600/50 rounded-lg text-slate-800 dark:text-slate-200">
                  {formatCurrency(getGoldRate(itemForm.karat))}/g
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Metal Value</label>
                <div className="px-4 py-2 bg-amber-500/10 rounded-lg text-amber-400 font-semibold">
                  {formatCurrency(itemForm.metalWeight * getGoldRate(itemForm.karat))}
                </div>
              </div>
            </div>
          </div>

          {/* Wastage & Making Charges */}
          <div className="p-4 bg-slate-100 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600/50">
            <h4 className="text-sm font-medium text-amber-500 dark:text-amber-400 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Labor & Wastage Charges
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Input
                  label="Wastage %"
                  type="number"
                  step="0.5"
                  value={itemForm.wastagePercentage || ''}
                  onChange={(e) => setItemForm(prev => ({ ...prev, wastagePercentage: Number(e.target.value) }))}
                  placeholder="8"
                />
                <p className="text-xs text-slate-500 mt-1">Typical: 8-12%</p>
              </div>
              <div>
                <Input
                  label="Making Charges"
                  type="number"
                  value={itemForm.makingCharges || ''}
                  onChange={(e) => setItemForm(prev => ({ ...prev, makingCharges: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Charge Type</label>
                <Select
                  value={itemForm.makingChargeType}
                  onChange={(e) => setItemForm(prev => ({ ...prev, makingChargeType: e.target.value as 'per-gram' | 'fixed' | 'percentage' }))}
                >
                  <option value="per-gram">Per Gram</option>
                  <option value="fixed">Fixed Amount</option>
                  <option value="percentage">% of Metal Value</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Gemstones */}
          <div className="p-4 bg-slate-100 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600/50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-amber-500 dark:text-amber-400 flex items-center gap-2">
                <Gem className="w-4 h-4" />
                Gemstones
              </h4>
              <Button size="sm" variant="outline" onClick={() => setShowGemstoneModal(true)}>
                <Plus className="w-3 h-3" />
                Add Gemstone
              </Button>
            </div>

            {itemForm.gemstones.length > 0 ? (
              <div className="space-y-2">
                {itemForm.gemstones.map((gem) => (
                  <div key={gem.id} className="flex items-center justify-between bg-slate-200 dark:bg-slate-800/50 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-pink-400" />
                      <div>
                        <p className="text-slate-800 dark:text-slate-200 capitalize">{gem.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {gem.carat} ct @ {formatCurrency(gem.pricePerCarat)}/ct
                          {gem.certified && ' • Certified'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-amber-500 dark:text-amber-400 font-semibold">{formatCurrency(gem.totalPrice)}</span>
                      <button
                        onClick={() => handleRemoveGemstone(gem.id)}
                        className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">No gemstones added</p>
            )}
          </div>

          {/* Quantity & Discount */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                label="Quantity"
                type="number"
                min="1"
                value={itemForm.quantity}
                onChange={(e) => setItemForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Input
                label="Item Discount"
                type="number"
                value={itemForm.discount || ''}
                onChange={(e) => setItemForm(prev => ({ ...prev, discount: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Discount Type</label>
              <Select
                value={itemForm.discountType}
                onChange={(e) => setItemForm(prev => ({ ...prev, discountType: e.target.value as 'percentage' | 'fixed' }))}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (Rs.)</option>
              </Select>
            </div>
          </div>

          {/* Preview Total */}
          {itemForm.metalWeight > 0 && (
            <div className="p-4 bg-gradient-to-br from-amber-50 dark:from-amber-500/10 to-yellow-50 dark:to-yellow-500/5 rounded-lg border border-amber-200 dark:border-amber-500/20">
              <div className="flex justify-between items-center">
                <span className="text-slate-700 dark:text-slate-300">Estimated Item Total</span>
                <span className="text-2xl font-bold text-amber-500 dark:text-amber-400">
                  {formatCurrency(calculateItemTotal(itemForm).total)}
                </span>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button variant="outline" onClick={() => { setShowAddItem(false); setItemForm(defaultItemForm); }}>
              Cancel
            </Button>
            <Button onClick={handleAddItem}>
              <Plus className="w-4 h-4" />
              Add to Invoice
            </Button>
          </div>
        </div>
      </Modal>

      {/* Gemstone Modal */}
      <Modal
        isOpen={showGemstoneModal}
        onClose={() => { setShowGemstoneModal(false); setCurrentGemstone({}); }}
        title="Add Gemstone"
      >
        <div className="px-5 sm:px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gemstone Type</label>
              <Select
                value={currentGemstone.type || ''}
                onChange={(e) => setCurrentGemstone(prev => ({ ...prev, type: e.target.value, name: e.target.value }))}
              >
                <option value="">Select type...</option>
                {gemstoneTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Input
                label="Name (Optional)"
                value={currentGemstone.name || ''}
                onChange={(e) => setCurrentGemstone(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Blue Sapphire"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Carat Weight"
                type="number"
                step="0.01"
                value={currentGemstone.carat || ''}
                onChange={(e) => setCurrentGemstone(prev => ({ ...prev, carat: Number(e.target.value) }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Input
                label="Price per Carat (Rs.)"
                type="number"
                value={currentGemstone.pricePerCarat || ''}
                onChange={(e) => setCurrentGemstone(prev => ({ ...prev, pricePerCarat: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Input
                label="Clarity"
                value={currentGemstone.clarity || ''}
                onChange={(e) => setCurrentGemstone(prev => ({ ...prev, clarity: e.target.value }))}
                placeholder="e.g., VS1"
              />
            </div>
            <div>
              <Input
                label="Color"
                value={currentGemstone.color || ''}
                onChange={(e) => setCurrentGemstone(prev => ({ ...prev, color: e.target.value }))}
                placeholder="e.g., Blue"
              />
            </div>
            <div>
              <Input
                label="Cut"
                value={currentGemstone.cut || ''}
                onChange={(e) => setCurrentGemstone(prev => ({ ...prev, cut: e.target.value }))}
                placeholder="e.g., Oval"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Origin"
                value={currentGemstone.origin || ''}
                onChange={(e) => setCurrentGemstone(prev => ({ ...prev, origin: e.target.value }))}
                placeholder="e.g., Sri Lanka"
              />
            </div>
            <div>
              <Input
                label="Certificate Number"
                value={currentGemstone.certificateNumber || ''}
                onChange={(e) => setCurrentGemstone(prev => ({ ...prev, certificateNumber: e.target.value, certified: !!e.target.value }))}
                placeholder="Optional"
              />
            </div>
          </div>

          {currentGemstone.carat && currentGemstone.pricePerCarat && (
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/20">
              <div className="flex justify-between">
                <span className="text-slate-700 dark:text-slate-300">Total Value</span>
                <span className="font-bold text-amber-500 dark:text-amber-400">
                  {formatCurrency(currentGemstone.carat * currentGemstone.pricePerCarat)}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => { setShowGemstoneModal(false); setCurrentGemstone({}); }}>
              Cancel
            </Button>
            <Button onClick={handleAddGemstone} disabled={!currentGemstone.type || !currentGemstone.carat || !currentGemstone.pricePerCarat}>
              Add Gemstone
            </Button>
          </div>
        </div>
      </Modal>

      {/* Gold Rates Info Modal */}
      <Modal
        isOpen={showRateInfo}
        onClose={() => setShowRateInfo(false)}
        title="Today's Gold Rates"
      >
        <div className="px-5 sm:px-6 py-5 space-y-4">
          <p className="text-slate-500 dark:text-slate-400 text-sm">Current gold rates per gram (Selling)</p>
          <div className="space-y-2">
            {goldRates.map((rate) => (
              <div key={rate.id} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="warning">{rate.karat}</Badge>
                  <span className="text-slate-700 dark:text-slate-300">{rate.karat} Gold</span>
                </div>
                <div className="text-right">
                  <p className="text-amber-500 dark:text-amber-400 font-semibold">{formatCurrency(rate.sellingRate)}/g</p>
                  <p className="text-xs text-slate-500">Buy: {formatCurrency(rate.buyingRate)}/g</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Rates are updated daily. Last update: {new Date().toLocaleDateString()}
          </p>
        </div>
      </Modal>
    </div>
  );
}
