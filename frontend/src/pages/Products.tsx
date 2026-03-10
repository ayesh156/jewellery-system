import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Gem,
  Layers,
  Tag,
  Loader2,
  RefreshCw,
  X,
  MoreVertical,
  SlidersHorizontal,
  Calendar,
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Combobox, type ComboboxOption } from '../components/ui/Combobox';
import { Badge } from '../components/ui/Badge';
import { Modal, ModalContent, ModalFooter } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, MobileCard, MobileCardHeader, MobileCardContent, MobileCardRow, MobileCardActions, MobileCardsContainer } from '../components/ui/Table';
import { categoriesApi, productsApi, countersApi } from '../services/api';
import { formatCurrency, formatWeight } from '../utils/formatters';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';
import type { JewelleryItem, JewelleryCategory, MetalType, GoldKarat } from '../types';

const metalTypes: MetalType[] = ['gold', 'silver', 'platinum', 'palladium', 'white-gold', 'rose-gold'];
const karats: GoldKarat[] = ['24K', '22K', '21K', '18K', '14K', '10K', '9K'];

const metalOptions: ComboboxOption[] = metalTypes.map((metal) => ({
  value: metal,
  label: metal.charAt(0).toUpperCase() + metal.slice(1).replace('-', ' '),
  icon: <Gem className="w-4 h-4" />,
}));

// Convert API numeric strings to frontend numbers
function toProduct(raw: any): JewelleryItem {
  return {
    ...raw,
    metalWeight: Number(raw.metalWeight),
    metalPurity: raw.metalPurity != null ? Number(raw.metalPurity) : undefined,
    metalRate: Number(raw.metalRate),
    makingCharges: Number(raw.makingCharges),
    gemstoneValue: raw.gemstoneValue != null ? Number(raw.gemstoneValue) : undefined,
    otherCharges: raw.otherCharges != null ? Number(raw.otherCharges) : undefined,
    sellingPrice: Number(raw.sellingPrice),
    costPrice: Number(raw.costPrice),
    totalGemstoneWeight: raw.totalGemstoneWeight != null ? Number(raw.totalGemstoneWeight) : undefined,
  };
}

// Convert frontend numbers to API numeric strings, stripping nulls
function toApiData(data: Partial<JewelleryItem>) {
  const out: Record<string, unknown> = {};
  const numericKeys = new Set(['metalWeight', 'metalPurity', 'metalRate', 'makingCharges', 'gemstoneValue', 'otherCharges', 'sellingPrice', 'costPrice', 'totalGemstoneWeight']);
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;
    out[key] = numericKeys.has(key) ? String(value) : value;
  }
  return out;
}

