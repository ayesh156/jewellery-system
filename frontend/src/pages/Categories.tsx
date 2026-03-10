import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Grid3X3,
  ToggleLeft,
  ToggleRight,
  Loader2,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  CircleDot,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MoreVertical,
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal, ModalContent, ModalFooter } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { DateCombobox } from '../components/ui/DateCombobox';
import { Combobox } from '../components/ui/Combobox';
import { Select } from '../components/ui/Select';
import { categoriesApi, countersApi, productsApi } from '../services/api';
import toast from 'react-hot-toast';
import type { ProductCategory, GoldKarat, MetalType } from '../types';

const metalTypes: MetalType[] = ['gold', 'silver', 'platinum', 'white-gold', 'rose-gold'];
const goldKarats: GoldKarat[] = ['24K', '22K', '21K', '18K', '14K', '10K', '9K'];

const categoryIcons: Record<string, string> = {
  'Rings': '💍',
  'Necklaces': '📿',
  'Earrings': '✨',
  'Bangles & Bracelets': '⭕',
  'Chains': '🔗',
  'Pendants': '💎',
  'Anklets': '⚪',
  'Nose Pins': '👃',
  'Mangalsutra': '🪬',
  'Sets': '🎁',
  "Men's Jewellery": '👔',
  'Silver Items': '🥈',
  'Coins & Bars': '🪙',
  'Watches': '⌚',
};

const allIcons = Object.values(categoryIcons);

type SortField = 'name' | 'code' | 'createdAt';
type SortDirection = 'asc' | 'desc';

