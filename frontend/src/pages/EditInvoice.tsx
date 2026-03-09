import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Minus,
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
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Combobox } from '../components/ui/Combobox';
import { Badge } from '../components/ui/Badge';
import { productsApi, customersApi, invoicesApi, companyApi } from '../services/api';
import { formatCurrency, formatWeight } from '../utils/formatters';
import type { JewelleryItem, Customer, Invoice, InvoiceItem, PaymentMethod } from '../types';

const paymentMethods: PaymentMethod[] = ['cash', 'card', 'bank-transfer', 'cheque', 'credit'];

export function EditInvoice() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Loading states
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Original invoice data
  const [originalInvoice, setOriginalInvoice] = useState<Invoice | null>(null);

  // API-loaded data
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [allProducts, setAllProducts] = useState<JewelleryItem[]>([]);

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

  // Load invoice, customers & products from API
  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        setPageLoading(true);
        const [invoiceRes, customersRes, productsRes] = await Promise.all([
          invoicesApi.getById(id),
          customersApi.getAll({ isActive: 'true', limit: 100 }),
          productsApi.getAll({ isActive: 'true', limit: 100 }),
        ]);

        // Map invoice data
        const inv = invoiceRes.data;
        const invoice: Invoice = {
          ...inv,
          subtotal: Number(inv.subtotal),
          discount: Number(inv.discount),
          tax: Number(inv.tax),
          taxRate: inv.taxRate ? Number(inv.taxRate) : undefined,
          total: Number(inv.total),
          amountPaid: Number(inv.amountPaid),
          balanceDue: Number(inv.balanceDue),
          items: (inv.items || []).map((item: any) => ({
            ...item,
            metalWeight: item.metalWeight ? Number(item.metalWeight) : 0,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
            discount: item.discount ? Number(item.discount) : undefined,
            total: Number(item.total),
          })),
        };

        setOriginalInvoice(invoice);
        setInvoiceItems(invoice.items);
        setNotes(invoice.notes || '');
        setPaidAmount(invoice.amountPaid);
        setPaymentMethod((invoice.paymentMethod as PaymentMethod) || 'cash');

        // Determine discount type and value from original
        if (invoice.discount > 0 && invoice.subtotal > 0) {
          const pctDiscount = (invoice.discount / invoice.subtotal) * 100;
          if (Number.isInteger(pctDiscount) || pctDiscount === Math.round(pctDiscount * 100) / 100) {
            setDiscountType('percentage');
            setDiscount(pctDiscount);
          } else {
            setDiscountType('fixed');
            setDiscount(invoice.discount);
          }
        }

        if (invoice.taxRate) {
          setTaxRate(invoice.taxRate);
        } else if (invoice.tax > 0 && invoice.subtotal - invoice.discount > 0) {
          setTaxRate((invoice.tax / (invoice.subtotal - invoice.discount)) * 100);
        } else {
          // No tax on this invoice — load default from company settings
          try {
            const companyRes = await companyApi.get();
            const rate = parseFloat(companyRes.data.defaultTaxRate || '0');
            if (rate > 0) setTaxRate(rate);
          } catch { /* ignore */ }
        }

        // Map customers
        const customers = customersRes.data.map((c: any) => ({
          ...c,
          totalPurchased: Number(c.totalPurchased),
          creditLimit: c.creditLimit ? Number(c.creditLimit) : undefined,
          creditBalance: c.creditBalance ? Number(c.creditBalance) : undefined,
        }));
        setAllCustomers(customers);

        // Find and set the invoice's customer
        const invoiceCustomer = customers.find((c: Customer) => c.id === invoice.customerId);
        if (invoiceCustomer) {
          setSelectedCustomer(invoiceCustomer);
        } else {
          // Create a minimal customer object from invoice data
          setSelectedCustomer({
            id: invoice.customerId,
            name: invoice.customerName,
            phone: invoice.customerPhone || '',
            address: invoice.customerAddress,
            customerType: 'retail',
            totalPurchased: 0,
            isActive: true,
          } as Customer);
        }

        // Map products
        setAllProducts(productsRes.data.map((p: any) => ({
          ...p,
          metalWeight: Number(p.metalWeight),
          metalPurity: p.metalPurity ? Number(p.metalPurity) : undefined,
          metalRate: Number(p.metalRate),
          makingCharges: Number(p.makingCharges),
          gemstoneValue: p.gemstoneValue ? Number(p.gemstoneValue) : undefined,
          otherCharges: p.otherCharges ? Number(p.otherCharges) : undefined,
          sellingPrice: Number(p.sellingPrice),
          costPrice: Number(p.costPrice),
          totalGemstoneWeight: p.totalGemstoneWeight ? Number(p.totalGemstoneWeight) : undefined,
        })));
      } catch (err: any) {
        toast.error(err.message || 'Failed to load invoice');
        navigate('/invoices');
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

  // Filtered lists
  const filteredCustomers = useMemo(() => {
    return allCustomers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        customer.phone?.includes(customerSearchQuery)
      );
    });
  }, [customerSearchQuery, allCustomers]);

  const getAvailableStock = useCallback((product: JewelleryItem) => {
    const invoiceItem = invoiceItems.find(item => item.productId === product.id);
    // In edit mode, original invoice quantities are already deducted from DB stock,
    // so add them back to get the true available stock
    const originalItem = originalInvoice?.items.find(i => i.productId === product.id);
    const originalQty = originalItem?.quantity || 0;
    return product.stockQuantity + originalQty - (invoiceItem?.quantity || 0);
  }, [invoiceItems, originalInvoice]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter(
      (product) =>
        (product.stockQuantity > 0 || invoiceItems.some(item => item.productId === product.id)) &&
        (product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
          product.sku.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
          product.barcode?.toLowerCase().includes(productSearchQuery.toLowerCase()))
    );
  }, [productSearchQuery, allProducts, invoiceItems]);

  // Calculate totals
  const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount =
    discountType === 'percentage' ? (subtotal * discount) / 100 : discount;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * taxRate) / 100;
  const total = taxableAmount + taxAmount;
  const balanceDue = total - paidAmount;

  // Auto-update paid amount when total changes (for non-credit methods), skip during initial load
  useEffect(() => {
    if (pageLoading) return;
    if (paymentMethod !== 'credit') {
      setPaidAmount(total);
    }
  }, [total, paymentMethod, pageLoading]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerSearch(false);
    setCustomerSearchQuery('');
  };

  const handleAddProduct = (product: JewelleryItem) => {
    // Account for original invoice quantity when checking available stock
    const originalItem = originalInvoice?.items.find(i => i.productId === product.id);
    const originalQty = originalItem?.quantity || 0;
    const availableStock = getAvailableStock(product) + originalQty;
    if (availableStock <= 0) {
      toast.error(`"${product.name}" is out of stock! Cannot add more.`);
      return;
    }

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
      const product = allProducts.find(p => p.id === productId);
      if (product) {
        // Account for original invoice quantity (already deducted from stock)
        const originalItem = originalInvoice?.items.find(i => i.productId === productId);
        const originalQty = originalItem?.quantity || 0;
        const maxAvailable = product.stockQuantity + originalQty;
        if (quantity > maxAvailable) {
          toast.error(`Only ${maxAvailable} available for "${product.name}"`);
          return;
        }
      }
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

  const handleUpdateInvoice = async () => {
    if (!selectedCustomer || invoiceItems.length === 0 || !originalInvoice) {
      toast.error('Please select a customer and add at least one item');
      return;
    }

    const finalStatus = paidAmount >= total ? 'paid'
      : paidAmount > 0 ? 'partial'
      : originalInvoice.status;

    setSaving(true);
    try {
      const invoicePayload = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        customerAddress: selectedCustomer.address,
        items: invoiceItems.map(item => ({
          ...item,
          unitPrice: item.unitPrice.toFixed(2),
          total: item.total.toFixed(2),
          metalWeight: item.metalWeight?.toString() ?? null,
          originalPrice: item.originalPrice?.toFixed(2) ?? null,
          discount: item.discount?.toFixed(2) ?? null,
        })),
        subtotal: subtotal.toFixed(2),
        discount: discountAmount.toFixed(2),
        discountType: discountAmount > 0 ? discountType : null,
        tax: taxAmount.toFixed(2),
        taxRate: taxRate > 0 ? taxRate.toFixed(2) : null,
        total: total.toFixed(2),
        amountPaid: paidAmount.toFixed(2),
        balanceDue: balanceDue.toFixed(2),
        status: finalStatus,
        paymentMethod: paidAmount > 0 ? paymentMethod : originalInvoice.paymentMethod || null,
        notes: notes || null,
      };

      await invoicesApi.update(originalInvoice.id, invoicePayload);

      // Adjust product stock based on differences between original and updated items
      try {
        const originalItems = originalInvoice.items || [];
        const stockUpdates: Promise<any>[] = [];

        // For each current invoice item, calculate the quantity difference
        for (const item of invoiceItems) {
          const product = allProducts.find(p => p.id === item.productId);
          if (!product) continue;
          const originalItem = originalItems.find(oi => oi.productId === item.productId);
          const originalQty = originalItem?.quantity || 0;
          const diff = item.quantity - originalQty; // positive = more used, negative = returned
          if (diff !== 0) {
            const newStock = Math.max(0, product.stockQuantity - diff);
            stockUpdates.push(productsApi.updateStock(item.productId, newStock));
          }
        }

        // For items that were in original but removed entirely
        for (const originalItem of originalItems) {
          if (!invoiceItems.some(i => i.productId === originalItem.productId)) {
            const product = allProducts.find(p => p.id === originalItem.productId);
            if (product) {
              const newStock = product.stockQuantity + originalItem.quantity;
              stockUpdates.push(productsApi.updateStock(originalItem.productId, newStock));
            }
          }
        }

        if (stockUpdates.length > 0) {
          await Promise.all(stockUpdates);
        }
      } catch {
        toast.error('Invoice updated but stock adjustment failed. Please update stock manually.');
      }

      toast.success('Invoice updated successfully');
      navigate('/invoices');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update invoice');
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto" />
          <p className="text-slate-600 dark:text-slate-400">Loading invoice...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">Edit Invoice</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {originalInvoice?.invoiceNumber}
              {originalInvoice?.paymentMethod && (
                <Badge variant={originalInvoice.paymentMethod === 'credit' ? 'warning' : 'success'} className="ml-2">
                  {originalInvoice.paymentMethod === 'credit' ? 'Credit' : 'Cash'}
                </Badge>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none sm:size-default" onClick={() => navigate('/invoices')} disabled={saving}>
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Cancel</span>
          </Button>
          <Button variant="gold" size="sm" className="flex-1 sm:flex-none sm:size-default" onClick={handleUpdateInvoice} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="hidden sm:inline">Update Invoice</span>
            <span className="sm:hidden">Update</span>
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gem className="w-5 h-5 text-amber-400" />
                Items
                {invoiceItems.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-amber-500/15 text-amber-500 rounded-full">
                    {invoiceItems.length}
                  </span>
                )}
              </CardTitle>
            </CardHeader>

            {/* Full-width search bar */}
            <div className="relative px-5 pb-4 -mt-2">
              <div className="relative group">
                <div className="relative flex items-center rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 shadow-sm group-focus-within:border-amber-500/50 transition-colors duration-200 overflow-hidden">
                  {/* Left icon */}
                  <div className="pl-5 pr-3 flex items-center shrink-0">
                    <Search className="w-5 h-5 text-slate-400 group-focus-within:text-amber-500 transition-colors duration-300" />
                  </div>
                  {/* Input */}
                  <input
                    type="text"
                    placeholder="Search and add products by name, SKU, or barcode..."
                    value={productSearchQuery}
                    onChange={(e) => {
                      setProductSearchQuery(e.target.value);
                      setShowProductSearch(true);
                    }}
                    onFocus={() => setShowProductSearch(true)}
                    onBlur={() => setTimeout(() => setShowProductSearch(false), 200)}
                    className="flex-1 py-4 pr-4 text-sm bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                  />
                  {/* Right: clear button or gem icon */}
                  <div className="pr-4 flex items-center gap-2 shrink-0">
                    {productSearchQuery ? (
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); setProductSearchQuery(''); setShowProductSearch(false); }}
                        className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <Gem className="w-4 h-4 text-slate-300 dark:text-slate-600 group-focus-within:text-amber-400 transition-colors duration-300" />
                    )}
                  </div>
                </div>
              </div>

              {/* Dropdown results */}
              {showProductSearch && productSearchQuery && (
                <div className="absolute z-[9999] left-5 right-5 mt-1.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl max-h-72 overflow-y-auto">
                  {filteredProducts.length > 0 ? (
                    <>
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700/50">
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                          {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                        </p>
                      </div>
                      {filteredProducts.map((product) => {
                        const availableStock = getAvailableStock(product);
                        const isOutOfStock = availableStock <= 0;
                        return (
                          <button
                            key={product.id}
                            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left border-b border-slate-100 dark:border-slate-700/50 last:border-b-0 ${
                              isOutOfStock
                                ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800/30'
                                : 'hover:bg-amber-50 dark:hover:bg-amber-500/5'
                            }`}
                            onClick={() => handleAddProduct(product)}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                              isOutOfStock
                                ? 'bg-slate-200/50 dark:bg-slate-700/30 border-slate-300/30'
                                : 'bg-gradient-to-br from-amber-400/20 to-yellow-500/10 border-amber-400/20'
                            }`}>
                              <Gem className={`w-5 h-5 ${isOutOfStock ? 'text-slate-400' : 'text-amber-400'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{product.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {product.sku} • {formatWeight(product.metalWeight)}
                                <span className={`ml-2 font-medium ${isOutOfStock ? 'text-red-500' : availableStock <= 2 ? 'text-red-400' : 'text-emerald-500'}`}>
                                  {isOutOfStock ? 'Out of stock' : `${availableStock} available`}
                                </span>
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-amber-500">{formatCurrency(product.sellingPrice)}</p>
                              <p className={`text-xs mt-0.5 ${isOutOfStock ? 'text-red-400 font-medium' : 'text-slate-400'}`}>
                                {isOutOfStock ? 'unavailable' : 'tap to add'}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </>
                  ) : (
                    <div className="p-8 text-center">
                      <Gem className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                      <p className="font-medium text-slate-600 dark:text-slate-400">No products found</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try a different name, SKU, or barcode</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <CardContent>
              {invoiceItems.length > 0 ? (
                <div className="space-y-3">
                  {invoiceItems.map((item, index) => (
                    <div
                      key={item.productId || item.id}
                      className="group relative rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/60 dark:to-slate-800/30 border border-slate-200/60 dark:border-slate-700/40 hover:border-amber-400/30 transition-all duration-200 overflow-hidden"
                    >
                      {/* Item number accent */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-l-xl" />

                      <div className="p-3 sm:p-4 pl-4 sm:pl-5">
                        {/* Top row: Product info + delete */}
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-gradient-to-br from-amber-400/20 to-yellow-500/10 flex items-center justify-center shrink-0 border border-amber-400/20">
                            <span className="text-xs sm:text-sm font-bold text-amber-500">{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-200 truncate">{item.productName}</p>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.description}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.productId!)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Bottom row: Quantity + Price */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/30">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg"
                              onClick={() => handleUpdateQuantity(item.productId!, item.quantity - 1)}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </Button>
                            <span className="w-8 sm:w-10 text-center font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg"
                              onClick={() => handleUpdateQuantity(item.productId!, item.quantity + 1)}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </Button>
                            <span className="text-xs text-slate-400 ml-1 hidden sm:inline">@ {formatCurrency(item.unitPrice)}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm sm:text-base text-amber-500">
                              {formatCurrency(item.total)}
                            </p>
                            <p className="text-xs text-slate-400 sm:hidden">
                              @ {formatCurrency(item.unitPrice)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Items total bar */}
                  <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {invoiceItems.length} item{invoiceItems.length !== 1 ? 's' : ''} · {invoiceItems.reduce((sum, i) => sum + i.quantity, 0)} unit{invoiceItems.reduce((sum, i) => sum + i.quantity, 0) !== 1 ? 's' : ''}
                    </span>
                    <span className="text-sm font-bold text-amber-500">{formatCurrency(subtotal)}</span>
                  </div>
                </div>
              ) : (
                <div className="p-8 sm:p-12 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                    <Gem className="w-8 h-8 text-amber-400/60" />
                  </div>
                  <p className="font-medium text-slate-600 dark:text-slate-400">No items added yet</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Search and add products above</p>
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
                  onChange={(val) => {
                    const method = val as PaymentMethod;
                    setPaymentMethod(method);
                    if (method === 'credit') {
                      setPaidAmount(0);
                    } else {
                      setPaidAmount(total);
                    }
                  }}
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