export function Products() {
  // Data state
  const [products, setProducts] = useState<JewelleryItem[]>([]);
  const [categories, setCategories] = useState<JewelleryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [metalFilter, setMetalFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [karatFilter, setKaratFilter] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low' | 'out'>('all');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<JewelleryItem | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [moreMenuId, setMoreMenuId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Form state
  const [formData, setFormData] = useState<Partial<JewelleryItem>>({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    metalType: 'gold',
    karat: '22K',
    metalWeight: 0,
    makingCharges: 0,
    costPrice: 0,
    sellingPrice: 0,
    stockQuantity: 1,
    reorderLevel: 2,
    description: '',
    isActive: true,
    hasGemstones: false,
  });

  // ==========================================
  // Data Loading
  // ==========================================

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productsApi.getAll({ limit: 100 }),
        categoriesApi.getAll(),
      ]);
      setProducts(productsRes.data.map(toProduct));
      setCategories(categoriesRes.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Dynamic category options from API data
  const categoryOptions: ComboboxOption[] = useMemo(() =>
    categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
      icon: <Layers className="w-4 h-4" />,
    })),
    [categories]
  );

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !categoryFilter || product.categoryId === categoryFilter;
      const matchesMetal = !metalFilter || product.metalType === metalFilter;
      const matchesKarat = !karatFilter || product.karat === karatFilter;

      let matchesStock = true;
      if (stockFilter === 'in-stock') matchesStock = product.stockQuantity > (product.reorderLevel || 2);
      else if (stockFilter === 'low') matchesStock = product.stockQuantity > 0 && product.stockQuantity <= (product.reorderLevel || 2);
      else if (stockFilter === 'out') matchesStock = product.stockQuantity === 0;

      let matchesPrice = true;
      if (priceMin) matchesPrice = product.sellingPrice >= Number(priceMin);
      if (matchesPrice && priceMax) matchesPrice = product.sellingPrice <= Number(priceMax);

      return matchesSearch && matchesCategory && matchesMetal && matchesKarat && matchesStock && matchesPrice;
    });
  }, [products, searchQuery, categoryFilter, metalFilter, karatFilter, stockFilter, priceMin, priceMax]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, metalFilter, karatFilter, stockFilter, priceMin, priceMax]);

  // Active filter count
  const activeFilterCount = [categoryFilter, metalFilter, karatFilter, stockFilter !== 'all' ? 'x' : '', priceMin, priceMax].filter(Boolean).length;

  // Stats
  const totalValue = products.reduce((sum, p) => sum + p.sellingPrice * p.stockQuantity, 0);
  const lowStockCount = products.filter((p) => p.stockQuantity <= (p.reorderLevel || 2)).length;

  const handleInputChange = (field: keyof JewelleryItem, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.sku || !formData.categoryId) {
      toast.error('Please fill in required fields: Name, SKU, and Category');
      return;
    }
    setSaving(true);
    try {
      if (editMode && selectedProduct) {
        const { id: _id, dateAdded: _da, lastUpdated: _lu, categoryName: _cn, ...updateData } = formData as any;
        const res = await productsApi.update(selectedProduct.id, toApiData(updateData));
        setProducts((prev) =>
          prev.map((p) => (p.id === selectedProduct.id ? toProduct(res.data) : p))
        );
        toast.success('Product updated successfully');
      } else {
        // Get next product number from server (atomic, multi-user safe)
        const shopCode = localStorage.getItem('shopCode') || 'A';
        const counterRes = await countersApi.getNext('product', shopCode);
        const createData = {
          ...toApiData(formData),
          id: counterRes.data.formattedId.toLowerCase(),
          sku: formData.sku || counterRes.data.formatted,
          metalRate: String(formData.metalRate || 18500),
        };
        const res = await productsApi.create(createData);
        setProducts((prev) => [...prev, toProduct(res.data)]);
        toast.success('Product added successfully');
      }
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    setSaving(true);
    try {
      await productsApi.delete(selectedProduct.id);
      setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id));
      setShowDeleteModal(false);
      setSelectedProduct(null);
      toast.success('Product deleted successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      categoryId: '',
      metalType: 'gold',
      karat: '22K',
      metalWeight: 0,
      makingCharges: 0,
      costPrice: 0,
      sellingPrice: 0,
      stockQuantity: 1,
      reorderLevel: 2,
      description: '',
      isActive: true,
      hasGemstones: false,
    });
    setShowAddModal(false);
    setEditMode(false);
    setSelectedProduct(null);
  };

  const openEditModal = (product: JewelleryItem) => {
    setSelectedProduct(product);
    setFormData({
      ...product,
      barcode: product.barcode ?? '',
      description: product.description ?? '',
      karat: product.karat ?? undefined,
      metalPurity: product.metalPurity ?? undefined,
      totalGemstoneWeight: product.totalGemstoneWeight ?? undefined,
      gemstoneValue: product.gemstoneValue ?? undefined,
      otherCharges: product.otherCharges ?? undefined,
      reorderLevel: product.reorderLevel ?? 2,
      supplierId: product.supplierId ?? undefined,
      supplierName: product.supplierName ?? undefined,
    });
    setEditMode(true);
    setShowAddModal(true);
  };

  const openViewModal = (product: JewelleryItem) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const openDeleteModal = (product: JewelleryItem) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="h-8 w-36 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-4 w-52 bg-slate-200 dark:bg-slate-700 rounded mt-2 animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse">
                  <div className="w-6 h-6" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-7 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters skeleton */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              <div className="lg:w-64 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              <div className="lg:w-56 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            </div>
          </CardContent>
        </Card>

        {/* Table skeleton */}
        <Card>
          <CardContent className="p-0 md:p-0">
            <div className="hidden md:block">
              <div className="grid grid-cols-8 gap-4 px-6 py-3 border-b border-slate-200 dark:border-slate-700">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                ))}
              </div>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="grid grid-cols-8 gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 col-span-1">
                    <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      <div className="h-3 w-14 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse self-center" />
                  <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse self-center" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse self-center" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse self-center" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse self-center" />
                  <div className="h-6 w-12 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse self-center mx-auto" />
                  <div className="flex items-center justify-center gap-1">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {/* Mobile skeleton */}
            <div className="md:hidden p-4 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
                      <div className="space-y-1.5">
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                        <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                  </div>
                  <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="flex justify-between">
                        <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                    <div className="flex-1 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                    <div className="flex-1 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                    <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                  </div>
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
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">Products</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Manage your jewellery inventory</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="gold" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10">
              <Package className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Products</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{products.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <Gem className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Inventory Value</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(totalValue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-500/10">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Low Stock</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{lowStockCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            {/* Search + first 2 filters + toggle row */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name, SKU, or barcode..."
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
              <div className="flex items-center gap-2 shrink-0">
                <Combobox
                  options={categoryOptions}
                  value={categoryFilter}
                  onChange={(val) => setCategoryFilter(val)}
                  placeholder="All Categories"
                  searchPlaceholder="Search categories..."
                  defaultIcon={<Layers className="w-4 h-4" />}
                  showAllOption
                  allOptionLabel="All Categories"
                  clearable
                  showFooter={false}
                  className="w-[120px] sm:w-[160px]"
                />
                <Combobox
                  options={metalOptions}
                  value={metalFilter}
                  onChange={(val) => setMetalFilter(val)}
                  placeholder="All Metals"
                  searchPlaceholder="Search metals..."
                  defaultIcon={<Gem className="w-4 h-4" />}
                  showAllOption
                  allOptionLabel="All Metals"
                  clearable
                  showFooter={false}
                  className="w-[120px] sm:w-[160px]"
                />
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all shrink-0',
                    showFilters || activeFilterCount > 0
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400'
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Karat */}
                  <Combobox
                    options={karats.map((k) => ({ value: k, label: k, icon: <Tag className="w-4 h-4" /> }))}
                    value={karatFilter}
                    onChange={(val) => setKaratFilter(val)}
                    placeholder="All Karats"
                    defaultIcon={<Tag className="w-4 h-4" />}
                    showAllOption
                    allOptionLabel="All Karats"
                    clearable
                    showFooter={false}
                  />

                  {/* Stock */}
                  <Combobox
                    options={[
                      { value: 'all', label: 'All Stock', icon: <Package className="w-4 h-4" /> },
                      { value: 'in-stock', label: 'In Stock', icon: <Package className="w-4 h-4" /> },
                      { value: 'low', label: 'Low Stock', icon: <AlertTriangle className="w-4 h-4" /> },
                      { value: 'out', label: 'Out of Stock', icon: <AlertTriangle className="w-4 h-4" /> },
                    ]}
                    value={stockFilter}
                    onChange={(val) => setStockFilter(val as 'all' | 'in-stock' | 'low' | 'out')}
                    placeholder="Stock status..."
                    showFooter={false}
                  />

                  <Input
                    placeholder="Min price"
                    type="number"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                  />
                  <Input
                    placeholder="Max price"
                    type="number"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                  />
                </div>

                {/* Active filter pills */}
                {activeFilterCount > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Active:</span>
                    {categoryFilter && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-500/20">
                        <Layers className="w-3 h-3" /> {categories.find((c) => c.id === categoryFilter)?.name || categoryFilter}
                        <button onClick={() => setCategoryFilter('')} className="ml-0.5 hover:text-blue-800 dark:hover:text-blue-200"><X className="w-3 h-3" /></button>
                      </span>
                    )}
                    {metalFilter && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium border border-amber-500/20">
                        <Gem className="w-3 h-3" /> {metalFilter}
                        <button onClick={() => setMetalFilter('')} className="ml-0.5 hover:text-amber-800 dark:hover:text-amber-200"><X className="w-3 h-3" /></button>
                      </span>
                    )}
                    {karatFilter && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium border border-purple-500/20">
                        <Tag className="w-3 h-3" /> {karatFilter}
                        <button onClick={() => setKaratFilter('')} className="ml-0.5 hover:text-purple-800 dark:hover:text-purple-200"><X className="w-3 h-3" /></button>
                      </span>
                    )}
                    {stockFilter !== 'all' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">
                        <Package className="w-3 h-3" /> {stockFilter === 'in-stock' ? 'In Stock' : stockFilter === 'low' ? 'Low Stock' : 'Out of Stock'}
                        <button onClick={() => setStockFilter('all')} className="ml-0.5 hover:text-emerald-800 dark:hover:text-emerald-200"><X className="w-3 h-3" /></button>
                      </span>
                    )}
                    {(priceMin || priceMax) && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-500/20">
                        Rs. {priceMin || '0'} – {priceMax || '∞'}
                        <button onClick={() => { setPriceMin(''); setPriceMax(''); }} className="ml-0.5 hover:text-rose-800 dark:hover:text-rose-200"><X className="w-3 h-3" /></button>
                      </span>
                    )}
                    <button
                      onClick={() => { setCategoryFilter(''); setMetalFilter(''); setKaratFilter(''); setStockFilter('all'); setPriceMin(''); setPriceMax(''); }}
                      className="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 font-medium ml-1"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0 md:p-0">
          {/* Desktop Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Metal</TableHead>
                <TableHead className="text-right">Weight</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-center w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center">
                        <Gem className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <button
                          onClick={() => openEditModal(product)}
                          className="font-medium text-slate-800 dark:text-slate-200 hover:text-amber-500 dark:hover:text-amber-400 transition-colors text-left"
                        >
                          {product.name}
                        </button>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{product.barcode}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-700 dark:text-slate-300">{product.sku}</TableCell>
                  <TableCell>
                    <Badge variant="default">{product.categoryName || product.categoryId}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-700 dark:text-slate-300">
                      {product.metalType.charAt(0).toUpperCase() + product.metalType.slice(1).replace('-', ' ')}
                      {product.karat && ` ${product.karat}`}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-slate-700 dark:text-slate-300">
                    {formatWeight(product.metalWeight)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(product.sellingPrice)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        product.stockQuantity <= (product.reorderLevel || 2)
                          ? 'error'
                          : product.stockQuantity <= (product.reorderLevel || 2) * 2
                          ? 'warning'
                          : 'success'
                      }
                    >
                      {product.stockQuantity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMoreMenuId(moreMenuId === product.id ? null : product.id)}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      {moreMenuId === product.id && (
                        <>
                          <div className="fixed inset-0 z-[60]" onClick={() => setMoreMenuId(null)} />
                          <div className="absolute right-0 bottom-full mb-1 z-[70] w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl py-1.5">
                            <button
                              onClick={() => { openViewModal(product); setMoreMenuId(null); }}
                              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <Eye className="w-4 h-4" /> View
                            </button>
                            <button
                              onClick={() => { openEditModal(product); setMoreMenuId(null); }}
                              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <Edit className="w-4 h-4" /> Edit
                            </button>
                            <button
                              onClick={() => { openDeleteModal(product); setMoreMenuId(null); }}
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
              ))}
            </TableBody>
          </Table>

          {/* Mobile Cards */}
          <MobileCardsContainer className="p-4">
            {paginatedProducts.map((product) => (
              <MobileCard key={product.id}>
                <MobileCardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center">
                      <Gem className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <button
                        onClick={() => openEditModal(product)}
                        className="font-semibold text-slate-800 dark:text-slate-200 hover:text-amber-500 dark:hover:text-amber-400 transition-colors text-left"
                      >
                        {product.name}
                      </button>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{product.sku}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      product.stockQuantity <= (product.reorderLevel || 2)
                        ? 'error'
                        : product.stockQuantity <= (product.reorderLevel || 2) * 2
                        ? 'warning'
                        : 'success'
                    }
                  >
                    {product.stockQuantity} in stock
                  </Badge>
                </MobileCardHeader>
                <MobileCardContent>
                  <MobileCardRow 
                    label="Category" 
                    value={<Badge variant="default">{product.categoryName || product.categoryId}</Badge>} 
                  />
                  <MobileCardRow 
                    label="Metal" 
                    value={`${product.metalType.charAt(0).toUpperCase() + product.metalType.slice(1).replace('-', ' ')}${product.karat ? ` ${product.karat}` : ''}`} 
                  />
                  <MobileCardRow 
                    label="Weight" 
                    value={formatWeight(product.metalWeight)} 
                  />
                  <MobileCardRow 
                    label="Price" 
                    value={<span className="text-amber-500 font-bold">{formatCurrency(product.sellingPrice)}</span>} 
                  />
                </MobileCardContent>
                <MobileCardActions>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openViewModal(product)}>
                    <Eye className="w-4 h-4" /> View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditModal(product)}>
                    <Edit className="w-4 h-4" /> Edit
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openDeleteModal(product)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </MobileCardActions>
              </MobileCard>
            ))}
          </MobileCardsContainer>

          {filteredProducts.length === 0 && (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400">No products found</p>
            </div>
          )}

          {/* Pagination */}
          {filteredProducts.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-700">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredProducts.length}
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
        title={editMode ? 'Edit Product' : 'Add New Product'}
        size="lg"
      >
        <ModalContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5">Product Name</label>
              <Input
                value={formData.name ?? ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Gold Wedding Ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5">SKU</label>
              <Input
                value={formData.sku ?? ''}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                placeholder="e.g., GWR-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5">Barcode</label>
              <Input
                value={formData.barcode ?? ''}
                onChange={(e) => handleInputChange('barcode', e.target.value)}
                placeholder="e.g., 8901234567890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5">Category *</label>
              <Combobox
                value={formData.categoryId}
                onChange={(val) => handleInputChange('categoryId', val)}
                options={[
                  { value: '', label: 'Select Category', icon: <Tag className="w-4 h-4" /> },
                  ...categories.map((cat) => ({
                    value: cat.id,
                    label: cat.name,
                    icon: <Tag className="w-4 h-4" />
                  }))
                ]}
                placeholder="Select category..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5">Metal Type</label>
              <Combobox
                value={formData.metalType}
                onChange={(val) => handleInputChange('metalType', val)}
                options={metalTypes.map((metal) => ({
                  value: metal,
                  label: metal.charAt(0).toUpperCase() + metal.slice(1).replace('-', ' '),
                  icon: <Gem className="w-4 h-4" />
                }))}
                placeholder="Select metal type..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5">Karat</label>
              <Combobox
                value={formData.karat}
                onChange={(val) => handleInputChange('karat', val)}
                options={karats.map((k) => ({
                  value: k,
                  label: k,
                  icon: <Gem className="w-4 h-4" />
                }))}
                placeholder="Select karat..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5">Metal Weight (g)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.metalWeight}
                onChange={(e) => handleInputChange('metalWeight', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5">Cost Price</label>
              <Input
                type="number"
                value={formData.costPrice}
                onChange={(e) => handleInputChange('costPrice', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5">Selling Price</label>
              <Input
                type="number"
                value={formData.sellingPrice}
                onChange={(e) => handleInputChange('sellingPrice', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5">Making Charges</label>
              <Input
                type="number"
                value={formData.makingCharges}
                onChange={(e) => handleInputChange('makingCharges', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5">Stock Quantity</label>
              <Input
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => handleInputChange('stockQuantity', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5">Reorder Level</label>
              <Input
                type="number"
                value={formData.reorderLevel}
                onChange={(e) => handleInputChange('reorderLevel', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5">Description</label>
            <textarea
              className="w-full px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 resize-none"
              rows={3}
              value={formData.description ?? ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter product description..."
            />
          </div>

        </ModalContent>
        <ModalFooter>
          <Button variant="outline" onClick={resetForm} disabled={saving}>
            Cancel
          </Button>
          <Button variant="gold" onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {editMode ? 'Update Product' : 'Add Product'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Product Details"
        size="md"
      >
        {selectedProduct && (
          <ModalContent className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center">
                <Gem className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{selectedProduct.name}</h3>
                <p className="text-slate-600 dark:text-slate-400">SKU: {selectedProduct.sku}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                <p className="text-slate-600 dark:text-slate-400">Metal Type</p>
                <p className="text-slate-800 dark:text-slate-200 font-medium mt-1">
                  {selectedProduct.metalType.charAt(0).toUpperCase() + selectedProduct.metalType.slice(1).replace('-', ' ')}
                  {selectedProduct.karat && ` ${selectedProduct.karat}`}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                <p className="text-slate-600 dark:text-slate-400">Metal Weight</p>
                <p className="text-slate-800 dark:text-slate-200 font-medium mt-1">{formatWeight(selectedProduct.metalWeight)}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                <p className="text-slate-600 dark:text-slate-400">Selling Price</p>
                <p className="text-amber-400 font-semibold mt-1">{formatCurrency(selectedProduct.sellingPrice)}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                <p className="text-slate-600 dark:text-slate-400">Stock Quantity</p>
                <p className="text-slate-800 dark:text-slate-200 font-medium mt-1">{selectedProduct.stockQuantity}</p>
              </div>
            </div>

            {selectedProduct.description && (
              <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                <p className="text-slate-600 dark:text-slate-400 mb-2">Description</p>
                <p className="text-slate-800 dark:text-slate-200">{selectedProduct.description}</p>
              </div>
            )}

          </ModalContent>
        )}
        {selectedProduct && (
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
            <Button
              variant="gold"
              onClick={() => {
                setShowViewModal(false);
                openEditModal(selectedProduct);
              }}
            >
              <Edit className="w-4 h-4" />
              Edit Product
            </Button>
          </ModalFooter>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Product"
        size="sm"
      >
        <ModalContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-red-500/10">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <div>
              <p className="text-slate-800 dark:text-slate-200">Are you sure you want to delete this product?</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedProduct?.name}</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This action cannot be undone. This will permanently delete the product from your inventory.
          </p>
        </ModalContent>
        <ModalFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <Trash2 className="w-4 h-4" />
              Delete Product
            </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