// Skeleton card component
function SkeletonCard() {
  return (
    <Card>
      <CardContent className="p-4 animate-pulse">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-700/50" />
            <div className="space-y-1.5">
              <div className="h-4 bg-slate-700/50 rounded w-24" />
              <div className="h-3 bg-slate-700/30 rounded w-16" />
            </div>
          </div>
          <div className="h-5 bg-slate-700/30 rounded w-14" />
        </div>
        <div className="h-4 bg-slate-700/30 rounded w-full mb-3" />
        <div className="flex gap-2 mb-4">
          <div className="h-5 bg-slate-700/30 rounded w-12" />
          <div className="h-5 bg-slate-700/30 rounded w-10" />
          <div className="h-5 bg-slate-700/30 rounded w-20" />
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-slate-700">
          <div className="h-6 bg-slate-700/30 rounded w-6" />
          <div className="flex gap-1">
            <div className="h-8 bg-slate-700/30 rounded w-8" />
            <div className="h-8 bg-slate-700/30 rounded w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Categories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    icon: '💎',
    defaultMetalType: 'gold' as MetalType,
    defaultKarat: '22K' as GoldKarat,
    defaultWastage: 8,
    isActive: true,
  });

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<ProductCategory | null>(null);
  const [moreMenuId, setMoreMenuId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, countsRes] = await Promise.all([
        categoriesApi.getAll(),
        productsApi.getCounts(),
      ]);
      setProductCounts(countsRes.data.byCategory);
      setCategories(res.data.map((c: any, i: number) => ({
        id: c.id,
        name: c.name,
        code: c.id.toUpperCase(),
        description: c.description,
        icon: categoryIcons[c.name] || c.icon || '💎',
        defaultMetalType: 'gold' as MetalType,
        defaultKarat: '22K' as GoldKarat,
        defaultWastage: 8,
        sortOrder: i + 1,
        isActive: c.isActive,
        createdAt: c.createdAt || '',
        updatedAt: c.updatedAt || '',
      })));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filtered + sorted
  const filteredCategories = useMemo(() => {
    let result = categories.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? c.isActive : !c.isActive);

      let matchesDate = true;
      if (dateFrom || dateTo) {
        const created = c.createdAt ? new Date(c.createdAt).getTime() : 0;
        if (dateFrom) matchesDate = matchesDate && created >= new Date(dateFrom).getTime();
        if (dateTo) matchesDate = matchesDate && created <= new Date(dateTo + 'T23:59:59').getTime();
      }

      return matchesSearch && matchesStatus && matchesDate;
    });

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'code': cmp = a.code.localeCompare(b.code); break;
        case 'createdAt': cmp = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(); break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [categories, searchQuery, statusFilter, sortField, sortDirection, dateFrom, dateTo]);

  // Paginated
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, currentPage, pageSize]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, sortField, sortDirection, dateFrom, dateTo]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
      : <ArrowDown className="w-3.5 h-3.5 text-amber-400" />;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setSortField('name');
    setSortDirection('asc');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || dateFrom || dateTo;

  // Handlers
  const handleAdd = () => {
    setEditingCategory(null);
    setForm({ name: '', code: '', description: '', icon: '💎', defaultMetalType: 'gold', defaultKarat: '22K', defaultWastage: 8, isActive: true });
    setShowModal(true);
  };

  const handleEdit = (category: ProductCategory) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      code: category.code,
      description: category.description || '',
      icon: category.icon || '💎',
      defaultMetalType: category.defaultMetalType || 'gold',
      defaultKarat: category.defaultKarat || '22K',
      defaultWastage: category.defaultWastage || 8,
      isActive: category.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Please enter a category name'); return; }
    setSaving(true);
    try {
      if (editingCategory) {
        const res = await categoriesApi.update(editingCategory.id, {
          name: form.name,
          description: form.description || undefined,
          icon: form.icon,
          isActive: form.isActive,
        });
        setCategories(prev => prev.map(c =>
          c.id === editingCategory.id ? {
            ...c,
            name: res.data.name,
            description: res.data.description,
            icon: categoryIcons[res.data.name] || res.data.icon || '💎',
            isActive: res.data.isActive,
            updatedAt: res.data.updatedAt || new Date().toISOString(),
            code: form.code,
            defaultMetalType: form.defaultMetalType,
            defaultKarat: form.defaultKarat,
            defaultWastage: form.defaultWastage,
          } : c
        ));
        toast.success('Category updated');
      } else {
        const shopCode = localStorage.getItem('shopCode') || 'A';
        const counterRes = await countersApi.getNext('category', shopCode);
        const newId = counterRes.data.formattedId.toLowerCase();
        const res = await categoriesApi.create({
          id: newId,
          name: form.name,
          description: form.description || undefined,
          icon: form.icon,
          isActive: form.isActive,
        });
        const newCategory: ProductCategory = {
          id: res.data.id,
          name: res.data.name,
          code: res.data.id.toUpperCase(),
          description: res.data.description,
          icon: categoryIcons[res.data.name] || res.data.icon || '💎',
          defaultMetalType: form.defaultMetalType,
          defaultKarat: form.defaultKarat,
          defaultWastage: form.defaultWastage,
          sortOrder: categories.length + 1,
          isActive: res.data.isActive,
          createdAt: res.data.createdAt || new Date().toISOString(),
          updatedAt: res.data.updatedAt || new Date().toISOString(),
        };
        setCategories(prev => [...prev, newCategory]);
        toast.success('Category created');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await categoriesApi.delete(deleteTarget.id);
      setCategories(prev => prev.filter(c => c.id !== deleteTarget.id));
      toast.success('Category deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    // Optimistic update
    setCategories(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
    try {
      await categoriesApi.update(id, { isActive: !cat.isActive });
    } catch (err) {
      // Revert on error
      setCategories(prev => prev.map(c => c.id === id ? { ...c, isActive: cat.isActive } : c));
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Categories</h1>
          <p className="text-slate-400 text-sm mt-1">
            {loading ? '...' : `${filteredCategories.length} of ${categories.length} categor${categories.length !== 1 ? 'ies' : 'y'}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Category</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-[180px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search categories..."
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
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Combobox
                options={[
                  { value: 'all', label: 'All Status', icon: <CircleDot className="w-3.5 h-3.5 text-slate-400" /> },
                  { value: 'active', label: 'Active', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> },
                  { value: 'inactive', label: 'Inactive', icon: <XCircle className="w-3.5 h-3.5 text-red-400" /> },
                ]}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as 'all' | 'active' | 'inactive')}
                placeholder="Status"
                clearable={false}
                showFooter={false}
                className="w-[120px] sm:w-[160px]"
              />
              <div className="flex gap-1">
                <button
                  onClick={() => toggleSort('name')}
                  className={`flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                    sortField === 'name' ? 'border-amber-500/50 bg-amber-500/10 text-amber-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  Name <SortIcon field="name" />
                </button>
                <button
                  onClick={() => toggleSort('code')}
                  className={`flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                    sortField === 'code' ? 'border-amber-500/50 bg-amber-500/10 text-amber-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  Code <SortIcon field="code" />
                </button>
              </div>
              <button
                onClick={() => setShowMoreFilters(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                  showMoreFilters || dateFrom || dateTo || sortField === 'createdAt'
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                    : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                More
                {showMoreFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-3.5 h-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* More filters (collapsible) */}
          {showMoreFilters && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-3 border-t border-slate-700/50">
              <button
                onClick={() => toggleSort('createdAt')}
                className={`flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                  sortField === 'createdAt' ? 'border-amber-500/50 bg-amber-500/10 text-amber-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                Date Added <SortIcon field="createdAt" />
              </button>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                Range:
              </div>
              <div className="flex gap-2 flex-1">
                <div className="w-full sm:w-44">
                  <DateCombobox
                    value={dateFrom}
                    onChange={(v) => setDateFrom(v)}
                    placeholder="From date"
                    clearable
                  />
                </div>
                <div className="w-full sm:w-44">
                  <DateCombobox
                    value={dateTo}
                    onChange={(v) => setDateTo(v)}
                    placeholder="To date"
                    clearable
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : paginatedCategories.length > 0 ? (
          paginatedCategories.map((category) => (
            <Card key={category.id} hover className={`transition-opacity ${!category.isActive ? 'opacity-60' : ''}`}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center text-xl sm:text-2xl shrink-0">
                      {category.icon}
                    </div>
                    <div className="min-w-0">
                      <button
                        onClick={() => handleEdit(category)}
                        className="font-semibold text-slate-100 text-sm sm:text-base truncate block hover:text-amber-400 transition-colors text-left"
                      >
                        {category.name}
                      </button>
                      <p className="text-xs text-slate-500">Code: {category.code}</p>
                    </div>
                  </div>
                  <Badge variant={category.isActive ? 'success' : 'default'} className="text-[10px] sm:text-xs shrink-0">
                    {category.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {category.description && (
                  <p className="text-xs sm:text-sm text-slate-400 mb-2 sm:mb-3 truncate" title={category.description}>{category.description}</p>
                )}

                <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 overflow-hidden">
                  <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0 capitalize">{category.defaultMetalType}</Badge>
                  {category.defaultKarat && <Badge variant="warning" className="text-[10px] sm:text-xs shrink-0">{category.defaultKarat}</Badge>}
                  <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0 truncate">Wastage: {category.defaultWastage}%</Badge>
                  <Badge variant={productCounts[category.id] ? 'info' : 'default'} className="text-[10px] sm:text-xs shrink-0">
                    {productCounts[category.id] || 0} Product{(productCounts[category.id] || 0) !== 1 ? 's' : ''}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-slate-700">
                  <button onClick={() => handleToggleActive(category.id)} className="text-slate-400 hover:text-slate-200 transition-colors">
                    {category.isActive ? <ToggleRight className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" /> : <ToggleLeft className="w-5 h-5 sm:w-6 sm:h-6" />}
                  </button>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMoreMenuId(moreMenuId === category.id ? null : category.id)}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                    {moreMenuId === category.id && (
                      <>
                        <div className="fixed inset-0 z-[60]" onClick={() => setMoreMenuId(null)} />
                        <div className="absolute right-0 bottom-full mb-1 z-[70] w-40 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl py-1.5">
                          <button
                            onClick={() => { handleEdit(category); setMoreMenuId(null); }}
                            className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" /> Edit
                          </button>
                          <button
                            onClick={() => { setDeleteTarget(category); setMoreMenuId(null); }}
                            className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="py-12 text-center">
                <Grid3X3 className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">No categories found</h3>
                <p className="text-slate-400 mb-4">
                  {hasActiveFilters ? 'Try adjusting your filters' : 'Create your first product category'}
                </p>
                {hasActiveFilters ? (
                  <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
                ) : (
                  <Button onClick={handleAdd}><Plus className="w-4 h-4" /> Add Category</Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredCategories.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredCategories.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
      >
        <ModalContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Category Name *"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Rings"
            />
            <Input
              label="Category Code"
              value={form.code}
              onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              placeholder="Auto-generated"
              disabled={!editingCategory}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Category description..."
              className="w-full h-20 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {allIcons.map((icon, idx) => (
                <button
                  key={idx}
                  onClick={() => setForm(prev => ({ ...prev, icon }))}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-lg sm:text-xl transition-all ${
                    form.icon === icon
                      ? 'bg-amber-500/20 border-2 border-amber-500'
                      : 'bg-slate-700/50 border border-slate-600 hover:border-slate-500'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Default Metal"
              value={form.defaultMetalType}
              onChange={(e) => setForm(prev => ({ ...prev, defaultMetalType: e.target.value as MetalType }))}
            >
              {metalTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                </option>
              ))}
            </Select>
            <Select
              label="Default Karat"
              value={form.defaultKarat}
              onChange={(e) => setForm(prev => ({ ...prev, defaultKarat: e.target.value as GoldKarat }))}
            >
              {goldKarats.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </Select>
            <Input
              label="Default Wastage %"
              type="number"
              value={form.defaultWastage}
              onChange={(e) => setForm(prev => ({ ...prev, defaultWastage: Number(e.target.value) }))}
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500"
            />
            <label className="text-sm text-slate-300">Category is active</label>
          </div>

        </ModalContent>
        <ModalFooter>
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingCategory ? 'Update' : 'Create'} Category
            </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete Category"
        size="sm"
      >
        <ModalContent>
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Are you sure?</h3>
            <p className="text-sm text-slate-400">
              This will permanently delete <span className="font-medium text-slate-200">{deleteTarget?.name}</span>.
              This action cannot be undone.
            </p>
          </div>
        </ModalContent>
        <ModalFooter>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-500 hover:bg-red-600 border-red-500"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
