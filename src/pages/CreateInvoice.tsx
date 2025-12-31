import { useState, useMemo } from 'react';
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
  DollarSign,
  CreditCard,
  Percent,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Combobox } from '../components/ui/Combobox';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { mockProducts, mockCustomers } from '../data/mockData';
import { formatCurrency, formatWeight } from '../utils/formatters';
import type { JewelleryItem, Customer, Invoice, InvoiceItem, PaymentMethod } from '../types';

const paymentMethods: PaymentMethod[] = ['cash', 'card', 'bank-transfer', 'cheque', 'credit'];

export function CreateInvoice() {
  const navigate = useNavigate();

  // Customer selection
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);

  // Product selection
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);

  // Invoice items
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);

  // Invoice details
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [taxRate, setTaxRate] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');

  // Filtered lists
  const filteredCustomers = useMemo(() => {
    return mockCustomers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        customer.phone?.includes(customerSearchQuery)
      );
    });
  }, [customerSearchQuery]);

  const filteredProducts = useMemo(() => {
    return mockProducts.filter(
      (product) =>
        product.stockQuantity > 0 &&
        (product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
          product.sku.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
          product.barcode?.toLowerCase().includes(productSearchQuery.toLowerCase()))
    );
  }, [productSearchQuery]);

  // Calculate totals
  const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount =
    discountType === 'percentage' ? (subtotal * discount) / 100 : discount;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * taxRate) / 100;
  const total = taxableAmount + taxAmount;
  const balanceDue = total - paidAmount;

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerSearch(false);
    setCustomerSearchQuery('');
  };

  const handleAddProduct = (product: JewelleryItem) => {
    const existingItem = invoiceItems.find((item) => item.productId === product.id);

    if (existingItem) {
      setInvoiceItems((prev) =>
        prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.unitPrice,
              }
            : item
        )
      );
    } else {
      const newItem: InvoiceItem = {
        id: `item-${Date.now()}`,
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        description: `${product.metalType} ${product.karat || ''} - ${formatWeight(product.metalWeight)}`,
        quantity: 1,
        unitPrice: product.sellingPrice,
        discount: 0,
        total: product.sellingPrice,
        metalWeight: product.metalWeight,
        metalType: product.metalType,
        karat: product.karat,
      };
      setInvoiceItems((prev) => [...prev, newItem]);
    }
    setShowProductSearch(false);
    setProductSearchQuery('');
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setInvoiceItems((prev) => prev.filter((item) => item.productId !== productId));
    } else {
      setInvoiceItems((prev) =>
        prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity, total: quantity * item.unitPrice }
            : item
        )
      );
    }
  };

  const handleRemoveItem = (productId: string) => {
    setInvoiceItems((prev) => prev.filter((item) => item.productId !== productId));
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
      alert('Please select a customer and add at least one item');
      return;
    }

    const invoiceId = `INV${Date.now()}`;
    const invoice: Invoice = {
      id: invoiceId,
      invoiceNumber: generateInvoiceNumber(),
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      customerAddress: selectedCustomer.address,
      items: invoiceItems,
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total,
      amountPaid: paidAmount,
      balanceDue,
      status: paidAmount >= total ? 'paid' : status,
      paymentMethod: paidAmount > 0 ? paymentMethod : undefined,
      notes,
      issueDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // In a real app, save to database here
    console.log('Invoice created:', invoice);

    // Store invoice in localStorage for print page to access
    localStorage.setItem('printInvoice', JSON.stringify(invoice));

    // Open print preview and trigger print dialog
    const printWindow = window.open(`/invoices/${invoiceId}/print`, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }

    // Navigate back to invoices
    navigate('/invoices');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">Create Invoice</h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">Create a new sales invoice</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => handleSaveInvoice('draft')}>
            <Save className="w-4 h-4" />
            Save Draft
          </Button>
          <Button variant="gold" onClick={() => handleSaveInvoice('pending')}>
            <FileText className="w-4 h-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <Card className="relative z-30 overflow-visible">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/10 flex items-center justify-center border border-blue-500/20">
                      <span className="text-lg font-semibold text-blue-400">
                        {selectedCustomer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {selectedCustomer.name}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{selectedCustomer.phone}</p>
                      {selectedCustomer.customerType !== 'retail' && (
                        <Badge variant="gold" className="mt-1">
                          {selectedCustomer.customerType.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
                    <X className="w-4 h-4" />
                    Change
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                  <Input
                    placeholder="Search customer by name or phone..."
                    value={customerSearchQuery}
                    onChange={(e) => {
                      setCustomerSearchQuery(e.target.value);
                      setShowCustomerSearch(true);
                    }}
                    onFocus={() => setShowCustomerSearch(true)}
                    onBlur={() => setTimeout(() => setShowCustomerSearch(false), 200)}
                    className="pl-10"
                  />
                  {showCustomerSearch && customerSearchQuery && (
                    <div className="absolute z-[9999] w-full mt-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl max-h-72 overflow-y-auto">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                          <button
                            key={customer.id}
                            className="w-full flex items-center gap-3 p-4 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left border-b border-slate-100 dark:border-slate-700/50 last:border-b-0"
                            onClick={() => handleSelectCustomer(customer)}
                          >
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                              <span className="text-sm font-medium text-blue-400">
                                {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                {customer.name}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">{customer.phone}</p>
                            </div>
                            <Badge variant="default" className="shrink-0">
                              {customer.customerType}
                            </Badge>
                          </button>
                        ))
                      ) : (
                        <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                          <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No customers found</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Selection */}
          <Card className="relative z-20 overflow-visible">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Gem className="w-5 h-5 text-amber-400" />
                Items
              </CardTitle>
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Add product..."
                  value={productSearchQuery}
                  onChange={(e) => {
                    setProductSearchQuery(e.target.value);
                    setShowProductSearch(true);
                  }}
                  onFocus={() => setShowProductSearch(true)}
                  onBlur={() => setTimeout(() => setShowProductSearch(false), 200)}
                  className="pl-10"
                />
                {showProductSearch && productSearchQuery && (
                  <div className="absolute z-[9999] w-80 mt-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl max-h-64 overflow-y-auto right-0">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          className="w-full flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left border-b border-slate-100 dark:border-slate-700/50 last:border-b-0"
                          onClick={() => handleAddProduct(product)}
                        >
                          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                            <Gem className="w-5 h-5 text-amber-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{product.name}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {product.sku} • {formatWeight(product.metalWeight)} • Stock:{' '}
                              {product.stockQuantity}
                            </p>
                          </div>
                          <p className="font-semibold text-amber-400 shrink-0">
                            {formatCurrency(product.sellingPrice)}
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-400">
                        <Gem className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No products found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {invoiceItems.length > 0 ? (
                <div className="space-y-3">
                  {invoiceItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center gap-4 p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50"
                    >
                      <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Gem className="w-6 h-6 text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{item.productName}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleUpdateQuantity(item.productId!, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center text-slate-800 dark:text-slate-200">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleUpdateQuantity(item.productId!, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                      <div className="w-24 text-right">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatCurrency(item.total)}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          @ {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.productId!)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                  <Gem className="w-12 h-12 text-slate-500 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">Search and add products to the invoice</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Summary */}
        <div className="space-y-6">
          {/* Discount & Tax */}
          <Card>
            <CardHeader>
              <CardTitle>Adjustments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  label="Discount"
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="flex-1"
                />
                <div className="w-28">
                  <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5 opacity-0">
                    Type
                  </label>
                  <Combobox
                    value={discountType}
                    onChange={(val) => setDiscountType(val as 'percentage' | 'fixed')}
                    options={[
                      { value: 'percentage', label: '%', icon: <Percent className="w-4 h-4" /> },
                      { value: 'fixed', label: 'Fixed', icon: <DollarSign className="w-4 h-4" /> }
                    ]}
                    placeholder="Type"
                  />
                </div>
              </div>
              <Input
                label="Tax Rate (%)"
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              />
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5">
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
              <Input
                label="Amount Paid"
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                max={total}
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
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      Discount {discountType === 'percentage' && `(${discount}%)`}
                    </span>
                    <span className="text-red-500 dark:text-red-400">-{formatCurrency(discountAmount)}</span>
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
                  <span className="text-amber-500 dark:text-amber-400">{formatCurrency(total)}</span>
                </div>
                {paidAmount > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Paid</span>
                      <span className="text-emerald-500 dark:text-emerald-400">{formatCurrency(paidAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-slate-600 dark:text-slate-400">Balance Due</span>
                      <span className="text-amber-500 dark:text-amber-400">{formatCurrency(balanceDue)}</span>
                    </div>
                  </>
                )}
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
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 resize-none"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes to this invoice..."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
